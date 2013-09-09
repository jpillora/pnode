dnode = require 'dnode'
Base = require '../base'
helper = require '../helper'
RemoteContext = require '../context'
ObjectIndex = require 'object-index'
servers = []

#represents a client conn
module.exports = class Connection extends Base.Logger

  name: 'Connection'

  constructor: (@server, read, write) ->

    @opts = @server.opts
    @id = @guid = "..."
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
      @log "DNODE END"
      @emit 'down'

    #splice!
    read.pipe(@d).pipe(write)

  unbind: ->
    @log "EXPLICIT UNBIND"
    @d.end() if @d

  #recieve a remote interface
  onRemote: (remote) ->
    meta = remote._pnode
    unless meta
      @log "closing conn, not a pnode conn"
      d.end()
      return

    {@id, @guid} = meta
    @ctx.getMeta meta

    @remote = remote
    @emit 'remote', remote
    @emit 'up'
    return

  publish: ->
    args = arguments
    unless @ctx.events[args[0]]
      @log "not subscribed to event: #{args[0]}"
      return 
    @remote._pnode.publish.apply null, args

  subscribe: (event, fn) ->
    @remote._pnode.subscribe event
