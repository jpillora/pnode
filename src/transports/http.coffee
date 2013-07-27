http = require 'http'
pkg = require '../../package.json'

exports.listen = (opts, port, callback) ->
  useOpts = =>
    if typeof callback isnt 'function'
      callback = ->
    https.createServer(opts, (req, res) =>
      @handle(req, res)
    ).listen port, callback

  if typeof opts is 'number'
    callback = port
    port = opts
    opts = {}
    useOpts()
  else
    useOpts()

exports.connect = (port) ->
  opts =
    hostname: 'localhost'
    port: port
    path: '/hnode'
    headers:
      'user-agent': 'hnode/'+pkg.version
      'transfer-encoding': 'chunked'
      'expect': '100-continue'

  @onConnect (passRead, passWrite) ->
    @log 'connecting to ' + port
    req = http.request httpReqOpts, (res) =>
      passRead(res)
    passWrite(req)