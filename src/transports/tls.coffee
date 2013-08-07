tls = require 'tls'
pem = require 'pem'

exports.listen = (opts, port, callback) ->

  console.log "TLS IS NOT WORKING YET"

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
    @server = tls.createServer opts, @handle
    @server.listen.apply @server, args

  #start
  getOpts()

exports.connect = ->
  args = arguments
  @createConnection (streamCallback) ->
    # { secureProtocol: 'TLSv1_client_method' }
    streamCallback tls.connect.apply tls, args