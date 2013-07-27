https = require 'https'
pem = require 'pem'
pkg = require '../../package.json'

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

exports.connect = (port) ->
  opts =
    hostname: 'localhost'
    port: port
    path: '/hnode'
    rejectUnauthorized: false
    headers:
      'user-agent': 'hnode/'+pkg.version
      'transfer-encoding': 'chunked'
      'expect': '100-continue'

  @onConnect (passRead, passWrite) ->
    @log 'connecting to ' + port
    req = https.request opts, (res) =>
      passRead(res)
    passWrite(req)