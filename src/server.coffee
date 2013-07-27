_ = require 'lodash'
dnode = require 'dnode'
Base = require './base'

class Server extends Base

  name: 'Server'

  defaults:
    hello: 42

  constructor: ->
    super
    @clients = {}
    #add helpers for a few types of transports
    for name, transport of @transports
      @[name] = { listen: transport.listen.bind(@) }
    

  expose: (obj) ->
    _.extend @exposed, obj

  handle: (read, write = read) ->

    @err "Invalid read stream" unless read.readable
    @err "Invalid write stream" unless write.writable

    d = dnode @exposed
    d.once 'remote', @onRemote
    read.once 'close', d.end

    read.pipe(d).pipe(write)

  onRemote: (remote, conn) ->
    @log 'connected', _.keys remote
    @emit 'remote', remote
    
    if(remote.id)
      @clients[remote.id] = remote
      conn.once 'end', =>
        @clients[remote.id] = null



module.exports = (opts) ->
  new Server opts


