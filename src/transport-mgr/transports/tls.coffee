tls = require 'tls'
fs = require 'fs'
_ = require '../../../vendor/lodash'
secure = require "../secure-common"

exports.bindServer = (callback, args...) ->

  pserver = @

  #pull out opts
  opts = args.pop() if typeof args[args.length-1] is 'object'

  secure.checkCerts opts, (opts) ->
    #default allow unauthorized
    if opts.rejectUnauthorized is `undefined`
      opts.rejectUnauthorized = false

    s = tls.createServer opts, (stream) ->
      pserver.handle stream
    
    s.once 'listening', ->
      addr = s.address()
      callback
        uri: "tls://#{addr.address}:#{addr.port}"
        unbind: (cb) -> s.close cb
      return

    s.listen.apply s, args
    return

exports.bindClient = (args...) ->

  opts = {}
  if typeof args[0] is 'number'
    opts.port = args.shift()
  if typeof args[0] is 'string'
    opts.hostname = args.shift()
  if typeof args[0] is 'object'
    _.merge opts, args.shift()

  #default allow *unsigned* certs
  if opts.rejectUnauthorized is `undefined`
    opts.rejectUnauthorized = false

  uri = "tls://#{opts.hostname or 'localhost'}:#{opts.port}"

  pclient = @
  pclient.createConnection (callback) ->
    stream = tls.connect.call null, opts
    stream.once 'secureConnect', ->
      callback
        uri: uri
        stream: stream
        unbind: (cb) ->
          stream.once 'end', cb
          stream.end()

  return

