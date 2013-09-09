_ = require '../../vendor/lodash'
Server = require '../server/server'
Connection = require '../server/connection'
Client = require '../client/client'
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
    server = new Server @opts, @
    server.on 'error', (err) => @emit 'error', err
    server.on 'connection', @onPeer
    server.bindOn.apply server, arguments

    @servers[server.guid] = server
    server.once 'unbind', =>
      delete @servers[server.guid]

  bindTo: ->
    client = new Client @opts, @
    client.on 'error', (err) => @emit 'error', err
    client.on 'remote', => @onPeer client
    client.bindTo.apply client, arguments

  unbind: ->
    @log "UNBIND SELF AND ALL PEERS"
    for peer in @peers
      peer.unbind()
    for guid, server of @servers
      server.unbind()

  # new peer connection (client / server connection)
  # must have a remote which must have a guid
  onPeer: (cliconn) ->
    unless cliconn instanceof Client or cliconn instanceof Connection
      return @log "must be client or conn" 

    {remote} = cliconn
    
    unless remote
      return @log 'peer missing remote'
    
    {guid, id, ips} = remote._pnode
    unless guid
      return @log 'peer missing guid'
    
    peer = @peers.get guid

    unless peer
      peer = new RemotePeer @, guid, id, ips

      @peers.add peer

      peer.on 'up', (remote) =>
        @emit 'peer', peer
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
    get = =>
      @log "get #{id}"
      peer = @peers.get id
      return false unless peer?.up
      callback peer.remote
      return true

    return if get()

    check = ->
      return unless get()
      @off 'peer', check
      clearTimeout t

    t = setTimeout =>
      @off 'peer', check
      @emit 'timeout', id
    , @opts.wait

    @on 'peer', check

  publish: ->
  subscribe: ->