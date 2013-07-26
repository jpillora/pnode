http = require 'http'

exports.listen = (port) ->
  http.createServer((req, res) =>
    @handle(req, res)
  ).listen port, =>
    @log 'listening on ' + port

exports.connect = (port) ->
  httpReqOpts =
    hostname: 'localhost'
    port: port
    path: '/'
    method: 'PATCH'
    rejectUnauthorized: false
    headers:
      'transfer-encoding': 'chunked'
      'expect': '100-continue'

  @onConnect (callback) ->
    req = http.request httpReqOpts, (res) =>
      @log 'connecting to ' + port
      callback(res, req)