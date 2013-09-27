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

    @opts = @server.opts # {debug: true}
    @id = @guid = "..."
    @subs = {}

    @ctx = new RemoteContext
    @ctx.getAddr read

    #provide a client-specific version of exposed
    @d = dnode @server.wrapObject(@server.exposed, @ctx)

    #handle dnode event
    @d.on 'error', @onError.bind(@)
    @d.on 'fail', @onFail.bind(@)
    @d.once 'remote', @onRemote.bind(@)

    read.once 'close', @d.end
    read.once 'end', @d.end
    write.once 'close', @d.end
    write.once 'end', @d.end

    @d.once 'end', =>
      # @log "DNODE END (from #{@server.id})"
      @emit 'down'

    #splice!
    read.pipe(@d).pipe(write)

  unbind: (cb) ->
    # @log "EXPLICIT UNBIND (from #{@server.id})"
    @d.once 'end', cb if cb
    @d.end()
    #remove all eventlisteners
    @removeAllListeners()

  #recieve a remote interface
  onRemote: (remote) ->

    remote = @server.wrapObject(remote)

    meta = remote._pnode
    unless meta
      @warn "Invalid pnode connection"
      d.end()
      return

    {@id, @guid} = meta
    @ctx.getMeta meta
    
    @remote = remote
    @emit 'remote', remote
    @emit 'up'
    return

  onError: (err) ->
    @warn "dnode error: #{err}"
    @server.emit 'error', err

  onFail: (err) ->
    @warn "dnode fail: #{err}"
    @server.emit 'fail', err

  publish: ->
    args = arguments
    unless @ctx.events[args[0]]
      @log "not subscribed to event: #{args[0]}"
      return
    @remote._pnode.publish.apply null, args

  subscribe: (event, fn) ->
    @remote._pnode.subscribe event

  toString: ->
    "#{@name}: #{@server.id} -> #{@id}:"
