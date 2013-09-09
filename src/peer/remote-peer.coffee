Base = require '../base'
RemoteContext = require '../context'

# a remote peer contains all connections to and from it
# identified by its 'guid', all remotes with this guid
# will be added to this peer which may be used as an
# rpc transport
module.exports = class RemotePeer extends Base.Logger

  name: 'RemotePeer'

  constructor: (@local, @guid, @id, @ips) ->
    @connecting = false
    @ctx = new RemoteContext
    @isUp(false)
    @opts = @local.opts
    @cliconns = []

  #will be a client (outgoing) OR connection (incoming)
  add: (cliconn) ->
    @log "add connection (required:#{not @up})"

    @ctx.combine cliconn.ctx
    
    #disconnect if already connected
    @remote = cliconn.remote unless @up
  
    @cliconns.push cliconn
    cliconn.once 'down', =>
      @log "LOST CONNECTION TO", cliconn.id
      @cliconns.splice @cliconns.indexOf(cliconn), 1
      @setRemote()

    @setRemote()

  setRemote: ->
    @remote = @cliconns[0]?.remote
    @isUp(typeof @remote is 'object')

  isUp: (up) ->
    if up
      @up = true
      @emit 'up'
    else
      @up = false
      @remote = null
      @emit 'down'
    return

  unbind: ->
    for cliconn in Array::slice.call @cliconns
      cliconn.unbind()

  #custom serialisation
  serialize: ->
    id: @id
    guid: @guid
    ips: @ips
    clients: helper.serialize @clients