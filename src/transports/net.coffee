net = require 'net'

exports.listen = (port) ->
  net.createServer(@handle).listen port, =>
    @log 'listening on ' + port

exports.connect = (port) ->
  @onConnect (callback) ->
    @log 'connecting to ' + port
    callback net.connect(port)