_ = require 'lodash'
dnode = require 'dnode'
Base = require './base'

class Server extends Base

  name: 'Server'

  defaults:
    hello: 42

  constructor: (@opts = {})->
    @clients = {}
    @exposed = {
      name: 'server'
    }

    for name, transport of @transports
      @[name] = { listen: transport.listen.bind(@) }

    _.defaults @opts, @defaults
    _.bindAll @

  expose: (obj) ->
    _.extend @exposed, obj

  handle: (read, write = read) ->

    @checkStreams read, write

    d = dnode @exposed
    d.on 'remote', @setRemote
    d.on 'end', => @log "lost '#{remote?.name}'" 

    read.pipe(d).pipe(write)

  setRemote: (remote, d) ->
    @log 'set remote', _.keys remote
    if(remote.name)
      @clients[remote.name] = remote
    @emit 'remote', remote, d

module.exports = (opts) ->
  new Server opts


