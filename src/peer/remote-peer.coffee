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
    @cliconns = []
    Object.defineProperty @, 'uri', get: => @cliconns[0]?.uri
    @connecting = false
    @ctx = new RemoteContext
    @ctx.id = id
    @ctx.guid = guid
    @isUp(false)

  #will be a client (outgoing) OR connection (incoming)
  add: (cliconn) ->

    @ctx.combine cliconn.ctx
  
    @cliconns.push cliconn
    cliconn.once 'down', =>
      @log "LOST CONNECTION (#{@uri})"
      @cliconns.splice @cliconns.indexOf(cliconn), 1
      @setActive()

    @log "add connection (#conns:#{@cliconns.length})"
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
      @log "UP"
      @emit 'up'
    else
      @up = false
      @remote = null
      @emit 'down'
      @log "DOWN"
    return

  #custom serialisation
  serialize: ->
    id: @id
    guid: @guid
    ips: @ips
    clients: helper.serialize @clients

  toString: ->
    type = if @cliconns[0]?.name is 'Client' then '>' else '<'
    "#{@name}: #{@local.id}#{type}#{@id}:"
