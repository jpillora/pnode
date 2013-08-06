tls = require 'tls'
pem = require 'pem'

exports.listen = (opts, port, callback) ->

  console.log "TLS IS NOT WORKING YET"

  useOpts = =>
    if typeof callback isnt 'function'
      callback = ->
    unless opts
      opts = {}
    # opts.secureProtocol = 'TLSv1_server_method'
    tls.createServer(opts, @handle).listen port, callback

  if typeof opts is 'number'
    callback = port
    port = opts
    pem.createCertificate {days:365, selfSigned:true}, (err, keys) =>
      opts = {key: keys.serviceKey, cert: keys.certificate};
      useOpts()
  else
    useOpts()

exports.connect = (port, host, opts, callback) ->
  @createConnection (streamCallback) ->
    # { secureProtocol: 'TLSv1_client_method' }
    streamCallback tls.connect port, host, opts, callback