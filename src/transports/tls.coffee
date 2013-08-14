tls = require 'tls'

exports.listen = ->

  args = Array::slice.call arguments
  opts = null

  if typeof args[0] is 'object'
    opts = args.shift()
  else
    throw "Missing options object"

  console.log 'listen', args
  @server = tls.createServer opts, @handle
  @server.listen.apply @server, args

exports.connect = ->
  args = arguments

  @createConnection (streamCallback) ->

    console.log 'connect'
    stream = tls.connect.apply tls, args

    stream.on 'secureConnect', -> stream.emit 'connect'
    stream.on 'clientError', ->   stream.emit 'error'

    stream.on 'data', (c) ->   console.log 'TLS DATA', c.toString()
    stream.on 'close', ->   console.log 'disconnect'

    streamCallback stream



