http = require 'http'
shoe = require 'shoe'

#custom parse to include path
exports.parse = (str) ->
  args = []
  if typeof str is 'string' and /^(.+?)(:(\d+))?(\/.+)$/.test str
    port = parseInt RegExp.$3, 10
    args.push(port) if port
    args.push(RegExp.$1)
    args.push(RegExp.$4)

  return args

#args are either a http server or http.createServer args
#opts is sockjs server opts

exports.bindServer = (emitter, args..., opts) ->

  emitter.emit 'binding'

  unless opts
    throw "Missing options"

  if args[0] instanceof http.Server
    s = args.shift()

  unless s
    s = http.createServer()
    s.listen.apply s, args

  #store connections for destroying later
  conns = []
  s.on 'connection', (conn) -> conns.push conn

  listening = ->
    emitter.emit 'bound'
    emitter.once 'unbind', ->
      emitter.emit 'unbinding'
      c.destroy() for c in conns
      s.close()

  #check already listening
  if s.address()
    listening()
  else
    s.once 'listening', listening

  s.once 'close', ->
    emitter.emit 'unbound'

  sock = shoe (stream) ->
    stream.destroy = null
    emitter.emit 'stream', stream

  sock.install s, opts
  return

exports.bindClient = ->
  # see 'browser/src/transports/ws.coffee'
  throw "bind ws client not supported in node"
