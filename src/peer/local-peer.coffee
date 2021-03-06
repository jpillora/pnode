_ = require '../../vendor/lodash'
BaseClass = require '../base'

Server = require '../server/server'
Connection = require '../server/connection'
Client = require '../client/client'
helper = require '../helper'
RemotePeer = require './remote-peer'
ObjectIndex = require 'object-index'

# a peer is many clients AND servers
module.exports = class LocalPeer extends BaseClass

  name: 'LocalPeer'

  defaults:
    debug: false
    wait: 1000
    learn: false

  constructor: ->
    super

    @count = { server:0, client:0 }
    @servers = {}
    @clients = {}
    @peers = helper.set()

    #provide self serialization method
    if @opts.learn
      @expose 
        _pnode:
          serialize: @exposeDynamic => @serialize()

  bind: ->
    @error "bind() is ambiguous, please use bindOn() and bindTo()"

  #best attempt at determining uri
  bindId: (args) ->
    Array::slice.call(args).filter((a) -> typeof a in ["number","string"]).join("-")

  bindOn: ->
    id = @bindId arguments
    if @servers[id]# and @servers[id].unbound
      return

    @count.server++
    server = new Server @

    #proxy prefixed events
    self = @
    server.onAny (args...) ->
      e = [].concat(server.subid).concat(@event)
      args.unshift e
      self.emit.apply null, args

    server.on 'error', (err) => @emit 'error', err
    server.on 'connection', (conn) =>
      conn.once 'remote', => @onPeer conn

    server.bindOn.apply server, arguments

    @servers[id] = server
    server.once 'unbound', =>
      delete @servers[id]
    return

  bindTo: ->
    id = @bindId arguments

    if @clients[id]# and @clients[id].unbound
      return

    @count.client++
    client = new Client @

    #proxy prefixed events
    self = @
    client.onAny (args...) ->
      e = [].concat(client.subid).concat(@event)
      args.unshift e
      self.emit.apply null, args

    client.on 'error', (err) => @emit 'error', err
    client.on 'remote', => @onPeer client
    client.bindTo.apply client, arguments

    @clients[id] = client
    client.once 'unbound', =>
      delete @clients[id]
    return


  #unbind one
  unbindFrom: (args...) ->
    id = @bindId args
    s = @servers[id]
    s.unbind() if s
    c = @clients[id]
    c.unbind() if c
    return

  #unbind all
  unbind: (callback) ->
    #run this after all generated callbacks and been fired
    mkCb = helper.callbacker =>
      callback() if callback
      @emit 'unbound-all'

    for id, client of @clients
      client.unbind mkCb()
    for id, server of @servers
      server.unbind mkCb()
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

    peer = @peers.findBy 'guid', guid

    unless peer
      peer = new RemotePeer @, guid, id, ips

      @peers.add peer

      peer.on 'up', =>
        @emit 'peer', peer
        @emit 'remote', peer.remote
      peer.on 'down', =>
        @log "lost peer %s", id

    peer.add cliconn
    return
  serialize: ->
    servers: helper.serialize @servers
    peers: helper.serialize @peers

  #peers can provide their peers to us
  # learn: (peers) ->

  all: (callback) ->
    rems = []
    for peer in @peers
      if peer.up
        rems.push peer.remote
    callback rems

  getPeer: (id) ->
    @peers.findBy('id', id) or @peers.findBy('guid', id)

  peer: (id, callback) ->
    get = =>
      peer = @getPeer id
      return false unless peer?.up
      @log "FOUND PEER: #{id}"
      callback peer.remote
      return true

    return if get()

    check = ->
      @log "CHECK PEER: #{id}"
      return unless get()
      @off 'peer', check
      clearTimeout t

    t = setTimeout =>
      @off 'peer', check
      @emit 'waitout', id
    , @opts.wait

    @on 'peer', check

  publish: ->
    for peer in @peers
      if peer.up
        peer.publish.apply peer, arguments
    return

  subscribe: (event, fn) ->
    #first subscription - notify peers
    if @pubsub.listeners(event).length is 0
      #clients currently binding will not be peers yet
      for id, client of @clients
        if client.binding
          client.subscribe event
      #subscribe to all peers
      for peer in @peers
        peer.subscribe? event
    super
    return

  unsubscribe: (event, fn) ->
    #has subscriptions - notify peers
    if @pubsub.listeners(event).length > 0
      #subscribe to all peers
      for peer in @peers
        peer.unsubscribe? event
    super
    return

