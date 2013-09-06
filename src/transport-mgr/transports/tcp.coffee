net = require 'net'

exports.bindServer = (args...) ->
  pserver = @
  s = net.createServer pserver.handle
  s.listen.apply s, args

  pserver.setInterface {
    uri: "tcp://#{typeof args[1] is 'string' and args[1] or '0.0.0.0'}:#{args[0]}"
    unbind: -> s.close()
  }
  return

exports.bindClient = (args...) ->
  pclient = @
  pclient.createConnection (callback) ->
    callback net.connect.apply null, args

  pclient.setInterface {
    uri: "tcp://#{typeof args[1] is 'string' and args[1] or 'localhost'}:#{args[0]}"
  }
  return
