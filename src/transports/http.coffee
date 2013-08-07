http = require 'http'
pkg = require '../../package.json'

exports.listen = ->

  args = Array::slice.call arguments

  if typeof args[0] isnt 'number'
    args.unshift @opts.port

  @server = http.createServer @handle
  @server.listen.apply @server, args

exports.connect = (port, hostname) ->

  if typeof port is 'string'
    hostname = port
    port = @opts.port

  opts =
    hostname: hostname
    port: port
    path: '/'+pkg.name
    headers:
      'user-agent': pkg.name+'/'+pkg.version
      'transfer-encoding': 'chunked'
      'expect': '100-continue'

  @createConnection (readCallback, writeCallback) ->
    writeCallback http.request opts, readCallback
