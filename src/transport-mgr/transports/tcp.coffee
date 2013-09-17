net = require 'net'

exports.bindServer = (callback, args...) ->
  pserver = @
  s = net.createServer pserver.handle
  s.listen.apply s, args
  s.once 'listening', ->
    callback {
      uri: "tcp://#{typeof args[1] is 'string' and args[1] or '0.0.0.0'}:#{args[0]}"
      unbind: (cb) -> s.close cb
    }
  return

exports.bindClient = (args...) ->
  pclient = @

  uri = "tcp://#{typeof args[1] is 'string' and args[1] or 'localhost'}:#{args[0]}"

  pclient.createConnection (callback) ->

    stream = net.connect.apply null, args

    callback callback
    # {
    #   stream,
    #   uri,
    #   unbind: -> stream.close()
    # }

  return
