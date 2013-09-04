
Socket = require("net").Socket

#interface provided to each function exposed
module.exports = class RemoteContext
  constructor: ->
    @data = {}
    @events = {}
  
  get: (k) -> @data[k]
  set: (k, v) -> @data[k] = v
  
  getAddr: (stream) ->
    #set src ip
    if stream instanceof Socket
      sock = stream
    else if stream.connection instanceof Socket
      sock = stream.connection
    if sock
      @ip = sock.remoteAddress
      @port = sock.remotePort

  getIds: (pnode) ->
    {@id, @guid} = pnode
    for e in pnode.events
      @events[e] = 1
