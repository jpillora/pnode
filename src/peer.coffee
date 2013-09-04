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
    @reset()
    @opts = @local.opts
    @clients = []
    @connections = []
    @addresses = {}

  #will be a client, or a server connection
  addPeer: (peer) ->
    
    unless @up
      @remote = peer.remote
      @getMeta()
    
    switch peer.name
      when 'Client' then @addClient peer
      when 'Connection' then @addConnection peer

  getMeta: ->
    {@guid, @id, @ips} = @remote._pnode

  addClient: (client) ->
    @addresses[client.uri()] = true
    #disconnect if already connected
    return client.unbind() if @up
    @clients.push client
    client.once 'down', =>
      @reset()
      delete @addresses[client.uri()]
      @clients.splice @clients.indexOf(client), 1

  addConnection: (conn) ->
    #disconnect if already connected
    return conn.disconnect() if @up
    @connections.push conn
    conn.once 'disconnected', =>
      @reset()
      @connections.splice @connections.indexOf(conn), 1

  reset: ->
    @up = false
    @remote = null

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
      @expose 
        _pnode:
          serialize: new Base.Exposed => @serialize()

  bindOn: ->
    server = pnode.server @opts, @
    server.on 'error', (err) => @emit 'error', err
    server.on 'connection', @onPeer
    server.bindOn.apply server, arguments

    @servers[server.guid] = server
    server.once 'unbind', =>
      delete @servers[server.guid]

  bindTo: ->
    client = pnode.client @opts, @
    client.on 'error', (err) => @emit 'error', err
    client.on 'remote', => @onPeer client
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
