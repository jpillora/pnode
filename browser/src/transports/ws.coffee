sock = require 'shoe'

#custom parse to include path
exports.parse = (str) ->
  args = []
  #prepend http if has stuff before the slash
  if typeof str is 'string' and /^.+\/.+$/.test str
    str = "http://#{str}"
  return [str]

exports.bindServer = ->
  # see 'src/transports/ws.coffee'
  throw "bind server not supported in the browser"

exports.bindClient = (args...) ->
  client = @
  client.createConnection (callback) ->
    callback sock.apply null, args