http = require "../http-common"

#http specifc
exports.bindServer = (callback, args...) ->
  pserver = @
  http.createServer callback, pserver, 'http', args, [pserver.handle]
  return

exports.bindClient = (args...) ->
  pclient = @
  http.createClient pclient, 'http', args
  return

