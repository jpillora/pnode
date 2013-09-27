http = require "../http-common"

#http specifc
exports.bindServer = (emitter, args...) ->
  http.createServer emitter, 'http', args, []
  return

exports.bindClient = (emitter, args...) ->
  http.createClient emitter, 'http', args, {}
  return

