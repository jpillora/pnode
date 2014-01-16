net = require 'net'

exports.buildUri = (args) ->
  return if typeof args[0] is "string" and typeof args[1] isnt "number"
    "ipc://#{args[0]}"
  else
    "tcp://#{if typeof args[1] is 'string' then args[1] else '0.0.0.0'}:#{args[0]}"

exports.bindServer = (emitter, args...) ->

  uri = exports.buildUri args
  emitter.emit 'uri', uri
  
  s = net.createServer()

  s.on 'connection', (stream) ->
    emitter.emit 'stream', stream

  s.listen.apply s, args

  s.once 'listening', ->
    emitter.emit 'bound'
    emitter.once 'unbind', ->
      s.close()

  s.once 'close', ->
    emitter.emit 'unbound'

  s.on 'error', (err) ->
    err.message = "TCP Server Error: '#{uri}': #{err.message}"
    emitter.emit 'error', err
  
  return

exports.bindClient = (emitter, args...) ->

  uri = exports.buildUri args
  emitter.emit 'uri', uri
  
  c = net.connect.apply null, args
  
  emitter.emit 'stream', c

  c.once 'connect', ->
    emitter.emit 'bound'

  emitter.once 'unbind', ->
    c.end()
    

  c.once 'end', ->
    emitter.emit 'unbound'

  # let pnode handle errors
  # c.on 'error', (err) ->
  #   err.message = "TCP Client Error: '#{uri}': #{err.message}"
  #   emitter.emit 'error', err

  return
