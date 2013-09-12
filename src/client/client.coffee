_ = require '../../vendor/lodash'
dnode = require 'dnode'
Base = require '../base'
helper = require '../helper'
transportMgr = require '../transport-mgr'
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

    @bound = false
    @stream = {}
    @count = { ping: 0, pong: 0, attempt: 0 }
    @connecting = false
    @status = 'down'

    #throttle reconnects and pings
    @reconnect = _.throttle @reconnect, @opts.retryInterval, {leading:true}
    @ping = _.throttle @ping, @opts.pingInterval

    #alias
    @bindTo = @bind    

  #premade connection creators
  bind: ->
    @unbind()
    #call the appropriate {transport}.bindClient()
    @bound = true
    transportMgr.bind @, arguments
    @log "bind to #{@uri()}!"
    return

  unbind: ->
    @log "unbind!" if @bound
    @bound = false
    @count.attempt = 0
    @reset()
    @stream.duplex?.close?()
    @stream.read?.close?()
    @stream.write?.close?()
    @stream = {}
    @ci = null
    @emit 'unbind'
    return

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

  reconnect: ->
    if @status is 'up' or
       @connecting or
       @count.attempt >= @opts.maxRetries
      return

    @count.attempt++
    @connecting = true

    @reset()

    #server context, exposed to remote api
    @ctx = new RemoteContext
    @d = dnode @exposeWith(@ctx)
    @d.once 'remote', @onRemote
    @d.once 'end', @onEnd
    @d.once 'error', @onError
    @d.once 'fail', @onStreamError

    @timeout =>
      @reset()
      @reconnect()

    @log "connection attempt #{@count.attempt} (#{@uri()})"
    @emit 'connecting'
    #get stream and splice in
    switch @getConnectionFn.length
      #user providing a duplex stream
      when 1
        @getConnectionFn (stream) =>
          @err "Invalid duplex stream (not readable)" unless helper.isReadable stream
          @err "Invalid duplex stream (not writable)" unless helper.isWritable stream
          stream.on 'error', @onStreamError

          #extract src ip and port
          @ctx.getAddr stream

          stream.pipe(@d).pipe(stream)
          @stream.duplex = stream
      #user providing a read stream and a write stream
      when 2
        @getConnectionFn (read) =>
          @err "Invalid read stream" unless helper.isReadable read
          read.on 'error', @onStreamError
          read.pipe(@d)

          #extract src ip and port
          @ctx.getAddr read

          @stream.read = read
        , (write) =>
          @err "Invalid write stream" unless helper.isWritable write
          write.on 'error', @onStreamError
          @d.pipe(write)
          @stream.write = write
    return

  #connection failed
  onStreamError: (err) ->
    return unless @bound
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
    return unless @bound
    @log "RPC Error: #{err.stack or err}"
    @err err

  #up events
  onRemote: (remote) ->

    @timeout(false)

    #ensure it's a pnode remote
    meta = remote?._pnode
    unless typeof meta?.ping is "function"
      return @err "Invalid pnode host"

    # @log "got server remote", meta

    @remote = remote
    @ctx.getMeta meta
    
    @log "EMIT REMOTE"
    @emit 'remote', @remote, @
    @setStatus 'up'
    @ping()

  #ping while 'up'
  ping: ->
    return if @status is 'down'
    @count.ping++
    @timeout(true)
    # @log "ping #{@count.ping}!"
    @remote._pnode.ping (ok) =>
      @count.pong++ if ok is true
      @timeout(false)
      @ping()

  #timeout method
  timeout: (cb) ->
    clearTimeout @timeout.t
    return if cb is false
    @timeout.t = setTimeout =>
      @setStatus 'down'
      cb() if typeof cb is 'function'
    , @opts.timeout

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

  setInterface: (obj) -> @ci = obj
  uri: -> @ci?.uri
  serialize: -> @uri()
