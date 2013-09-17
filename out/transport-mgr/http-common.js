// Generated by CoffeeScript 1.6.3
var pkg, _;

_ = require('../../vendor/lodash');

pkg = require('../../package.json');

exports.createServer = function(callback, pserver, type, listenArgs, serverArgs) {
  var hostname, httpModule, port, s;
  httpModule = require(type);
  s = httpModule.createServer.apply(null, serverArgs);
  s.listen.apply(s, listenArgs);
  hostname = typeof listenArgs[1] === 'string' ? listenArgs[1] : '0.0.0.0';
  port = listenArgs[0];
  s.once('listening', function() {
    return callback({
      uri: "http://" + hostname + ":" + port,
      unbind: function(cb) {
        return s.close(cb);
      }
    });
  });
};

exports.createClient = function(pclient, type, reqArgs, extraOpts) {
  var httpModule, opts;
  if (extraOpts == null) {
    extraOpts = {};
  }
  httpModule = require(type);
  opts = {
    path: '/' + pkg.name,
    headers: {
      'user-agent': pkg.name + '/' + pkg.version,
      'transfer-encoding': 'chunked',
      'expect': '100-continue'
    }
  };
  _.merge(opts, extraOpts);
  if (typeof reqArgs[0] === 'number') {
    opts.port = reqArgs.shift();
  } else {
    pclient.err("bind " + type + " error: missing port");
  }
  if (typeof reqArgs[0] === 'string') {
    opts.hostname = reqArgs.shift();
  }
  pclient.setInterface({
    uri: "http://" + (opts.hostname || 'localhost') + ":" + opts.port
  });
  pclient.createConnection(function(readCallback, writeCallback) {
    return writeCallback(httpModule.request(opts, readCallback));
  });
};

/*
//@ sourceMappingURL=http-common.map
*/