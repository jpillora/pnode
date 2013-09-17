tls = require 'tls'
fs = require 'fs'
_ = require '../../../vendor/lodash'
secure = require "../secure-common"

exports.bindServer = (callback, args...) ->

  pserver = @
  si = {}

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
        unbind: (cb) ->
          s.once 'close', cb
          s.close()
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

  if opts.rejectUnauthorized is `undefined`
    opts.rejectUnauthorized = false

  pclient = @
  pclient.createConnection (callback) ->
    callback tls.connect.call null, opts

  pclient.setInterface
    uri: "tls://#{opts.hostname or 'localhost'}:#{opts.port}"
  return

