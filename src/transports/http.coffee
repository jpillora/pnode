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

exports.connect = (port, hostname) ->
  opts =
    hostname: hostname
    port: port
    path: '/'+pkg.name
    headers:
      'user-agent': pkg.name+'/'+pkg.version
      'transfer-encoding': 'chunked'
      'expect': '100-continue'

  @onConnect (passRead, passWrite) ->
    @log 'connecting to ' + port
    passWrite https.request opts, passRead