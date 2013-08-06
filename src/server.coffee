_ = require 'lodash'
dnode = require 'dnode'
Base = require './base'
transports = require './transports'

class Server extends Base

  name: 'Server'

  defaults:
    hello: 42

  constructor: ->
    super
    @clients = {}
    #add helpers for a few types of transports
    for name, transport of transports
      @[name] = { listen: transport.listen.bind(@) }

  expose: (obj) ->
    _.extend @exposed, obj

  handle: (read, write) ->

    if read.write and not write?.write
      write = read

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
    
    @clients[meta.id] = {remote, conn}
    @log 'connected to client', meta.id
    @emit 'remote', remote
    conn.once 'end', =>
      @log 'disconnected from client', meta.id
      @clients[meta.id] = null

  client: (id) ->
    if _.isString id
      return @clients[id]?.remote
    else if _.isNumber id
      i = id
      for id, client of @clients
        return client.remote if i-- is 0 
    else
      @err "invalid arguments"

  # clients: ->
  #   _.map @clients, (c) -> c.remote


module.exports = (opts) ->
  new Server opts


