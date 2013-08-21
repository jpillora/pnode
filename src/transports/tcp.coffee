net = require 'net'

exports.bindServer = (args...) ->
  server = @
  s = net.createServer server.handle
  s.listen.apply s, args

  return {
    uri: "tcp://#{typeof args[1] is 'string' and args[1] or '0.0.0.0'}:#{args[0]}"
    unbind: -> s.close()
  }

exports.bindClient = (args...) ->

  client = @
  client.createConnection (callback) ->
    callback net.connect.apply null, args

  return {
    uri: "tcp://#{typeof args[1] is 'string' and args[1] or 'localhost'}:#{args[0]}"
  }
