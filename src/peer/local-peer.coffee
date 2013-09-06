_ = require '../../vendor/lodash'
pnode = require '../index'
Base = require '../base'
helper = require '../helper'
RemotePeer = require './remote-peer'
ObjectIndex = require 'object-index'

# a peer is many clients AND servers
module.exports = class LocalPeer extends Base

  name: 'LocalPeer'

  defaults:
    debug: false
    wait: 1000
    providePeers: true
    extractPeers: true

  constructor: ->
    super

    @servers = {}
    @peers = ObjectIndex "id", "guid"

    if @opts.providePeers
      @expose 
        _pnode:
          serialize: @exposeDynamic => @serialize()

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

  # new peer connection (client / server connection)
  # must have a remote which must have a guid
  onPeer: (cliconn) ->
    return @log "must be client or conn" unless client?.name in ['Client','Connection']
    {remote} = cliconn
    return @log 'peer missing remote' unless remote
    
    {guid, id, ips} = remote?._pnode?
    return @log 'peer missing guid' unless guid
    
    peer = @peers.get guid

    unless peer
      peer = new RemotePeer @, guid, id, ips

      @peers.add peer

      peer.on 'up', (remote) =>
        @emit 'remote', remote
      peer.on 'down', =>
        @log "lost peer %s", guid



    peer.add cliconn
    return
  serialize: ->
    servers: helper.serialize @servers
    peers: helper.serialize @peers.list

  #peers can provide their peers to us
  # learn: (peers) ->

  all: (callback) ->
    rems = []
    for guid, peer of @peers
      if peer.up
        rems.push peer.remote
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
