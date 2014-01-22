// Generated by CoffeeScript 1.6.3
var Emitter, Logger, util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Emitter = require('eventemitter2').EventEmitter2;

util = require('util');

module.exports = Logger = (function(_super) {
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

/*
//@ sourceMappingURL=logger.map
*/
