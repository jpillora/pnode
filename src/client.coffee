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
    up: 1
    down: 2
    connecting: 3

  constructor: ->
    super

    if @opts.timeout >= @opts.interval
      @err "'timeout' must be less than 'interval'"

    @ping = 0
    @retry = 0
    @status = 'down'

    #add helpers for a few types of transports
    for name, transport of @transports
      @[name] = { connect: transport.connect.bind(@) }

    @check = _.throttle @check, @opts.interval

    _.extend @get, @
    return @get

  expose: (obj) ->
    _.extend @exposed, obj

  onConnect: (fn) ->
    @getConnection = fn

  get: (callback) ->
    if @status is 'down'
      @setStatus 'connecting'

      @d = dnode @exposed
      @d.once 'remote', @onRemote
      @d.once 'end', @onEnd
      
      @getConnection (read) =>
        @err "Invalid read stream" unless read.readable
        read.pipe(@d)
      , (write) =>
        @err "Invalid write stream" unless write.writable
        @d.pipe(write)
        write.on 'error', (e) =>
          # @log "write error: #{e}"
          @check()

      @once 'remote', callback
    else if @status is 'up'
      callback @remote
    else
      @once 'remote', callback

  unget: (callback) ->
    @removeListener 'remote', callback

  onRemote: (@remote) ->
    @log 'connected', _.keys remote
    @setStatus 'up'
    @emit 'remote', remote
    @check()

  onEnd: ->
    @log "lost connection to server"
    @setStatus 'down'
    @check()

  check: ->

    if @retry >= @opts.retries
      @setStatus 'down'
      return

    t = null
    @ping++
    p = @ping
    @retry++
    # @log "ping: ##{@ping}, fails: ##{@retry}"

    #grab remote 
    callback = (remote) =>
      clearTimeout t

      unless remote._ping
        @err "Missing '_ping' function"
        @setStatus 'down'
        @check()
        return

      remote._ping (ok) =>
        if ok is true
          @retry = 0
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
    return unless @statuses[s] and s isnt @status
    @log "#{@status} -> #{s}"
    @status = s
    @emit s

module.exports = (opts) ->
  new Client opts


