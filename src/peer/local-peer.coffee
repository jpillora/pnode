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
    learn: false

  constructor: ->
    super

    @servers = {}
    @peers = ObjectIndex "id", "guid"

    #provide self serialization method
    if @opts.learn
      @expose 
        _pnode:
          serialize: @exposeDynamic => @serialize()

  bindOn: ->
    server = new Server @
    server.on 'error', (err) => @emit 'error', err
    server.on 'connection', @onPeer
    server.bindOn.apply server, arguments

    @servers[server.guid] = server
    server.once 'unbind', =>
      delete @servers[server.guid]

  bindTo: ->
    client = new Client @
    client.on 'error', (err) => @emit 'error', err
    client.on 'remote', => @onPeer client
    client.bindTo.apply client, arguments

  unbind: (callback) ->
    @log "UNBIND SELF AND ALL PEERS"

    cb = helper.callbacker =>
      @log "UNBOUND SELF! <======="
      callback()

    for peer in @peers
      peer.unbind cb()
    for guid, server of @servers
      server.unbind cb()

    return

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
    
    #extract peers
    # if @opts.learn

    peer = @peers.get guid

    unless peer
      peer = new RemotePeer @, guid, id, ips

      @peers.add peer

      peer.on 'up', (remote) =>
        @emit 'peer', peer
        @emit 'remote', remote
      peer.on 'down', =>
        @log "lost peer %s", id

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
    for peer in @peers
      if peer.up
        peer.publish.apply peer, arguments
    return

  subscribe: (event, fn) ->
    @pubsub.on event, fn
    if @pubsub.listeners(event).length is 1
      for peer in @peers
        peer.subscribe? event
    return

  unsubscribe: (event, fn) ->
    @pubsub.off event, fn

