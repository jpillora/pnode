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
    @d = dnode @server.exposeWith(@ctx)
    
    #handle dnode event
    helper.proxyEvents @d, @, 'error', 'fail', 'end'
    @d.once 'remote', @onRemote.bind(@)

    #connect!
    read.once 'close', @d.end
    read.pipe(@d).pipe(write)

    @once 'end', => @emit 'disconnected'

  disconnect: ->
    @d.end() if @d

  #recieve a remote interface
  onRemote: (remote) ->
    meta = remote._pnode
    unless meta
      @log "closing connection, not a pnode connection"
      d.end()
      return

    {@id, @guid} = meta
    @ctx.getIds meta

    @log "dnode connected!"
    @remote = remote
    @emit 'remote', remote
    return

  publish: ->
    args = arguments
    return unless @ctx.events[args[0]]
    @remote._pnode.publish.apply null, args

  subscribe: (event, fn) ->
    @remote._pnode.subscribe event

class Server extends Base

  name: 'Server'

  defaults:
    debug: false
    wait: 5000

  constructor: ->
    super
    @connections = []
    #add indexes
    @connections.ids = {}
    @connections.guids = {}
    #alias
    @bindOn = @bind

  #premade handlers
  bind: ->
    @unbind()
    transports.bind @, arguments
    return

  unbind: ->
    for connection in @connections
      connection.disconnect()
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

    connection = new Connection @, read, write

    connection.once 'remote', (remote) =>
      #check for existing id or guid
      for idType in ['id', 'guid']
        c = connection[idType] 
        if c and @connections[idType+'s'][c]
          @warn "rejected connection with duplicate #{idType}: #{c}"
          connection.disconnect()
          return
      #add to all
      @connections.push connection
      @connections.ids[connection.id] = connection
      @connections.guids[connection.guid] = connection

      @emit 'remote', remote
      @emit 'connection', connection, @

    connection.once 'disconnected', =>
      i = @connections.indexOf connection
      return if i is -1
      @log 'removing connection ', i
      #remove from all
      @connections.splice i, 1
      delete @connections.ids[connection.id]
      delete @connections.guids[connection.guid]
      @emit 'disconnection', connection

  connection: (id, callback) ->
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
      return (@connections.ids[id] or @connections.guids[id] or {}).remote
    else if typeof id is 'number'
      return @connections[id]?.remote
    else
      @err "invalid arguments"

  #pubsub to ALL connection remotes
  publish: ->
    args = arguments
    for connection in @connections
      connection.publish.apply null, args

  subscribe: (event, fn) ->
    @pubsub.on event, fn
    for connection in @connections
      connection.subscribe event

  setInterface: (obj) -> @si = obj
  uri: -> @si?.uri
  serialize: -> @uri()

module.exports = (opts, parent) ->
  server = new Server opts, parent
  servers.push server
  return server

#unbind all servers on exit
process.on? 'exit', ->
  for server in servers
    server.unbind()

process.on? 'SIGINT', ->
  process.exit()

