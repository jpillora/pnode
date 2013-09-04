_ = require '../vendor/lodash'
pnode = require './index'
Base = require './base'
helper = require './helper'
locals = []

#source map support
require('source-map-support').install()

# a remote peer contains all connections to and from it
# identified by its 'guid', all remotes with this guid
# will be added to this peer which may be used as an
# rpc transport
class RemotePeer extends Base.Logger

  name: 'RemotePeer'

  constructor: (@local) ->
    @opts = @local.opts
    @clients = {}
    @connections = {}
    @addresses = {}

  #will be a client, or a server connection
  addPeer: (peer) ->
    meta = peer.remote._pnode
    {@guid, @id, @ips} = meta

    switch peer.name
      when 'Client' then @addClient peer
      when 'Connection' then @addConnection peer

  addClient: (client) ->
    @addresses[client.uri()] = true
    @clients[client.guid] = client
    client.once 'down', =>
      delete @clients[client.guid]

  addConnection: (conn) ->
    @connections[conn.guid] = conn
    conn.once 'disconnect', =>
      delete @connections[conn.guid]

  getRemote: ->
    for guid, client of @clients
      return client.remote
    for guid, conn of @connections
      return conn.remote
    return null

  #custom serialisation
  serialize: ->
    id: @id
    guid: @guid
    ips: @ips
    clients: helper.serialize @clients

# a peer is 1 server and N clients 
class LocalPeer extends Base

  name: 'LocalPeer'

  defaults:
    debug: false
    wait: 1000
    providePeers: true
    extractPeers: true

  constructor: ->
    super

    @servers = {}
    @peers = {}

    if @opts.providePeers
      @expose { _pnode: {serialize: (cb) => cb @serialize()} }

  bindOn: ->
    server = pnode.server @opts
    server.on 'error', (err) => @emit 'error', err
    server.on 'connection', @onPeer
    server.exposed = @exposed
    server.bindOn.apply server, arguments

    @servers[server.guid] = server
    server.once 'unbind', =>
      delete @servers[server.guid]

  bindTo: ->
    client = pnode.client @opts
    client.on 'error', (err) => @emit 'error', err
    client.on 'remote', => @onPeer client
    client.exposed = @exposed
    client.bindTo.apply client, arguments

  #new peer connection
  # a peer must have a remote which must have a guid
  onPeer: (peer) ->
    {remote} = peer
    return @log 'peer missing remote' unless remote
      
    guid = remote?._pnode?.guid
    return @log 'peer missing guid' unless guid

    unless @peers[guid]
      @peers[guid] = new RemotePeer @

    @peers[guid].addPeer peer

    @log 'add peer', remote

    @emit 'remote', remote

  serialize: ->
    servers: helper.serialize @servers
    peers: helper.serialize @peers

  #peers can provide their peers to us
  # learn: (peers) ->

  all: (callback) ->

    missing = 0
    rems = []
    for guid, peer of @peers
      rem = peer.getRemote()
      if rem
        rems.push rem
      else
        missing++

    console.log @toString(), 'all()', missing
    callback rems

  peer: (id, callback) ->

    console.log @toString(), 'peer()', id

    #find peer
    peer = @peers[id]
    #interate through peer ids
    unless peer
      for guid, p of @peers
        if p.id is id
          peer = p
          break
    #no peer with this id
    unless peer
      return null

    rem = peer.getRemote()

    if rem
      callback rem

    return null

  publish: ->
  subscribe: ->

module.exports = (opts) ->
  peer = new LocalPeer opts
  locals.push peer
  return peer
