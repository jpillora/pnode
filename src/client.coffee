_ = require 'lodash'
dnode = require 'dnode'
Base = require './base'
transports = require './transports'

class Client extends Base

  name: 'Client'

  defaults:
    retries: Infinity
    timeout: 10000
    interval: 1000

  constructor: ->
    super

    @count = { ping: 0, pong: 0, retry: 0 }
    @status = 'down'
    @connecting = false

    #add helpers for various transports
    for name, transport of transports
      @[name] = { connect: transport.connect.bind(@) }

    #handle the ups and downs
    @on 'up', @onUp
    @on 'down', @onDown

    #return @get function extended by this instance
    _.extend @get, @
    return @get

  expose: (obj) ->
    _.extend @exposed, obj

  createConnection: (fn) ->
    unless typeof fn is 'function'
      @err "must be a function"
    unless fn.length is 1 or fn.length is 2
      @err "must have arity 1 or 2"
    @getConnectionFn = fn

  get: (callback, forceRetry = false) ->

    #check connection function
    unless @getConnectionFn
      return @err "no create connection method defined"

    if @status is 'up'
      @count.retry = 0
      return callback @remote

    else if @status is 'down' and (not @connecting or forceRetry) 
      @connecting = true
      @d.removeAllListeners().end() if @d
      @d = dnode @exposed
      @d.once 'remote', @onRemote
      @d.once 'end', @onEnd
      @d.once 'error', @onError
      
      #get stream and splice in
      switch @getConnectionFn.length
        #user providing a duplex stream
        when 1
          @getConnectionFn (stream) =>
            @err "Invalid duplex stream" unless stream.read and stream.write
            stream.on 'error', @onStreamError
            stream.pipe(@d).pipe(stream)
        #user providing a read stream and a write stream
        when 2
          @getConnectionFn (read) =>
            @err "Invalid read stream" unless read.read
            read.on 'error', @onStreamError
            read.pipe(@d)
          , (write) =>
            @err "Invalid write stream" unless write.write
            write.on 'error', @onStreamError
            @d.pipe(write)
    
    #wait forever until remote arrives
    @once 'remote', callback

  unget: (callback) ->
    @removeListener 'remote', callback


  #up events
  onRemote: (remote) ->
    #ensure it's a multinode remote
    meta = remote._multi
    unless meta and meta.ping
      return @err "Invalid multinode host"
    
    @remote = remote
    @setStatus 'up'

  onUp: ->
    @emit 'remote', @remote
    @queuePing()

  queuePing: ->
    @ping.t = setTimeout @ping, @opts.interval

  #ping while 'up'
  ping: ->
    #ping/pong mismatch check...
    @count.ping++
    @timeout(true)
    @remote._multi.ping (ok) =>
      @count.pong++ if ok is true
      @timeout(false)
      @queuePing()

  #timeout method
  timeout: (cb = ->) ->

    if cb is false
      clearTimeout @timeout.t
      return

    setTimeout, =>
      @setStatus 'down'
      cb()
    , @opts.timeout

  #down events
  onError: (err) ->
    @log "error: #{err}"
    @emit "error", err
    @setStatus 'down'

  onStreamError: (err) ->
    # ignore stream errors, just retry
    @log "stream error: #{err}"
    @emit "error", err
    @setStatus 'down'

  onEnd: ->
    @log "lost connection to server"
    @setStatus 'down'

  onDown: ->
    #stop pinging
    clearTimeout @ping.t
    @retry()

  #retry while 'down'
  retry: ->
    clearTimeout @ping.t

    if @count.retry >= @opts.retries
      return

    @count.retry++
    # @log "ping: ##{@count.ping}, fails: ##{@count.retry}"

    #on remote 
    callback = (remote) => @timeout(false)

    #start timeout
    @timeout =>
      @unget callback
      @retry()

    #make call
    @get callback

  setStatus: (s) ->
    return unless s in ['up', 'down'] and s isnt @status
    @log "#{@status} -> #{s}"
    @status = s
    @emit s

module.exports = (opts) ->
  new Client opts


