http = require 'http'
pkg = require '../../package.json'

exports.bindServer = (args...) ->
  server = @
  s = http.createServer server.handle
  s.listen.apply s, args
  return {
    unbind: -> s.close()
  }

exports.bindClient = (args...) ->

  client = @

  opts =
    path: '/'+pkg.name
    headers:
      'user-agent': pkg.name+'/'+pkg.version
      'transfer-encoding': 'chunked'
      'expect': '100-continue'

  if typeof args[0] is 'number'
    opts.port = args.shift()
  else
    client.err "bind failed: missing port"

  if typeof args[0] is 'string'
    opts.hostname = args.shift()

  client.createConnection (readCallback, writeCallback) ->
    writeCallback http.request opts, readCallback
