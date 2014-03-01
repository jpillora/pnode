
http = require "../http-common"
secure = require "../secure-common"

exports.bindServer = (emitter, args...) ->
  opts = http.opts args
  secure.checkCerts opts, (opts) ->
    http.createServer emitter, 'https', args, opts

exports.bindClient = (emitter, args...) ->
  opts = http.opts args
  opts.rejectUnauthorized = false unless 'rejectUnauthorized' of opts
  http.createClient emitter, 'https', args, opts
  return
