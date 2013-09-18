_ = require '../../vendor/lodash'
pkg = require '../../package.json'
util = require 'util'
http = require 'http'
https = require 'https'
stream = if process.version.match /^\v0\.8/
  require 'readable-stream'
else
  require 'stream'

class HTTPDuplex extends stream.Duplex
  constructor: (type, opts) ->
    unless @ instanceof HTTPDuplex
      return new HTTPDuplex type, opts
    
    stream.Duplex.call @, type, opts

    @res = null
    @http = if type is 'https' then https else http 

    @req = @http.request(opts)
    @req.on "response", (resp) =>
      @res = resp
      @emit "response", resp
      resp.on "data", (c) =>
        console.log 'READ HTTP DATA: ' + c
        @res.pause()  unless @push(c)
      resp.on "end", =>
        @push null

  _read: (n) ->
    @res.resume()  if @res

  _write: (chunk, encoding, cb) ->
    console.log 'WRITE HTTP DATA: ' + chunk
    @req.write chunk, encoding, cb

  end: (chunk, encoding, cb) ->
    console.log 'HTTP END'
    @req.end chunk, encoding, cb


#common code for http/https
exports.createServer = (callback, pserver, type, listenArgs, serverArgs) ->
  
  httpModule = require type

  s = httpModule.createServer.apply null, serverArgs
  s.listen.apply s, listenArgs

  hostname = if typeof listenArgs[1] is 'string' then listenArgs[1] else '0.0.0.0'
  port = listenArgs[0]

  s.once 'listening', ->
    callback
      uri: "#{type}://#{hostname}:#{port}"
      unbind: (cb) -> s.close cb
  return

#common code for http/https
exports.createClient = (pclient, type, reqArgs, extraOpts = {}) ->

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

  uri = "#{type}://#{opts.hostname or 'localhost'}:#{opts.port}"  

  pclient.createConnection (callback) ->

    stream = HTTPDuplex type, opts
    callback
      uri: uri
      stream: stream
      unbind: (cb) ->
        stream.end()
        cb true
    return
  return
