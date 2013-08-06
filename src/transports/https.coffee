https = require 'https'
pkg = require '../../package.json'
pem = require 'pem'

exports.listen = (opts, port, callback) ->
  useOpts = =>
    if typeof callback isnt 'function'
      callback = ->
    https.createServer(opts, (req, res) =>
      @handle(req, res)
    ).listen port, callback

  if typeof opts is 'number'
    callback = port
    port = opts
    pem.createCertificate {days:365, selfSigned:true}, (err, keys) =>
      opts = {key: keys.serviceKey, cert: keys.certificate};
      useOpts()
  else
    useOpts()

exports.connect = (port, hostname) ->
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