https = require 'https'
pkg = require '../../package.json'
pem = require 'pem'

exports.bindServer = (args..., opts) ->

  server = @

  start = =>
    s = https.createServer opts, server.handle
    s.listen.apply s, args
    si.unbind = -> s.close()

  #start
  if typeof opts is 'object'
    start()
  else
    pem.createCertificate {days:365, selfSigned:true}, (err, keys) =>
      server.err err if err
      opts = {key: keys.serviceKey, cert: keys.certificate}
      start()

  return si = {}

exports.bindClient = (args...) ->

  client = @

  opts =
    path: '/'+pkg.name
    rejectUnauthorized: false
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
    writeCallback https.request opts, readCallback
