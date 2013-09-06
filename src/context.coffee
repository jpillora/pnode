
_ = require '../vendor/lodash'
Socket = require("net").Socket

#interface provided to each function exposed
module.exports = class RemoteContext
  constructor: ->
    @data = {}
    @events = {}
  
  get: (k) -> @data[k]
  set: (k, v) -> @data[k] = v
  
  combine: (ctx) ->
    @data   = ctx.data   = _.merge @data, ctx.data
    @events = ctx.events = _.merge @events, ctx.events

  getAddr: (stream) ->
    return if process.browser

    #set src ip
    if stream instanceof Socket
      sock = stream
    else if stream.connection instanceof Socket
      sock = stream.connection
    if sock
      @ip = sock.remoteAddress
      @port = sock.remotePort

  getMeta: (meta) ->
    {@id, @guid} = meta
    for e in meta.events
      @events[e] = 1
