// Generated by CoffeeScript 1.6.3
var pem;

pem = require('pem');

exports.checkCerts = function(opts, callback) {
  var _this = this;
  if (typeof opts === 'object') {
    return callback(opts);
  }
  return pem.createCertificate({
    days: 365,
    selfSigned: true
  }, function(err, keys) {
    if (err) {
      pserver.err(err);
    }
    return callback({
      key: keys.serviceKey,
      cert: keys.certificate
    });
  });
};

/*
//@ sourceMappingURL=secure-common.map
*/
