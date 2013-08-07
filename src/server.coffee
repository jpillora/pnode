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

  #premade handlers
  listen: ->
    args = Array::slice.call arguments
    transport = args.shift()

    if /[^a-z]/.test transport
      @err "Invalid transport name: '#{transport}'"

    obj = transports.get transport
    unless obj
      @err "Transport: '#{transport}' not found"

    obj.listen.apply @, args

  expose: (obj) ->
    _.extend @exposed, obj

  handle: (read, write) ->

    if read.write and not write?.write
      write = read

    @err "Invalid read stream" unless read.read
    @err "Invalid write stream" unless write.write

    d = dnode @exposed
    d.once 'remote', @onRemote
    read.once 'close', d.end

    read.pipe(d).pipe(write)

  onRemote: (remote, d) ->
    meta = remote._multi
    unless meta
      @log "closing connection, not a multinode client"
      d.end()
      return
    
    @clients[meta.id] = {remote, d}

    @log 'connected to client', meta.id
    @emit 'remote', remote
    d.once 'end', =>
      @log 'disconnected from client', meta.id
      @clients[meta.id] = null

  client: (id) ->
    if _.isString id
      return @clients[id]?.remote
    else if _.isNumber id
      i = id
      for id, client of @clients
        return client.remote if i-- is 0
      return null
    @err "invalid arguments"

  disconnect: ->
    if @server
      @server.close()

  # clients: ->
  #   _.map @clients, (c) -> c.remote


module.exports = (opts) ->
  new Server opts


