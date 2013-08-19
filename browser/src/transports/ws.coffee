sock = require 'shoe'

exports.bindServer = ->
  # see 'src/transports/ws.coffee'
  throw "bind server not supported"

exports.bindClient = (args...) ->
  client = @
  client.log args
  client.createConnection (callback) ->
    callback sock.apply null, args