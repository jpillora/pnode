_ = require '../../vendor/lodash'
pkg = require '../../package.json'
util = require 'util'
types = 
  http: require 'http'
  https: require 'https'

#common code for http/https
exports.createServer = (emitter, type, listenArgs, serverArgs) ->
  
  hostname = if typeof listenArgs[1] is 'string' then listenArgs[1] else '0.0.0.0'
  port = listenArgs[0]
  emitter.emit 'uri', "#{type}://#{hostname}:#{port}"
  emitter.emit 'binding'

  s = types[type].createServer.apply null, serverArgs

  s.on 'request', (read, write) ->
    emitter.emit 'stream', read, write

  s.listen.apply s, listenArgs

  s.once 'listening', ->
    emitter.emit 'bound'
    emitter.once 'unbind', ->
      emitter.emit 'unbinding'
      s.close()

  s.once 'close', ->
    emitter.emit 'unbound'

  return

#common code for http/https
exports.createClient = (emitter, type, reqArgs, extraOpts = {}) ->

  opts =
    path: '/'+pkg.name
    headers:
      'user-agent': pkg.name+'/'+pkg.version
      'transfer-encoding': 'chunked'
      'expect': '100-continue'

  #extra options
  _.merge opts, extraOpts

  #extract port
  if typeof reqArgs[0] is 'number'
    opts.port = reqArgs.shift()
  else
    throw new Error "bind #{type} error: missing port"
  #extract host
  if typeof reqArgs[0] is 'string'
    opts.hostname = reqArgs.shift()

  emitter.emit 'uri', "#{type}://#{opts.hostname or 'localhost'}:#{opts.port}"
  emitter.emit 'binding'

  write = types[type].request opts, (read) ->
    
    emitter.once 'unbind', ->
      emitter.emit 'unbinding'
      read.socket.end()
    
    read.once 'end', ->
      emitter.emit 'unbound'
    
    emitter.emit 'read', read
    emitter.emit 'bound'
    return
  
  emitter.emit 'write', write
  return
