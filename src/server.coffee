dnode = require 'dnode'
Base = require './base'
transports = require './transports'
helper = require './helper'
_ = require '../vendor/lodash'
RemoteContext = require './context'
servers = []

#represents a client connection
class Connection extends Base.Logger

  name: 'Connection'

  constructor: (@server, read, write) ->

    @opts = @server.opts
    @id = @guid = "S-#{@server.id}"
    @subs = {}

    @ctx = new RemoteContext
    @ctx.getAddr read

    #provide a client-specific version of exposed
    @d = dnode @server.boundExposed(@ctx)
    
    #handle dnode event
    helper.proxyEvents @d, @, 'error', 'fail', 'end'
    @d.once 'remote', @onRemote.bind(@)

    #connect!
    read.once 'close', @d.end
    read.pipe(@d).pipe(write)

  close: ->
    @d.end() if @d

  #recieve a remote interface
  onRemote: (remote) ->
    meta = remote._pnode
    unless meta
      @log "closing connection, not a pnode client"
      d.end()
      return

    {@id, @guid} = meta
    @ctx.getIds meta

    @log "dnode connected!"
    @remote = remote
    @emit 'remote', remote
    return

class Server extends Base

  name: 'Server'

  defaults:
    debug: false
    wait: 5000

  constructor: ->
    super
    @clients = []
    #add indexes
    @clients.ids = {}
    @clients.guids = {}
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

    client = new Connection @, read, write

    client.once 'remote', (remote) =>

      #check for existing id or guid
      for idType in ['id', 'guid']
        c = client[idType] 
        if c and @clients[idType+'s'][c]
          @warn "rejected client with duplicate #{idType}: #{c}"
          client.close()
          return

      #add to all
      @clients.push client
      @clients.ids[client.id] = client
      @clients.guids[client.guid] = client

      @emit 'remote', remote
      @emit 'connection', client, @

    client.once 'end', =>
      i = @clients.indexOf client
      return if i is -1
      @log 'removing client ', i
      #remove from all
      @clients.splice i, 1
      delete @clients.ids[client.id]
      delete @clients.guids[client.guid]
      @emit 'disconnection', client

  client: (id, callback) ->
    rem = @clientSync id
    return callback(rem) if rem

    t = setTimeout =>
      @log "timeout waiting for #{id}"
      @removeListener 'remote', cb
    , @opts.wait

    cb = =>
      @log "new remote! looking for #{id}"
      rem = @clientSync id
      return unless rem
      clearTimeout t
      @removeListener 'remote', cb
      callback rem

    @on 'remote', cb
    return

  clientSync: (id) ->
    if typeof id is 'string'
      return (@clients.ids[id] or @clients.guids[id] or {}).remote
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

