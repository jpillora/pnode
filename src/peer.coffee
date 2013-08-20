_ = require '../vendor/lodash'
pnode = require './index'
Base = require './base'
locals = []

# a remote peer contains all connections to and from it
# identified by its 'guid', all remotes with this guid
# will be added to this peer which may be used as an
# rpc transport
class RemotePeer extends Base.Logger

  name: 'RemotePeer'

  constructor: (@local, @remote, clientOrServer) ->
    super

    {@id,@guid,@ips} = @remote._pnode

    @clients = {}
    @servers = {}

    switch clientOrServer.name
      when 'Client' then @client = clientOrServer
      when 'Server' then @server = clientOrServer

  #custom serialisation
  serialize: ->
    "#{@name} - #{@id}: [#{@ips.join(',')}]"

  add: ->
    @log 'add!'


# a peer is 1 server and N clients 
class LocalPeer extends Base

  name: 'LocalPeer'

  defaults:
    debug: true
    providePeers: true
    extractPeers: true
    hello: 42

  constructor: ->
    super

    @peers = {}

    if @opts.providePeers
      @expose { _pnode: {peers: (cb) => cb @serializePeers()} }

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
    if @peers[guid]
      @peers[guid].add remote
    else
      @peers[guid] = new RemotePeer @, remote, clientOrServer

  serializePeers: ->
    peers = {}
    for guid, peer of @peers
      peers[guid] = peer.serialize()
    return peers

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
