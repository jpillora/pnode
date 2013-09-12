// Generated by CoffeeScript 1.6.3
var Base, Connection, ObjectIndex, Server, dnode, helper, servers, transportMgr,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

dnode = require('dnode');

Base = require('../base');

transportMgr = require('../transport-mgr');

helper = require('../helper');

ObjectIndex = require('object-index');

Connection = require('./connection');

servers = [];

module.exports = Server = (function(_super) {
  __extends(Server, _super);

  Server.prototype.name = 'Server';

  Server.prototype.defaults = {
    debug: false,
    wait: 5000
  };

  function Server() {
    servers.push(this);
    Server.__super__.constructor.apply(this, arguments);
    this.connections = ObjectIndex("id", "guid");
    this.bindOn = this.bind;
  }

  Server.prototype.bind = function() {
    this.unbind();
    transportMgr.bind(this, arguments);
    this.log("bind server!");
  };

  Server.prototype.unbind = function() {
    var conn, _i, _len, _ref, _ref1;
    _ref = Array.prototype.slice.call(this.connections);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      conn = _ref[_i];
      conn.unbind();
    }
    try {
      if (typeof ((_ref1 = this.si) != null ? _ref1.unbind : void 0) === 'function') {
        this.si.unbind();
      }
    } catch (_error) {}
    this.si = null;
    this.emit('unbind');
  };

  Server.prototype.handle = function(read, write) {
    var conn,
      _this = this;
    if (read.write && !(write != null ? write.write : void 0)) {
      write = read;
    }
    if (!helper.isReadable(read)) {
      this.err("Invalid read stream");
    }
    if (!helper.isWritable(write)) {
      this.err("Invalid write stream");
    }
    conn = new Connection(this, read, write);
    this.log("new connection!");
    conn.once('up', function() {
      if (_this.connections.getBy("id", conn.id) || _this.connections.getBy("guid", conn.guid)) {
        _this.warn("rejected duplicate conn with id " + conn.id + " (" + conn.guid + ")");
        conn.unbind();
        return;
      }
      _this.connections.add(conn);
      _this.emit('remote', conn.remote);
      return _this.emit('connection', conn, _this);
    });
    return conn.once('down', function() {
      if (!_this.connections.remove(conn)) {
        return;
      }
      return _this.emit('disconnection', conn);
    });
  };

  Server.prototype.client = function(id, callback) {
    var cb, conn, t,
      _this = this;
    conn = this.connections.get(id);
    if (!callback) {
      return conn;
    }
    if (conn) {
      return callback(conn.remote);
    }
    t = setTimeout(function() {
      _this.log("timeout waiting for " + id);
      return _this.removeListener('remote', cb);
    }, this.opts.wait);
    cb = function() {
      _this.log("new remote! looking for " + id);
      conn = _this.connections.get(id);
      if (!conn) {
        return;
      }
      clearTimeout(t);
      _this.removeListener('remote', cb);
      return callback(conn.remote);
    };
    this.on('remote', cb);
  };

  Server.prototype.publish = function() {
    var args, conn, _i, _len, _ref, _results;
    args = arguments;
    _ref = this.connections;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      conn = _ref[_i];
      _results.push(conn.publish.apply(conn, args));
    }
    return _results;
  };

  Server.prototype.subscribe = function(event, fn) {
    var conn, _i, _len, _ref, _results;
    this.pubsub.on(event, fn);
    _ref = this.connections;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      conn = _ref[_i];
      _results.push(conn.subscribe(event));
    }
    return _results;
  };

  Server.prototype.setInterface = function(obj) {
    return this.si = obj;
  };

  Server.prototype.uri = function() {
    var _ref;
    return (_ref = this.si) != null ? _ref.uri : void 0;
  };

  Server.prototype.serialize = function() {
    return this.uri();
  };

  return Server;

})(Base);

if (typeof process.on === "function") {
  process.on('exit', function() {
    var server, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = servers.length; _i < _len; _i++) {
      server = servers[_i];
      _results.push(server.unbind());
    }
    return _results;
  });
}

if (typeof process.on === "function") {
  process.on('SIGINT', function() {
    return process.exit();
  });
}

/*
//@ sourceMappingURL=server.map
*/
