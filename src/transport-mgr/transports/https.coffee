
http = require "../http-common"
secure = require "../secure-common"

exports.bindServer = (args...) ->
  pserver = @
  opts = args.pop() if typeof args[args.length-1] is 'object'
  secure.checkCerts opts, (opts) ->
    http.createServer pserver, 'https', args, [opts, pserver.handle]

exports.bindClient = (args...) ->
  pclient = @
  http.createClient pclient, 'https', args, {rejectUnauthorized: false}
  return
