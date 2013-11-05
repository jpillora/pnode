var shoe = require('shoe');

exports.parse = function(str) {
  if (typeof str === 'string' && /^.+\/.+$/.test(str))
    str = "http://" + str;
  return [str];
};

exports.bindServer = function() {
  throw "bind ws server not supported in the browser";
};

exports.bindClient = function() {

  var args = Array.prototype.slice.call(arguments);
  var emitter = args.shift();
  var stream = shoe.apply(null, args);

  emitter.emit('stream', stream);

  stream.once('connect', function() {
    emitter.emit('bound');
  });

  emitter.once('unbind', function() {
    stream.end();
  });

  stream.once('end', function() {
    emitter.emit('unbound');
  });
};
