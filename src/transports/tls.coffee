tls = require 'tls'
pem = require 'pem'

exports.listen = (opts, port, callback) ->

  useOpts = =>
    if typeof callback isnt 'function'
      callback = ->
    tls.createServer(opts, @handle).listen port, callback

  if typeof opts is 'number'
    callback = port
    port = opts
    pem.createCertificate {days:365}, (err, keys) =>
      opts = {key: keys.serviceKey, cert: keys.certificate};
      useOpts()
  else
    useOpts()

exports.connect = (port) ->
  @onConnect (passRead, passWrite) ->
    @log 'connecting to ' + port
    c = tls.connect(port)
    passRead(c)
    passWrite(c)