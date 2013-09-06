dnode = require 'dnode'
Base = require './base'
transportMgr = require './transport-mgr'
helper = require './helper'
_ = require '../vendor/lodash'
RemoteContext = require './context'
ObjectIndex = require 'object-index'
servers = []

#represents a client conn
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
    helper.proxyEvents @d, @, 'error', 'fail'
    @d.once 'remote', @onRemote.bind(@)

    read.once 'close', @d.end
    read.once 'end', @d.end
    write.once 'close', @d.end
    write.once 'end', @d.end

    @d.once 'end', =>
      @log "disconnected!"
      @emit 'disconnected'

    #splice!
    read.pipe(@d).pipe(write)

  disconnect: ->
    @d.end() if @d

  #recieve a remote interface
  onRemote: (remote) ->
    @log "connected!"
    meta = remote._pnode
    unless meta
      @log "closing conn, not a pnode conn"
      d.end()
      return

    {@id, @guid} = meta
    @ctx.getMeta meta

    @log "dnode connected!"
    @remote = remote
    @emit 'remote', remote
    return

  publish: ->
    args = arguments
    unless @ctx.events[args[0]]
      @log "not subscribed to event: #{args[0]}"
      return 
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
    @connections = ObjectIndex "id", "guid"

    #alias
    @bindOn = @bind

  #premade handlers
  bind: ->
    @unbind()
    transportMgr.bind @, arguments
    return

  unbind: ->
    #copy and iterate
    for conn in Array::slice.call @connections.list
      conn.disconnect()
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

    conn = new Connection @, read, write

    conn.once 'remote', (remote) =>
      #check for existing id or guid
      if @connections.getBy("id",  conn.id) or
         @connections.getBy("guid",conn.guid)
        @warn "rejected duplicate conn with id #{conn.id} (#{conn.guid})"
        conn.disconnect()
        return
      #add to all
      @connections.add conn

      @emit 'remote', remote
      @emit 'conn', conn, @

    conn.once 'disconnected', =>
      if @connections.remove conn
        @log 'removed conn'
        @emit 'disconnection', conn

  client: (id, callback) ->
    conn = @connections.get id
    return conn unless callback
    return callback(conn.remote) if conn

    t = setTimeout =>
      @log "timeout waiting for #{id}"
      @removeListener 'remote', cb
    , @opts.wait

    cb = =>
      @log "new remote! looking for #{id}"
      conn = @connections.get id
      return unless conn
      clearTimeout t
      @removeListener 'remote', cb
      callback conn.remote

    @on 'remote', cb
    return

  #pubsub to ALL conn remotes
  publish: ->
    args = arguments
    for conn in @connections.list
      conn.publish.apply conn, args

  subscribe: (event, fn) ->
    @pubsub.on event, fn
    for conn in @connections.list
      conn.subscribe event

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

