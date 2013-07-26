_ = require 'lodash'
dnode = require 'dnode'
Base = require './base'

class Client extends Base

  name: 'Client'

  defaults:
    retries: 10
    timeout: 1000
    interval: 10000

  constructor: (@opts = {})->
    @status = 'down'
    @exposed = {
      name: 'client'
    }
    _.defaults @opts, @defaults
    _.bindAll @

    for name, transport of @transports
      @[name] = { connect: transport.connect.bind(@) }

    _.extend @get, @
    return @get

  expose: (obj) ->
    _.extend @exposed, obj

  onConnect: (fn) ->
    @getConnection = fn

  get: (callback) ->
    if @status is 'down'
      @status = 'connecting'
      @d = dnode @exposed
      @d.on 'remote', @setRemote
      @getConnection (read, write = read) =>
        @checkStreams read, write
        read.pipe(@d).pipe(write)
    else if @status is 'connecting'
      @once 'remote', callback
    else if @status is 'up'
      callback @remote
    else
      @err 'what da...'

  setRemote: (remote) ->
    @log 'server', _.keys remote
    @status = 'up'
    @emit 'remote', remote
      
    remote.ho( @exposed )

    @remote = remote




module.exports = (opts) ->
  new Client opts


