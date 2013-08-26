
httpTransport = require './http'
pem = require 'pem'

exports.bindServer = (args..., opts) ->
  pserver = @

  start = =>
    httpTransport.createServer pserver, 'https', args, [opts, pserver.handle]

  #start
  if typeof opts is 'object'
    start()
  else
    pem.createCertificate {days:365, selfSigned:true}, (err, keys) =>
      pserver.err err if err
      opts = {key: keys.serviceKey, cert: keys.certificate}
      start()
  return
  
exports.bindClient = (args...) ->
  pclient = @
  httpTransport.createClient pclient, 'https', args, {rejectUnauthorized: false}
  return
