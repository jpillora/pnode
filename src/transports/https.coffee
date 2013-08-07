https = require 'https'
pkg = require '../../package.json'
pem = require 'pem'

exports.listen = ->

  args = Array::slice.call arguments
  opts = null

  getOpts = =>
    if typeof args[0] is 'object'
      opts = args.shift()
      checkPort()
    else
      pem.createCertificate {days:365, selfSigned:true}, (err, keys) =>
        @err err if err
        opts = {key: keys.serviceKey, cert: keys.certificate}
        checkPort()

  checkPort = =>
    if typeof args[0] isnt 'number'
      args.unshift @opts.port
    gotOpts()

  gotOpts = =>
    @server = https.createServer opts, @handle
    @server.listen.apply @server, args

  #start
  getOpts()

exports.connect = (port, hostname) ->

  if typeof port is 'string'
    hostname = port
    port = @opts.port

  opts =
    hostname: hostname
    port: port
    path: '/'+pkg.name
    rejectUnauthorized: false
    headers:
      'user-agent': pkg.name+'/'+pkg.version
      'transfer-encoding': 'chunked'
      'expect': '100-continue'

  @createConnection (readCallback, writeCallback) ->
    writeCallback https.request opts, readCallback