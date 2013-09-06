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
    @reset()
    @opts = @local.opts
    @cliconns = []

  #will be a client (outgoing) OR connection (incoming)
  add: (cliconn) ->
    @log "add peer (up:#{@up})"

    @ctx.combine cliconn.ctx
    
    #disconnect if already connected
    return cliconn.unbind() if @up
  
    @remote = cliconn.remote
  
    @cliconns.push cliconn
    cliconn.once 'down', =>
      @reset()
      @cliconns.splice @cliconns.indexOf(cliconn), 1

    @up = true
    @emit 'up'

  reset: ->
    @up = false
    @remote = null

  #custom serialisation
  serialize: ->
    id: @id
    guid: @guid
    ips: @ips
    clients: helper.serialize @clients