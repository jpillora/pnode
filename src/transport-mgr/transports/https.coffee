
http = require "../http-common"
secure = require "../secure-common"

exports.bindServer = (emitter, args...) ->
  opts = args.pop() if typeof args[args.length-1] is 'object'
  secure.checkCerts opts, (opts) ->
    http.createServer emitter, 'https', args, [opts]

exports.bindClient = (emitter, args...) ->
  http.createClient emitter, 'https', args, {rejectUnauthorized: false}
  return
