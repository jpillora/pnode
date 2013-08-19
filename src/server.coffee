dnode = require 'dnode'
Base = require './base'
transports = require './transports'
helper = require './helper'
servers = []

class Server extends Base

  name: 'Server'

  defaults:
    debug: true
    wait: 5000

  constructor: ->
    super
    @clients = {}

  #premade handlers
  bind: ->
    @si = transports.bind @, arguments

  unbind: ->
    client.d.end() for id, client of @clients
    try
      @si.unbind() if typeof @si?.unbind is 'function'
    catch e
      #ignore if already closed

  handle: (read, write) ->

    if read.write and not write?.write
      write = read

    @err "Invalid read stream" unless helper.isReadable read
    @err "Invalid write stream" unless helper.isWritable write

    d = dnode @exposed

    d.once 'remote', @onRemote

    d.on 'error', (err) => @log 'handle error', err
    d.on 'fail', (err) => @log 'handle fail', err
    
    read.once 'close', d.end

    read.pipe(d).pipe(write)

  onRemote: (remote, d) ->
    meta = remote._multi
    unless meta
      @log "closing connection, not a pnode client"
      d.end()
      return
    
    @clients[meta.id] = {remote, d}

    @log 'connected to client', meta.id
    @emit 'remote', remote
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
    if typeof id is 'string'
      return @clients[id]?.remote
    else if typeof id is 'number'
      i = id
      for id, client of @clients
        return client.remote if i-- is 0
      return null
    else
      @err "invalid arguments"


module.exports = (opts) ->
  server = new Server opts
  servers.push server
  return server

#unbind all servers on exit
process.on? 'exit', ->
  for server in servers
    server.unbind()

process.on? 'SIGINT', ->
  process.exit()

