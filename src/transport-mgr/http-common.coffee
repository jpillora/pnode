_ = require '../../vendor/lodash'
pkg = require '../../package.json'

#common code for http/https
exports.createServer = (pserver, type, listenArgs, serverArgs) ->
  
  httpModule = require type

  s = httpModule.createServer.apply null, serverArgs
  s.listen.apply s, listenArgs

  hostname = if typeof listenArgs[1] is 'string' then listenArgs[1] else '0.0.0.0'
  port = listenArgs[0]

  pserver.setInterface {
    uri: "http://#{hostname}:#{port}"
    unbind: -> s.close()
  }
  return

#common code for http/https
exports.createClient = (pclient, type, reqArgs, extraOpts = {}) ->
  
  httpModule = require type

  opts =
    path: '/'+pkg.name
    headers:
      'user-agent': pkg.name+'/'+pkg.version
      'transfer-encoding': 'chunked'
      'expect': '100-continue'

  #extra options
  _.merge opts, extraOpts

  if typeof reqArgs[0] is 'number'
    opts.port = reqArgs.shift()
  else
    pclient.err "bind #{type} error: missing port"

  if typeof reqArgs[0] is 'string'
    opts.hostname = reqArgs.shift()

  pclient.setInterface {
    uri: "http://#{opts.hostname or 'localhost'}:#{opts.port}"
  }

  pclient.createConnection (readCallback, writeCallback) ->
    writeCallback httpModule.request opts, readCallback
  return