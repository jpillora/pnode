// Generated by CoffeeScript 1.6.3
var Base, DynamicExposed, Emitter, Logger, RemoteContext, addr, addrs, crypto, guid, ips, name, os, transportMgr, util, _, _i, _len, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Emitter = require('eventemitter2').EventEmitter2;

util = require('util');

_ = require('../vendor/lodash');

transportMgr = require('./transport-mgr');

RemoteContext = require('./context');

Logger = (function(_super) {
  __extends(Logger, _super);

  Logger.prototype.name = 'Logger';

  function Logger() {
    Logger.__super__.constructor.call(this, {
      wildcard: true
    });
  }

  Logger.prototype.log = function() {
    var _ref;
    if ((_ref = this.opts) != null ? _ref.debug : void 0) {
      return console.log(this.toString() + ' ' + util.format.apply(null, arguments));
    }
  };

  Logger.prototype.warn = function() {
    return console.warn('WARNING: ' + this.toString() + ' ' + util.format.apply(null, arguments));
  };

  Logger.prototype.err = function(e) {
    if (e instanceof Error) {
      e.message = "" + this + " " + e.message;
    } else {
      e = new Error(e);
    }
    return this.emit('error', e);
  };

  Logger.prototype.toString = function() {
    return "" + this.name + ": " + this.id + (this.subid ? ' (' + this.subid + ')' : '') + ":";
  };

  return Logger;

})(Emitter);

crypto = require("crypto");

guid = function() {
  return crypto.randomBytes(6).toString('hex');
};

os = require("os");

ips = [];

_ref = typeof os.networkInterfaces === "function" ? os.networkInterfaces() : void 0;
for (name in _ref) {
  addrs = _ref[name];
  for (_i = 0, _len = addrs.length; _i < _len; _i++) {
    addr = addrs[_i];
    if (addr.family === 'IPv4') {
      ips.push(addr.address);
    }
  }
}

DynamicExposed = (function() {
  function DynamicExposed(fn) {
    this.fn = fn;
  }

  return DynamicExposed;

})();

Base = (function(_super) {
  __extends(Base, _super);

  Base.prototype.name = 'Base';

  function Base(incoming) {
    var _this = this;
    Base.__super__.constructor.call(this);
    this.guid = guid();
    if ((incoming != null ? incoming.name : void 0) === 'LocalPeer') {
      this.parent = incoming;
      this.opts = this.parent.opts;
      this.id = this.parent.id || this.guid;
      this.subid = (this.name === "Server" ? "s" : "c") + this.parent.count[this.name === "Server" ? "server" : "client"];
      this.pubsub = this.parent.pubsub;
      this.exposed = this.parent.exposed;
    } else {
      this.opts = _.isString(incoming) ? {
        id: incoming
      } : incoming || {};
      this.id = this.opts.id || this.guid;
      this.subid = null;
      this.pubsub = new Emitter;
      this.exposed = this.defaultExposed();
    }
    _.defaults(this.opts, this.defaults);
    if (this.opts.debug) {
      this.on('error', function(err) {
        return console.error("ERROR EMITTED: " + (err.stack || err));
      });
    }
    _.bindAll(this);
    this.unbound = true;
  }

  Base.prototype.options = function(opts) {
    return _.extend(this.opts, opts);
  };

  Base.prototype.defaultExposed = function() {
    var self;
    self = this;
    return {
      _pnode: {
        id: this.id,
        guid: this.guid,
        ips: ips.filter(function(ip) {
          return ip !== '127.0.0.1';
        }),
        subscribe: function(event) {
          return this.events[event] = 1;
        },
        unsubscribe: function(event) {
          return delete this.events[event];
        },
        publish: function() {
          var args, cb;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          if (typeof args[0] === 'function') {
            cb = args.shift();
          }
          self.pubsub.emit.apply(null, args);
          if (cb) {
            return cb(true);
          }
        },
        ping: function(cb) {
          self.log('ping %s -> %s', this.id, self.id);
          return cb(true);
        },
        events: this.exposeDynamic(function() {
          return Object.keys(self.pubsub._events);
        })
      }
    };
  };

  Base.prototype.exposeDynamic = function(fn) {
    return new DynamicExposed(fn);
  };

  Base.prototype.expose = function(obj) {
    return _.merge(this.exposed, obj);
  };

  Base.prototype.bind = function() {
    var args, err, events, inst, trans;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    this.log("bind", args);
    if (this.bound) {
      if (this.unbinding) {
        this.warn('unbind in progress');
      }
      return;
    }
    if (this.tEmitter) {
      this.tEmitter.removeAllListeners();
    }
    this.tEmitter = new Emitter;
    events = ['binding', 'bound', 'unbinding', 'unbound'];
    inst = this;
    this.tEmitter.onAny(function() {
      var args, e, _j, _len1, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      inst.log('transport event ', this.event);
      if (_ref1 = this.event, __indexOf.call(events, _ref1) >= 0) {
        for (_j = 0, _len1 = events.length; _j < _len1; _j++) {
          e = events[_j];
          inst[e] = e === this.event;
        }
      }
      inst.emit.apply(null, [this.event].concat(args));
    });
    try {
      trans = transportMgr.get(args);
      args.unshift(this.tEmitter);
      trans["bind" + this.name].apply(null, args);
    } catch (_error) {
      err = _error;
      err.message = "Transport: " + err.message;
      this.err(err);
    }
  };

  Base.prototype.unbind = function(callback) {
    if (this.unbound) {
      if (this.binding) {
        this.warn('bind in progress');
      }
      return;
    }
    if (callback) {
      this.once('unbound', callback);
    }
    this.tEmitter.emit('unbind');
  };

  Base.prototype.wrapObject = function(input, ctx) {
    return this.wrapObjectAcc('root', input, ctx);
  };

  Base.prototype.wrapObjectAcc = function(name, input, ctx) {
    var k, output, type, v;
    if (input instanceof DynamicExposed) {
      return input.fn();
    }
    type = typeof input;
    if (input instanceof Array) {
      return input;
    }
    if (input && type === 'object') {
      output = {};
      for (k in input) {
        v = input[k];
        output[k] = this.wrapObjectAcc(k, v, ctx);
      }
      return output;
    }
    if (type === 'function') {
      return this.timeoutify(name, input, ctx);
    }
    return input;
  };

  Base.prototype.timeoutify = function(name, fn, ctx) {
    var self, type, _base,
      _this = this;
    if (ctx == null) {
      ctx = this;
    }
    self = this;
    (_base = self.timeoutify).id || (_base.id = 0);
    type = ctx instanceof RemoteContext ? 'local' : 'remote';
    return function() {
      var a, args, i, id, t, timedout, _j, _len1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      t = null;
      timedout = false;
      id = self.timeoutify.id++;
      for (i = _j = 0, _len1 = args.length; _j < _len1; i = ++_j) {
        a = args[i];
        if (typeof a === 'function') {
          args[i] = function() {
            clearTimeout(t);
            if (timedout) {
              return;
            }
            self.emit(['timein', name], args, ctx);
            a.apply(this, arguments);
          };
          t = setTimeout(function() {
            timedout = true;
            if (!self.bound) {
              return;
            }
            self.emit(['timeout', name], args, ctx);
          }, self.opts.timeout);
          break;
        }
      }
      return fn.apply(ctx, args);
    };
  };

  Base.prototype.ips = ips;

  return Base;

})(Logger);

Base.Logger = Logger;

module.exports = Base;

/*
//@ sourceMappingURL=base.map
*/
