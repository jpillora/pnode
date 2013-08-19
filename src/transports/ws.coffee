http = require 'http'
shoe = require 'shoe'

exports.bindServer = (args..., opts) ->

  server = @

  unless opts
    server.err "Missing options" 

  if typeof args[0] is 'number'
    port = args.shift()
  if typeof args[0] is 'string'
    hostname = args.shift()
  if args[0] instanceof http.Server
    s = args.shift()

  unless s
    server.log "creating server!"
    s = http.createServer()
    s.listen.apply s, args

  sock = shoe (stream) -> server.handle stream
  sock.install s, opts

  return {
    unbind: -> s.close()
  }

exports.bindClient = (args...) ->
  # see 'browser/src/transports/ws.coffee'
  throw "bind client not supported"
