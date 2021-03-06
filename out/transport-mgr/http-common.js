// Generated by CoffeeScript 1.6.3
var filterRequest, pkg, token, types, util, _;

_ = require('../../vendor/lodash');

pkg = require('../../package.json');

util = require('util');

types = {
  http: require('http'),
  https: require('https')
};

token = process.env.PNODE_HTTP_TOKEN;

filterRequest = function(req) {
  return (!token || token === req.headers['pnode-token']) && /^pnode\/0\.\d+.\d+$/.test(req.headers['user-agent']);
};

exports.opts = function(args) {
  if (typeof args[args.length - 1] === 'object') {
    return args.pop();
  } else {
    return {};
  }
};

exports.createServer = function(emitter, type, args, serverOpts) {
  var addr, filter, handlers, http, listening, s;
  http = types[type];
  if (args[0] instanceof http.Server) {
    s = args[0];
    filter = typeof args[1] === 'function' ? args[1] : filterRequest;
  } else {
    s = http.createServer.apply(s, type === 'https' ? [serverOpts] : []);
    filter = filterRequest;
    s.listen.apply(s, args);
  }
  handlers = s.listeners('request').slice(0);
  s.removeAllListeners('request');
  s.on('request', function(req, res) {
    var _this = this;
    if (filter(req)) {
      return emitter.emit('stream', req, res);
    } else {
      return handlers.forEach(function(fn) {
        return fn.call(_this, req, res);
      });
    }
  });
  addr = s.address();
  listening = function() {
    if (!addr) {
      addr = s.address();
    }
    if (typeof addr === 'object') {
      addr = "" + addr.address + ":" + addr.port;
    }
    emitter.emit('uri', "" + type + "://" + addr);
    emitter.emit('bound');
    return emitter.once('unbind', function() {
      return s.close();
    });
  };
  if (addr) {
    listening();
  } else {
    s.once('listening', listening);
  }
  s.once('close', function() {
    return emitter.emit('unbound');
  });
};

exports.createClient = function(emitter, type, args, reqOpts) {
  var opts, write;
  if (reqOpts == null) {
    reqOpts = {};
  }
  opts = {
    path: '/' + pkg.name,
    headers: {
      'user-agent': pkg.name + '/' + pkg.version,
      'transfer-encoding': 'chunked',
      'expect': '100-continue'
    }
  };
  if (token) {
    opts.headers['pnode-token'] = token;
  }
  _.merge(opts, reqOpts);
  if (typeof args[0] === 'number') {
    opts.port = args.shift();
  }
  if (typeof args[0] === 'string') {
    opts.hostname = args.shift();
  }
  if (!opts.port) {
    throw new Error("bind " + type + " error: missing port");
  }
  emitter.emit('uri', "" + type + "://" + (opts.hostname || 'localhost') + ":" + opts.port);
  write = types[type].request(opts, function(read) {
    emitter.once('unbind', function() {
      return read.socket.end();
    });
    read.once('end', function() {
      return emitter.emit('unbound');
    });
    emitter.emit('read', read);
    emitter.emit('bound');
  });
  emitter.emit('write', write);
};

/*
//@ sourceMappingURL=http-common.map
*/
