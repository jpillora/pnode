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

    @stream = {}
    @count = { ping: 0, pong: 0, attempt: 0 }
    @connecting = false
    @status = 'down'

    
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
      @setStatus 'down'

    #alias
    @bindTo = @bind

  # unbind: ->
  #   @log "unbind!" if @bound
  #   @count.attempt = 0
  #   @reset()
  #   @stream.duplex?.close?()
  #   @stream.read?.close?()
  #   @stream.write?.close?()
  #   @stream = {}
  #   @ci = null
  #   super
  #   return

  createConnection: (fn) ->
    unless typeof fn is 'function'
      @err "must be a function"
    unless fn.length is 1 or fn.length is 2
      @err "must have arity 1 or 2"
    @getConnectionFn = fn
    @reconnect()
    return

  server: (callback) ->
    #check connection function
    unless @getConnectionFn
      return @err "no create connection method defined"

    if @status is 'up'
      return callback @remote

    else if @status is 'down' and not @connecting
      @count.attempt = 0
      @reconnect()      

    #call back when remote arrives
    @once 'remote', callback
    return

  unget: (callback) ->
    @removeListener 'remote', callback

  reconnect: (callback) ->
    if @status is 'up' or
       @connecting or
       @count.attempt >= @opts.maxRetries
      return

    @count.attempt++
    @connecting = true

    @reset()

    #server context, exposed to remote api
    @ctx = new RemoteContext
    @d = dnode @wrapObject(@exposed, @ctx)
    @d.once 'remote', @onRemote
    @d.once 'end', @onEnd
    @d.once 'error', @onError
    @d.once 'fail', @onStreamError

    gotRead = false
    gotWrite = false
    tInterface = {}

    @log "connection attempt #{@count.attempt} to #{@uri()}..."
    @emit 'connecting'

    spliceRead = (read) =>
      return if gotRead
      unless helper.isReadable read
        @err "Invalid read stream" 
      read.on 'error', @onStreamError
      #extract src ip and port
      @ctx.getAddr read
      #read to dnode
      read.pipe(@d)
      gotRead = true

    spliceWrite = (write) =>
      return if gotWrite
      unless helper.isWritable write
        @err "Invalid write stream" 
      write.on 'error', @onStreamError
      #write from dnode
      @d.pipe(write)
      gotWrite = true

    @getConnectionFn (obj) =>

      {stream, unbind, uri, read, write} = obj

      tInterface.uri = uri if uri
      tInterface.unbind = unbind if unbind

      # if typeof unbind isnt 'function'
      #   @err "unbind function missing"
      # if typeof uri isnt 'string'
      #   @err "uri string missing"

      if tInterface.uri and tInterface.unbind
        @emit 'interface', tInterface

      if read
        spliceRead read
      if write
        spliceWrite write
      if stream
        spliceRead stream
        spliceWrite stream
      return
    return

  #connection failed
  onStreamError: (err) ->
    return unless @isBound
    # if err.code is 'ECONNREFUSED'
    #   @log "blocked by server"
    # else
    @log "stream error: #{err.message}"
    # @emit "error", err
    @setStatus 'down'
    @reconnect()
    return

  #on rpc method exception
  onError: (err) ->
    return unless @isBound
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
    @setStatus 'up'
    @ping()

  #throttled ping while 'up'
  ping: ->
    return if @status is 'down'
    @count.ping++
    # @log "ping #{@count.ping}!"
    @remote._pnode.ping (ok) =>
      @count.pong++ if ok is true
      @ping()

  #down events
  onEnd: ->
    @log "server closed connection"
    @setStatus 'down'
    @reconnect()

  setStatus: (s) ->
    #status change
    @connecting = false
    return unless s in ['up', 'down'] and s isnt @status
    @log s
    @status = s
    @emit s

  reset: ->
    @setStatus 'down'
    if @d
      @d.removeAllListeners().end()
      @d = null

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

  serialize: -> @uri()
