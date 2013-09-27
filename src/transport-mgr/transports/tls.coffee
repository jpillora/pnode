tls = require 'tls'
fs = require 'fs'
_ = require '../../../vendor/lodash'
secure = require "../secure-common"

exports.bindServer = (emitter, args...) ->

  #pull out opts
  opts = args.pop() if typeof args[args.length-1] is 'object'

  emitter.emit 'uri', "tls://#{if typeof args[1] is 'string' then args[1] else '0.0.0.0'}:#{args[0]}"
  emitter.emit 'configuring'

  secure.checkCerts opts, (opts) ->

    emitter.emit 'binding'

    #default allow unauthorized
    if opts.rejectUnauthorized is `undefined`
      opts.rejectUnauthorized = false

    s = tls.createServer(opts)

    s.on 'secureConnection', (stream) ->
      emitter.emit 'stream', stream

    s.listen.apply s, args

    s.once 'listening', ->
      emitter.emit 'bound'
      emitter.once 'unbind', ->
        emitter.emit 'unbinding'
        s.close()

    s.once 'close', ->
      emitter.emit 'unbound'

  return

exports.bindClient = (emitter, args...) ->

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

  emitter.emit 'uri', "tls://#{opts.hostname or 'localhost'}:#{opts.port}"
  emitter.emit 'binding'

  stream = tls.connect.call null, opts

  emitter.emit 'stream', stream

  stream.once 'secureConnect', ->
    emitter.emit 'bound'

  emitter.once 'unbind', ->
    emitter.emit 'unbinding'
    stream.end()

  stream.once 'end', ->
    emitter.emit 'unbound'


  return

