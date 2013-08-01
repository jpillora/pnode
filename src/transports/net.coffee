net = require 'net'

exports.listen = (port, callback) ->
  net.createServer(@handle).listen port, callback

exports.connect = (port) ->

  @createConnection (streamCallback) ->
    @log 'connecting to ' + port
    streamCallback net.connect(port)