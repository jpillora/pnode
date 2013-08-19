tls = require 'tls'
fs = require 'fs'
pem = require 'pem'
_ = require '../../lib/lodash'

exports.bindServer = (args..., opts) ->

  server = @
  si = {}

  start = =>
    s = tls.createServer opts, (stream) -> server.handle stream
    s.listen.apply s, args
    si.unbind = -> s.close()

  #start
  if typeof opts is 'object'
    start()
  else
    pem.createCertificate {days:365, selfSigned:true}, (err, keys) =>
      server.err err if err
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

  client = @
  client.createConnection (callback) ->
    callback tls.connect.call null, opts



