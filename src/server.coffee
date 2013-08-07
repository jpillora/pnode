_ = require 'lodash'
dnode = require 'dnode'
Base = require './base'
transports = require './transports'

class Server extends Base

  name: 'Server'

  defaults:
    wait: 5000

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
    @emit 'remote', meta.id, remote
    d.once 'end', =>
      @log 'disconnected from client', meta.id
      delete @clients[meta.id]

  client: (id, callback) ->
    rem = @clientSync id
    return callback(rem) if rem

    t = setTimeout =>
      # @log "timeout waiting for #{id}"
      @removeListener 'remote', cb
    , @opts.wait

    cb = =>
      rem = @clientSync id
      return unless rem
      clearTimeout t
      @removeListener 'remote', cb
      callback rem

    @on 'remote', cb

  clientSync: (id) ->
    if _.isString id
      return @clients[id]?.remote
    else if _.isNumber id
      i = id
      for id, client of @clients
        return client.remote if i-- is 0
      return null
    else
      @err "invalid arguments"

  disconnect: ->
    client.d.end() for id, client of @clients
    @server.close() if @server

  # clients: ->
  #   _.map @clients, (c) -> c.remote


module.exports = (opts) ->
  new Server opts


