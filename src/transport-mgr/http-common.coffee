_ = require '../../vendor/lodash'
pkg = require '../../package.json'
util = require 'util'
http = require 'http'
https = require 'https'
# stream = if process.version.match /^\v0\.8/
#   require 'readable-stream'
# else
#   require 'stream'

# watch = (read, write) ->
#   read.on 'data', ->
#     console.log 'READ DATA: ' + arguments[0]
#   read.on 'end', ->
#     console.log 'READ END'
#   w = write.write
#   write.write = ->
#     result = w.apply @, arguments
#     console.log 'WRITE DATA: ('+result+')' + arguments[0]
#     result
#   write.on 'drain', ->
#     console.log 'WRITE DRAIN'
#   write.on 'end', ->
#     console.log 'WRITE END'

# class HTTPDuplex extends stream.Duplex
#   constructor: (type, opts) ->
#     unless @ instanceof HTTPDuplex
#       return new HTTPDuplex type, opts
#     super
#     @res = null
#     @http = if type is 'https' then https else http 
#     @req = @http.request(opts)
#     @req.on "response", (res) =>
#       console.log "RESPONSE"
#       @res = res
#       @res.on "data", (c) =>
#         @res.pause() unless @push(c)
#       @res.on "end", =>
#         @push null

#       @emit "response", @res

#       @res.on "readable", =>
#         console.log "READABLE!"
#         @emit "readable"

#   _read: (n) ->
#     @res.resume()  if @res
#   _write: (chunk, encoding, cb) ->
#     succ = @req.write chunk, encoding, cb
#     console.log "WRITE SUCCESS? ===> " + succ
#     succ
#   end: (chunk, encoding, cb) ->
#     @req.end chunk, encoding, cb


#common code for http/https
exports.createServer = (callback, pserver, type, listenArgs, serverArgs) ->
  
  s = (if type is 'https' then https else http).createServer.apply null, serverArgs
  # s = (if type is 'https' then https else http).createServer (req, res) ->
  #   watch req, res
  #   serverArgs[0](req, res)

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

    write = (if type is 'https' then https else http).request opts
    write.once 'response', (read) ->
      callback { read }
      return

    callback {
      uri
      write
      unbind: (cb) ->
        write.once 'end', cb
        write.end()
    }
    return
  return
