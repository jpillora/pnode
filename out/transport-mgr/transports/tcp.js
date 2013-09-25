// Generated by CoffeeScript 1.6.3
var net,
  __slice = [].slice;

net = require('net');

exports.bindServer = function() {
  var args, callback, pserver, s;
  callback = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  pserver = this;
  s = net.createServer(pserver.handle);
  s.listen.apply(s, args);
  s.once('listening', function() {
    return callback({
      uri: "tcp://" + (typeof args[1] === 'string' && args[1] || '0.0.0.0') + ":" + args[0],
      unbind: function(cb) {
        return s.close(cb);
      }
    });
  });
};

exports.bindClient = function() {
  var args, pclient, uri;
  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  pclient = this;
  uri = "tcp://" + (typeof args[1] === 'string' && args[1] || 'localhost') + ":" + args[0];
  pclient.createConnection(function(callback) {
    var stream;
    stream = net.connect.apply(null, args);
    return callback({
      uri: uri,
      stream: stream,
      unbind: function(cb) {
        stream.once('end', cb);
        return stream.end();
      }
    });
  });
};

/*
//@ sourceMappingURL=tcp.map
*/
