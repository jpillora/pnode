Base = require '../base'
RemoteContext = require '../context'
helper = require '../helper'

# a remote peer contains all connections to and from it
# identified by its 'guid', all remotes with this guid
# will be added to this peer which may be used as an
# rpc transport
module.exports = class RemotePeer extends Base.Logger

  name: 'RemotePeer'

  constructor: (@local, @guid, @id, @ips) ->
    @opts = @local.opts
    @connecting = false
    @ctx = new RemoteContext
    @ctx.id = id
    @ctx.guid = guid
    @isUp(false)
    @cliconns = []

  #will be a client (outgoing) OR connection (incoming)
  add: (cliconn) ->
    @log "add connection (first remote:#{not @up})"

    @ctx.combine cliconn.ctx
  
    @cliconns.push cliconn
    cliconn.once 'down', =>
      # @log "LOST CONNECTION (from #{@local.id})"
      @cliconns.splice @cliconns.indexOf(cliconn), 1
      @setActive()

    @setActive()

  setActive: ->
    c = @cliconns[0]
    @remote = if c then c.remote else null
    @publish = if c then c.publish.bind(c) else null
    @subscribe = if c then c.subscribe.bind(c) else null
    @isUp(!!@remote)

  isUp: (up) ->
    return if @up is up
    if up
      @up = true
      @emit 'up'
    else
      @up = false
      @remote = null
      @emit 'down'
    return

  unbind: (callback) ->

    mkCb = helper.callbacker callback

    for cliconn in Array::slice.call @cliconns
      cliconn.unbind mkCb()
    return

  #custom serialisation
  serialize: ->
    id: @id
    guid: @guid
    ips: @ips
    clients: helper.serialize @clients

  toString: ->
    "#{@name}: #{@local.id}>#{@id}:"
