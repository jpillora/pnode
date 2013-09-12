// Generated by CoffeeScript 1.6.3
var __slice = [].slice;

exports.isReadable = function(stream) {
  return stream.readable === true || typeof stream.read === 'function';
};

exports.isWritable = function(stream) {
  return stream.writable === true || typeof stream.write === 'function';
};

exports.serialize = function(obj) {
  var key, newobj, o;
  if (obj instanceof Array) {
    return obj.filter(function(o) {
      return typeof o.serialize === 'function';
    }).map(function(o) {
      return o.serialize();
    });
  }
  newobj = {};
  for (key in obj) {
    o = obj[key];
    if (o.serialize) {
      newobj[key] = o.serialize();
    }
  }
  return newobj;
};

exports.proxyEvents = function() {
  var dest, e, events, src, _i, _len, _results;
  src = arguments[0], dest = arguments[1], events = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
  _results = [];
  for (_i = 0, _len = events.length; _i < _len; _i++) {
    e = events[_i];
    _results.push(src.on(e, function(a1, a2, a3, a4) {
      return dest.emit(e, a1, a2, a3, a4);
    }));
  }
  return _results;
};

/*
//@ sourceMappingURL=helper.map
*/
