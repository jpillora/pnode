pem = require 'pem'

exports.checkCerts = (opts, callback) ->
  #start
  if typeof opts is 'object'
    return callback opts
  
  pem.createCertificate {days:365, selfSigned:true}, (err, keys) =>
    pserver.err err if err
    callback {key: keys.serviceKey, cert: keys.certificate}
