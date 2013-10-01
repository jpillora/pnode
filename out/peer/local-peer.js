// Generated by CoffeeScript 1.6.3
var Base, Client, Connection, LocalPeer, ObjectIndex, RemotePeer, Server, helper, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

_ = require('../../vendor/lodash');

Server = require('../server/server');

Connection = require('../server/connection');

Client = require('../client/client');

Base = require('../base');

helper = require('../helper');

RemotePeer = require('./remote-peer');

ObjectIndex = require('object-index');

module.exports = LocalPeer = (function(_super) {
  __extends(LocalPeer, _super);

  LocalPeer.prototype.name = 'LocalPeer';

  LocalPeer.prototype.defaults = {
    debug: false,
    wait: 1000,
    learn: false
  };

  function LocalPeer() {
    var _this = this;
    LocalPeer.__super__.constructor.apply(this, arguments);
    this.count = {
      server: 0,
      client: 0
    };
    this.servers = {};
    this.clients = {};
    this.peers = ObjectIndex("id", "guid");
    if (this.opts.learn) {
      this.expose({
        _pnode: {
          serialize: this.exposeDynamic(function() {
            return _this.serialize();
          })
        }
      });
    }
  }

  LocalPeer.prototype.bindOn = function() {
    var self, server,
      _this = this;
    this.count.server++;
    server = new Server(this);
    self = this;
    server.onAny(function() {
      var args, e;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      e = [].concat(server.subid).concat(this.event);
      args.unshift(e);
      return self.emit.apply(null, args);
    });
    server.on('error', function(err) {
      return _this.emit('error', err);
    });
    server.on('connection', function(conn) {
      return conn.once('remote', function() {
        return _this.onPeer(conn);
      });
    });
    server.bindOn.apply(server, arguments);
    this.servers[server.guid] = server;
    server.once('unbound', function() {
      return delete _this.servers[server.guid];
    });
  };

  LocalPeer.prototype.bindTo = function() {
    var client, self,
      _this = this;
    this.count.client++;
    client = new Client(this);
    self = this;
    client.onAny(function() {
      var args, e;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      e = [].concat(client.subid).concat(this.event);
      args.unshift(e);
      return self.emit.apply(null, args);
    });
    client.on('error', function(err) {
      return _this.emit('error', err);
    });
    client.on('remote', function() {
      return _this.onPeer(client);
    });
    client.bindTo.apply(client, arguments);
    this.clients[client.guid] = client;
    client.once('unbound', function() {
      return delete _this.clients[client.guid];
    });
  };

  LocalPeer.prototype.unbind = function(callback) {
    var client, guid, mkCb, server, _ref, _ref1,
      _this = this;
    mkCb = helper.callbacker(function() {
      if (callback) {
        callback();
      }
      return _this.emit('unbound-all');
    });
    _ref = this.clients;
    for (guid in _ref) {
      client = _ref[guid];
      client.unbind(mkCb());
    }
    _ref1 = this.servers;
    for (guid in _ref1) {
      server = _ref1[guid];
      server.unbind(mkCb());
    }
  };

  LocalPeer.prototype.onPeer = function(cliconn) {
    var guid, id, ips, peer, remote, _ref,
      _this = this;
    if (!(cliconn instanceof Client || cliconn instanceof Connection)) {
      return this.log("must be client or conn");
    }
    remote = cliconn.remote;
    if (!remote) {
      return this.log('peer missing remote');
    }
    _ref = remote._pnode, guid = _ref.guid, id = _ref.id, ips = _ref.ips;
    if (!guid) {
      return this.log('peer missing guid');
    }
    peer = this.peers.get(guid);
    if (!peer) {
      peer = new RemotePeer(this, guid, id, ips);
      this.peers.add(peer);
      peer.on('up', function() {
        _this.emit('peer', peer);
        return _this.emit('remote', peer.remote);
      });
      peer.on('down', function() {
        return _this.log("lost peer %s", id);
      });
    }
    peer.add(cliconn);
  };

  LocalPeer.prototype.serialize = function() {
    return {
      servers: helper.serialize(this.servers),
      peers: helper.serialize(this.peers.list)
    };
  };

  LocalPeer.prototype.all = function(callback) {
    var guid, peer, rems, _ref;
    rems = [];
    _ref = this.peers;
    for (guid in _ref) {
      peer = _ref[guid];
      if (peer.up) {
        rems.push(peer.remote);
      }
    }
    return callback(rems);
  };

  LocalPeer.prototype.peer = function(id, callback) {
    var check, get, t,
      _this = this;
    get = function() {
      var peer;
      peer = _this.peers.get(id);
      if (!(peer != null ? peer.up : void 0)) {
        return false;
      }
      _this.log("FOUND PEER: " + id);
      callback(peer.remote);
      return true;
    };
    if (get()) {
      return;
    }
    check = function() {
      if (!get()) {
        return;
      }
      this.off('peer', check);
      return clearTimeout(t);
    };
    t = setTimeout(function() {
      _this.off('peer', check);
      return _this.emit('timeout', id);
    }, this.opts.wait);
    return this.on('peer', check);
  };

  LocalPeer.prototype.publish = function() {
    var peer, _i, _len, _ref;
    _ref = this.peers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      peer = _ref[_i];
      if (peer.up) {
        peer.publish.apply(peer, arguments);
      }
    }
  };

  LocalPeer.prototype.subscribe = function(event, fn) {
    var peer, _i, _len, _ref;
    this.pubsub.on(event, fn);
    if (this.pubsub.listeners(event).length === 1) {
      _ref = this.peers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        peer = _ref[_i];
        if (typeof peer.subscribe === "function") {
          peer.subscribe(event);
        }
      }
    }
  };

  LocalPeer.prototype.unsubscribe = function(event, fn) {
    return this.pubsub.off(event, fn);
  };

  return LocalPeer;

})(Base);

/*
//@ sourceMappingURL=local-peer.map
*/
