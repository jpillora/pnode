// Generated by CoffeeScript 1.6.3
var setFns;

exports._ = require('../vendor/lodash');

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

exports.callbacker = function(callback) {
  var expecting, received;
  received = 0;
  expecting = 0;
  return function() {
    expecting++;
    return function() {
      received++;
      if (expecting === received) {
        callback();
      }
    };
  };
};

setFns = {
  has: function(o) {
    return this.indexOf(o) !== -1;
  },
  add: function(o) {
    if (this.has(o)) {
      return false;
    }
    this.push(o);
    return true;
  },
  remove: function(o) {
    var i;
    i = this.indexOf(o);
    if (i === -1) {
      return false;
    }
    this.splice(i, 1);
    return true;
  },
  copy: function() {
    return this.slice();
  },
  find: function(fn) {
    var o, _i, _len;
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      o = this[_i];
      if (fn(o)) {
        return o;
      }
    }
    return null;
  },
  findAll: function(fn) {
    var o, os, _i, _len;
    os = [];
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      o = this[_i];
      if (fn(o)) {
        os.push(o);
      }
    }
    return os;
  },
  findBy: function(k, v) {
    return this.find(function(o) {
      return o[k] === v;
    });
  },
  findAllBy: function(k, v) {
    return this.findAll(function(o) {
      return o[k] === v;
    });
  }
};

exports.set = function() {
  var arr, fn, name;
  arr = [];
  for (name in setFns) {
    fn = setFns[name];
    arr[name] = fn;
  }
  return arr;
};

/*
//@ sourceMappingURL=helper.map
*/
