net = require 'net'

exports.listen = (path) ->
  args = Array::slice.call arguments

  if typeof args[0] isnt 'number'
    args.unshift @opts.port

  @server = net.createServer @handle
  @server.listen.apply @server, args

exports.connect = ->
  args = arguments
  @createConnection (streamCallback) ->
    streamCallback net.connect.apply net, args