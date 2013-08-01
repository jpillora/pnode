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
    
    _.extend @get, @
    return @get

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
    meta = remote._multi
    unless meta
      @log "closing connection, not a multinode client"
      conn.end()
      return
    
    @clients[remote.id] = {remote, conn}
    @log 'connected to client', meta.id
    @emit 'remote', remote
    conn.once 'end', =>
      @log 'disconnected from client', meta.id
      @clients[meta.id] = null

  get: (id, callback) ->
    unless @clients[id]
      return callback null
    callback @clients[id].remote

module.exports = (opts) ->
  new Server opts


