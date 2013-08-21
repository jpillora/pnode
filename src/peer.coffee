_ = require '../vendor/lodash'
pnode = require './index'
Base = require './base'
helper = require './helper'
locals = []

# a remote peer contains all connections to and from it
# identified by its 'guid', all remotes with this guid
# will be added to this peer which may be used as an
# rpc transport
class RemotePeer extends Base.Logger

  name: 'RemotePeer'

  constructor: (meta, @local) ->
    super
    @opts = @local.opts
    {@id,@guid,@ips} = meta
    @clients = {}
    @servers = {}

  onRemote: (remote, clientOrServer) ->
    @log 'add!'
    switch clientOrServer.name
      when 'Client' then @clients[clientOrServer.guid] = clientOrServer
      when 'Server' then @servers[clientOrServer.guid] = clientOrServer

    @active = clientOrServer
    @remote = remote

  #custom serialisation
  serialize: ->
    id: @id
    guid: @guid
    ips: @ips
    clients: helper.serialize @clients
    servers: helper.serialize @servers

# a peer is 1 server and N clients 
class LocalPeer extends Base

  name: 'LocalPeer'

  defaults:
    debug: false
    providePeers: true
    extractPeers: true

  constructor: ->
    super

    @peers = {}

    if @opts.providePeers
      @expose { _pnode: {peers: (cb) => cb @getPeers()} }

  bindOn: ->
    server = pnode.server @opts
    server.on 'error', (err) => @emit 'error', err
    server.on 'remote', @onPeer
    server.exposed = @exposed
    server.bindOn.apply server, arguments

  bindTo: ->
    client = pnode.client @opts
    client.on 'error', (err) => @emit 'error', err
    client.on 'remote', @onPeer
    client.exposed = @exposed
    client.bindTo.apply client, arguments

  #new peer connection
  onPeer: (remote, clientOrServer) ->
    meta = remote._pnode
    return unless meta

    if @opts.extractPeers and meta.peers
      meta.peers (p) => @log "PEERS on #{meta.id}", p

    guid = meta.guid
    unless guid
      @log 'peer missing guid'
      return

    unless @peers[guid]
      @peers[guid] = new RemotePeer @, meta

    @peers[guid].onRemote remote, clientOrServer
    @emit 'remote', remote

  getPeers: ->
    helper.serialize @peers

  #peers can provide their peers to us
  # learn: (peers) ->

  all: ->
    @log 'all!'

  peer: ->
    @log 'one!'

module.exports = (opts) ->
  peer = new LocalPeer opts
  locals.push peer
  return peer
