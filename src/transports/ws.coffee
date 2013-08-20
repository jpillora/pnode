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

  server = @

  unless opts
    server.err "Missing options" 

  if args[0] instanceof http.Server
    s = args.shift()

  unless s
    s = http.createServer()
    s.listen.apply s, args

  sock = shoe (stream) -> server.handle stream
  sock.install s, opts

  return {
    unbind: -> s.close()
  }

exports.bindClient = (args...) ->
  # see 'browser/src/transports/ws.coffee'
  throw "bind client not supported in node"
