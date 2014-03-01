// Generated by CoffeeScript 1.6.3
var http, secure,
  __slice = [].slice;

http = require("../http-common");

secure = require("../secure-common");

exports.bindServer = function() {
  var args, emitter, opts;
  emitter = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  opts = http.opts(args);
  return secure.checkCerts(opts, function(opts) {
    return http.createServer(emitter, 'https', args, opts);
  });
};

exports.bindClient = function() {
  var args, emitter, opts;
  emitter = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  opts = http.opts(args);
  if (!('rejectUnauthorized' in opts)) {
    opts.rejectUnauthorized = false;
  }
  http.createClient(emitter, 'https', args, opts);
};

/*
//@ sourceMappingURL=https.map
*/
