net = require 'net'

exports.bindServer = (args...) ->
  server = @
  s = net.createServer server.handle
  s.listen.apply s, args
  return {
    unbind: -> s.close()
  }

exports.bindClient = (args...) ->
  client = @
  client.createConnection (callback) ->
    callback net.connect.apply null, args