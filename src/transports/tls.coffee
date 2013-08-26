tls = require 'tls'
fs = require 'fs'
pem = require 'pem'
_ = require '../../vendor/lodash'

exports.bindServer = (args..., opts) ->

  pserver = @
  si = {}

  start = =>
    s = tls.createServer opts, (stream) -> pserver.handle stream
    s.listen.apply s, args
    addr = s.address()
    pserver.setInterface
      uri: "tls://#{addr.address}:#{addr.port}"
      unbind: -> s.close()

  #start
  if typeof opts is 'object'
    start()
  else
    pem.createCertificate {days:365, selfSigned:true}, (err, keys) =>
      pserver.err err if err
      opts =
        key: keys.serviceKey
        cert: keys.certificate
        rejectUnauthorized: false
      start()

  return si

exports.bindClient = (args...) ->

  opts = {}
  if typeof args[0] is 'number'
    opts.port = args.shift()
  if typeof args[0] is 'string'
    opts.hostname = args.shift()
  if typeof args[0] is 'object'
    _.merge opts, args.shift()

  if opts.rejectUnauthorized is `undefined`
    opts.rejectUnauthorized = false

  pclient = @
  pclient.createConnection (callback) ->
    callback tls.connect.call null, opts

  pclient.setInterface
    uri: "tls://#{opts.hostname or 'localhost'}:#{opts.port}"
  return

