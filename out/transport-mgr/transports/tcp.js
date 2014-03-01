// Generated by CoffeeScript 1.6.3
var net,
  __slice = [].slice;

net = require('net');

exports.buildUri = function(args) {
  if (typeof args[0] === "string" && typeof args[1] !== "number") {
    return "ipc://" + args[0];
  } else {
    return "tcp://" + (typeof args[1] === 'string' ? args[1] : '0.0.0.0') + ":" + args[0];
  }
};

exports.bindServer = function() {
  var args, conns, emitter, s, uri;
  emitter = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  uri = exports.buildUri(args);
  emitter.emit('uri', uri);
  s = net.createServer();
  conns = [];
  s.on('connection', function(conn) {
    conns.push(conn);
    conn.once('close', function() {
      return conns.splice(conns.indexOf(conn), 1);
    });
    return emitter.emit('stream', conn);
  });
  s.listen.apply(s, args);
  s.once('listening', function() {
    emitter.emit('bound');
    return emitter.once('unbind', function() {
      var c, _i, _len;
      for (_i = 0, _len = conns.length; _i < _len; _i++) {
        c = conns[_i];
        c.destroy();
      }
      return s.close();
    });
  });
  s.once('close', function() {
    return emitter.emit('unbound');
  });
  s.on('error', function(err) {
    err.message = "TCP Server Error: '" + uri + "': " + err.message;
    return emitter.emit('error', err);
  });
};

exports.bindClient = function() {
  var args, c, emitter, uri;
  emitter = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  uri = exports.buildUri(args);
  emitter.emit('uri', uri);
  c = net.connect.apply(null, args);
  emitter.emit('stream', c);
  c.once('connect', function() {
    return emitter.emit('bound');
  });
  emitter.once('unbind', function() {
    return c.end();
  });
  c.once('end', function() {
    return emitter.emit('unbound');
  });
};

/*
//@ sourceMappingURL=tcp.map
*/
