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
    
    #timeoutify and throttle connects
    @connect = _.throttle @connect, @opts.retryInterval, {leading:true}

    # @on ['timeout','connect'], =>
    #   @log "connect TIMEOUT!"
    #   @reset()
    #   @connect()

    #throttle ping (already timeoutified from remote)
    @ping = _.throttle @ping, @opts.pingInterval

    @on ['timeout','ping'], =>
      @log "ping TIMEOUT!"

    #alias
    @bindTo = @bind

    @on 'binding,unbound', =>
      if @d
        @d.removeAllListeners().end()
        @d = null
      return

    @on 'unbound', =>
      @emit 'down'
      @connect()
      return

    #store URI
    @on 'uri', (@uri) => 

    #handle streams
    onRead = (@read) =>
      if @d.splicedRead
        @err new Error "Already spliced read stream" 
      unless helper.isReadable read
        @err new Error "Invalid read stream" 
      read.on 'error', @onStreamError
      #extract src ip and port
      @ctx.getAddr read
      #read to dnode
      @d.splicedRead = true
      read.pipe(@d)

    onWrite = (@write) =>
      if @d.splicedWrite
        @err new Error "Already spliced write stream" 
      unless helper.isWritable write
        @err new Error "Invalid write stream" 
      write.on 'error', @onStreamError
      #write from dnode
      @d.splicedWrite = true
      @d.pipe(write)

    @on 'read', (read) ->
      onRead read
    @on 'write', (write) ->
      onWrite write
    @on 'stream', (stream) ->
      onRead stream
      onWrite stream

  bind: ->
    @count.attempt = 0 
    @bindArgs = arguments
    @connect()
    return

  unbind: ->
    @log "CLIENT UNBIND"
    @count.attempt = Infinity
    super

  server: (callback) ->
    if @bound and @remote
      return callback @remote
    else if @unbound
      @count.attempt = 0
      @connect()      

    #call back when remote arrives
    @once 'remote', callback
    return

  unget: (callback) ->
    @removeListener 'remote', callback

  connect: ->
    unless @bindArgs and
           not @bound and
           @count.attempt < @opts.maxRetries
      return

    @log "connecting...."

    @count.attempt++

    #server context, exposed to remote api
    @ctx = new RemoteContext
    @d = dnode @wrapObject(@exposed, @ctx)
    @d.splicedRead = false
    @d.splicedWrite = false

    @remote = null
    @d.once 'remote', @onRemote
    @d.once 'end', @onEnd
    @d.once 'error', @onError
    @d.once 'fail', @onStreamError

    #timeout connects
    # clearTimeout @connect.t
    # @connect.t = setTimeout @onConnectTimeout, @opts.timeout
    # @d.once 'remote', => clearTimeout @connect.t

    @log "connection attempt #{@count.attempt}..."

    #call transport bind using local bind call args
    Base::bind.apply @, @bindArgs
    return

  # onConnectTimeout: ->
  #   @emit 'timeout.connect'
  #   #TODO Base::unbind.call @
  #   @unbind => @connect() 

  #connection failed
  onStreamError: (err) ->

    return if @unbound or @unbinding
    
    # if err.code is 'ECONNREFUSED'
    #   @log "blocked by server"
    # else

    #errored must be unbound
    @tEmitter?.emit 'unbound'

    @log "stream error: #{err.message}"
    # @emit "error", err
    @connect()
    return

  #on rpc method exception
  onError: (err) ->
    @warn "===== #{err.stack or err}"
    return if @unbound or @unbinding
    msg = if err.stack then err.stack + "\n====" else err
    @err new Error msg

  #up events
  onRemote: (remote) ->

    remote = @wrapObject(remote)

    #ensure it's a pnode remote
    meta = remote?._pnode
    unless typeof meta?.ping is "function"
      return @err new Error "Invalid pnode host"

    # @log "got server remote", meta
    @remote = remote
    @ctx.getMeta meta
    
    @log "server remote!"
    @emit 'remote', @remote, @
    @emit 'up'
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
    @connect()

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
    #if we are not yet subscribed, notify server
    if @pubsub.listeners(event).length is 0
      @server (remote) =>
        remote._pnode.subscribe event
    super
    return

  serialize: -> @uri
