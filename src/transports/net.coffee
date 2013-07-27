net = require 'net'

exports.listen = (port) ->
  net.createServer(@handle).listen port, =>
    @log 'listening on ' + port

exports.connect = (port) ->
  @onConnect (passRead, passWrite) ->
    @log 'connecting to ' + port
    c = net.connect(port)
    passRead(c)
    passWrite(c)