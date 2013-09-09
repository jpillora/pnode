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

exports.bindServer = (args..., opts) ->

  pserver = @

  unless opts
    pserver.err "Missing options" 

  if args[0] instanceof http.Server
    s = args.shift()

  unless s
    s = http.createServer()
    s.listen.apply s, args

  sock = shoe (stream) -> pserver.handle stream
  sock.install s, opts

  pserver.setInterface
    unbind: -> s.close()

exports.bindClient = ->
  # see 'browser/src/transports/ws.coffee'
  throw "bind client not supported in node"