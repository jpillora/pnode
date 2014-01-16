_ = require '../../vendor/lodash'
pkg = require '../../package.json'
util = require 'util'
types = 
  http: require 'http'
  https: require 'https'

filterRequest = (req) ->
  (/^pnode\/0\.1\.\d+$/).test req.headers['user-agent']

#common code for http/https
exports.createServer = (emitter, type, args, serverArgs) ->
  
  http = types[type]

  #provided server
  if args[0] instanceof http.Server
    s = args[0]
    filter = if typeof args[1] is 'function' then args[1] else filterRequest
  else
    s = http.createServer.apply null, serverArgs
    filter = filterRequest
    s.listen.apply s, args

  #hijack all requests
  handlers = s.listeners('request').slice(0)
  s.removeAllListeners 'request'
  s.on 'request', (req, res) ->
    #grab all pnode requests
    if filter req
      emitter.emit 'stream', req, res
    #fallback to other handlers
    else
      handlers.forEach (fn) => fn.call @, req, res

  #check if already listening
  addr = s.address()

  listening = ->
    addr = s.address() unless addr
    addr = "#{addr.address}:#{addr.port}" if typeof addr is 'object'
    emitter.emit 'uri', "#{type}://#{addr}"
    emitter.emit 'bound'
    #now we can accept unbind requests
    emitter.once 'unbind', ->
      s.close()

  if addr
    listening()
  else
    s.once 'listening', listening

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

  write = types[type].request opts, (read) ->
    
    emitter.once 'unbind', ->
      read.socket.end()
    
    read.once 'end', ->
      emitter.emit 'unbound'
    
    emitter.emit 'read', read
    emitter.emit 'bound'
    return
  
  emitter.emit 'write', write
  return
