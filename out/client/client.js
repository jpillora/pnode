// Generated by CoffeeScript 1.6.3
var Base, Client, RemoteContext, dnode, helper, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

_ = require('../../vendor/lodash');

dnode = require('dnode');

Base = require('../base');

helper = require('../helper');

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
    var spliceRead, spliceWrite,
      _this = this;
    Client.__super__.constructor.apply(this, arguments);
    this.count = {
      ping: 0,
      pong: 0,
      attempt: 0
    };
    this.reconnect = this.timeoutify('reconnect', this.reconnect);
    this.reconnect = _.throttle(this.reconnect, this.opts.retryInterval, {
      leading: true
    });
    this.on(['timeout', 'reconnect'], function() {
      _this.log("reconnect TIMEOUT!");
      _this.reset();
      return _this.reconnect();
    });
    this.ping = _.throttle(this.ping, this.opts.pingInterval);
    this.on(['timeout', 'ping'], function() {
      return _this.log("ping TIMEOUT!");
    });
    this.bindTo = this.bind;
    this.on('unbound', function() {
      if (_this.d) {
        _this.d.removeAllListeners().end();
        _this.d = null;
      }
    });
    this.on('uri', function(uri) {
      _this.uri = uri;
    });
    spliceRead = function(read) {
      if (_this.d.splicedRead) {
        _this.err(new Error("Already spliced read stream"));
      }
      if (!helper.isReadable(read)) {
        _this.err(new Error("Invalid read stream"));
      }
      read.on('error', _this.onStreamError);
      _this.ctx.getAddr(read);
      _this.d.splicedRead = true;
      return read.pipe(_this.d);
    };
    spliceWrite = function(write) {
      if (_this.d.spliceWrite) {
        _this.err(new Error("Already spliced write stream"));
      }
      if (!helper.isWritable(write)) {
        _this.err(new Error("Invalid write stream"));
      }
      write.on('error', _this.onStreamError);
      _this.d.spliceWrite = true;
      return _this.d.pipe(write);
    };
    this.on('read', function(read) {
      return spliceRead(read);
    });
    this.on('write', function(write) {
      return spliceWrite(write);
    });
    this.on('stream', function(stream) {
      spliceRead(stream);
      return spliceWrite(stream);
    });
  }

  Client.prototype.bind = function() {
    this.count.attempt = 0;
    this.bindArgs = arguments;
    return this.reconnect();
  };

  Client.prototype.unbind = function() {
    this.count.attempt = Infinity;
    return Client.__super__.unbind.apply(this, arguments);
  };

  Client.prototype.server = function(callback) {
    if (this.bound && this.remote) {
      return callback(this.remote);
    } else if (this.unbound) {
      this.count.attempt = 0;
      this.reconnect();
    }
    this.once('remote', callback);
  };

  Client.prototype.unget = function(callback) {
    return this.removeListener('remote', callback);
  };

  Client.prototype.reconnect = function() {
    if (!(this.unbound && this.count.attempt < this.opts.maxRetries)) {
      return;
    }
    this.count.attempt++;
    this.ctx = new RemoteContext;
    this.d = dnode(this.wrapObject(this.exposed, this.ctx));
    this.d.splicedRead = false;
    this.d.splicedWrite = false;
    this.d.once('remote', this.onRemote);
    this.d.once('end', this.onEnd);
    this.d.once('error', this.onError);
    this.d.once('fail', this.onStreamError);
    this.log("connection attempt " + this.count.attempt + "...");
    Base.prototype.bind.apply(this, this.bindArgs);
  };

  Client.prototype.onStreamError = function(err) {
    if (this.unbound || this.unbinding) {
      return;
    }
    this.log("stream error: " + err.message);
    this.reconnect();
  };

  Client.prototype.onError = function(err) {
    var msg;
    if (this.unbound || this.unbinding) {
      return;
    }
    msg = err.stack ? err.stack + "\n====" : err;
    return this.err(new Error(msg));
  };

  Client.prototype.onRemote = function(remote) {
    var meta;
    remote = this.wrapObject(remote);
    meta = remote != null ? remote._pnode : void 0;
    if (typeof (meta != null ? meta.ping : void 0) !== "function") {
      return this.err(new Error("Invalid pnode host"));
    }
    this.remote = remote;
    this.ctx.getMeta(meta);
    this.log("server remote!");
    this.emit('remote', this.remote, this);
    return this.ping();
  };

  Client.prototype.ping = function() {
    var _this = this;
    if (this.unbound) {
      return;
    }
    this.count.ping++;
    return this.remote._pnode.ping(function(ok) {
      if (ok === true) {
        _this.count.pong++;
      }
      return _this.ping();
    });
  };

  Client.prototype.onEnd = function() {
    this.log("server closed connection");
    return this.reconnect();
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

  Client.prototype.serialize = function() {
    return this.uri;
  };

  return Client;

})(Base);

/*
//@ sourceMappingURL=client.map
*/
