net = require 'net'

exports.listen = (port, callback) ->
  net.createServer(@handle).listen port, callback

exports.connect = (port) ->
  @createConnection (streamCallback) ->
    streamCallback net.connect(port)