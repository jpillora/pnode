dnode = require 'dnode'
Base = require './base'
transports = require './transports'
helper = require './helper'
_ = require '../vendor/lodash'
servers = []

#represents a client connected
class Connection extends Base.Logger

  name: 'Connection'

  constructor: (@server, meta, @remote, @d) ->
    {@id, @guid} = meta


class Server extends Base

  name: 'Server'

  defaults:
    debug: false
    wait: 5000

  constructor: ->
    super
    @clients = []
    #alias
    @bindOn = @bind

  #premade handlers
  bind: ->
    @unbind()
    transports.bind @, arguments
    return

  unbind: ->
    for client in @clients
      client?.d?.end()
    try
      if typeof @si?.unbind is 'function'
        @si.unbind()
        @emit 'unbind'
    @si = null
    return

  handle: (read, write) ->

    if read.write and not write?.write
      write = read

    @err "Invalid read stream" unless helper.isReadable read
    @err "Invalid write stream" unless helper.isWritable write

    d = dnode @exposed

    helper.proxyEvents d, @, 'error', 'fail'
    d.once 'remote', @onRemote
    read.once 'close', d.end
    read.pipe(d).pipe(write)

  onRemote: (remote, d) ->
    meta = remote._pnode
    unless meta
      @log "closing connection, not a pnode client"
      d.end()
      return

    client = new Connection @, meta, remote, d
    @clients.push client

    @emit 'connection', client
    @emit 'remote', remote, @

    d.once 'end', =>
      i = @clients.indexOf client
      @log 'removing client ', i
      @clients.splice i, 1
      
      @emit 'disconnection', client
      client.emit 'disconnect'
    return

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

    @once 'remote', cb
    return

  clientSync: (id) ->
    if typeof id is 'string'
      for client in @clients
        if client.id is id or client.guid is id
          return client.remote
      return null
    else if typeof id is 'number'
      return @clients[id]?.remote
    else
      @err "invalid arguments"

  setInterface: (obj) -> @si = obj
  uri: -> @si?.uri
  serialize: -> @uri()

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

