_ = require 'lodash'
dnode = require 'dnode'
Base = require './base'

class Client extends Base

  name: 'Client'

  defaults:
    retries: 3
    timeout: 1000
    interval: 2000

  statuses:
    ['up', 'down', 'connecting']

  constructor: ->
    super

    if @opts.timeout >= @opts.interval
      @err "'timeout' must be less than 'interval'"

    @stat =
      ping: 0
      retry: 0
    
    @status = 'down'

    #add helpers for a few types of transports
    for name, transport of @transports
      @[name] = { connect: transport.connect.bind(@) }

    #limit ping interval
    @check = _.throttle @check, @opts.interval

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

  get: (callback) ->
    unless @getConnectionFn
      @err "no create connection method defined"

    if @status is 'up'
      callback @remote
      return
    else if @status is 'down'
      @setStatus 'connecting'

      @d = dnode @exposed
      @d.once 'remote', @onRemote
      @d.once 'end', @onEnd
      @d.once 'error', @onError
      
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
    
    @once 'remote', callback

  unget: (callback) ->
    @removeListener 'remote', callback

  onRemote: (@remote) ->
    @log 'connected', _.keys remote
    @setStatus 'up'
    @emit 'remote', remote
    @check()

  onError: (err) ->
    @log "error: #{err}"

  onStreamError: (err) ->
    @log "stream error: #{err}"
    @check()

  onEnd: ->
    @log "lost connection to server"
    @setStatus 'down'
    @check()

  check: ->

    if @stat.retry >= @opts.retries
      @setStatus 'down'
      return

    t = null
    @stat.ping++
    p = @stat.ping
    @stat.retry++
    # @log "ping: ##{@ping}, fails: ##{@retry}"

    #grab remote 
    callback = (remote) =>
      clearTimeout t

      meta = remote._multi
      unless meta
        @log "not a multinode server"
        return
      unless meta.ping
        @err "server missing '_ping' function"
        @setStatus 'down'
        @check()
        return

      meta.ping (ok) =>
        if ok is true
          @stat.retry = 0
        @check()

    #start timeout
    t = setTimeout =>
      @unget callback
      @setStatus 'down'
      @check()
    , @opts.timeout

    #make call
    @get callback

  setStatus: (s) ->
    return unless s in @statuses and s isnt @status
    @log "#{@status} -> #{s}"
    @status = s
    @emit s

module.exports = (opts) ->
  new Client opts


