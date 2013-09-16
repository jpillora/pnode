// Generated by CoffeeScript 1.6.3
var Base, Client, RemoteContext, dnode, helper, transportMgr, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

_ = require('../../vendor/lodash');

dnode = require('dnode');

Base = require('../base');

helper = require('../helper');

transportMgr = require('../transport-mgr');

RemoteContext = require('../context');

module.exports = Client = (function(_super) {
  __extends(Client, _super);

  Client.prototype.name = 'Client';

  Client.prototype.defaults = {
    debug: false,
    maxRetries: 5,
    timeout: 5000,
    retryInterval: 500,
    pingInterval: 5000,
    port: 7337
  };

  function Client() {
    Client.__super__.constructor.apply(this, arguments);
    this.bound = false;
    this.stream = {};
    this.count = {
      ping: 0,
      pong: 0,
      attempt: 0
    };
    this.connecting = false;
    this.status = 'down';
    this.reconnect = _.throttle(this.reconnect, this.opts.retryInterval, {
      leading: true
    });
    this.ping = _.throttle(this.ping, this.opts.pingInterval);
    this.bindTo = this.bind;
  }

  Client.prototype.bind = function() {
    this.unbind();
    this.bound = true;
    transportMgr.bind(this, arguments);
    this.log("bind to " + (this.uri()) + "!");
  };

  Client.prototype.unbind = function() {
    var _ref, _ref1, _ref2;
    if (this.bound) {
      this.log("unbind!");
    }
    this.bound = false;
    this.count.attempt = 0;
    this.reset();
    if ((_ref = this.stream.duplex) != null) {
      if (typeof _ref.close === "function") {
        _ref.close();
      }
    }
    if ((_ref1 = this.stream.read) != null) {
      if (typeof _ref1.close === "function") {
        _ref1.close();
      }
    }
    if ((_ref2 = this.stream.write) != null) {
      if (typeof _ref2.close === "function") {
        _ref2.close();
      }
    }
    this.stream = {};
    this.ci = null;
    this.emit('unbind');
  };

  Client.prototype.createConnection = function(fn) {
    if (typeof fn !== 'function') {
      this.err("must be a function");
    }
    if (!(fn.length === 1 || fn.length === 2)) {
      this.err("must have arity 1 or 2");
    }
    this.getConnectionFn = fn;
    this.reconnect();
  };

  Client.prototype.server = function(callback) {
    if (!this.getConnectionFn) {
      return this.err("no create connection method defined");
    }
    if (this.status === 'up') {
      return callback(this.remote);
    } else if (this.status === 'down' && !this.connecting) {
      this.count.attempt = 0;
      this.reconnect();
    }
    this.once('remote', callback);
  };

  Client.prototype.unget = function(callback) {
    return this.removeListener('remote', callback);
  };

  Client.prototype.reconnect = function() {
    var _this = this;
    if (this.status === 'up' || this.connecting || this.count.attempt >= this.opts.maxRetries) {
      return;
    }
    this.count.attempt++;
    this.connecting = true;
    this.reset();
    this.ctx = new RemoteContext;
    this.d = dnode(this.wrapObject(this.exposed, this.ctx));
    this.d.once('remote', this.onRemote);
    this.d.once('end', this.onEnd);
    this.d.once('error', this.onError);
    this.d.once('fail', this.onStreamError);
    this.timeout(function() {
      _this.reset();
      return _this.reconnect();
    });
    this.log("connection attempt " + this.count.attempt + " (" + (this.uri()) + ")");
    this.emit('connecting');
    switch (this.getConnectionFn.length) {
      case 1:
        this.getConnectionFn(function(stream) {
          if (!helper.isReadable(stream)) {
            _this.err("Invalid duplex stream (not readable)");
          }
          if (!helper.isWritable(stream)) {
            _this.err("Invalid duplex stream (not writable)");
          }
          stream.on('error', _this.onStreamError);
          _this.ctx.getAddr(stream);
          stream.pipe(_this.d).pipe(stream);
          return _this.stream.duplex = stream;
        });
        break;
      case 2:
        this.getConnectionFn(function(read) {
          if (!helper.isReadable(read)) {
            _this.err("Invalid read stream");
          }
          read.on('error', _this.onStreamError);
          read.pipe(_this.d);
          _this.ctx.getAddr(read);
          return _this.stream.read = read;
        }, function(write) {
          if (!helper.isWritable(write)) {
            _this.err("Invalid write stream");
          }
          write.on('error', _this.onStreamError);
          _this.d.pipe(write);
          return _this.stream.write = write;
        });
    }
  };

  Client.prototype.onStreamError = function(err) {
    if (!this.bound) {
      return;
    }
    this.log("stream error: " + err.message);
    this.setStatus('down');
    this.reconnect();
  };

  Client.prototype.onError = function(err) {
    if (!this.bound) {
      return;
    }
    this.log("RPC Error: " + (err.stack || err));
    return this.err(err);
  };

  Client.prototype.onRemote = function(remote) {
    var meta;
    this.timeout(false);
    remote = this.wrapObject(remote);
    meta = remote != null ? remote._pnode : void 0;
    if (typeof (meta != null ? meta.ping : void 0) !== "function") {
      return this.err("Invalid pnode host");
    }
    this.remote = remote;
    this.ctx.getMeta(meta);
    this.log("EMIT REMOTE");
    this.emit('remote', this.remote, this);
    this.setStatus('up');
    return this.ping();
  };

  Client.prototype.ping = function() {
    var _this = this;
    if (this.status === 'down') {
      return;
    }
    this.count.ping++;
    this.timeout(true);
    return this.remote._pnode.ping(function(ok) {
      if (ok === true) {
        _this.count.pong++;
      }
      _this.timeout(false);
      return _this.ping();
    });
  };

  Client.prototype.timeout = function(cb) {
    var _this = this;
    clearTimeout(this.timeout.t);
    if (cb === false) {
      return;
    }
    return this.timeout.t = setTimeout(function() {
      _this.setStatus('down');
      if (typeof cb === 'function') {
        return cb();
      }
    }, this.opts.timeout);
  };

  Client.prototype.onEnd = function() {
    this.log("server closed connection");
    this.setStatus('down');
    return this.reconnect();
  };

  Client.prototype.setStatus = function(s) {
    this.connecting = false;
    if (!((s === 'up' || s === 'down') && s !== this.status)) {
      return;
    }
    this.log(s);
    this.status = s;
    return this.emit(s);
  };

  Client.prototype.reset = function() {
    this.setStatus('down');
    if (this.d) {
      this.d.removeAllListeners().end();
      return this.d = null;
    }
  };

  Client.prototype.publish = function() {
    var args,
      _this = this;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    this.server(function(remote) {
      var event;
      event = typeof args[0] === 'function' ? args[1] : args[0];
      if (!_this.ctx.events[event]) {
        _this.log("server " + _this.ctx.id + " isnt subscribed to " + event);
        return;
      }
      _this.log("publishing a " + event);
      return remote._pnode.publish.apply(null, args);
    });
  };

  Client.prototype.subscribe = function(event, fn) {
    var _this = this;
    this.pubsub.on(event, fn);
    if (!this.getConnectionFn) {
      return;
    }
    if (this.pubsub.listeners(event).length === 1) {
      this.server(function(remote) {
        return remote._pnode.subscribe(event);
      });
    }
  };

  Client.prototype.setInterface = function(obj) {
    return this.ci = obj;
  };

  Client.prototype.uri = function() {
    var _ref;
    return (_ref = this.ci) != null ? _ref.uri : void 0;
  };

  Client.prototype.serialize = function() {
    return this.uri();
  };

  return Client;

})(Base);

/*
//@ sourceMappingURL=client.map
*/
