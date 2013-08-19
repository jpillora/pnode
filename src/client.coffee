_ = require '../vendor/lodash'
dnode = require 'dnode'
Base = require './base'
helper = require './helper'
transports = require './transports'

class Client extends Base

  name: 'Client'

  defaults:
    debug: false
    maxRetries: 5
    timeout: 5000
    interval: 1000
    port: 7337

  constructor: ->
    super

    @count = { ping: 0, pong: 0, attempt: 0 }
    @connecting = false
    @status = 'down'

    #throttle reconnects and pings
    @reconnect = _.throttle @reconnect, @opts.interval, {leading:true}
    @ping = _.throttle @ping, @opts.interval

    #return @get function extended by this instance
    _.extend @get, @
    return @get

  #premade connection creators
  bind: ->
    @count.attempt = 0
    transports.bind @, arguments

  unbind: ->
    @count.attempt = 0
    @reset()

  createConnection: (fn) ->
    unless typeof fn is 'function'
      @err "must be a function"
    unless fn.length is 1 or fn.length is 2
      @err "must have arity 1 or 2"
    @getConnectionFn = fn
    @reconnect()

  get: (callback) ->
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
    @d = dnode @exposed
    @d.once 'remote', @onRemote
    @d.once 'end', @onEnd
    @d.once 'error', @onError
    @d.once 'fail', @onStreamError

    @timeout =>
      @reset()
      @reconnect()

    # @log "connection attempt #{@count.attempt}!"
    @emit 'connecting'
    #get stream and splice in
    switch @getConnectionFn.length
      #user providing a duplex stream
      when 1
        @getConnectionFn (stream) =>
          @err "Invalid duplex stream (not readable)" unless helper.isReadable stream
          @err "Invalid duplex stream (not writable)" unless helper.isWritable stream
          stream.on 'error', @onStreamError
          stream.pipe(@d).pipe(stream)
      #user providing a read stream and a write stream
      when 2
        @getConnectionFn (read) =>
          @err "Invalid read stream" unless helper.isReadable read
          read.on 'error', @onStreamError
          read.pipe(@d)
        , (write) =>
          @err "Invalid write stream" unless helper.isWritable write
          write.on 'error', @onStreamError
          @d.pipe(write)

  #connection failed
  onStreamError: (err) ->
    # if err.code is 'ECONNREFUSED'
    #   @log "blocked by server"
    # else
    #   @log "stream error: #{err.message}"
    # @emit "error", err
    @setStatus 'down'
    @reconnect()

  #on rpc method exception
  onError: (err) ->
    @log "error: #{err}"
    @emit "error", err

  #up events
  onRemote: (remote) ->

    @timeout(false)

    #ensure it's a pnode remote
    unless remote._multi?.ping
      return @err "Invalid pnode host"
    
    @remote = remote
    @emit 'remote', @remote
    @setStatus 'up'
    @ping()

  #ping while 'up'
  ping: ->
    return if @status is 'down'
    @count.ping++
    @timeout(true)
    # @log "ping #{@count.ping}!"
    @remote._multi.ping (ok) =>
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
    @d.removeAllListeners().end() if @d

module.exports = (opts) ->
  new Client opts


