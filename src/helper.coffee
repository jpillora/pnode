
#extract protocol, hostname, port from string
exports.parseOrigin = (str) ->
  if typeof str is 'string' and /^([a-z]+):\/\/([^\/]+?)(:(\d+))?$/.test str
    return { protocol: RegExp.$1, hostname: RegExp.$2, port: parseInt RegExp.$4, 10 }
  return null