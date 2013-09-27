net = require 'net'

exports.bindServer = (emitter, args...) ->

  emitter.emit 'uri', "tcp://#{if typeof args[1] is 'string' then args[1] else '0.0.0.0'}:#{args[0]}"
  emitter.emit 'binding'

  s = net.createServer()

  s.on 'connection', (stream) ->
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

  emitter.emit 'uri', "tcp://#{typeof args[1] is 'string' and args[1] or 'localhost'}:#{args[0]}"
  emitter.emit 'binding'

  stream = net.connect.apply null, args
  
  emitter.emit 'stream', stream

  stream.once 'connect', ->
    emitter.emit 'bound'

  emitter.once 'unbind', ->
    emitter.emit 'unbinding'
    stream.end()

  stream.once 'end', ->
    emitter.emit 'unbound'

  return
