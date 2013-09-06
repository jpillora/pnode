http = require "../http-common"

#http specifc
exports.bindServer = (args...) ->
  pserver = @
  http.createServer pserver, 'http', args, [pserver.handle]
  return

exports.bindClient = (args...) ->
  pclient = @
  http.createClient pclient, 'http', args
  return

