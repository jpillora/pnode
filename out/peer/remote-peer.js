// Generated by CoffeeScript 1.6.3
var Logger, RemoteContext, RemotePeer, helper,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Logger = require('../logger');

RemoteContext = require('../context');

helper = require('../helper');

module.exports = RemotePeer = (function(_super) {
  __extends(RemotePeer, _super);

  RemotePeer.prototype.name = 'RemotePeer';

  function RemotePeer(local, guid, id, ips) {
    var _this = this;
    this.local = local;
    this.guid = guid;
    this.id = id;
    this.ips = ips;
    this.opts = this.local.opts;
    this.cliconns = [];
    Object.defineProperty(this, 'uri', {
      get: function() {
        var _ref;
        return (_ref = _this.cliconns[0]) != null ? _ref.uri : void 0;
      }
    });
    this.connecting = false;
    this.ctx = new RemoteContext;
    this.ctx.id = id;
    this.ctx.guid = guid;
    this.isUp(false);
  }

  RemotePeer.prototype.add = function(cliconn) {
    var _this = this;
    this.ctx.combine(cliconn.ctx);
    this.cliconns.push(cliconn);
    cliconn.once('down', function() {
      _this.cliconns.splice(_this.cliconns.indexOf(cliconn), 1);
      return _this.setActive();
    });
    return this.setActive();
  };

  RemotePeer.prototype.setActive = function() {
    var c;
    c = this.cliconns[0];
    this.remote = c ? c.remote : null;
    this.publish = c ? c.publish.bind(c) : null;
    this.subscribe = c ? c.subscribe.bind(c) : null;
    return this.isUp(!!this.remote);
  };

  RemotePeer.prototype.isUp = function(up) {
    if (this.up === up) {
      return;
    }
    if (up) {
      this.up = true;
      this.emit('up');
    } else {
      this.up = false;
      this.remote = null;
      this.emit('down');
    }
    this.log("" + (this.up ? 'UP' : 'DOWN') + " (#conns:" + this.cliconns.length + ")");
  };

  RemotePeer.prototype.serialize = function() {
    return {
      id: this.id,
      guid: this.guid,
      ips: this.ips,
      clients: helper.serialize(this.clients)
    };
  };

  RemotePeer.prototype.toString = function() {
    return "" + this.name + ": " + this.local.id + ": " + this.id + ":";
  };

  return RemotePeer;

})(Logger);

/*
//@ sourceMappingURL=remote-peer.map
*/
