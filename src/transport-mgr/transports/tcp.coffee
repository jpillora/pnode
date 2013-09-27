net = require 'net'

exports.bindServer = (emitter, args...) ->

  emitter 'uri', "tcp://#{typeof args[1] is 'string' and args[1] or '0.0.0.0'}:#{args[0]}"

  emitter.emit 'binding'

  s = net.createServer()

  s.on 'connnection', (stream) ->
    emitter.emit 'stream', stream

  s.listen.apply s, args

  s.once 'listening', ->
    emitter.emit 'bound'
    emitter.once 'unbind', ->
      emitter.emit 'unbinding'
      s.close()

  s.once 'close', ->
    emitter.emitter 'unbound'

  return

exports.bindClient = (emitter, args...) ->

  uri = "tcp://#{typeof args[1] is 'string' and args[1] or 'localhost'}:#{args[0]}"

  pclient.createConnection () ->

    emitter.emit 'uri', uri
    emitter.emit 'binding'

    stream = net.connect.apply null, args

    emitter.emit 'stream', stream

    stream.once 'connect', ->
      emitter.emit 'bound'

    emitter.once 'unbind', ->
      emitter.emit 'unbinding'
      stream.end()

    stream.once 'end', ->
      emitter.emitter 'unbound'

  return
