_ = require '../../vendor/lodash'
dnode = require 'dnode'
Base = require '../base'
helper = require '../helper'
RemoteContext = require '../context'

module.exports = class Client extends Base

  name: 'Client'

  defaults:
    debug: false
    maxRetries: 5
    timeout: 5000
    retryInterval: 500
    pingInterval: 5000
    port: 7337

  constructor: ->
    super

    @count = { ping: 0, pong: 0, attempt: 0 }
    
    #timeoutify and throttle reconnects
    @reconnect = @timeoutify 'reconnect', @reconnect
    @reconnect = _.throttle @reconnect, @opts.retryInterval, {leading:true}

    @on ['timeout','reconnect'], =>
      @log "reconnect TIMEOUT!"
      @reset()
      @reconnect()

    #throttle ping (already timeoutified from remote)
    @ping = _.throttle @ping, @opts.pingInterval

    @on ['timeout','ping'], =>
      @log "ping TIMEOUT!"

    #alias
    @bindTo = @bind

    @on 'unbound', =>
      @count.attempt = 0
      if @d
        @d.removeAllListeners().end()
        @d = null
      return

  bind: ->
    @bindArgs = arguments
    super

  server: (callback) ->
    if @bound and @remote
      return callback @remote

    else if @unbound
      @count.attempt = 0
      @reconnect()      

    #call back when remote arrives
    @once 'remote', callback
    return

  unget: (callback) ->
    @removeListener 'remote', callback

  reconnect: (callback) ->
    unless @unbound and @count.attempt < @opts.maxRetries
      return

    @count.attempt++

    #server context, exposed to remote api
    @ctx = new RemoteContext
    @d = dnode @wrapObject(@exposed, @ctx)
    @d.once 'remote', @onRemote
    @d.once 'end', @onEnd
    @d.once 'error', @onError
    @d.once 'fail', @onStreamError

    @log "connection attempt #{@count.attempt} to #{@uri()}..."

    #reconnect using previous bind call
    @bind.apply @, @bindArgs

    #store URI
    @tEmitter.once 'uri', (@uri) => 

    spliceRead = (read) =>
      unless helper.isReadable read
        @err "Invalid read stream" 
      read.on 'error', @onStreamError
      #extract src ip and port
      @ctx.getAddr read
      #read to dnode
      read.pipe(@d)

    spliceWrite = (write) =>
      unless helper.isWritable write
        @err "Invalid write stream" 
      write.on 'error', @onStreamError
      #write from dnode
      @d.pipe(write)

    @tEmitter.once 'read', (read) ->
      spliceRead read
    @tEmitter.once 'read', (read) ->
      spliceWrite write
    @tEmitter.once 'stream', (stream) ->
      spliceRead stream
      spliceWrite stream

    return

  #connection failed
  onStreamError: (err) ->
    return if @unbound or @unbinding
    # if err.code is 'ECONNREFUSED'
    #   @log "blocked by server"
    # else
    @log "stream error: #{err.message}"
    # @emit "error", err
    @reconnect()
    return

  #on rpc method exception
  onError: (err) ->
    return if @unbound or @unbinding
    msg = if err.stack then err.stack + "\n====" else err
    @err msg

  #up events
  onRemote: (remote) ->

    remote = @wrapObject(remote)

    #ensure it's a pnode remote
    meta = remote?._pnode
    unless typeof meta?.ping is "function"
      return @err "Invalid pnode host"

    # @log "got server remote", meta
    @remote = remote
    @ctx.getMeta meta
    
    # @log "EMIT REMOTE", remote
    @emit 'remote', @remote, @
    @ping()

  #throttled ping while 'up'
  ping: ->
    return if @unbound
    @count.ping++
    # @log "ping #{@count.ping}!"
    @remote._pnode.ping (ok) =>
      @count.pong++ if ok is true
      @ping()

  #down events
  onEnd: ->
    @log "server closed connection"
    @reconnect()

  #pubsub to server remote
  publish: (args...) ->

    #get remote
    @server (remote) =>

      event = if typeof args[0] is 'function' then args[1] else args[0]

      unless @ctx.events[event]
        @log "server #{@ctx.id} isnt subscribed to #{event}"
        return

      @log "publishing a #{event}"
      remote._pnode.publish.apply null, args
    return

  subscribe: (event, fn) ->
    @pubsub.on event, fn
    return unless @getConnectionFn
    if @pubsub.listeners(event).length is 1
      @server (remote) =>
        remote._pnode.subscribe event
    return

  serialize: -> @uri
