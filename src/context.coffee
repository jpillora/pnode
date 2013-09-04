
Socket = require("net").Socket

module.exports = class RemoteContext
  constructor: ->
    @data = {}
    @events = {}
  
  get: (k) -> @data[k]
  set: (k, v) -> @data[k] = v

  getAddr: (stream) ->
    #set src ip
    if stream instanceof Socket
      sock = read
    else if stream.connection instanceof Socket
      sock = stream.connection
    if sock
      @ip = sock.remoteAddress
      @port = sock.remotePort

  getIds: (obj) ->
    {@id, @guid} = obj
