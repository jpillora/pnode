;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var process=require("__browserify_process");if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (typeof emitter._events[type] === 'function')
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

},{"__browserify_process":9}],2:[function(require,module,exports){
// nothing to see here... no file methods for the browser

},{}],3:[function(require,module,exports){
var process=require("__browserify_process");function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';

},{"__browserify_process":9}],4:[function(require,module,exports){

/**
 * Object#toString() ref for stringify().
 */

var toString = Object.prototype.toString;

/**
 * Array#indexOf shim.
 */

var indexOf = typeof Array.prototype.indexOf === 'function'
  ? function(arr, el) { return arr.indexOf(el); }
  : function(arr, el) {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] === el) return i;
      }
      return -1;
    };

/**
 * Array.isArray shim.
 */

var isArray = Array.isArray || function(arr) {
  return toString.call(arr) == '[object Array]';
};

/**
 * Object.keys shim.
 */

var objectKeys = Object.keys || function(obj) {
  var ret = [];
  for (var key in obj) ret.push(key);
  return ret;
};

/**
 * Array#forEach shim.
 */

var forEach = typeof Array.prototype.forEach === 'function'
  ? function(arr, fn) { return arr.forEach(fn); }
  : function(arr, fn) {
      for (var i = 0; i < arr.length; i++) fn(arr[i]);
    };

/**
 * Array#reduce shim.
 */

var reduce = function(arr, fn, initial) {
  if (typeof arr.reduce === 'function') return arr.reduce(fn, initial);
  var res = initial;
  for (var i = 0; i < arr.length; i++) res = fn(res, arr[i]);
  return res;
};

/**
 * Cache non-integer test regexp.
 */

var isint = /^[0-9]+$/;

function promote(parent, key) {
  if (parent[key].length == 0) return parent[key] = {};
  var t = {};
  for (var i in parent[key]) t[i] = parent[key][i];
  parent[key] = t;
  return t;
}

function parse(parts, parent, key, val) {
  var part = parts.shift();
  // end
  if (!part) {
    if (isArray(parent[key])) {
      parent[key].push(val);
    } else if ('object' == typeof parent[key]) {
      parent[key] = val;
    } else if ('undefined' == typeof parent[key]) {
      parent[key] = val;
    } else {
      parent[key] = [parent[key], val];
    }
    // array
  } else {
    var obj = parent[key] = parent[key] || [];
    if (']' == part) {
      if (isArray(obj)) {
        if ('' != val) obj.push(val);
      } else if ('object' == typeof obj) {
        obj[objectKeys(obj).length] = val;
      } else {
        obj = parent[key] = [parent[key], val];
      }
      // prop
    } else if (~indexOf(part, ']')) {
      part = part.substr(0, part.length - 1);
      if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
      parse(parts, obj, part, val);
      // key
    } else {
      if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
      parse(parts, obj, part, val);
    }
  }
}

/**
 * Merge parent key/val pair.
 */

function merge(parent, key, val){
  if (~indexOf(key, ']')) {
    var parts = key.split('[')
      , len = parts.length
      , last = len - 1;
    parse(parts, parent, 'base', val);
    // optimize
  } else {
    if (!isint.test(key) && isArray(parent.base)) {
      var t = {};
      for (var k in parent.base) t[k] = parent.base[k];
      parent.base = t;
    }
    set(parent.base, key, val);
  }

  return parent;
}

/**
 * Parse the given obj.
 */

function parseObject(obj){
  var ret = { base: {} };
  forEach(objectKeys(obj), function(name){
    merge(ret, name, obj[name]);
  });
  return ret.base;
}

/**
 * Parse the given str.
 */

function parseString(str){
  return reduce(String(str).split('&'), function(ret, pair){
    var eql = indexOf(pair, '=')
      , brace = lastBraceInKey(pair)
      , key = pair.substr(0, brace || eql)
      , val = pair.substr(brace || eql, pair.length)
      , val = val.substr(indexOf(val, '=') + 1, val.length);

    // ?foo
    if ('' == key) key = pair, val = '';
    if ('' == key) return ret;

    return merge(ret, decode(key), decode(val));
  }, { base: {} }).base;
}

/**
 * Parse the given query `str` or `obj`, returning an object.
 *
 * @param {String} str | {Object} obj
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if (null == str || '' == str) return {};
  return 'object' == typeof str
    ? parseObject(str)
    : parseString(str);
};

/**
 * Turn the given `obj` into a query string
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

var stringify = exports.stringify = function(obj, prefix) {
  if (isArray(obj)) {
    return stringifyArray(obj, prefix);
  } else if ('[object Object]' == toString.call(obj)) {
    return stringifyObject(obj, prefix);
  } else if ('string' == typeof obj) {
    return stringifyString(obj, prefix);
  } else {
    return prefix + '=' + encodeURIComponent(String(obj));
  }
};

/**
 * Stringify the given `str`.
 *
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyString(str, prefix) {
  if (!prefix) throw new TypeError('stringify expects an object');
  return prefix + '=' + encodeURIComponent(str);
}

/**
 * Stringify the given `arr`.
 *
 * @param {Array} arr
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyArray(arr, prefix) {
  var ret = [];
  if (!prefix) throw new TypeError('stringify expects an object');
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '[' + i + ']'));
  }
  return ret.join('&');
}

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyObject(obj, prefix) {
  var ret = []
    , keys = objectKeys(obj)
    , key;

  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    if (null == obj[key]) {
      ret.push(encodeURIComponent(key) + '=');
    } else {
      ret.push(stringify(obj[key], prefix
        ? prefix + '[' + encodeURIComponent(key) + ']'
        : encodeURIComponent(key)));
    }
  }

  return ret.join('&');
}

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (undefined === v) {
    obj[key] = val;
  } else if (isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}

/**
 * Decode `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function decode(str) {
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch (err) {
    return str;
  }
}

},{}],5:[function(require,module,exports){
var events = require('events');
var util = require('util');

function Stream() {
  events.EventEmitter.call(this);
}
util.inherits(Stream, events.EventEmitter);
module.exports = Stream;
// Backwards-compat with node 0.4.x
Stream.Stream = Stream;

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once, and
  // only when all sources have ended.
  if (!dest._isStdio && (!options || options.end !== false)) {
    dest._pipeCount = dest._pipeCount || 0;
    dest._pipeCount++;

    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest._pipeCount--;

    // remove the listeners
    cleanup();

    if (dest._pipeCount > 0) {
      // waiting for other incoming streams to end.
      return;
    }

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest._pipeCount--;

    // remove the listeners
    cleanup();

    if (dest._pipeCount > 0) {
      // waiting for other incoming streams to end.
      return;
    }

    dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (this.listeners('error').length === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('end', cleanup);
    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('end', cleanup);
  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":1,"util":7}],6:[function(require,module,exports){
var punycode = { encode : function (s) { return s } };

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

function arrayIndexOf(array, subject) {
    for (var i = 0, j = array.length; i < j; i++) {
        if(array[i] == subject) return i;
    }
    return -1;
}

var objectKeys = Object.keys || function objectKeys(object) {
    if (object !== Object(object)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in object) if (object.hasOwnProperty(key)) keys[keys.length] = key;
    return keys;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]+$/,
    // RFC 2396: characters reserved for delimiting URLs.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],
    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '~', '[', ']', '`'].concat(delims),
    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''],
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#']
      .concat(unwise).concat(autoEscape),
    nonAuthChars = ['/', '@', '?', '#'].concat(delims),
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-zA-Z0-9][a-z0-9A-Z_-]{0,62}$/,
    hostnamePartStart = /^([a-zA-Z0-9][a-z0-9A-Z_-]{0,62})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always have a path component.
    pathedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && typeof(url) === 'object' && url.href) return url;

  if (typeof url !== 'string') {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var out = {},
      rest = url;

  // cut off any delimiters.
  // This is to support parse stuff like "<http://foo.com>"
  for (var i = 0, l = rest.length; i < l; i++) {
    if (arrayIndexOf(delims, rest.charAt(i)) === -1) break;
  }
  if (i !== 0) rest = rest.substr(i);


  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    out.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      out.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {
    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    // don't enforce full RFC correctness, just be unstupid about it.

    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the first @ sign, unless some non-auth character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    var atSign = arrayIndexOf(rest, '@');
    if (atSign !== -1) {
      // there *may be* an auth
      var hasAuth = true;
      for (var i = 0, l = nonAuthChars.length; i < l; i++) {
        var index = arrayIndexOf(rest, nonAuthChars[i]);
        if (index !== -1 && index < atSign) {
          // not a valid auth.  Something like http://foo.com/bar@baz/
          hasAuth = false;
          break;
        }
      }
      if (hasAuth) {
        // pluck off the auth portion.
        out.auth = rest.substr(0, atSign);
        rest = rest.substr(atSign + 1);
      }
    }

    var firstNonHost = -1;
    for (var i = 0, l = nonHostChars.length; i < l; i++) {
      var index = arrayIndexOf(rest, nonHostChars[i]);
      if (index !== -1 &&
          (firstNonHost < 0 || index < firstNonHost)) firstNonHost = index;
    }

    if (firstNonHost !== -1) {
      out.host = rest.substr(0, firstNonHost);
      rest = rest.substr(firstNonHost);
    } else {
      out.host = rest;
      rest = '';
    }

    // pull out port.
    var p = parseHost(out.host);
    var keys = objectKeys(p);
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      out[key] = p[key];
    }

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    out.hostname = out.hostname || '';

    // validate a little.
    if (out.hostname.length > hostnameMaxLen) {
      out.hostname = '';
    } else {
      var hostparts = out.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            out.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    // hostnames are always lower case.
    out.hostname = out.hostname.toLowerCase();

    // IDNA Support: Returns a puny coded representation of "domain".
    // It only converts the part of the domain name that
    // has non ASCII characters. I.e. it dosent matter if
    // you call it with a domain that already is in ASCII.
    var domainArray = out.hostname.split('.');
    var newOut = [];
    for (var i = 0; i < domainArray.length; ++i) {
      var s = domainArray[i];
      newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
          'xn--' + punycode.encode(s) : s);
    }
    out.hostname = newOut.join('.');

    out.host = (out.hostname || '') +
        ((out.port) ? ':' + out.port : '');
    out.href += out.host;
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }

    // Now make sure that delims never appear in a url.
    var chop = rest.length;
    for (var i = 0, l = delims.length; i < l; i++) {
      var c = arrayIndexOf(rest, delims[i]);
      if (c !== -1) {
        chop = Math.min(c, chop);
      }
    }
    rest = rest.substr(0, chop);
  }


  // chop off from the tail first.
  var hash = arrayIndexOf(rest, '#');
  if (hash !== -1) {
    // got a fragment string.
    out.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = arrayIndexOf(rest, '?');
  if (qm !== -1) {
    out.search = rest.substr(qm);
    out.query = rest.substr(qm + 1);
    if (parseQueryString) {
      out.query = querystring.parse(out.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    out.search = '';
    out.query = {};
  }
  if (rest) out.pathname = rest;
  if (slashedProtocol[proto] &&
      out.hostname && !out.pathname) {
    out.pathname = '/';
  }

  //to support http.request
  if (out.pathname || out.search) {
    out.path = (out.pathname ? out.pathname : '') +
               (out.search ? out.search : '');
  }

  // finally, reconstruct the href based on what has been validated.
  out.href = urlFormat(out);
  return out;
}

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (typeof(obj) === 'string') obj = urlParse(obj);

  var auth = obj.auth || '';
  if (auth) {
    auth = auth.split('@').join('%40');
    for (var i = 0, l = nonAuthChars.length; i < l; i++) {
      var nAC = nonAuthChars[i];
      auth = auth.split(nAC).join(encodeURIComponent(nAC));
    }
    auth += '@';
  }

  var protocol = obj.protocol || '',
      host = (obj.host !== undefined) ? auth + obj.host :
          obj.hostname !== undefined ? (
              auth + obj.hostname +
              (obj.port ? ':' + obj.port : '')
          ) :
          false,
      pathname = obj.pathname || '',
      query = obj.query &&
              ((typeof obj.query === 'object' &&
                objectKeys(obj.query).length) ?
                 querystring.stringify(obj.query) :
                 '') || '',
      search = obj.search || (query && ('?' + query)) || '',
      hash = obj.hash || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (obj.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  return protocol + host + pathname + search + hash;
}

function urlResolve(source, relative) {
  return urlFormat(urlResolveObject(source, relative));
}

function urlResolveObject(source, relative) {
  if (!source) return relative;

  source = urlParse(urlFormat(source), false, true);
  relative = urlParse(urlFormat(relative), false, true);

  // hash is always overridden, no matter what.
  source.hash = relative.hash;

  if (relative.href === '') {
    source.href = urlFormat(source);
    return source;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    relative.protocol = source.protocol;
    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[relative.protocol] &&
        relative.hostname && !relative.pathname) {
      relative.path = relative.pathname = '/';
    }
    relative.href = urlFormat(relative);
    return relative;
  }

  if (relative.protocol && relative.protocol !== source.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      relative.href = urlFormat(relative);
      return relative;
    }
    source.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      relative.pathname = relPath.join('/');
    }
    source.pathname = relative.pathname;
    source.search = relative.search;
    source.query = relative.query;
    source.host = relative.host || '';
    source.auth = relative.auth;
    source.hostname = relative.hostname || relative.host;
    source.port = relative.port;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.slashes = source.slashes || relative.slashes;
    source.href = urlFormat(source);
    return source;
  }

  var isSourceAbs = (source.pathname && source.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host !== undefined ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (source.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = source.pathname && source.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = source.protocol &&
          !slashedProtocol[source.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // source.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {

    delete source.hostname;
    delete source.port;
    if (source.host) {
      if (srcPath[0] === '') srcPath[0] = source.host;
      else srcPath.unshift(source.host);
    }
    delete source.host;
    if (relative.protocol) {
      delete relative.hostname;
      delete relative.port;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      delete relative.host;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    source.host = (relative.host || relative.host === '') ?
                      relative.host : source.host;
    source.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : source.hostname;
    source.search = relative.search;
    source.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    source.search = relative.search;
    source.query = relative.query;
  } else if ('search' in relative) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      source.hostname = source.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = source.host && arrayIndexOf(source.host, '@') > 0 ?
                       source.host.split('@') : false;
      if (authInHost) {
        source.auth = authInHost.shift();
        source.host = source.hostname = authInHost.shift();
      }
    }
    source.search = relative.search;
    source.query = relative.query;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.href = urlFormat(source);
    return source;
  }
  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    delete source.pathname;
    //to support http.request
    if (!source.search) {
      source.path = '/' + source.search;
    } else {
      delete source.path;
    }
    source.href = urlFormat(source);
    return source;
  }
  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (source.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    source.hostname = source.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = source.host && arrayIndexOf(source.host, '@') > 0 ?
                     source.host.split('@') : false;
    if (authInHost) {
      source.auth = authInHost.shift();
      source.host = source.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (source.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  source.pathname = srcPath.join('/');
  //to support request.http
  if (source.pathname !== undefined || source.search !== undefined) {
    source.path = (source.pathname ? source.pathname : '') +
                  (source.search ? source.search : '');
  }
  source.auth = relative.auth || source.auth;
  source.slashes = source.slashes || relative.slashes;
  source.href = urlFormat(source);
  return source;
}

function parseHost(host) {
  var out = {};
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    out.port = port.substr(1);
    host = host.substr(0, host.length - port.length);
  }
  if (host) out.hostname = host;
  return out;
}

},{"querystring":4}],7:[function(require,module,exports){
var events = require('events');

exports.isArray = isArray;
exports.isDate = function(obj){return Object.prototype.toString.call(obj) === '[object Date]'};
exports.isRegExp = function(obj){return Object.prototype.toString.call(obj) === '[object RegExp]'};


exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\u001b[' + styles[style][0] + 'm' + str +
             '\u001b[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return Array.isArray(ar) ||
         (typeof ar === 'object' && Object.prototype.toString.call(ar) === '[object Array]');
}


function isRegExp(re) {
  typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]';
}


function isDate(d) {
  return typeof d === 'object' && Object.prototype.toString.call(d) === '[object Date]';
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (typeof f !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(exports.inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j': return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });
  for(var x = args[i]; i < len; x = args[++i]){
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + exports.inspect(x);
    }
  }
  return str;
};

},{"events":1}],8:[function(require,module,exports){

},{}],9:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],10:[function(require,module,exports){
var Stream = require('stream');
var sockjs = require('sockjs-client');
var resolve = require('url').resolve;

module.exports = function (u, cb) {
    var uri = resolve(window.location.href, u);
    
    var stream = new Stream;
    stream.readable = true;
    stream.writable = true;
    
    var ready = false;
    var buffer = [];
    
    var sock = sockjs(uri);
    stream.sock = sock;
    
    stream.write = function (msg) {
        if (!ready || buffer.length) buffer.push(msg)
        else sock.send(msg)
    };
    
    stream.end = function (msg) {
        if (msg !== undefined) stream.write(msg);
        if (!ready) {
            stream._ended = true;
            return;
        }
        stream.writable = false;
        sock.close();
    };
    
    stream.destroy = function () {
        stream._ended = true;
        stream.writable = stream.readable = false;
        buffer.length = 0
        sock.close();
    };
    
    sock.onopen = function () {
        if (typeof cb === 'function') cb();
        ready = true;
        for (var i = 0; i < buffer.length; i++) {
            sock.send(buffer[i]);
        }
        buffer = [];
        stream.emit('connect');
        if (stream._ended) stream.end();
    };
    
    sock.onmessage = function (e) {
        stream.emit('data', e.data);
    };
    
    sock.onclose = function () {
        stream.emit('end');
        stream.writable = false;
        stream.readable = false;
    };
    
    return stream;
};

},{"sockjs-client":11,"stream":5,"url":6}],11:[function(require,module,exports){
/* SockJS client, version 0.3.1.7.ga67f.dirty, http://sockjs.org, MIT License

Copyright (c) 2011-2012 VMware, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// JSON2 by Douglas Crockford (minified).
var JSON;JSON||(JSON={}),function(){function str(a,b){var c,d,e,f,g=gap,h,i=b[a];i&&typeof i=="object"&&typeof i.toJSON=="function"&&(i=i.toJSON(a)),typeof rep=="function"&&(i=rep.call(b,a,i));switch(typeof i){case"string":return quote(i);case"number":return isFinite(i)?String(i):"null";case"boolean":case"null":return String(i);case"object":if(!i)return"null";gap+=indent,h=[];if(Object.prototype.toString.apply(i)==="[object Array]"){f=i.length;for(c=0;c<f;c+=1)h[c]=str(c,i)||"null";e=h.length===0?"[]":gap?"[\n"+gap+h.join(",\n"+gap)+"\n"+g+"]":"["+h.join(",")+"]",gap=g;return e}if(rep&&typeof rep=="object"){f=rep.length;for(c=0;c<f;c+=1)typeof rep[c]=="string"&&(d=rep[c],e=str(d,i),e&&h.push(quote(d)+(gap?": ":":")+e))}else for(d in i)Object.prototype.hasOwnProperty.call(i,d)&&(e=str(d,i),e&&h.push(quote(d)+(gap?": ":":")+e));e=h.length===0?"{}":gap?"{\n"+gap+h.join(",\n"+gap)+"\n"+g+"}":"{"+h.join(",")+"}",gap=g;return e}}function quote(a){escapable.lastIndex=0;return escapable.test(a)?'"'+a.replace(escapable,function(a){var b=meta[a];return typeof b=="string"?b:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'}function f(a){return a<10?"0"+a:a}"use strict",typeof Date.prototype.toJSON!="function"&&(Date.prototype.toJSON=function(a){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(a){return this.valueOf()});var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;typeof JSON.stringify!="function"&&(JSON.stringify=function(a,b,c){var d;gap="",indent="";if(typeof c=="number")for(d=0;d<c;d+=1)indent+=" ";else typeof c=="string"&&(indent=c);rep=b;if(!b||typeof b=="function"||typeof b=="object"&&typeof b.length=="number")return str("",{"":a});throw new Error("JSON.stringify")}),typeof JSON.parse!="function"&&(JSON.parse=function(text,reviver){function walk(a,b){var c,d,e=a[b];if(e&&typeof e=="object")for(c in e)Object.prototype.hasOwnProperty.call(e,c)&&(d=walk(e,c),d!==undefined?e[c]=d:delete e[c]);return reviver.call(a,b,e)}var j;text=String(text),cx.lastIndex=0,cx.test(text)&&(text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver=="function"?walk({"":j},""):j}throw new SyntaxError("JSON.parse")})}()


//     [*] Including lib/index.js
// Public object
var SockJS = (function(){
              var _document = document;
              var _window = window;
              var utils = {};


//         [*] Including lib/reventtarget.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

/* Simplified implementation of DOM2 EventTarget.
 *   http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventTarget
 */
var REventTarget = function() {};
REventTarget.prototype.addEventListener = function (eventType, listener) {
    if(!this._listeners) {
         this._listeners = {};
    }
    if(!(eventType in this._listeners)) {
        this._listeners[eventType] = [];
    }
    var arr = this._listeners[eventType];
    if(utils.arrIndexOf(arr, listener) === -1) {
        arr.push(listener);
    }
    return;
};

REventTarget.prototype.removeEventListener = function (eventType, listener) {
    if(!(this._listeners && (eventType in this._listeners))) {
        return;
    }
    var arr = this._listeners[eventType];
    var idx = utils.arrIndexOf(arr, listener);
    if (idx !== -1) {
        if(arr.length > 1) {
            this._listeners[eventType] = arr.slice(0, idx).concat( arr.slice(idx+1) );
        } else {
            delete this._listeners[eventType];
        }
        return;
    }
    return;
};

REventTarget.prototype.dispatchEvent = function (event) {
    var t = event.type;
    var args = Array.prototype.slice.call(arguments, 0);
    if (this['on'+t]) {
        this['on'+t].apply(this, args);
    }
    if (this._listeners && t in this._listeners) {
        for(var i=0; i < this._listeners[t].length; i++) {
            this._listeners[t][i].apply(this, args);
        }
    }
};
//         [*] End of lib/reventtarget.js


//         [*] Including lib/simpleevent.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var SimpleEvent = function(type, obj) {
    this.type = type;
    if (typeof obj !== 'undefined') {
        for(var k in obj) {
            if (!obj.hasOwnProperty(k)) continue;
            this[k] = obj[k];
        }
    }
};

SimpleEvent.prototype.toString = function() {
    var r = [];
    for(var k in this) {
        if (!this.hasOwnProperty(k)) continue;
        var v = this[k];
        if (typeof v === 'function') v = '[function]';
        r.push(k + '=' + v);
    }
    return 'SimpleEvent(' + r.join(', ') + ')';
};
//         [*] End of lib/simpleevent.js


//         [*] Including lib/eventemitter.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var EventEmitter = function(events) {
    this.events = events || [];
};
EventEmitter.prototype.emit = function(type) {
    var that = this;
    var args = Array.prototype.slice.call(arguments, 1);
    if (!that.nuked && that['on'+type]) {
        that['on'+type].apply(that, args);
    }
    if (utils.arrIndexOf(that.events, type) === -1) {
        utils.log('Event ' + JSON.stringify(type) +
                  ' not listed ' + JSON.stringify(that.events) +
                  ' in ' + that);
    }
};

EventEmitter.prototype.nuke = function(type) {
    var that = this;
    that.nuked = true;
    for(var i=0; i<that.events.length; i++) {
        delete that[that.events[i]];
    }
};
//         [*] End of lib/eventemitter.js


//         [*] Including lib/utils.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var random_string_chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
utils.random_string = function(length, max) {
    max = max || random_string_chars.length;
    var i, ret = [];
    for(i=0; i < length; i++) {
        ret.push( random_string_chars.substr(Math.floor(Math.random() * max),1) );
    }
    return ret.join('');
};
utils.random_number = function(max) {
    return Math.floor(Math.random() * max);
};
utils.random_number_string = function(max) {
    var t = (''+(max - 1)).length;
    var p = Array(t+1).join('0');
    return (p + utils.random_number(max)).slice(-t);
};

// Assuming that url looks like: http://asdasd:111/asd
utils.getOrigin = function(url) {
    url += '/';
    var parts = url.split('/').slice(0, 3);
    return parts.join('/');
};

utils.isSameOriginUrl = function(url_a, url_b) {
    // location.origin would do, but it's not always available.
    if (!url_b) url_b = _window.location.href;

    return (url_a.split('/').slice(0,3).join('/')
                ===
            url_b.split('/').slice(0,3).join('/'));
};

utils.getParentDomain = function(url) {
    // ipv4 ip address
    if (/^[0-9.]*$/.test(url)) return url;
    // ipv6 ip address
    if (/^\[/.test(url)) return url;
    // no dots
    if (!(/[.]/.test(url))) return url;

    var parts = url.split('.').slice(1);
    return parts.join('.');
};

utils.objectExtend = function(dst, src) {
    for(var k in src) {
        if (src.hasOwnProperty(k)) {
            dst[k] = src[k];
        }
    }
    return dst;
};

var WPrefix = '_jp';

utils.polluteGlobalNamespace = function() {
    if (!(WPrefix in _window)) {
        _window[WPrefix] = {};
    }
};

utils.closeFrame = function (code, reason) {
    return 'c'+JSON.stringify([code, reason]);
};

utils.userSetCode = function (code) {
    return code === 1000 || (code >= 3000 && code <= 4999);
};

// See: http://www.erg.abdn.ac.uk/~gerrit/dccp/notes/ccid2/rto_estimator/
// and RFC 2988.
utils.countRTO = function (rtt) {
    var rto;
    if (rtt > 100) {
        rto = 3 * rtt; // rto > 300msec
    } else {
        rto = rtt + 200; // 200msec < rto <= 300msec
    }
    return rto;
}

utils.log = function() {
    if (_window.console && console.log && console.log.apply) {
        console.log.apply(console, arguments);
    }
};

utils.bind = function(fun, that) {
    if (fun.bind) {
        return fun.bind(that);
    } else {
        return function() {
            return fun.apply(that, arguments);
        };
    }
};

utils.flatUrl = function(url) {
    return url.indexOf('?') === -1 && url.indexOf('#') === -1;
};

utils.amendUrl = function(url) {
    var dl = _document.location;
    if (!url) {
        throw new Error('Wrong url for SockJS');
    }
    if (!utils.flatUrl(url)) {
        throw new Error('Only basic urls are supported in SockJS');
    }

    //  '//abc' --> 'http://abc'
    if (url.indexOf('//') === 0) {
        url = dl.protocol + url;
    }
    // '/abc' --> 'http://localhost:80/abc'
    if (url.indexOf('/') === 0) {
        url = dl.protocol + '//' + dl.host + url;
    }
    // strip trailing slashes
    url = url.replace(/[/]+$/,'');
    return url;
};

// IE doesn't support [].indexOf.
utils.arrIndexOf = function(arr, obj){
    for(var i=0; i < arr.length; i++){
        if(arr[i] === obj){
            return i;
        }
    }
    return -1;
};

utils.arrSkip = function(arr, obj) {
    var idx = utils.arrIndexOf(arr, obj);
    if (idx === -1) {
        return arr.slice();
    } else {
        var dst = arr.slice(0, idx);
        return dst.concat(arr.slice(idx+1));
    }
};

// Via: https://gist.github.com/1133122/2121c601c5549155483f50be3da5305e83b8c5df
utils.isArray = Array.isArray || function(value) {
    return {}.toString.call(value).indexOf('Array') >= 0
};

utils.delay = function(t, fun) {
    if(typeof t === 'function') {
        fun = t;
        t = 0;
    }
    return setTimeout(fun, t);
};


// Chars worth escaping, as defined by Douglas Crockford:
//   https://github.com/douglascrockford/JSON-js/blob/47a9882cddeb1e8529e07af9736218075372b8ac/json2.js#L196
var json_escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    json_lookup = {
"\u0000":"\\u0000","\u0001":"\\u0001","\u0002":"\\u0002","\u0003":"\\u0003",
"\u0004":"\\u0004","\u0005":"\\u0005","\u0006":"\\u0006","\u0007":"\\u0007",
"\b":"\\b","\t":"\\t","\n":"\\n","\u000b":"\\u000b","\f":"\\f","\r":"\\r",
"\u000e":"\\u000e","\u000f":"\\u000f","\u0010":"\\u0010","\u0011":"\\u0011",
"\u0012":"\\u0012","\u0013":"\\u0013","\u0014":"\\u0014","\u0015":"\\u0015",
"\u0016":"\\u0016","\u0017":"\\u0017","\u0018":"\\u0018","\u0019":"\\u0019",
"\u001a":"\\u001a","\u001b":"\\u001b","\u001c":"\\u001c","\u001d":"\\u001d",
"\u001e":"\\u001e","\u001f":"\\u001f","\"":"\\\"","\\":"\\\\",
"\u007f":"\\u007f","\u0080":"\\u0080","\u0081":"\\u0081","\u0082":"\\u0082",
"\u0083":"\\u0083","\u0084":"\\u0084","\u0085":"\\u0085","\u0086":"\\u0086",
"\u0087":"\\u0087","\u0088":"\\u0088","\u0089":"\\u0089","\u008a":"\\u008a",
"\u008b":"\\u008b","\u008c":"\\u008c","\u008d":"\\u008d","\u008e":"\\u008e",
"\u008f":"\\u008f","\u0090":"\\u0090","\u0091":"\\u0091","\u0092":"\\u0092",
"\u0093":"\\u0093","\u0094":"\\u0094","\u0095":"\\u0095","\u0096":"\\u0096",
"\u0097":"\\u0097","\u0098":"\\u0098","\u0099":"\\u0099","\u009a":"\\u009a",
"\u009b":"\\u009b","\u009c":"\\u009c","\u009d":"\\u009d","\u009e":"\\u009e",
"\u009f":"\\u009f","\u00ad":"\\u00ad","\u0600":"\\u0600","\u0601":"\\u0601",
"\u0602":"\\u0602","\u0603":"\\u0603","\u0604":"\\u0604","\u070f":"\\u070f",
"\u17b4":"\\u17b4","\u17b5":"\\u17b5","\u200c":"\\u200c","\u200d":"\\u200d",
"\u200e":"\\u200e","\u200f":"\\u200f","\u2028":"\\u2028","\u2029":"\\u2029",
"\u202a":"\\u202a","\u202b":"\\u202b","\u202c":"\\u202c","\u202d":"\\u202d",
"\u202e":"\\u202e","\u202f":"\\u202f","\u2060":"\\u2060","\u2061":"\\u2061",
"\u2062":"\\u2062","\u2063":"\\u2063","\u2064":"\\u2064","\u2065":"\\u2065",
"\u2066":"\\u2066","\u2067":"\\u2067","\u2068":"\\u2068","\u2069":"\\u2069",
"\u206a":"\\u206a","\u206b":"\\u206b","\u206c":"\\u206c","\u206d":"\\u206d",
"\u206e":"\\u206e","\u206f":"\\u206f","\ufeff":"\\ufeff","\ufff0":"\\ufff0",
"\ufff1":"\\ufff1","\ufff2":"\\ufff2","\ufff3":"\\ufff3","\ufff4":"\\ufff4",
"\ufff5":"\\ufff5","\ufff6":"\\ufff6","\ufff7":"\\ufff7","\ufff8":"\\ufff8",
"\ufff9":"\\ufff9","\ufffa":"\\ufffa","\ufffb":"\\ufffb","\ufffc":"\\ufffc",
"\ufffd":"\\ufffd","\ufffe":"\\ufffe","\uffff":"\\uffff"};

// Some extra characters that Chrome gets wrong, and substitutes with
// something else on the wire.
var extra_escapable = /[\x00-\x1f\ud800-\udfff\ufffe\uffff\u0300-\u0333\u033d-\u0346\u034a-\u034c\u0350-\u0352\u0357-\u0358\u035c-\u0362\u0374\u037e\u0387\u0591-\u05af\u05c4\u0610-\u0617\u0653-\u0654\u0657-\u065b\u065d-\u065e\u06df-\u06e2\u06eb-\u06ec\u0730\u0732-\u0733\u0735-\u0736\u073a\u073d\u073f-\u0741\u0743\u0745\u0747\u07eb-\u07f1\u0951\u0958-\u095f\u09dc-\u09dd\u09df\u0a33\u0a36\u0a59-\u0a5b\u0a5e\u0b5c-\u0b5d\u0e38-\u0e39\u0f43\u0f4d\u0f52\u0f57\u0f5c\u0f69\u0f72-\u0f76\u0f78\u0f80-\u0f83\u0f93\u0f9d\u0fa2\u0fa7\u0fac\u0fb9\u1939-\u193a\u1a17\u1b6b\u1cda-\u1cdb\u1dc0-\u1dcf\u1dfc\u1dfe\u1f71\u1f73\u1f75\u1f77\u1f79\u1f7b\u1f7d\u1fbb\u1fbe\u1fc9\u1fcb\u1fd3\u1fdb\u1fe3\u1feb\u1fee-\u1fef\u1ff9\u1ffb\u1ffd\u2000-\u2001\u20d0-\u20d1\u20d4-\u20d7\u20e7-\u20e9\u2126\u212a-\u212b\u2329-\u232a\u2adc\u302b-\u302c\uaab2-\uaab3\uf900-\ufa0d\ufa10\ufa12\ufa15-\ufa1e\ufa20\ufa22\ufa25-\ufa26\ufa2a-\ufa2d\ufa30-\ufa6d\ufa70-\ufad9\ufb1d\ufb1f\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufb4e\ufff0-\uffff]/g,
    extra_lookup;

// JSON Quote string. Use native implementation when possible.
var JSONQuote = (JSON && JSON.stringify) || function(string) {
    json_escapable.lastIndex = 0;
    if (json_escapable.test(string)) {
        string = string.replace(json_escapable, function(a) {
            return json_lookup[a];
        });
    }
    return '"' + string + '"';
};

// This may be quite slow, so let's delay until user actually uses bad
// characters.
var unroll_lookup = function(escapable) {
    var i;
    var unrolled = {}
    var c = []
    for(i=0; i<65536; i++) {
        c.push( String.fromCharCode(i) );
    }
    escapable.lastIndex = 0;
    c.join('').replace(escapable, function (a) {
        unrolled[ a ] = '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        return '';
    });
    escapable.lastIndex = 0;
    return unrolled;
};

// Quote string, also taking care of unicode characters that browsers
// often break. Especially, take care of unicode surrogates:
//    http://en.wikipedia.org/wiki/Mapping_of_Unicode_characters#Surrogates
utils.quote = function(string) {
    var quoted = JSONQuote(string);

    // In most cases this should be very fast and good enough.
    extra_escapable.lastIndex = 0;
    if(!extra_escapable.test(quoted)) {
        return quoted;
    }

    if(!extra_lookup) extra_lookup = unroll_lookup(extra_escapable);

    return quoted.replace(extra_escapable, function(a) {
        return extra_lookup[a];
    });
}

var _all_protocols = ['websocket',
                      'xdr-streaming',
                      'xhr-streaming',
                      'iframe-eventsource',
                      'iframe-htmlfile',
                      'xdr-polling',
                      'xhr-polling',
                      'iframe-xhr-polling',
                      'jsonp-polling'];

utils.probeProtocols = function() {
    var probed = {};
    for(var i=0; i<_all_protocols.length; i++) {
        var protocol = _all_protocols[i];
        // User can have a typo in protocol name.
        probed[protocol] = SockJS[protocol] &&
                           SockJS[protocol].enabled();
    }
    return probed;
};

utils.detectProtocols = function(probed, protocols_whitelist, info) {
    var pe = {},
        protocols = [];
    if (!protocols_whitelist) protocols_whitelist = _all_protocols;
    for(var i=0; i<protocols_whitelist.length; i++) {
        var protocol = protocols_whitelist[i];
        pe[protocol] = probed[protocol];
    }
    var maybe_push = function(protos) {
        var proto = protos.shift();
        if (pe[proto]) {
            protocols.push(proto);
        } else {
            if (protos.length > 0) {
                maybe_push(protos);
            }
        }
    }

    // 1. Websocket
    if (info.websocket !== false) {
        maybe_push(['websocket']);
    }

    // 2. Streaming
    if (pe['xhr-streaming'] && !info.null_origin) {
        protocols.push('xhr-streaming');
    } else {
        if (pe['xdr-streaming'] && !info.cookie_needed && !info.null_origin) {
            protocols.push('xdr-streaming');
        } else {
            maybe_push(['iframe-eventsource',
                        'iframe-htmlfile']);
        }
    }

    // 3. Polling
    if (pe['xhr-polling'] && !info.null_origin) {
        protocols.push('xhr-polling');
    } else {
        if (pe['xdr-polling'] && !info.cookie_needed && !info.null_origin) {
            protocols.push('xdr-polling');
        } else {
            maybe_push(['iframe-xhr-polling',
                        'jsonp-polling']);
        }
    }
    return protocols;
}
//         [*] End of lib/utils.js


//         [*] Including lib/dom.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// May be used by htmlfile jsonp and transports.
var MPrefix = '_sockjs_global';
utils.createHook = function() {
    var window_id = 'a' + utils.random_string(8);
    if (!(MPrefix in _window)) {
        var map = {};
        _window[MPrefix] = function(window_id) {
            if (!(window_id in map)) {
                map[window_id] = {
                    id: window_id,
                    del: function() {delete map[window_id];}
                };
            }
            return map[window_id];
        }
    }
    return _window[MPrefix](window_id);
};



utils.attachMessage = function(listener) {
    utils.attachEvent('message', listener);
};
utils.attachEvent = function(event, listener) {
    if (typeof _window.addEventListener !== 'undefined') {
        _window.addEventListener(event, listener, false);
    } else {
        // IE quirks.
        // According to: http://stevesouders.com/misc/test-postmessage.php
        // the message gets delivered only to 'document', not 'window'.
        _document.attachEvent("on" + event, listener);
        // I get 'window' for ie8.
        _window.attachEvent("on" + event, listener);
    }
};

utils.detachMessage = function(listener) {
    utils.detachEvent('message', listener);
};
utils.detachEvent = function(event, listener) {
    if (typeof _window.addEventListener !== 'undefined') {
        _window.removeEventListener(event, listener, false);
    } else {
        _document.detachEvent("on" + event, listener);
        _window.detachEvent("on" + event, listener);
    }
};


var on_unload = {};
// Things registered after beforeunload are to be called immediately.
var after_unload = false;

var trigger_unload_callbacks = function() {
    for(var ref in on_unload) {
        on_unload[ref]();
        delete on_unload[ref];
    };
};

var unload_triggered = function() {
    if(after_unload) return;
    after_unload = true;
    trigger_unload_callbacks();
};

// Onbeforeunload alone is not reliable. We could use only 'unload'
// but it's not working in opera within an iframe. Let's use both.
utils.attachEvent('beforeunload', unload_triggered);
utils.attachEvent('unload', unload_triggered);

utils.unload_add = function(listener) {
    var ref = utils.random_string(8);
    on_unload[ref] = listener;
    if (after_unload) {
        utils.delay(trigger_unload_callbacks);
    }
    return ref;
};
utils.unload_del = function(ref) {
    if (ref in on_unload)
        delete on_unload[ref];
};


utils.createIframe = function (iframe_url, error_callback) {
    var iframe = _document.createElement('iframe');
    var tref, unload_ref;
    var unattach = function() {
        clearTimeout(tref);
        // Explorer had problems with that.
        try {iframe.onload = null;} catch (x) {}
        iframe.onerror = null;
    };
    var cleanup = function() {
        if (iframe) {
            unattach();
            // This timeout makes chrome fire onbeforeunload event
            // within iframe. Without the timeout it goes straight to
            // onunload.
            setTimeout(function() {
                if(iframe) {
                    iframe.parentNode.removeChild(iframe);
                }
                iframe = null;
            }, 0);
            utils.unload_del(unload_ref);
        }
    };
    var onerror = function(r) {
        if (iframe) {
            cleanup();
            error_callback(r);
        }
    };
    var post = function(msg, origin) {
        try {
            // When the iframe is not loaded, IE raises an exception
            // on 'contentWindow'.
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(msg, origin);
            }
        } catch (x) {};
    };

    iframe.src = iframe_url;
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.onerror = function(){onerror('onerror');};
    iframe.onload = function() {
        // `onload` is triggered before scripts on the iframe are
        // executed. Give it few seconds to actually load stuff.
        clearTimeout(tref);
        tref = setTimeout(function(){onerror('onload timeout');}, 2000);
    };
    _document.body.appendChild(iframe);
    tref = setTimeout(function(){onerror('timeout');}, 15000);
    unload_ref = utils.unload_add(cleanup);
    return {
        post: post,
        cleanup: cleanup,
        loaded: unattach
    };
};

utils.createHtmlfile = function (iframe_url, error_callback) {
    var doc = new ActiveXObject('htmlfile');
    var tref, unload_ref;
    var iframe;
    var unattach = function() {
        clearTimeout(tref);
    };
    var cleanup = function() {
        if (doc) {
            unattach();
            utils.unload_del(unload_ref);
            iframe.parentNode.removeChild(iframe);
            iframe = doc = null;
            CollectGarbage();
        }
    };
    var onerror = function(r)  {
        if (doc) {
            cleanup();
            error_callback(r);
        }
    };
    var post = function(msg, origin) {
        try {
            // When the iframe is not loaded, IE raises an exception
            // on 'contentWindow'.
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(msg, origin);
            }
        } catch (x) {};
    };

    doc.open();
    doc.write('<html><s' + 'cript>' +
              'document.domain="' + document.domain + '";' +
              '</s' + 'cript></html>');
    doc.close();
    doc.parentWindow[WPrefix] = _window[WPrefix];
    var c = doc.createElement('div');
    doc.body.appendChild(c);
    iframe = doc.createElement('iframe');
    c.appendChild(iframe);
    iframe.src = iframe_url;
    tref = setTimeout(function(){onerror('timeout');}, 15000);
    unload_ref = utils.unload_add(cleanup);
    return {
        post: post,
        cleanup: cleanup,
        loaded: unattach
    };
};
//         [*] End of lib/dom.js


//         [*] Including lib/dom2.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var AbstractXHRObject = function(){};
AbstractXHRObject.prototype = new EventEmitter(['chunk', 'finish']);

AbstractXHRObject.prototype._start = function(method, url, payload, opts) {
    var that = this;

    try {
        that.xhr = new XMLHttpRequest();
    } catch(x) {};

    if (!that.xhr) {
        try {
            that.xhr = new _window.ActiveXObject('Microsoft.XMLHTTP');
        } catch(x) {};
    }
    if (_window.ActiveXObject || _window.XDomainRequest) {
        // IE8 caches even POSTs
        url += ((url.indexOf('?') === -1) ? '?' : '&') + 't='+(+new Date);
    }

    // Explorer tends to keep connection open, even after the
    // tab gets closed: http://bugs.jquery.com/ticket/5280
    that.unload_ref = utils.unload_add(function(){that._cleanup(true);});
    try {
        that.xhr.open(method, url, true);
    } catch(e) {
        // IE raises an exception on wrong port.
        that.emit('finish', 0, '');
        that._cleanup();
        return;
    };

    if (!opts || !opts.no_credentials) {
        // Mozilla docs says https://developer.mozilla.org/en/XMLHttpRequest :
        // "This never affects same-site requests."
        that.xhr.withCredentials = 'true';
    }
    if (opts && opts.headers) {
        for(var key in opts.headers) {
            that.xhr.setRequestHeader(key, opts.headers[key]);
        }
    }

    that.xhr.onreadystatechange = function() {
        if (that.xhr) {
            var x = that.xhr;
            switch (x.readyState) {
            case 3:
                // IE doesn't like peeking into responseText or status
                // on Microsoft.XMLHTTP and readystate=3
                try {
                    var status = x.status;
                    var text = x.responseText;
                } catch (x) {};
                // IE does return readystate == 3 for 404 answers.
                if (text && text.length > 0) {
                    that.emit('chunk', status, text);
                }
                break;
            case 4:
                that.emit('finish', x.status, x.responseText);
                that._cleanup(false);
                break;
            }
        }
    };
    that.xhr.send(payload);
};

AbstractXHRObject.prototype._cleanup = function(abort) {
    var that = this;
    if (!that.xhr) return;
    utils.unload_del(that.unload_ref);

    // IE needs this field to be a function
    that.xhr.onreadystatechange = function(){};

    if (abort) {
        try {
            that.xhr.abort();
        } catch(x) {};
    }
    that.unload_ref = that.xhr = null;
};

AbstractXHRObject.prototype.close = function() {
    var that = this;
    that.nuke();
    that._cleanup(true);
};

var XHRCorsObject = utils.XHRCorsObject = function() {
    var that = this, args = arguments;
    utils.delay(function(){that._start.apply(that, args);});
};
XHRCorsObject.prototype = new AbstractXHRObject();

var XHRLocalObject = utils.XHRLocalObject = function(method, url, payload) {
    var that = this;
    utils.delay(function(){
        that._start(method, url, payload, {
            no_credentials: true
        });
    });
};
XHRLocalObject.prototype = new AbstractXHRObject();



// References:
//   http://ajaxian.com/archives/100-line-ajax-wrapper
//   http://msdn.microsoft.com/en-us/library/cc288060(v=VS.85).aspx
var XDRObject = utils.XDRObject = function(method, url, payload) {
    var that = this;
    utils.delay(function(){that._start(method, url, payload);});
};
XDRObject.prototype = new EventEmitter(['chunk', 'finish']);
XDRObject.prototype._start = function(method, url, payload) {
    var that = this;
    var xdr = new XDomainRequest();
    // IE caches even POSTs
    url += ((url.indexOf('?') === -1) ? '?' : '&') + 't='+(+new Date);

    var onerror = xdr.ontimeout = xdr.onerror = function() {
        that.emit('finish', 0, '');
        that._cleanup(false);
    };
    xdr.onprogress = function() {
        that.emit('chunk', 200, xdr.responseText);
    };
    xdr.onload = function() {
        that.emit('finish', 200, xdr.responseText);
        that._cleanup(false);
    };
    that.xdr = xdr;
    that.unload_ref = utils.unload_add(function(){that._cleanup(true);});
    try {
        // Fails with AccessDenied if port number is bogus
        that.xdr.open(method, url);
        that.xdr.send(payload);
    } catch(x) {
        onerror();
    }
};

XDRObject.prototype._cleanup = function(abort) {
    var that = this;
    if (!that.xdr) return;
    utils.unload_del(that.unload_ref);

    that.xdr.ontimeout = that.xdr.onerror = that.xdr.onprogress =
        that.xdr.onload = null;
    if (abort) {
        try {
            that.xdr.abort();
        } catch(x) {};
    }
    that.unload_ref = that.xdr = null;
};

XDRObject.prototype.close = function() {
    var that = this;
    that.nuke();
    that._cleanup(true);
};

// 1. Is natively via XHR
// 2. Is natively via XDR
// 3. Nope, but postMessage is there so it should work via the Iframe.
// 4. Nope, sorry.
utils.isXHRCorsCapable = function() {
    if (_window.XMLHttpRequest && 'withCredentials' in new XMLHttpRequest()) {
        return 1;
    }
    // XDomainRequest doesn't work if page is served from file://
    if (_window.XDomainRequest && _document.domain) {
        return 2;
    }
    if (IframeTransport.enabled()) {
        return 3;
    }
    return 4;
};
//         [*] End of lib/dom2.js


//         [*] Including lib/sockjs.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var SockJS = function(url, dep_protocols_whitelist, options) {
    if (this === window) {
        // makes `new` optional
        return new SockJS(url, dep_protocols_whitelist, options);
    }
    
    var that = this, protocols_whitelist;
    that._options = {devel: false, debug: false, protocols_whitelist: [],
                     info: undefined, rtt: undefined};
    if (options) {
        utils.objectExtend(that._options, options);
    }
    that._base_url = utils.amendUrl(url);
    that._server = that._options.server || utils.random_number_string(1000);
    if (that._options.protocols_whitelist &&
        that._options.protocols_whitelist.length) {
        protocols_whitelist = that._options.protocols_whitelist;
    } else {
        // Deprecated API
        if (typeof dep_protocols_whitelist === 'string' &&
            dep_protocols_whitelist.length > 0) {
            protocols_whitelist = [dep_protocols_whitelist];
        } else if (utils.isArray(dep_protocols_whitelist)) {
            protocols_whitelist = dep_protocols_whitelist
        } else {
            protocols_whitelist = null;
        }
        if (protocols_whitelist) {
            that._debug('Deprecated API: Use "protocols_whitelist" option ' +
                        'instead of supplying protocol list as a second ' +
                        'parameter to SockJS constructor.');
        }
    }
    that._protocols = [];
    that.protocol = null;
    that.readyState = SockJS.CONNECTING;
    that._ir = createInfoReceiver(that._base_url);
    that._ir.onfinish = function(info, rtt) {
        that._ir = null;
        if (info) {
            if (that._options.info) {
                // Override if user supplies the option
                info = utils.objectExtend(info, that._options.info);
            }
            if (that._options.rtt) {
                rtt = that._options.rtt;
            }
            that._applyInfo(info, rtt, protocols_whitelist);
            that._didClose();
        } else {
            that._didClose(1002, 'Can\'t connect to server', true);
        }
    };
};
// Inheritance
SockJS.prototype = new REventTarget();

SockJS.version = "0.3.1.7.ga67f.dirty";

SockJS.CONNECTING = 0;
SockJS.OPEN = 1;
SockJS.CLOSING = 2;
SockJS.CLOSED = 3;

SockJS.prototype._debug = function() {
    if (this._options.debug)
        utils.log.apply(utils, arguments);
};

SockJS.prototype._dispatchOpen = function() {
    var that = this;
    if (that.readyState === SockJS.CONNECTING) {
        if (that._transport_tref) {
            clearTimeout(that._transport_tref);
            that._transport_tref = null;
        }
        that.readyState = SockJS.OPEN;
        that.dispatchEvent(new SimpleEvent("open"));
    } else {
        // The server might have been restarted, and lost track of our
        // connection.
        that._didClose(1006, "Server lost session");
    }
};

SockJS.prototype._dispatchMessage = function(data) {
    var that = this;
    if (that.readyState !== SockJS.OPEN)
            return;
    that.dispatchEvent(new SimpleEvent("message", {data: data}));
};

SockJS.prototype._dispatchHeartbeat = function(data) {
    var that = this;
    if (that.readyState !== SockJS.OPEN)
        return;
    that.dispatchEvent(new SimpleEvent('heartbeat', {}));
};

SockJS.prototype._didClose = function(code, reason, force) {
    var that = this;
    if (that.readyState !== SockJS.CONNECTING &&
        that.readyState !== SockJS.OPEN &&
        that.readyState !== SockJS.CLOSING)
            throw new Error('INVALID_STATE_ERR');
    if (that._ir) {
        that._ir.nuke();
        that._ir = null;
    }

    if (that._transport) {
        that._transport.doCleanup();
        that._transport = null;
    }

    var close_event = new SimpleEvent("close", {
        code: code,
        reason: reason,
        wasClean: utils.userSetCode(code)});

    if (!utils.userSetCode(code) &&
        that.readyState === SockJS.CONNECTING && !force) {
        if (that._try_next_protocol(close_event)) {
            return;
        }
        close_event = new SimpleEvent("close", {code: 2000,
                                                reason: "All transports failed",
                                                wasClean: false,
                                                last_event: close_event});
    }
    that.readyState = SockJS.CLOSED;

    utils.delay(function() {
                   that.dispatchEvent(close_event);
                });
};

SockJS.prototype._didMessage = function(data) {
    var that = this;
    var type = data.slice(0, 1);
    switch(type) {
    case 'o':
        that._dispatchOpen();
        break;
    case 'a':
        var payload = JSON.parse(data.slice(1) || '[]');
        for(var i=0; i < payload.length; i++){
            that._dispatchMessage(payload[i]);
        }
        break;
    case 'm':
        var payload = JSON.parse(data.slice(1) || 'null');
        that._dispatchMessage(payload);
        break;
    case 'c':
        var payload = JSON.parse(data.slice(1) || '[]');
        that._didClose(payload[0], payload[1]);
        break;
    case 'h':
        that._dispatchHeartbeat();
        break;
    }
};

SockJS.prototype._try_next_protocol = function(close_event) {
    var that = this;
    if (that.protocol) {
        that._debug('Closed transport:', that.protocol, ''+close_event);
        that.protocol = null;
    }
    if (that._transport_tref) {
        clearTimeout(that._transport_tref);
        that._transport_tref = null;
    }

    while(1) {
        var protocol = that.protocol = that._protocols.shift();
        if (!protocol) {
            return false;
        }
        // Some protocols require access to `body`, what if were in
        // the `head`?
        if (SockJS[protocol] &&
            SockJS[protocol].need_body === true &&
            (!_document.body ||
             (typeof _document.readyState !== 'undefined'
              && _document.readyState !== 'complete'))) {
            that._protocols.unshift(protocol);
            that.protocol = 'waiting-for-load';
            utils.attachEvent('load', function(){
                that._try_next_protocol();
            });
            return true;
        }

        if (!SockJS[protocol] ||
              !SockJS[protocol].enabled(that._options)) {
            that._debug('Skipping transport:', protocol);
        } else {
            var roundTrips = SockJS[protocol].roundTrips || 1;
            var to = ((that._options.rto || 0) * roundTrips) || 5000;
            that._transport_tref = utils.delay(to, function() {
                if (that.readyState === SockJS.CONNECTING) {
                    // I can't understand how it is possible to run
                    // this timer, when the state is CLOSED, but
                    // apparently in IE everythin is possible.
                    that._didClose(2007, "Transport timeouted");
                }
            });

            var connid = utils.random_string(8);
            var trans_url = that._base_url + '/' + that._server + '/' + connid;
            that._debug('Opening transport:', protocol, ' url:'+trans_url,
                        ' RTO:'+that._options.rto);
            that._transport = new SockJS[protocol](that, trans_url,
                                                   that._base_url);
            return true;
        }
    }
};

SockJS.prototype.close = function(code, reason) {
    var that = this;
    if (code && !utils.userSetCode(code))
        throw new Error("INVALID_ACCESS_ERR");
    if(that.readyState !== SockJS.CONNECTING &&
       that.readyState !== SockJS.OPEN) {
        return false;
    }
    that.readyState = SockJS.CLOSING;
    that._didClose(code || 1000, reason || "Normal closure");
    return true;
};

SockJS.prototype.send = function(data) {
    var that = this;
    if (that.readyState === SockJS.CONNECTING)
        throw new Error('INVALID_STATE_ERR');
    if (that.readyState === SockJS.OPEN) {
        that._transport.doSend(utils.quote('' + data));
    }
    return true;
};

SockJS.prototype._applyInfo = function(info, rtt, protocols_whitelist) {
    var that = this;
    that._options.info = info;
    that._options.rtt = rtt;
    that._options.rto = utils.countRTO(rtt);
    that._options.info.null_origin = !_document.domain;
    var probed = utils.probeProtocols();
    that._protocols = utils.detectProtocols(probed, protocols_whitelist, info);
};
//         [*] End of lib/sockjs.js


//         [*] Including lib/trans-websocket.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var WebSocketTransport = SockJS.websocket = function(ri, trans_url) {
    var that = this;
    var url = trans_url + '/websocket';
    if (url.slice(0, 5) === 'https') {
        url = 'wss' + url.slice(5);
    } else {
        url = 'ws' + url.slice(4);
    }
    that.ri = ri;
    that.url = url;
    var Constructor = _window.WebSocket || _window.MozWebSocket;

    that.ws = new Constructor(that.url);
    that.ws.onmessage = function(e) {
        that.ri._didMessage(e.data);
    };
    // Firefox has an interesting bug. If a websocket connection is
    // created after onbeforeunload, it stays alive even when user
    // navigates away from the page. In such situation let's lie -
    // let's not open the ws connection at all. See:
    // https://github.com/sockjs/sockjs-client/issues/28
    // https://bugzilla.mozilla.org/show_bug.cgi?id=696085
    that.unload_ref = utils.unload_add(function(){that.ws.close()});
    that.ws.onclose = function() {
        that.ri._didMessage(utils.closeFrame(1006, "WebSocket connection broken"));
    };
};

WebSocketTransport.prototype.doSend = function(data) {
    this.ws.send('[' + data + ']');
};

WebSocketTransport.prototype.doCleanup = function() {
    var that = this;
    var ws = that.ws;
    if (ws) {
        ws.onmessage = ws.onclose = null;
        ws.close();
        utils.unload_del(that.unload_ref);
        that.unload_ref = that.ri = that.ws = null;
    }
};

WebSocketTransport.enabled = function() {
    return !!(_window.WebSocket || _window.MozWebSocket);
};

// In theory, ws should require 1 round trip. But in chrome, this is
// not very stable over SSL. Most likely a ws connection requires a
// separate SSL connection, in which case 2 round trips are an
// absolute minumum.
WebSocketTransport.roundTrips = 2;
//         [*] End of lib/trans-websocket.js


//         [*] Including lib/trans-sender.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var BufferedSender = function() {};
BufferedSender.prototype.send_constructor = function(sender) {
    var that = this;
    that.send_buffer = [];
    that.sender = sender;
};
BufferedSender.prototype.doSend = function(message) {
    var that = this;
    that.send_buffer.push(message);
    if (!that.send_stop) {
        that.send_schedule();
    }
};

// For polling transports in a situation when in the message callback,
// new message is being send. If the sending connection was started
// before receiving one, it is possible to saturate the network and
// timeout due to the lack of receiving socket. To avoid that we delay
// sending messages by some small time, in order to let receiving
// connection be started beforehand. This is only a halfmeasure and
// does not fix the big problem, but it does make the tests go more
// stable on slow networks.
BufferedSender.prototype.send_schedule_wait = function() {
    var that = this;
    var tref;
    that.send_stop = function() {
        that.send_stop = null;
        clearTimeout(tref);
    };
    tref = utils.delay(25, function() {
        that.send_stop = null;
        that.send_schedule();
    });
};

BufferedSender.prototype.send_schedule = function() {
    var that = this;
    if (that.send_buffer.length > 0) {
        var payload = '[' + that.send_buffer.join(',') + ']';
        that.send_stop = that.sender(that.trans_url,
                                     payload,
                                     function() {
                                         that.send_stop = null;
                                         that.send_schedule_wait();
                                     });
        that.send_buffer = [];
    }
};

BufferedSender.prototype.send_destructor = function() {
    var that = this;
    if (that._send_stop) {
        that._send_stop();
    }
    that._send_stop = null;
};

var jsonPGenericSender = function(url, payload, callback) {
    var that = this;

    if (!('_send_form' in that)) {
        var form = that._send_form = _document.createElement('form');
        var area = that._send_area = _document.createElement('textarea');
        area.name = 'd';
        form.style.display = 'none';
        form.style.position = 'absolute';
        form.method = 'POST';
        form.enctype = 'application/x-www-form-urlencoded';
        form.acceptCharset = "UTF-8";
        form.appendChild(area);
        _document.body.appendChild(form);
    }
    var form = that._send_form;
    var area = that._send_area;
    var id = 'a' + utils.random_string(8);
    form.target = id;
    form.action = url + '/jsonp_send?i=' + id;

    var iframe;
    try {
        // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
        iframe = _document.createElement('<iframe name="'+ id +'">');
    } catch(x) {
        iframe = _document.createElement('iframe');
        iframe.name = id;
    }
    iframe.id = id;
    form.appendChild(iframe);
    iframe.style.display = 'none';

    try {
        area.value = payload;
    } catch(e) {
        utils.log('Your browser is seriously broken. Go home! ' + e.message);
    }
    form.submit();

    var completed = function(e) {
        if (!iframe.onerror) return;
        iframe.onreadystatechange = iframe.onerror = iframe.onload = null;
        // Opera mini doesn't like if we GC iframe
        // immediately, thus this timeout.
        utils.delay(500, function() {
                       iframe.parentNode.removeChild(iframe);
                       iframe = null;
                   });
        area.value = '';
        callback();
    };
    iframe.onerror = iframe.onload = completed;
    iframe.onreadystatechange = function(e) {
        if (iframe.readyState == 'complete') completed();
    };
    return completed;
};

var createAjaxSender = function(AjaxObject) {
    return function(url, payload, callback) {
        var xo = new AjaxObject('POST', url + '/xhr_send', payload);
        xo.onfinish = function(status, text) {
            callback(status);
        };
        return function(abort_reason) {
            callback(0, abort_reason);
        };
    };
};
//         [*] End of lib/trans-sender.js


//         [*] Including lib/trans-jsonp-receiver.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// Parts derived from Socket.io:
//    https://github.com/LearnBoost/socket.io/blob/0.6.17/lib/socket.io/transports/jsonp-polling.js
// and jQuery-JSONP:
//    https://code.google.com/p/jquery-jsonp/source/browse/trunk/core/jquery.jsonp.js
var jsonPGenericReceiver = function(url, callback) {
    var tref;
    var script = _document.createElement('script');
    var script2;  // Opera synchronous load trick.
    var close_script = function(frame) {
        if (script2) {
            script2.parentNode.removeChild(script2);
            script2 = null;
        }
        if (script) {
            clearTimeout(tref);
            script.parentNode.removeChild(script);
            script.onreadystatechange = script.onerror =
                script.onload = script.onclick = null;
            script = null;
            callback(frame);
            callback = null;
        }
    };

    // IE9 fires 'error' event after orsc or before, in random order.
    var loaded_okay = false;
    var error_timer = null;

    script.id = 'a' + utils.random_string(8);
    script.src = url;
    script.type = 'text/javascript';
    script.charset = 'UTF-8';
    script.onerror = function(e) {
        if (!error_timer) {
            // Delay firing close_script.
            error_timer = setTimeout(function() {
                if (!loaded_okay) {
                    close_script(utils.closeFrame(
                        1006,
                        "JSONP script loaded abnormally (onerror)"));
                }
            }, 1000);
        }
    };
    script.onload = function(e) {
        close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (onload)"));
    };

    script.onreadystatechange = function(e) {
        if (/loaded|closed/.test(script.readyState)) {
            if (script && script.htmlFor && script.onclick) {
                loaded_okay = true;
                try {
                    // In IE, actually execute the script.
                    script.onclick();
                } catch (x) {}
            }
            if (script) {
                close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (onreadystatechange)"));
            }
        }
    };
    // IE: event/htmlFor/onclick trick.
    // One can't rely on proper order for onreadystatechange. In order to
    // make sure, set a 'htmlFor' and 'event' properties, so that
    // script code will be installed as 'onclick' handler for the
    // script object. Later, onreadystatechange, manually execute this
    // code. FF and Chrome doesn't work with 'event' and 'htmlFor'
    // set. For reference see:
    //   http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
    // Also, read on that about script ordering:
    //   http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
    if (typeof script.async === 'undefined' && _document.attachEvent) {
        // According to mozilla docs, in recent browsers script.async defaults
        // to 'true', so we may use it to detect a good browser:
        // https://developer.mozilla.org/en/HTML/Element/script
        if (!/opera/i.test(navigator.userAgent)) {
            // Naively assume we're in IE
            try {
                script.htmlFor = script.id;
                script.event = "onclick";
            } catch (x) {}
            script.async = true;
        } else {
            // Opera, second sync script hack
            script2 = _document.createElement('script');
            script2.text = "try{var a = document.getElementById('"+script.id+"'); if(a)a.onerror();}catch(x){};";
            script.async = script2.async = false;
        }
    }
    if (typeof script.async !== 'undefined') {
        script.async = true;
    }

    // Fallback mostly for Konqueror - stupid timer, 35 seconds shall be plenty.
    tref = setTimeout(function() {
                          close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (timeout)"));
                      }, 35000);

    var head = _document.getElementsByTagName('head')[0];
    head.insertBefore(script, head.firstChild);
    if (script2) {
        head.insertBefore(script2, head.firstChild);
    }
    return close_script;
};
//         [*] End of lib/trans-jsonp-receiver.js


//         [*] Including lib/trans-jsonp-polling.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// The simplest and most robust transport, using the well-know cross
// domain hack - JSONP. This transport is quite inefficient - one
// mssage could use up to one http request. But at least it works almost
// everywhere.
// Known limitations:
//   o you will get a spinning cursor
//   o for Konqueror a dumb timer is needed to detect errors


var JsonPTransport = SockJS['jsonp-polling'] = function(ri, trans_url) {
    utils.polluteGlobalNamespace();
    var that = this;
    that.ri = ri;
    that.trans_url = trans_url;
    that.send_constructor(jsonPGenericSender);
    that._schedule_recv();
};

// Inheritnace
JsonPTransport.prototype = new BufferedSender();

JsonPTransport.prototype._schedule_recv = function() {
    var that = this;
    var callback = function(data) {
        that._recv_stop = null;
        if (data) {
            // no data - heartbeat;
            if (!that._is_closing) {
                that.ri._didMessage(data);
            }
        }
        // The message can be a close message, and change is_closing state.
        if (!that._is_closing) {
            that._schedule_recv();
        }
    };
    that._recv_stop = jsonPReceiverWrapper(that.trans_url + '/jsonp',
                                           jsonPGenericReceiver, callback);
};

JsonPTransport.enabled = function() {
    return true;
};

JsonPTransport.need_body = true;


JsonPTransport.prototype.doCleanup = function() {
    var that = this;
    that._is_closing = true;
    if (that._recv_stop) {
        that._recv_stop();
    }
    that.ri = that._recv_stop = null;
    that.send_destructor();
};


// Abstract away code that handles global namespace pollution.
var jsonPReceiverWrapper = function(url, constructReceiver, user_callback) {
    var id = 'a' + utils.random_string(6);
    var url_id = url + '?c=' + escape(WPrefix + '.' + id);
    // Callback will be called exactly once.
    var callback = function(frame) {
        delete _window[WPrefix][id];
        user_callback(frame);
    };

    var close_script = constructReceiver(url_id, callback);
    _window[WPrefix][id] = close_script;
    var stop = function() {
        if (_window[WPrefix][id]) {
            _window[WPrefix][id](utils.closeFrame(1000, "JSONP user aborted read"));
        }
    };
    return stop;
};
//         [*] End of lib/trans-jsonp-polling.js


//         [*] Including lib/trans-xhr.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var AjaxBasedTransport = function() {};
AjaxBasedTransport.prototype = new BufferedSender();

AjaxBasedTransport.prototype.run = function(ri, trans_url,
                                            url_suffix, Receiver, AjaxObject) {
    var that = this;
    that.ri = ri;
    that.trans_url = trans_url;
    that.send_constructor(createAjaxSender(AjaxObject));
    that.poll = new Polling(ri, Receiver,
                            trans_url + url_suffix, AjaxObject);
};

AjaxBasedTransport.prototype.doCleanup = function() {
    var that = this;
    if (that.poll) {
        that.poll.abort();
        that.poll = null;
    }
};

// xhr-streaming
var XhrStreamingTransport = SockJS['xhr-streaming'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr_streaming', XhrReceiver, utils.XHRCorsObject);
};

XhrStreamingTransport.prototype = new AjaxBasedTransport();

XhrStreamingTransport.enabled = function() {
    // Support for CORS Ajax aka Ajax2? Opera 12 claims CORS but
    // doesn't do streaming.
    return (_window.XMLHttpRequest &&
            'withCredentials' in new XMLHttpRequest() &&
            (!/opera/i.test(navigator.userAgent)));
};
XhrStreamingTransport.roundTrips = 2; // preflight, ajax

// Safari gets confused when a streaming ajax request is started
// before onload. This causes the load indicator to spin indefinetely.
XhrStreamingTransport.need_body = true;


// According to:
//   http://stackoverflow.com/questions/1641507/detect-browser-support-for-cross-domain-xmlhttprequests
//   http://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/


// xdr-streaming
var XdrStreamingTransport = SockJS['xdr-streaming'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr_streaming', XhrReceiver, utils.XDRObject);
};

XdrStreamingTransport.prototype = new AjaxBasedTransport();

XdrStreamingTransport.enabled = function() {
    return !!_window.XDomainRequest;
};
XdrStreamingTransport.roundTrips = 2; // preflight, ajax



// xhr-polling
var XhrPollingTransport = SockJS['xhr-polling'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr', XhrReceiver, utils.XHRCorsObject);
};

XhrPollingTransport.prototype = new AjaxBasedTransport();

XhrPollingTransport.enabled = XhrStreamingTransport.enabled;
XhrPollingTransport.roundTrips = 2; // preflight, ajax


// xdr-polling
var XdrPollingTransport = SockJS['xdr-polling'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr', XhrReceiver, utils.XDRObject);
};

XdrPollingTransport.prototype = new AjaxBasedTransport();

XdrPollingTransport.enabled = XdrStreamingTransport.enabled;
XdrPollingTransport.roundTrips = 2; // preflight, ajax
//         [*] End of lib/trans-xhr.js


//         [*] Including lib/trans-iframe.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// Few cool transports do work only for same-origin. In order to make
// them working cross-domain we shall use iframe, served form the
// remote domain. New browsers, have capabilities to communicate with
// cross domain iframe, using postMessage(). In IE it was implemented
// from IE 8+, but of course, IE got some details wrong:
//    http://msdn.microsoft.com/en-us/library/cc197015(v=VS.85).aspx
//    http://stevesouders.com/misc/test-postmessage.php

var IframeTransport = function() {};

IframeTransport.prototype.i_constructor = function(ri, trans_url, base_url) {
    var that = this;
    that.ri = ri;
    that.origin = utils.getOrigin(base_url);
    that.base_url = base_url;
    that.trans_url = trans_url;

    var iframe_url = base_url + '/iframe.html';
    if (that.ri._options.devel) {
        iframe_url += '?t=' + (+new Date);
    }
    that.window_id = utils.random_string(8);
    iframe_url += '#' + that.window_id;

    that.iframeObj = utils.createIframe(iframe_url, function(r) {
                                            that.ri._didClose(1006, "Unable to load an iframe (" + r + ")");
                                        });

    that.onmessage_cb = utils.bind(that.onmessage, that);
    utils.attachMessage(that.onmessage_cb);
};

IframeTransport.prototype.doCleanup = function() {
    var that = this;
    if (that.iframeObj) {
        utils.detachMessage(that.onmessage_cb);
        try {
            // When the iframe is not loaded, IE raises an exception
            // on 'contentWindow'.
            if (that.iframeObj.iframe.contentWindow) {
                that.postMessage('c');
            }
        } catch (x) {}
        that.iframeObj.cleanup();
        that.iframeObj = null;
        that.onmessage_cb = that.iframeObj = null;
    }
};

IframeTransport.prototype.onmessage = function(e) {
    var that = this;
    if (e.origin !== that.origin) return;
    var window_id = e.data.slice(0, 8);
    var type = e.data.slice(8, 9);
    var data = e.data.slice(9);

    if (window_id !== that.window_id) return;

    switch(type) {
    case 's':
        that.iframeObj.loaded();
        that.postMessage('s', JSON.stringify([SockJS.version, that.protocol, that.trans_url, that.base_url]));
        break;
    case 't':
        that.ri._didMessage(data);
        break;
    }
};

IframeTransport.prototype.postMessage = function(type, data) {
    var that = this;
    that.iframeObj.post(that.window_id + type + (data || ''), that.origin);
};

IframeTransport.prototype.doSend = function (message) {
    this.postMessage('m', message);
};

IframeTransport.enabled = function() {
    // postMessage misbehaves in konqueror 4.6.5 - the messages are delivered with
    // huge delay, or not at all.
    var konqueror = navigator && navigator.userAgent && navigator.userAgent.indexOf('Konqueror') !== -1;
    return ((typeof _window.postMessage === 'function' ||
            typeof _window.postMessage === 'object') && (!konqueror));
};
//         [*] End of lib/trans-iframe.js


//         [*] Including lib/trans-iframe-within.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var curr_window_id;

var postMessage = function (type, data) {
    if(parent !== _window) {
        parent.postMessage(curr_window_id + type + (data || ''), '*');
    } else {
        utils.log("Can't postMessage, no parent window.", type, data);
    }
};

var FacadeJS = function() {};
FacadeJS.prototype._didClose = function (code, reason) {
    postMessage('t', utils.closeFrame(code, reason));
};
FacadeJS.prototype._didMessage = function (frame) {
    postMessage('t', frame);
};
FacadeJS.prototype._doSend = function (data) {
    this._transport.doSend(data);
};
FacadeJS.prototype._doCleanup = function () {
    this._transport.doCleanup();
};

utils.parent_origin = undefined;

SockJS.bootstrap_iframe = function() {
    var facade;
    curr_window_id = _document.location.hash.slice(1);
    var onMessage = function(e) {
        if(e.source !== parent) return;
        if(typeof utils.parent_origin === 'undefined')
            utils.parent_origin = e.origin;
        if (e.origin !== utils.parent_origin) return;

        var window_id = e.data.slice(0, 8);
        var type = e.data.slice(8, 9);
        var data = e.data.slice(9);
        if (window_id !== curr_window_id) return;
        switch(type) {
        case 's':
            var p = JSON.parse(data);
            var version = p[0];
            var protocol = p[1];
            var trans_url = p[2];
            var base_url = p[3];
            if (version !== SockJS.version) {
                utils.log("Incompatibile SockJS! Main site uses:" +
                          " \"" + version + "\", the iframe:" +
                          " \"" + SockJS.version + "\".");
            }
            if (!utils.flatUrl(trans_url) || !utils.flatUrl(base_url)) {
                utils.log("Only basic urls are supported in SockJS");
                return;
            }

            if (!utils.isSameOriginUrl(trans_url) ||
                !utils.isSameOriginUrl(base_url)) {
                utils.log("Can't connect to different domain from within an " +
                          "iframe. (" + JSON.stringify([_window.location.href, trans_url, base_url]) +
                          ")");
                return;
            }
            facade = new FacadeJS();
            facade._transport = new FacadeJS[protocol](facade, trans_url, base_url);
            break;
        case 'm':
            facade._doSend(data);
            break;
        case 'c':
            if (facade)
                facade._doCleanup();
            facade = null;
            break;
        }
    };

    // alert('test ticker');
    // facade = new FacadeJS();
    // facade._transport = new FacadeJS['w-iframe-xhr-polling'](facade, 'http://host.com:9999/ticker/12/basd');

    utils.attachMessage(onMessage);

    // Start
    postMessage('s');
};
//         [*] End of lib/trans-iframe-within.js


//         [*] Including lib/info.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var InfoReceiver = function(base_url, AjaxObject) {
    var that = this;
    utils.delay(function(){that.doXhr(base_url, AjaxObject);});
};

InfoReceiver.prototype = new EventEmitter(['finish']);

InfoReceiver.prototype.doXhr = function(base_url, AjaxObject) {
    var that = this;
    var t0 = (new Date()).getTime();
    var xo = new AjaxObject('GET', base_url + '/info');

    var tref = utils.delay(8000,
                           function(){xo.ontimeout();});

    xo.onfinish = function(status, text) {
        clearTimeout(tref);
        tref = null;
        if (status === 200) {
            var rtt = (new Date()).getTime() - t0;
            var info = JSON.parse(text);
            if (typeof info !== 'object') info = {};
            that.emit('finish', info, rtt);
        } else {
            that.emit('finish');
        }
    };
    xo.ontimeout = function() {
        xo.close();
        that.emit('finish');
    };
};

var InfoReceiverIframe = function(base_url) {
    var that = this;
    var go = function() {
        var ifr = new IframeTransport();
        ifr.protocol = 'w-iframe-info-receiver';
        var fun = function(r) {
            if (typeof r === 'string' && r.substr(0,1) === 'm') {
                var d = JSON.parse(r.substr(1));
                var info = d[0], rtt = d[1];
                that.emit('finish', info, rtt);
            } else {
                that.emit('finish');
            }
            ifr.doCleanup();
            ifr = null;
        };
        var mock_ri = {
            _options: {},
            _didClose: fun,
            _didMessage: fun
        };
        ifr.i_constructor(mock_ri, base_url, base_url);
    }
    if(!_document.body) {
        utils.attachEvent('load', go);
    } else {
        go();
    }
};
InfoReceiverIframe.prototype = new EventEmitter(['finish']);


var InfoReceiverFake = function() {
    // It may not be possible to do cross domain AJAX to get the info
    // data, for example for IE7. But we want to run JSONP, so let's
    // fake the response, with rtt=2s (rto=6s).
    var that = this;
    utils.delay(function() {
        that.emit('finish', {}, 2000);
    });
};
InfoReceiverFake.prototype = new EventEmitter(['finish']);

var createInfoReceiver = function(base_url) {
    if (utils.isSameOriginUrl(base_url)) {
        // If, for some reason, we have SockJS locally - there's no
        // need to start up the complex machinery. Just use ajax.
        return new InfoReceiver(base_url, utils.XHRLocalObject);
    }
    switch (utils.isXHRCorsCapable()) {
    case 1:
        return new InfoReceiver(base_url, utils.XHRCorsObject);
    case 2:
        return new InfoReceiver(base_url, utils.XDRObject);
    case 3:
        // Opera
        return new InfoReceiverIframe(base_url);
    default:
        // IE 7
        return new InfoReceiverFake();
    };
};


var WInfoReceiverIframe = FacadeJS['w-iframe-info-receiver'] = function(ri, _trans_url, base_url) {
    var ir = new InfoReceiver(base_url, utils.XHRLocalObject);
    ir.onfinish = function(info, rtt) {
        ri._didMessage('m'+JSON.stringify([info, rtt]));
        ri._didClose();
    }
};
WInfoReceiverIframe.prototype.doCleanup = function() {};
//         [*] End of lib/info.js


//         [*] Including lib/trans-iframe-eventsource.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var EventSourceIframeTransport = SockJS['iframe-eventsource'] = function () {
    var that = this;
    that.protocol = 'w-iframe-eventsource';
    that.i_constructor.apply(that, arguments);
};

EventSourceIframeTransport.prototype = new IframeTransport();

EventSourceIframeTransport.enabled = function () {
    return ('EventSource' in _window) && IframeTransport.enabled();
};

EventSourceIframeTransport.need_body = true;
EventSourceIframeTransport.roundTrips = 3; // html, javascript, eventsource


// w-iframe-eventsource
var EventSourceTransport = FacadeJS['w-iframe-eventsource'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/eventsource', EventSourceReceiver, utils.XHRLocalObject);
}
EventSourceTransport.prototype = new AjaxBasedTransport();
//         [*] End of lib/trans-iframe-eventsource.js


//         [*] Including lib/trans-iframe-xhr-polling.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var XhrPollingIframeTransport = SockJS['iframe-xhr-polling'] = function () {
    var that = this;
    that.protocol = 'w-iframe-xhr-polling';
    that.i_constructor.apply(that, arguments);
};

XhrPollingIframeTransport.prototype = new IframeTransport();

XhrPollingIframeTransport.enabled = function () {
    return _window.XMLHttpRequest && IframeTransport.enabled();
};

XhrPollingIframeTransport.need_body = true;
XhrPollingIframeTransport.roundTrips = 3; // html, javascript, xhr


// w-iframe-xhr-polling
var XhrPollingITransport = FacadeJS['w-iframe-xhr-polling'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr', XhrReceiver, utils.XHRLocalObject);
};

XhrPollingITransport.prototype = new AjaxBasedTransport();
//         [*] End of lib/trans-iframe-xhr-polling.js


//         [*] Including lib/trans-iframe-htmlfile.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// This transport generally works in any browser, but will cause a
// spinning cursor to appear in any browser other than IE.
// We may test this transport in all browsers - why not, but in
// production it should be only run in IE.

var HtmlFileIframeTransport = SockJS['iframe-htmlfile'] = function () {
    var that = this;
    that.protocol = 'w-iframe-htmlfile';
    that.i_constructor.apply(that, arguments);
};

// Inheritance.
HtmlFileIframeTransport.prototype = new IframeTransport();

HtmlFileIframeTransport.enabled = function() {
    return IframeTransport.enabled();
};

HtmlFileIframeTransport.need_body = true;
HtmlFileIframeTransport.roundTrips = 3; // html, javascript, htmlfile


// w-iframe-htmlfile
var HtmlFileTransport = FacadeJS['w-iframe-htmlfile'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/htmlfile', HtmlfileReceiver, utils.XHRLocalObject);
};
HtmlFileTransport.prototype = new AjaxBasedTransport();
//         [*] End of lib/trans-iframe-htmlfile.js


//         [*] Including lib/trans-polling.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var Polling = function(ri, Receiver, recv_url, AjaxObject) {
    var that = this;
    that.ri = ri;
    that.Receiver = Receiver;
    that.recv_url = recv_url;
    that.AjaxObject = AjaxObject;
    that._scheduleRecv();
};

Polling.prototype._scheduleRecv = function() {
    var that = this;
    var poll = that.poll = new that.Receiver(that.recv_url, that.AjaxObject);
    var msg_counter = 0;
    poll.onmessage = function(e) {
        msg_counter += 1;
        that.ri._didMessage(e.data);
    };
    poll.onclose = function(e) {
        that.poll = poll = poll.onmessage = poll.onclose = null;
        if (!that.poll_is_closing) {
            if (e.reason === 'permanent') {
                that.ri._didClose(1006, 'Polling error (' + e.reason + ')');
            } else {
                that._scheduleRecv();
            }
        }
    };
};

Polling.prototype.abort = function() {
    var that = this;
    that.poll_is_closing = true;
    if (that.poll) {
        that.poll.abort();
    }
};
//         [*] End of lib/trans-polling.js


//         [*] Including lib/trans-receiver-eventsource.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var EventSourceReceiver = function(url) {
    var that = this;
    var es = new EventSource(url);
    es.onmessage = function(e) {
        that.dispatchEvent(new SimpleEvent('message',
                                           {'data': unescape(e.data)}));
    };
    that.es_close = es.onerror = function(e, abort_reason) {
        // ES on reconnection has readyState = 0 or 1.
        // on network error it's CLOSED = 2
        var reason = abort_reason ? 'user' :
            (es.readyState !== 2 ? 'network' : 'permanent');
        that.es_close = es.onmessage = es.onerror = null;
        // EventSource reconnects automatically.
        es.close();
        es = null;
        // Safari and chrome < 15 crash if we close window before
        // waiting for ES cleanup. See:
        //   https://code.google.com/p/chromium/issues/detail?id=89155
        utils.delay(200, function() {
                        that.dispatchEvent(new SimpleEvent('close', {reason: reason}));
                    });
    };
};

EventSourceReceiver.prototype = new REventTarget();

EventSourceReceiver.prototype.abort = function() {
    var that = this;
    if (that.es_close) {
        that.es_close({}, true);
    }
};
//         [*] End of lib/trans-receiver-eventsource.js


//         [*] Including lib/trans-receiver-htmlfile.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var _is_ie_htmlfile_capable;
var isIeHtmlfileCapable = function() {
    if (_is_ie_htmlfile_capable === undefined) {
        if ('ActiveXObject' in _window) {
            try {
                _is_ie_htmlfile_capable = !!new ActiveXObject('htmlfile');
            } catch (x) {}
        } else {
            _is_ie_htmlfile_capable = false;
        }
    }
    return _is_ie_htmlfile_capable;
};


var HtmlfileReceiver = function(url) {
    var that = this;
    utils.polluteGlobalNamespace();

    that.id = 'a' + utils.random_string(6, 26);
    url += ((url.indexOf('?') === -1) ? '?' : '&') +
        'c=' + escape(WPrefix + '.' + that.id);

    var constructor = isIeHtmlfileCapable() ?
        utils.createHtmlfile : utils.createIframe;

    var iframeObj;
    _window[WPrefix][that.id] = {
        start: function () {
            iframeObj.loaded();
        },
        message: function (data) {
            that.dispatchEvent(new SimpleEvent('message', {'data': data}));
        },
        stop: function () {
            that.iframe_close({}, 'network');
        }
    };
    that.iframe_close = function(e, abort_reason) {
        iframeObj.cleanup();
        that.iframe_close = iframeObj = null;
        delete _window[WPrefix][that.id];
        that.dispatchEvent(new SimpleEvent('close', {reason: abort_reason}));
    };
    iframeObj = constructor(url, function(e) {
                                that.iframe_close({}, 'permanent');
                            });
};

HtmlfileReceiver.prototype = new REventTarget();

HtmlfileReceiver.prototype.abort = function() {
    var that = this;
    if (that.iframe_close) {
        that.iframe_close({}, 'user');
    }
};
//         [*] End of lib/trans-receiver-htmlfile.js


//         [*] Including lib/trans-receiver-xhr.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var XhrReceiver = function(url, AjaxObject) {
    var that = this;
    var buf_pos = 0;

    that.xo = new AjaxObject('POST', url, null);
    that.xo.onchunk = function(status, text) {
        if (status !== 200) return;
        while (1) {
            var buf = text.slice(buf_pos);
            var p = buf.indexOf('\n');
            if (p === -1) break;
            buf_pos += p+1;
            var msg = buf.slice(0, p);
            that.dispatchEvent(new SimpleEvent('message', {data: msg}));
        }
    };
    that.xo.onfinish = function(status, text) {
        that.xo.onchunk(status, text);
        that.xo = null;
        var reason = status === 200 ? 'network' : 'permanent';
        that.dispatchEvent(new SimpleEvent('close', {reason: reason}));
    }
};

XhrReceiver.prototype = new REventTarget();

XhrReceiver.prototype.abort = function() {
    var that = this;
    if (that.xo) {
        that.xo.close();
        that.dispatchEvent(new SimpleEvent('close', {reason: 'user'}));
        that.xo = null;
    }
};
//         [*] End of lib/trans-receiver-xhr.js


//         [*] Including lib/test-hooks.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// For testing
SockJS.getUtils = function(){
    return utils;
};

SockJS.getIframeTransport = function(){
    return IframeTransport;
};
//         [*] End of lib/test-hooks.js

                  return SockJS;
          })();
if ('_sockjs_onload' in window) setTimeout(_sockjs_onload, 1);

// AMD compliance
if (typeof define === 'function' && define.amd) {
    define('sockjs', [], function(){return SockJS;});
}

if (typeof module === 'object' && module && module.exports) {
    module.exports = SockJS;
}
//     [*] End of lib/index.js

// [*] End of lib/all.js


},{}],12:[function(require,module,exports){
var pnode;

pnode = require("../../");

pnode.addTransport("ws", require("./transports/ws.coffee"));

window.pnode = pnode;


},{"../../":28,"./transports/ws.coffee":13}],13:[function(require,module,exports){
var sock,
  __slice = [].slice;

sock = require('shoe');

exports.parse = function(str) {
  var args;
  args = [];
  if (typeof str === 'string' && /^.+\/.+$/.test(str)) {
    str = "http://" + str;
  }
  return [str];
};

exports.bindServer = function() {
  throw "bind server not supported";
};

exports.bindClient = function() {
  var args, client;
  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  client = this;
  return client.createConnection(function(callback) {
    return callback(sock.apply(null, args));
  });
};


},{"shoe":10}],14:[function(require,module,exports){
var dnode = require('./lib/dnode');

module.exports = function (cons, opts) {
    return new dnode(cons, opts);
};

},{"./lib/dnode":15}],15:[function(require,module,exports){
var process=require("__browserify_process");var protocol = require('dnode-protocol');
var Stream = require('stream');
var json = typeof JSON === 'object' ? JSON : require('jsonify');

module.exports = dnode;
dnode.prototype = {};
(function () { // browsers etc
    for (var key in Stream.prototype) {
        dnode.prototype[key] = Stream.prototype[key];
    }
})();

function dnode (cons, opts) {
    Stream.call(this);
    var self = this;
    
    self.opts = opts || {};
    
    self.cons = typeof cons === 'function'
        ? cons
        : function () { return cons || {} }
    ;
    
    self.readable = true;
    self.writable = true;
    
    process.nextTick(function () {
        if (self._ended) return;
        self.proto = self._createProto();
        self.proto.start();
        
        if (!self._handleQueue) return;
        for (var i = 0; i < self._handleQueue.length; i++) {
            self.handle(self._handleQueue[i]);
        }
    });
}

dnode.prototype._createProto = function () {
    var self = this;
    var proto = protocol(function (remote) {
        if (self._ended) return;
        
        var ref = self.cons.call(this, remote, self);
        if (typeof ref !== 'object') ref = this;
        
        self.emit('local', ref, self);
        
        return ref;
    }, self.opts.proto);
    
    proto.on('remote', function (remote) {
        self.emit('remote', remote, self);
        self.emit('ready'); // backwards compatability, deprecated
    });
    
    proto.on('request', function (req) {
        if (!self.readable) return;
        
        if (self.opts.emit === 'object') {
            self.emit('data', req);
        }
        else self.emit('data', json.stringify(req) + '\n');
    });
    
    proto.on('fail', function (err) {
        // errors that the remote end was responsible for
        self.emit('fail', err);
    });
    
    proto.on('error', function (err) {
        // errors that the local code was responsible for
        self.emit('error', err);
    });
    
    return proto;
};

dnode.prototype.write = function (buf) {
    if (this._ended) return;
    var self = this;
    var row;
    
    if (buf && typeof buf === 'object'
    && buf.constructor && buf.constructor.name === 'Buffer'
    && buf.length
    && typeof buf.slice === 'function') {
        // treat like a buffer
        if (!self._bufs) self._bufs = [];
        
        // treat like a buffer
        for (var i = 0, j = 0; i < buf.length; i++) {
            if (buf[i] === 0x0a) {
                self._bufs.push(buf.slice(j, i));
                
                var line = '';
                for (var k = 0; k < self._bufs.length; k++) {
                    line += String(self._bufs[k]);
                }
                
                try { row = json.parse(line) }
                catch (err) { return self.end() }
                
                j = i + 1;
                
                self.handle(row);
                self._bufs = [];
            }
        }
        
        if (j < buf.length) self._bufs.push(buf.slice(j, buf.length));
    }
    else if (buf && typeof buf === 'object') {
        // .isBuffer() without the Buffer
        // Use self to pipe JSONStream.parse() streams.
        self.handle(buf);
    }
    else {
        if (typeof buf !== 'string') buf = String(buf);
        if (!self._line) self._line = '';
        
        for (var i = 0; i < buf.length; i++) {
            if (buf.charCodeAt(i) === 0x0a) {
                try { row = json.parse(self._line) }
                catch (err) { return self.end() }
                
                self._line = '';
                self.handle(row);
            }
            else self._line += buf.charAt(i)
        }
    }
};

dnode.prototype.handle = function (row) {
    if (!this.proto) {
        if (!this._handleQueue) this._handleQueue = [];
        this._handleQueue.push(row);
    }
    else this.proto.handle(row);
};

dnode.prototype.end = function () {
    if (this._ended) return;
    this._ended = true;
    this.writable = false;
    this.readable = false;
    this.emit('end');
};

dnode.prototype.destroy = function () {
    this.end();
};

},{"__browserify_process":9,"dnode-protocol":16,"jsonify":22,"stream":5}],16:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter;
var scrubber = require('./lib/scrub');
var objectKeys = require('./lib/keys');
var forEach = require('./lib/foreach');
var isEnumerable = require('./lib/is_enum');

module.exports = function (cons, opts) {
    return new Proto(cons, opts);
};

(function () { // browsers bleh
    for (var key in EventEmitter.prototype) {
        Proto.prototype[key] = EventEmitter.prototype[key];
    }
})();

function Proto (cons, opts) {
    var self = this;
    EventEmitter.call(self);
    if (!opts) opts = {};
    
    self.remote = {};
    self.callbacks = { local : [], remote : [] };
    self.wrap = opts.wrap;
    self.unwrap = opts.unwrap;
    
    self.scrubber = scrubber(self.callbacks.local);
    
    if (typeof cons === 'function') {
        self.instance = new cons(self.remote, self);
    }
    else self.instance = cons || {};
}

Proto.prototype.start = function () {
    this.request('methods', [ this.instance ]);
};

Proto.prototype.cull = function (id) {
    delete this.callbacks.remote[id];
    this.emit('request', {
        method : 'cull',
        arguments : [ id ]
    });
};

Proto.prototype.request = function (method, args) {
    var scrub = this.scrubber.scrub(args);
    
    this.emit('request', {
        method : method,
        arguments : scrub.arguments,
        callbacks : scrub.callbacks,
        links : scrub.links
    });
};

Proto.prototype.handle = function (req) {
    var self = this;
    var args = self.scrubber.unscrub(req, function (id) {
        if (self.callbacks.remote[id] === undefined) {
            // create a new function only if one hasn't already been created
            // for a particular id
            var cb = function () {
                self.request(id, [].slice.apply(arguments));
            };
            self.callbacks.remote[id] = self.wrap ? self.wrap(cb, id) : cb;
            return cb;
        }
        return self.unwrap
            ? self.unwrap(self.callbacks.remote[id], id)
            : self.callbacks.remote[id]
        ;
    });
    
    if (req.method === 'methods') {
        self.handleMethods(args[0]);
    }
    else if (req.method === 'cull') {
        forEach(args, function (id) {
            delete self.callbacks.local[id];
        });
    }
    else if (typeof req.method === 'string') {
        if (isEnumerable(self.instance, req.method)) {
            self.apply(self.instance[req.method], args);
        }
        else {
            self.emit('fail', new Error(
                'request for non-enumerable method: ' + req.method
            ));
        }
    }
    else if (typeof req.method == 'number') {
        var fn = self.callbacks.local[req.method];
        if (!fn) {
            self.emit('fail', new Error('no such method'));
        }
        else self.apply(fn, args);
    }
};

Proto.prototype.handleMethods = function (methods) {
    var self = this;
    if (typeof methods != 'object') {
        methods = {};
    }
    
    // copy since assignment discards the previous refs
    forEach(objectKeys(self.remote), function (key) {
        delete self.remote[key];
    });
    
    forEach(objectKeys(methods), function (key) {
        self.remote[key] = methods[key];
    });
    
    self.emit('remote', self.remote);
    self.emit('ready');
};

Proto.prototype.apply = function (f, args) {
    try { f.apply(undefined, args) }
    catch (err) { this.emit('error', err) }
};

},{"./lib/foreach":17,"./lib/is_enum":18,"./lib/keys":19,"./lib/scrub":20,"events":1}],17:[function(require,module,exports){
module.exports = function forEach (xs, f) {
    if (xs.forEach) return xs.forEach(f)
    for (var i = 0; i < xs.length; i++) {
        f.call(xs, xs[i], i);
    }
}

},{}],18:[function(require,module,exports){
var objectKeys = require('./keys');

module.exports = function (obj, key) {
    if (Object.prototype.propertyIsEnumerable) {
        return Object.prototype.propertyIsEnumerable.call(obj, key);
    }
    var keys = objectKeys(obj);
    for (var i = 0; i < keys.length; i++) {
        if (key === keys[i]) return true;
    }
    return false;
};

},{"./keys":19}],19:[function(require,module,exports){
module.exports = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};

},{}],20:[function(require,module,exports){
var traverse = require('traverse');
var objectKeys = require('./keys');
var forEach = require('./foreach');

function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) if (xs[i] === x) return i;
    return -1;
}

// scrub callbacks out of requests in order to call them again later
module.exports = function (callbacks) {
    return new Scrubber(callbacks);
};

function Scrubber (callbacks) {
    this.callbacks = callbacks;
}

// Take the functions out and note them for future use
Scrubber.prototype.scrub = function (obj) {
    var self = this;
    var paths = {};
    var links = [];
    
    var args = traverse(obj).map(function (node) {
        if (typeof node === 'function') {
            var i = indexOf(self.callbacks, node);
            if (i >= 0 && !(i in paths)) {
                // Keep previous function IDs only for the first function
                // found. This is somewhat suboptimal but the alternatives
                // are worse.
                paths[i] = this.path;
            }
            else {
                var id = self.callbacks.length;
                self.callbacks.push(node);
                paths[id] = this.path;
            }
            
            this.update('[Function]');
        }
        else if (this.circular) {
            links.push({ from : this.circular.path, to : this.path });
            this.update('[Circular]');
        }
    });
    
    return {
        arguments : args,
        callbacks : paths,
        links : links
    };
};
 
// Replace callbacks. The supplied function should take a callback id and
// return a callback of its own.
Scrubber.prototype.unscrub = function (msg, f) {
    var args = msg.arguments || [];
    forEach(objectKeys(msg.callbacks || {}), function (sid) {
        var id = parseInt(sid, 10);
        var path = msg.callbacks[id];
        traverse.set(args, path, f(id));
    });
    
    forEach(msg.links || [], function (link) {
        var value = traverse.get(args, link.from);
        traverse.set(args, link.to, value);
    });
    
    return args;
};

},{"./foreach":17,"./keys":19,"traverse":21}],21:[function(require,module,exports){
var traverse = module.exports = function (obj) {
    return new Traverse(obj);
};

function Traverse (obj) {
    this.value = obj;
}

Traverse.prototype.get = function (ps) {
    var node = this.value;
    for (var i = 0; i < ps.length; i ++) {
        var key = ps[i];
        if (!Object.hasOwnProperty.call(node, key)) {
            node = undefined;
            break;
        }
        node = node[key];
    }
    return node;
};

Traverse.prototype.has = function (ps) {
    var node = this.value;
    for (var i = 0; i < ps.length; i ++) {
        var key = ps[i];
        if (!Object.hasOwnProperty.call(node, key)) {
            return false;
        }
        node = node[key];
    }
    return true;
};

Traverse.prototype.set = function (ps, value) {
    var node = this.value;
    for (var i = 0; i < ps.length - 1; i ++) {
        var key = ps[i];
        if (!Object.hasOwnProperty.call(node, key)) node[key] = {};
        node = node[key];
    }
    node[ps[i]] = value;
    return value;
};

Traverse.prototype.map = function (cb) {
    return walk(this.value, cb, true);
};

Traverse.prototype.forEach = function (cb) {
    this.value = walk(this.value, cb, false);
    return this.value;
};

Traverse.prototype.reduce = function (cb, init) {
    var skip = arguments.length === 1;
    var acc = skip ? this.value : init;
    this.forEach(function (x) {
        if (!this.isRoot || !skip) {
            acc = cb.call(this, acc, x);
        }
    });
    return acc;
};

Traverse.prototype.paths = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.path); 
    });
    return acc;
};

Traverse.prototype.nodes = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.node);
    });
    return acc;
};

Traverse.prototype.clone = function () {
    var parents = [], nodes = [];
    
    return (function clone (src) {
        for (var i = 0; i < parents.length; i++) {
            if (parents[i] === src) {
                return nodes[i];
            }
        }
        
        if (typeof src === 'object' && src !== null) {
            var dst = copy(src);
            
            parents.push(src);
            nodes.push(dst);
            
            forEach(objectKeys(src), function (key) {
                dst[key] = clone(src[key]);
            });
            
            parents.pop();
            nodes.pop();
            return dst;
        }
        else {
            return src;
        }
    })(this.value);
};

function walk (root, cb, immutable) {
    var path = [];
    var parents = [];
    var alive = true;
    
    return (function walker (node_) {
        var node = immutable ? copy(node_) : node_;
        var modifiers = {};
        
        var keepGoing = true;
        
        var state = {
            node : node,
            node_ : node_,
            path : [].concat(path),
            parent : parents[parents.length - 1],
            parents : parents,
            key : path.slice(-1)[0],
            isRoot : path.length === 0,
            level : path.length,
            circular : null,
            update : function (x, stopHere) {
                if (!state.isRoot) {
                    state.parent.node[state.key] = x;
                }
                state.node = x;
                if (stopHere) keepGoing = false;
            },
            'delete' : function (stopHere) {
                delete state.parent.node[state.key];
                if (stopHere) keepGoing = false;
            },
            remove : function (stopHere) {
                if (isArray(state.parent.node)) {
                    state.parent.node.splice(state.key, 1);
                }
                else {
                    delete state.parent.node[state.key];
                }
                if (stopHere) keepGoing = false;
            },
            keys : null,
            before : function (f) { modifiers.before = f },
            after : function (f) { modifiers.after = f },
            pre : function (f) { modifiers.pre = f },
            post : function (f) { modifiers.post = f },
            stop : function () { alive = false },
            block : function () { keepGoing = false }
        };
        
        if (!alive) return state;
        
        function updateState() {
            if (typeof state.node === 'object' && state.node !== null) {
                if (!state.keys || state.node_ !== state.node) {
                    state.keys = objectKeys(state.node)
                }
                
                state.isLeaf = state.keys.length == 0;
                
                for (var i = 0; i < parents.length; i++) {
                    if (parents[i].node_ === node_) {
                        state.circular = parents[i];
                        break;
                    }
                }
            }
            else {
                state.isLeaf = true;
                state.keys = null;
            }
            
            state.notLeaf = !state.isLeaf;
            state.notRoot = !state.isRoot;
        }
        
        updateState();
        
        // use return values to update if defined
        var ret = cb.call(state, state.node);
        if (ret !== undefined && state.update) state.update(ret);
        
        if (modifiers.before) modifiers.before.call(state, state.node);
        
        if (!keepGoing) return state;
        
        if (typeof state.node == 'object'
        && state.node !== null && !state.circular) {
            parents.push(state);
            
            updateState();
            
            forEach(state.keys, function (key, i) {
                path.push(key);
                
                if (modifiers.pre) modifiers.pre.call(state, state.node[key], key);
                
                var child = walker(state.node[key]);
                if (immutable && Object.hasOwnProperty.call(state.node, key)) {
                    state.node[key] = child.node;
                }
                
                child.isLast = i == state.keys.length - 1;
                child.isFirst = i == 0;
                
                if (modifiers.post) modifiers.post.call(state, child);
                
                path.pop();
            });
            parents.pop();
        }
        
        if (modifiers.after) modifiers.after.call(state, state.node);
        
        return state;
    })(root).node;
}

function copy (src) {
    if (typeof src === 'object' && src !== null) {
        var dst;
        
        if (isArray(src)) {
            dst = [];
        }
        else if (isDate(src)) {
            dst = new Date(src);
        }
        else if (isRegExp(src)) {
            dst = new RegExp(src);
        }
        else if (isError(src)) {
            dst = { message: src.message };
        }
        else if (isBoolean(src)) {
            dst = new Boolean(src);
        }
        else if (isNumber(src)) {
            dst = new Number(src);
        }
        else if (isString(src)) {
            dst = new String(src);
        }
        else if (Object.create && Object.getPrototypeOf) {
            dst = Object.create(Object.getPrototypeOf(src));
        }
        else if (src.constructor === Object) {
            dst = {};
        }
        else {
            var proto =
                (src.constructor && src.constructor.prototype)
                || src.__proto__
                || {}
            ;
            var T = function () {};
            T.prototype = proto;
            dst = new T;
        }
        
        forEach(objectKeys(src), function (key) {
            dst[key] = src[key];
        });
        return dst;
    }
    else return src;
}

var objectKeys = Object.keys || function keys (obj) {
    var res = [];
    for (var key in obj) res.push(key)
    return res;
};

function toS (obj) { return Object.prototype.toString.call(obj) }
function isDate (obj) { return toS(obj) === '[object Date]' }
function isRegExp (obj) { return toS(obj) === '[object RegExp]' }
function isError (obj) { return toS(obj) === '[object Error]' }
function isBoolean (obj) { return toS(obj) === '[object Boolean]' }
function isNumber (obj) { return toS(obj) === '[object Number]' }
function isString (obj) { return toS(obj) === '[object String]' }

var isArray = Array.isArray || function isArray (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

forEach(objectKeys(Traverse.prototype), function (key) {
    traverse[key] = function (obj) {
        var args = [].slice.call(arguments, 1);
        var t = new Traverse(obj);
        return t[key].apply(t, args);
    };
});

},{}],22:[function(require,module,exports){
exports.parse = require('./lib/parse');
exports.stringify = require('./lib/stringify');

},{"./lib/parse":23,"./lib/stringify":24}],23:[function(require,module,exports){
var at, // The index of the current character
    ch, // The current character
    escapee = {
        '"':  '"',
        '\\': '\\',
        '/':  '/',
        b:    '\b',
        f:    '\f',
        n:    '\n',
        r:    '\r',
        t:    '\t'
    },
    text,

    error = function (m) {
        // Call error when something is wrong.
        throw {
            name:    'SyntaxError',
            message: m,
            at:      at,
            text:    text
        };
    },
    
    next = function (c) {
        // If a c parameter is provided, verify that it matches the current character.
        if (c && c !== ch) {
            error("Expected '" + c + "' instead of '" + ch + "'");
        }
        
        // Get the next character. When there are no more characters,
        // return the empty string.
        
        ch = text.charAt(at);
        at += 1;
        return ch;
    },
    
    number = function () {
        // Parse a number value.
        var number,
            string = '';
        
        if (ch === '-') {
            string = '-';
            next('-');
        }
        while (ch >= '0' && ch <= '9') {
            string += ch;
            next();
        }
        if (ch === '.') {
            string += '.';
            while (next() && ch >= '0' && ch <= '9') {
                string += ch;
            }
        }
        if (ch === 'e' || ch === 'E') {
            string += ch;
            next();
            if (ch === '-' || ch === '+') {
                string += ch;
                next();
            }
            while (ch >= '0' && ch <= '9') {
                string += ch;
                next();
            }
        }
        number = +string;
        if (!isFinite(number)) {
            error("Bad number");
        } else {
            return number;
        }
    },
    
    string = function () {
        // Parse a string value.
        var hex,
            i,
            string = '',
            uffff;
        
        // When parsing for string values, we must look for " and \ characters.
        if (ch === '"') {
            while (next()) {
                if (ch === '"') {
                    next();
                    return string;
                } else if (ch === '\\') {
                    next();
                    if (ch === 'u') {
                        uffff = 0;
                        for (i = 0; i < 4; i += 1) {
                            hex = parseInt(next(), 16);
                            if (!isFinite(hex)) {
                                break;
                            }
                            uffff = uffff * 16 + hex;
                        }
                        string += String.fromCharCode(uffff);
                    } else if (typeof escapee[ch] === 'string') {
                        string += escapee[ch];
                    } else {
                        break;
                    }
                } else {
                    string += ch;
                }
            }
        }
        error("Bad string");
    },

    white = function () {

// Skip whitespace.

        while (ch && ch <= ' ') {
            next();
        }
    },

    word = function () {

// true, false, or null.

        switch (ch) {
        case 't':
            next('t');
            next('r');
            next('u');
            next('e');
            return true;
        case 'f':
            next('f');
            next('a');
            next('l');
            next('s');
            next('e');
            return false;
        case 'n':
            next('n');
            next('u');
            next('l');
            next('l');
            return null;
        }
        error("Unexpected '" + ch + "'");
    },

    value,  // Place holder for the value function.

    array = function () {

// Parse an array value.

        var array = [];

        if (ch === '[') {
            next('[');
            white();
            if (ch === ']') {
                next(']');
                return array;   // empty array
            }
            while (ch) {
                array.push(value());
                white();
                if (ch === ']') {
                    next(']');
                    return array;
                }
                next(',');
                white();
            }
        }
        error("Bad array");
    },

    object = function () {

// Parse an object value.

        var key,
            object = {};

        if (ch === '{') {
            next('{');
            white();
            if (ch === '}') {
                next('}');
                return object;   // empty object
            }
            while (ch) {
                key = string();
                white();
                next(':');
                if (Object.hasOwnProperty.call(object, key)) {
                    error('Duplicate key "' + key + '"');
                }
                object[key] = value();
                white();
                if (ch === '}') {
                    next('}');
                    return object;
                }
                next(',');
                white();
            }
        }
        error("Bad object");
    };

value = function () {

// Parse a JSON value. It could be an object, an array, a string, a number,
// or a word.

    white();
    switch (ch) {
    case '{':
        return object();
    case '[':
        return array();
    case '"':
        return string();
    case '-':
        return number();
    default:
        return ch >= '0' && ch <= '9' ? number() : word();
    }
};

// Return the json_parse function. It will have access to all of the above
// functions and variables.

module.exports = function (source, reviver) {
    var result;
    
    text = source;
    at = 0;
    ch = ' ';
    result = value();
    white();
    if (ch) {
        error("Syntax error");
    }

    // If there is a reviver function, we recursively walk the new structure,
    // passing each name/value pair to the reviver function for possible
    // transformation, starting with a temporary root object that holds the result
    // in an empty key. If there is not a reviver function, we simply return the
    // result.

    return typeof reviver === 'function' ? (function walk(holder, key) {
        var k, v, value = holder[key];
        if (value && typeof value === 'object') {
            for (k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    v = walk(value, k);
                    if (v !== undefined) {
                        value[k] = v;
                    } else {
                        delete value[k];
                    }
                }
            }
        }
        return reviver.call(holder, key, value);
    }({'': result}, '')) : result;
};

},{}],24:[function(require,module,exports){
var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    gap,
    indent,
    meta = {    // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    },
    rep;

function quote(string) {
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    
    escapable.lastIndex = 0;
    return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
        var c = meta[a];
        return typeof c === 'string' ? c :
            '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
}

function str(key, holder) {
    // Produce a string from holder[key].
    var i,          // The loop counter.
        k,          // The member key.
        v,          // The member value.
        length,
        mind = gap,
        partial,
        value = holder[key];
    
    // If the value has a toJSON method, call it to obtain a replacement value.
    if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
        value = value.toJSON(key);
    }
    
    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.
    if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
    }
    
    // What happens next depends on the value's type.
    switch (typeof value) {
        case 'string':
            return quote(value);
        
        case 'number':
            // JSON numbers must be finite. Encode non-finite numbers as null.
            return isFinite(value) ? String(value) : 'null';
        
        case 'boolean':
        case 'null':
            // If the value is a boolean or null, convert it to a string. Note:
            // typeof null does not produce 'null'. The case is included here in
            // the remote chance that this gets fixed someday.
            return String(value);
            
        case 'object':
            if (!value) return 'null';
            gap += indent;
            partial = [];
            
            // Array.isArray
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }
                
                // Join all of the elements together, separated with commas, and
                // wrap them in brackets.
                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }
            
            // If the replacer is an array, use it to select the members to be
            // stringified.
            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            else {
                // Otherwise, iterate through all of the keys in the object.
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            
        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.

        v = partial.length === 0 ? '{}' : gap ?
            '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
            '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
}

module.exports = function (value, replacer, space) {
    var i;
    gap = '';
    indent = '';
    
    // If the space parameter is a number, make an indent string containing that
    // many spaces.
    if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
            indent += ' ';
        }
    }
    // If the space parameter is a string, it will be used as the indent string.
    else if (typeof space === 'string') {
        indent = space;
    }

    // If there is a replacer, it must be a function or an array.
    // Otherwise, throw an error.
    rep = replacer;
    if (replacer && typeof replacer !== 'function'
    && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
    }
    
    // Make a fake root object containing our value under the key of ''.
    // Return the result of stringifying the value.
    return str('', {'': value});
};

},{}],25:[function(require,module,exports){
// Generated by CoffeeScript 1.6.3
var Base, EventEmitter, addr, addrs, guid, ips, name, os, _, _i, _len, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EventEmitter = require('events').EventEmitter;

_ = require('../vendor/lodash');

os = require("os");

guid = function() {
  return (Math.random() * Math.pow(2, 32)).toString(16);
};

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

module.exports = Base = (function(_super) {
  __extends(Base, _super);

  Base.prototype.name = 'Base';

  function Base(opts) {
    this.opts = opts != null ? opts : {};
    if (_.isString(this.opts)) {
      this.opts = {
        id: this.opts
      };
    }
    _.defaults(this.opts, this.defaults);
    this.guid = guid();
    this.id = this.opts.id || this.guid;
    _.bindAll(this);
    this.exposed = {
      _multi: {
        id: this.id,
        guid: this.guid,
        ips: ips,
        ping: function(cb) {
          return cb(true);
        }
      }
    };
  }

  Base.prototype.expose = function(obj) {
    return _.merge(this.exposed, obj);
  };

  Base.prototype.ips = function() {
    return ips;
  };

  Base.prototype.log = function() {
    if (this.opts.debug) {
      return console.log.apply(console, [this.toString()].concat([].slice.call(arguments)));
    }
  };

  Base.prototype.err = function(str) {
    throw new Error("" + this + " " + str);
  };

  Base.prototype.toString = function() {
    return "" + this.name + ": " + this.id + ":";
  };

  return Base;

})(EventEmitter);

},{"../vendor/lodash":32,"events":1,"os":8}],26:[function(require,module,exports){
// Generated by CoffeeScript 1.6.3
var Base, Client, dnode, helper, transports, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require('../vendor/lodash');

dnode = require('dnode');

Base = require('./base');

helper = require('./helper');

transports = require('./transports');

Client = (function(_super) {
  __extends(Client, _super);

  Client.prototype.name = 'Client';

  Client.prototype.defaults = {
    debug: true,
    maxRetries: 5,
    timeout: 5000,
    interval: 1000,
    port: 7337
  };

  function Client() {
    Client.__super__.constructor.apply(this, arguments);
    this.count = {
      ping: 0,
      pong: 0,
      attempt: 0
    };
    this.connecting = false;
    this.status = 'down';
    this.reconnect = _.throttle(this.reconnect, this.opts.interval, {
      leading: true
    });
    this.ping = _.throttle(this.ping, this.opts.interval);
    _.extend(this.get, this);
    return this.get;
  }

  Client.prototype.bind = function() {
    this.count.attempt = 0;
    return transports.bind(this, arguments);
  };

  Client.prototype.unbind = function() {
    this.count.attempt = 0;
    return this.reset();
  };

  Client.prototype.createConnection = function(fn) {
    if (typeof fn !== 'function') {
      this.err("must be a function");
    }
    if (!(fn.length === 1 || fn.length === 2)) {
      this.err("must have arity 1 or 2");
    }
    this.getConnectionFn = fn;
    return this.reconnect();
  };

  Client.prototype.get = function(callback) {
    if (!this.getConnectionFn) {
      return this.err("no create connection method defined");
    }
    if (this.status === 'up') {
      return callback(this.remote);
    } else if (this.status === 'down' && !this.connecting) {
      this.count.attempt = 0;
      this.reconnect();
    }
    return this.once('remote', callback);
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
    this.d = dnode(this.exposed);
    this.d.once('remote', this.onRemote);
    this.d.once('end', this.onEnd);
    this.d.once('error', this.onError);
    this.d.once('fail', this.onStreamError);
    this.timeout(function() {
      _this.reset();
      return _this.reconnect();
    });
    this.emit('connecting');
    switch (this.getConnectionFn.length) {
      case 1:
        return this.getConnectionFn(function(stream) {
          if (!helper.isReadable(stream)) {
            _this.err("Invalid duplex stream (not readable)");
          }
          if (!helper.isWritable(stream)) {
            _this.err("Invalid duplex stream (not writable)");
          }
          stream.on('error', _this.onStreamError);
          return stream.pipe(_this.d).pipe(stream);
        });
      case 2:
        return this.getConnectionFn(function(read) {
          if (!helper.isReadable(read)) {
            _this.err("Invalid read stream");
          }
          read.on('error', _this.onStreamError);
          return read.pipe(_this.d);
        }, function(write) {
          if (!helper.isWritable(write)) {
            _this.err("Invalid write stream");
          }
          write.on('error', _this.onStreamError);
          return _this.d.pipe(write);
        });
    }
  };

  Client.prototype.onStreamError = function(err) {
    this.setStatus('down');
    return this.reconnect();
  };

  Client.prototype.onError = function(err) {
    this.log("error: " + err);
    return this.emit("error", err);
  };

  Client.prototype.onRemote = function(remote) {
    var _ref;
    this.timeout(false);
    if (!((_ref = remote._multi) != null ? _ref.ping : void 0)) {
      return this.err("Invalid pnode host");
    }
    this.remote = remote;
    this.emit('remote', this.remote);
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
    return this.remote._multi.ping(function(ok) {
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
      return this.d.removeAllListeners().end();
    }
  };

  return Client;

})(Base);

module.exports = function(opts) {
  return new Client(opts);
};

},{"../vendor/lodash":32,"./base":25,"./helper":27,"./transports":31,"dnode":14}],27:[function(require,module,exports){
// Generated by CoffeeScript 1.6.3
exports.isReadable = function(stream) {
  return stream.readable === true || typeof stream.read === 'function';
};

exports.isWritable = function(stream) {
  return stream.writable === true || typeof stream.write === 'function';
};

},{}],28:[function(require,module,exports){
// Generated by CoffeeScript 1.6.3
exports.addTransport = require('./transports').add;

exports.client = require('./client');

exports.server = require('./server');

exports.peer = require('./peer');

},{"./client":26,"./peer":29,"./server":30,"./transports":31}],29:[function(require,module,exports){
// Generated by CoffeeScript 1.6.3
var Base, LocalPeer, RemotePeer, locals, pnode, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require('../vendor/lodash');

pnode = require('./index');

Base = require('./base');

locals = [];

RemotePeer = (function(_super) {
  __extends(RemotePeer, _super);

  RemotePeer.prototype.name = 'RemotePeer';

  RemotePeer.prototype.defaults = {
    hello: 42
  };

  function RemotePeer(local, remote) {
    this.local = local;
    this.remote = remote;
  }

  RemotePeer.prototype.toJSON = function() {
    this.log('toJSON', this.remote);
    return this.remote._multi.ips;
  };

  RemotePeer.prototype.add = function() {
    return this.log('add!');
  };

  return RemotePeer;

})(Base);

LocalPeer = (function(_super) {
  __extends(LocalPeer, _super);

  LocalPeer.prototype.name = 'LocalPeer';

  LocalPeer.prototype.defaults = {
    debug: true,
    hello: 42
  };

  function LocalPeer() {
    LocalPeer.__super__.constructor.apply(this, arguments);
    this.peers = {};
    this.expose({
      _multi: {
        guid: this.guid,
        peers: function(cb) {
          return cb(this.peers);
        }
      }
    });
    _.extend(this.one, this);
    return this.one;
  }

  LocalPeer.prototype.bindOn = function() {
    var server;
    server = pnode.server(this.opts);
    server.expose(this.exposed);
    server.bind.apply(server, arguments);
    return server.on('remote', this.onPeer);
  };

  LocalPeer.prototype.bindTo = function() {
    var client;
    client = pnode.client(this.opts);
    client.expose(this.exposed);
    return client.bind.apply(client, arguments);
  };

  LocalPeer.prototype.onPeer = function(remote) {
    var guid, _ref,
      _this = this;
    this.log('new peer! ', remote._multi.guid);
    remote._multi.peers(function(p) {
      return _this.log(p);
    });
    guid = remote != null ? (_ref = remote._multi) != null ? _ref.guid : void 0 : void 0;
    if (!guid) {
      return;
    }
    if (this.peers[guid]) {
      return this.peers[guid].add(remote);
    } else {
      return this.peers[guid] = new RemotePeer(this, remote);
    }
  };

  LocalPeer.prototype.all = function() {
    return this.log('all!');
  };

  LocalPeer.prototype.one = function() {
    return this.log('one!');
  };

  return LocalPeer;

})(Base);

module.exports = function(opts) {
  var peer;
  peer = new LocalPeer(opts);
  locals.push(peer);
  return peer;
};

},{"../vendor/lodash":32,"./base":25,"./index":28}],30:[function(require,module,exports){
var process=require("__browserify_process");// Generated by CoffeeScript 1.6.3
var Base, Server, dnode, helper, servers, transports,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

dnode = require('dnode');

Base = require('./base');

transports = require('./transports');

helper = require('./helper');

servers = [];

Server = (function(_super) {
  __extends(Server, _super);

  Server.prototype.name = 'Server';

  Server.prototype.defaults = {
    debug: true,
    wait: 5000
  };

  function Server() {
    Server.__super__.constructor.apply(this, arguments);
    this.clients = {};
  }

  Server.prototype.bind = function() {
    return this.si = transports.bind(this, arguments);
  };

  Server.prototype.unbind = function() {
    var client, e, id, _ref, _ref1;
    _ref = this.clients;
    for (id in _ref) {
      client = _ref[id];
      client.d.end();
    }
    try {
      if (typeof ((_ref1 = this.si) != null ? _ref1.unbind : void 0) === 'function') {
        return this.si.unbind();
      }
    } catch (_error) {
      e = _error;
    }
  };

  Server.prototype.handle = function(read, write) {
    var d,
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
    d = dnode(this.exposed);
    d.once('remote', this.onRemote);
    d.on('error', function(err) {
      return _this.log('handle error', err);
    });
    d.on('fail', function(err) {
      return _this.log('handle fail', err);
    });
    read.once('close', d.end);
    return read.pipe(d).pipe(write);
  };

  Server.prototype.onRemote = function(remote, d) {
    var meta,
      _this = this;
    meta = remote._multi;
    if (!meta) {
      this.log("closing connection, not a pnode client");
      d.end();
      return;
    }
    this.clients[meta.id] = {
      remote: remote,
      d: d
    };
    this.log('connected to client', meta.id);
    this.emit('remote', remote);
    return d.once('end', function() {
      _this.log('disconnected from client', meta.id);
      return delete _this.clients[meta.id];
    });
  };

  Server.prototype.client = function(id, callback) {
    var cb, rem, t,
      _this = this;
    rem = this.clientSync(id);
    if (rem) {
      return callback(rem);
    }
    t = setTimeout(function() {
      return _this.removeListener('remote', cb);
    }, this.opts.wait);
    cb = function() {
      rem = _this.clientSync(id);
      if (!rem) {
        return;
      }
      clearTimeout(t);
      _this.removeListener('remote', cb);
      return callback(rem);
    };
    return this.on('remote', cb);
  };

  Server.prototype.clientSync = function(id) {
    var client, i, _ref, _ref1;
    if (typeof id === 'string') {
      return (_ref = this.clients[id]) != null ? _ref.remote : void 0;
    } else if (typeof id === 'number') {
      i = id;
      _ref1 = this.clients;
      for (id in _ref1) {
        client = _ref1[id];
        if (i-- === 0) {
          return client.remote;
        }
      }
      return null;
    } else {
      return this.err("invalid arguments");
    }
  };

  return Server;

})(Base);

module.exports = function(opts) {
  var server;
  server = new Server(opts);
  servers.push(server);
  return server;
};

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

},{"./base":25,"./helper":27,"./transports":31,"__browserify_process":9,"dnode":14}],31:[function(require,module,exports){
var __dirname="/../../out/transports";// Generated by CoffeeScript 1.6.3
var fs, helper, path, re, transports;

fs = require('fs');

path = require('path');

helper = require('../helper');

re = /^([a-z]+):\/\//;

transports = {};

exports.parse = function(str) {
  var args, hostname, port;
  args = [];
  if (typeof str === 'string' && /^(.+?)(:(\d+))?$/.test(str)) {
    hostname = RegExp.$1;
    port = parseInt(RegExp.$3, 10);
    if (port) {
      args.push(port);
    }
    args.push(hostname);
  }
  return args;
};

exports.bind = function(context, args) {
  var fn, name, obj, parseFn, transport, uri;
  args = Array.prototype.slice.call(args);
  transport = args.shift();
  if (!transport) {
    context.err("Transport argument missing");
  }
  if (re.test(transport)) {
    name = RegExp.$1;
    obj = exports.get(name);
    uri = transport.replace(re, '');
  } else {
    name = transport;
    obj = exports.get(name);
  }
  if (!obj) {
    context.err("Transport: '" + transport + "' not found");
  }
  parseFn = obj.parse || exports.parse;
  args = parseFn(uri).concat(args);
  context.log(args);
  fn = obj["bind" + context.name];
  return fn.apply(context, args);
};

exports.add = function(name, obj) {
  if (typeof obj.bindServer !== 'function' || typeof obj.bindClient !== 'function') {
    throw "Transport '" + name + "' cannot be added, bind methods are missing";
  }
  if (/[^a-z]/.test(name)) {
    throw "Transport name must be lowercase letters only";
  }
  if (exports.get(name)) {
    throw "Transport '" + name + "' already exists";
  }
  transports[name] = obj;
  return true;
};

exports.get = function(name) {
  return transports[name];
};

if (typeof fs.readdirSync === "function") {
  fs.readdirSync(__dirname).forEach(function(file) {
    if (file !== 'index.js') {
      return exports.add(file.replace('.js', ''), require("./" + file));
    }
  });
}

},{"../helper":27,"fs":2,"path":3}],32:[function(require,module,exports){
var global=self;/**
 * @license
 * Lo-Dash 1.3.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modern include="merge,throttle,defaults,extend,bindAll" -o index.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.4.4 <http://underscorejs.org/>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
 * Available under MIT license <http://lodash.com/license>
 */
;(function(window) {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used to pool arrays and objects used internally */
  var arrayPool = [],
      objectPool = [];

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used internally to indicate various things */
  var indicatorObject = {};

  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date + '';

  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 75;

  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /** Used to match HTML entities */
  var reEscapedHtml = /&(?:amp|lt|gt|quot|#39);/g;

  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-7.8.6
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to detect functions containing a `this` reference */
  var reThis = (reThis = /\bthis\b/) && reThis.test(function() { return this; }) && reThis;

  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;

  /** Used to match HTML characters */
  var reUnescapedHtml = /[&<>"']/g;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      errorClass = '[object Error]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && module.exports == freeExports && module;

  /** Detect free variable `global`, from Node.js or Browserified code, and use it as `window` */
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    window = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
  function getObject() {
    return objectPool.pop() || {
      'array': null,
      'cache': null,
      'false': false,
      'leading': false,
      'maxWait': 0,
      'null': false,
      'number': null,
      'object': null,
      'push': null,
      'string': null,
      'trailing': false,
      'true': false,
      'undefined': false
    };
  }

  /**
   * A no-operation function.
   *
   * @private
   */
  function noop() {
    // no operation performed
  }

  /**
   * Releases the given `array` back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  /**
   * Releases the given `object` back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
  function releaseObject(object) {
    var cache = object.cache;
    if (cache) {
      releaseObject(cache);
    }
    object.array = object.cache =object.object = object.number = object.string =null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Used for `Array` method references.
   *
   * Normally `Array.prototype` would suffice, however, using an array literal
   * avoids issues in Narwhal.
   */
  var arrayRef = [];

  /** Used for native method references */
  var objectProto = Object.prototype,
      stringProto = String.prototype;

  /** Used to restore the original `_` reference in `noConflict` */
  var oldDash = window._;

  /** Used to detect if a method is native */
  var reNative = RegExp('^' +
    String(objectProto.valueOf)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/valueOf|for [^\]]+/g, '.+?') + '$'
  );

  /** Native method shortcuts */
  var ceil = Math.ceil,
      clearTimeout = window.clearTimeout,
      concat = arrayRef.concat,
      floor = Math.floor,
      fnToString = Function.prototype.toString,
      getPrototypeOf = reNative.test(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
      hasOwnProperty = objectProto.hasOwnProperty,
      push = arrayRef.push,
      propertyIsEnumerable = objectProto.propertyIsEnumerable,
      setTimeout = window.setTimeout,
      toString = objectProto.toString;

  /* Native method shortcuts for methods with the same name as other `lodash` methods */
  var nativeBind = reNative.test(nativeBind = toString.bind) && nativeBind,
      nativeCreate = reNative.test(nativeCreate =  Object.create) && nativeCreate,
      nativeIsArray = reNative.test(nativeIsArray = Array.isArray) && nativeIsArray,
      nativeIsFinite = window.isFinite,
      nativeIsNaN = window.isNaN,
      nativeKeys = reNative.test(nativeKeys = Object.keys) && nativeKeys,
      nativeMax = Math.max,
      nativeMin = Math.min,
      nativeRandom = Math.random,
      nativeSlice = arrayRef.slice;

  /** Detect various environments */
  var isIeOpera = reNative.test(window.attachEvent),
      isV8 = nativeBind && !/\n|true/.test(nativeBind + isIeOpera);

  /*--------------------------------------------------------------------------*/

  /**
   * Creates a `lodash` object, which wraps the given `value`, to enable method
   * chaining.
   *
   * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
   * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
   * and `unshift`
   *
   * Chaining is supported in custom builds as long as the `value` method is
   * implicitly or explicitly included in the build.
   *
   * The chainable wrapper functions are:
   * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
   * `compose`, `concat`, `countBy`, `createCallback`, `debounce`, `defaults`,
   * `defer`, `delay`, `difference`, `filter`, `flatten`, `forEach`, `forIn`,
   * `forOwn`, `functions`, `groupBy`, `initial`, `intersection`, `invert`,
   * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
   * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `push`, `range`,
   * `reject`, `rest`, `reverse`, `shuffle`, `slice`, `sort`, `sortBy`, `splice`,
   * `tap`, `throttle`, `times`, `toArray`, `transform`, `union`, `uniq`, `unshift`,
   * `unzip`, `values`, `where`, `without`, `wrap`, and `zip`
   *
   * The non-chainable wrapper functions are:
   * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `has`,
   * `identity`, `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`,
   * `isElement`, `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`,
   * `isNull`, `isNumber`, `isObject`, `isPlainObject`, `isRegExp`, `isString`,
   * `isUndefined`, `join`, `lastIndexOf`, `mixin`, `noConflict`, `parseInt`,
   * `pop`, `random`, `reduce`, `reduceRight`, `result`, `shift`, `size`, `some`,
   * `sortedIndex`, `runInContext`, `template`, `unescape`, `uniqueId`, and `value`
   *
   * The wrapper functions `first` and `last` return wrapped values when `n` is
   * passed, otherwise they return unwrapped values.
   *
   * @name _
   * @constructor
   * @alias chain
   * @category Chaining
   * @param {Mixed} value The value to wrap in a `lodash` instance.
   * @returns {Object} Returns a `lodash` instance.
   * @example
   *
   * var wrapped = _([1, 2, 3]);
   *
   * // returns an unwrapped value
   * wrapped.reduce(function(sum, num) {
   *   return sum + num;
   * });
   * // => 6
   *
   * // returns a wrapped value
   * var squares = wrapped.map(function(num) {
   *   return num * num;
   * });
   *
   * _.isArray(squares);
   * // => false
   *
   * _.isArray(squares.value());
   * // => true
   */
  function lodash() {
    // no operation performed
  }

  /**
   * An object used to flag environments features.
   *
   * @static
   * @memberOf _
   * @type Object
   */
  var support = lodash.support = {};

  /**
   * Detect if `Function#bind` exists and is inferred to be fast (all but V8).
   *
   * @memberOf _.support
   * @type Boolean
   */
  support.fastBind = nativeBind && !isV8;

  /*--------------------------------------------------------------------------*/

  /**
   * Creates a function that, when called, invokes `func` with the `this` binding
   * of `thisArg` and prepends any `partialArgs` to the arguments passed to the
   * bound function.
   *
   * @private
   * @param {Function|String} func The function to bind or the method name.
   * @param {Mixed} [thisArg] The `this` binding of `func`.
   * @param {Array} partialArgs An array of arguments to be partially applied.
   * @param {Object} [idicator] Used to indicate binding by key or partially
   *  applying arguments from the right.
   * @returns {Function} Returns the new bound function.
   */
  function createBound(func, thisArg, partialArgs, indicator) {
    var isFunc = isFunction(func),
        isPartial = !partialArgs,
        key = thisArg;

    // juggle arguments
    if (isPartial) {
      var rightIndicator = indicator;
      partialArgs = thisArg;
    }
    else if (!isFunc) {
      if (!indicator) {
        throw new TypeError;
      }
      thisArg = func;
    }

    function bound() {
      // `Function#bind` spec
      // http://es5.github.com/#x15.3.4.5
      var args = arguments,
          thisBinding = isPartial ? this : thisArg;

      if (!isFunc) {
        func = thisArg[key];
      }
      if (partialArgs.length) {
        args = args.length
          ? (args = nativeSlice.call(args), rightIndicator ? args.concat(partialArgs) : partialArgs.concat(args))
          : partialArgs;
      }
      if (this instanceof bound) {
        // ensure `new bound` is an instance of `func`
        thisBinding = createObject(func.prototype);

        // mimic the constructor's `return` behavior
        // http://es5.github.com/#x13.2.2
        var result = func.apply(thisBinding, args);
        return isObject(result) ? result : thisBinding;
      }
      return func.apply(thisBinding, args);
    }
    return bound;
  }

  /**
   * Creates a new object with the specified `prototype`.
   *
   * @private
   * @param {Object} prototype The prototype object.
   * @returns {Object} Returns the new object.
   */
  function createObject(prototype) {
    return isObject(prototype) ? nativeCreate(prototype) : {};
  }

  /**
   * A fallback implementation of `isPlainObject` which checks if a given `value`
   * is an object created by the `Object` constructor, assuming objects created
   * by the `Object` constructor have no inherited enumerable properties and that
   * there are no `Object.prototype` extensions.
   *
   * @private
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true`, if `value` is a plain object, else `false`.
   */
  function shimIsPlainObject(value) {
    var ctor,
        result;

    // avoid non Object objects, `arguments` objects, and DOM elements
    if (!(value && toString.call(value) == objectClass) ||
        (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
      return false;
    }
    // In most environments an object's own properties are iterated before
    // its inherited properties. If the last iterated property is an object's
    // own property then there are no inherited enumerable properties.
    forIn(value, function(value, key) {
      result = key;
    });
    return result === undefined || hasOwnProperty.call(value, result);
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Checks if `value` is an `arguments` object.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true`, if the `value` is an `arguments` object, else `false`.
   * @example
   *
   * (function() { return _.isArguments(arguments); })(1, 2, 3);
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  function isArguments(value) {
    return toString.call(value) == argsClass;
  }

  /**
   * Checks if `value` is an array.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true`, if the `value` is an array, else `false`.
   * @example
   *
   * (function() { return _.isArray(arguments); })();
   * // => false
   *
   * _.isArray([1, 2, 3]);
   * // => true
   */
  var isArray = nativeIsArray;

  /**
   * A fallback implementation of `Object.keys` which produces an array of the
   * given object's own enumerable property names.
   *
   * @private
   * @type Function
   * @param {Object} object The object to inspect.
   * @returns {Array} Returns a new array of property names.
   */
  var shimKeys = function (object) {
    var index, iterable = object, result = [];
    if (!iterable) return result;
    if (!(objectTypes[typeof object])) return result;    
      for (index in iterable) {
        if (hasOwnProperty.call(iterable, index)) {
          result.push(index);    
        }
      }    
    return result
  };

  /**
   * Creates an array composed of the own enumerable property names of `object`.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The object to inspect.
   * @returns {Array} Returns a new array of property names.
   * @example
   *
   * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
   * // => ['one', 'two', 'three'] (order is not guaranteed)
   */
  var keys = !nativeKeys ? shimKeys : function(object) {
    if (!isObject(object)) {
      return [];
    }
    return nativeKeys(object);
  };

  /*--------------------------------------------------------------------------*/

  /**
   * Assigns own enumerable properties of source object(s) to the destination
   * object. Subsequent sources will overwrite property assignments of previous
   * sources. If a `callback` function is passed, it will be executed to produce
   * the assigned values. The `callback` is bound to `thisArg` and invoked with
   * two arguments; (objectValue, sourceValue).
   *
   * @static
   * @memberOf _
   * @type Function
   * @alias extend
   * @category Objects
   * @param {Object} object The destination object.
   * @param {Object} [source1, source2, ...] The source objects.
   * @param {Function} [callback] The function to customize assigning values.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Object} Returns the destination object.
   * @example
   *
   * _.assign({ 'name': 'moe' }, { 'age': 40 });
   * // => { 'name': 'moe', 'age': 40 }
   *
   * var defaults = _.partialRight(_.assign, function(a, b) {
   *   return typeof a == 'undefined' ? b : a;
   * });
   *
   * var food = { 'name': 'apple' };
   * defaults(food, { 'name': 'banana', 'type': 'fruit' });
   * // => { 'name': 'apple', 'type': 'fruit' }
   */
  var assign = function (object, source, guard) {
    var index, iterable = object, result = iterable;
    if (!iterable) return result;
    var args = arguments,
        argsIndex = 0,
        argsLength = typeof guard == 'number' ? 2 : args.length;
    if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
      var callback = lodash.createCallback(args[--argsLength - 1], args[argsLength--], 2);
    } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
      callback = args[--argsLength];
    }
    while (++argsIndex < argsLength) {
      iterable = args[argsIndex];
      if (iterable && objectTypes[typeof iterable]) {    
      var ownIndex = -1,
          ownProps = objectTypes[typeof iterable] && keys(iterable),
          length = ownProps ? ownProps.length : 0;

      while (++ownIndex < length) {
        index = ownProps[ownIndex];
        result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];    
      }    
      }
    }
    return result
  };

  /**
   * Assigns own enumerable properties of source object(s) to the destination
   * object for all destination properties that resolve to `undefined`. Once a
   * property is set, additional defaults of the same property will be ignored.
   *
   * @static
   * @memberOf _
   * @type Function
   * @category Objects
   * @param {Object} object The destination object.
   * @param {Object} [source1, source2, ...] The source objects.
   * @param- {Object} [guard] Allows working with `_.reduce` without using its
   *  callback's `key` and `object` arguments as sources.
   * @returns {Object} Returns the destination object.
   * @example
   *
   * var food = { 'name': 'apple' };
   * _.defaults(food, { 'name': 'banana', 'type': 'fruit' });
   * // => { 'name': 'apple', 'type': 'fruit' }
   */
  var defaults = function (object, source, guard) {
    var index, iterable = object, result = iterable;
    if (!iterable) return result;
    var args = arguments,
        argsIndex = 0,
        argsLength = typeof guard == 'number' ? 2 : args.length;
    while (++argsIndex < argsLength) {
      iterable = args[argsIndex];
      if (iterable && objectTypes[typeof iterable]) {    
      var ownIndex = -1,
          ownProps = objectTypes[typeof iterable] && keys(iterable),
          length = ownProps ? ownProps.length : 0;

      while (++ownIndex < length) {
        index = ownProps[ownIndex];
        if (typeof result[index] == 'undefined') result[index] = iterable[index];    
      }    
      }
    }
    return result
  };

  /**
   * Iterates over `object`'s own and inherited enumerable properties, executing
   * the `callback` for each property. The `callback` is bound to `thisArg` and
   * invoked with three arguments; (value, key, object). Callbacks may exit iteration
   * early by explicitly returning `false`.
   *
   * @static
   * @memberOf _
   * @type Function
   * @category Objects
   * @param {Object} object The object to iterate over.
   * @param {Function} [callback=identity] The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Object} Returns `object`.
   * @example
   *
   * function Dog(name) {
   *   this.name = name;
   * }
   *
   * Dog.prototype.bark = function() {
   *   alert('Woof, woof!');
   * };
   *
   * _.forIn(new Dog('Dagny'), function(value, key) {
   *   alert(key);
   * });
   * // => alerts 'name' and 'bark' (order is not guaranteed)
   */
  var forIn = function (collection, callback, thisArg) {
    var index, iterable = collection, result = iterable;
    if (!iterable) return result;
    if (!objectTypes[typeof iterable]) return result;
    callback = callback && typeof thisArg == 'undefined' ? callback : lodash.createCallback(callback, thisArg);    
      for (index in iterable) {
        if (callback(iterable[index], index, collection) === false) return result;    
      }    
    return result
  };

  /**
   * Iterates over an object's own enumerable properties, executing the `callback`
   * for each property. The `callback` is bound to `thisArg` and invoked with three
   * arguments; (value, key, object). Callbacks may exit iteration early by explicitly
   * returning `false`.
   *
   * @static
   * @memberOf _
   * @type Function
   * @category Objects
   * @param {Object} object The object to iterate over.
   * @param {Function} [callback=identity] The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Object} Returns `object`.
   * @example
   *
   * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
   *   alert(key);
   * });
   * // => alerts '0', '1', and 'length' (order is not guaranteed)
   */
  var forOwn = function (collection, callback, thisArg) {
    var index, iterable = collection, result = iterable;
    if (!iterable) return result;
    if (!objectTypes[typeof iterable]) return result;
    callback = callback && typeof thisArg == 'undefined' ? callback : lodash.createCallback(callback, thisArg);    
      var ownIndex = -1,
          ownProps = objectTypes[typeof iterable] && keys(iterable),
          length = ownProps ? ownProps.length : 0;

      while (++ownIndex < length) {
        index = ownProps[ownIndex];
        if (callback(iterable[index], index, collection) === false) return result;    
      }    
    return result
  };

  /**
   * Creates a sorted array of all enumerable properties, own and inherited,
   * of `object` that have function values.
   *
   * @static
   * @memberOf _
   * @alias methods
   * @category Objects
   * @param {Object} object The object to inspect.
   * @returns {Array} Returns a new array of property names that have function values.
   * @example
   *
   * _.functions(_);
   * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
   */
  function functions(object) {
    var result = [];
    forIn(object, function(value, key) {
      if (isFunction(value)) {
        result.push(key);
      }
    });
    return result.sort();
  }

  /**
   * Performs a deep comparison between two values to determine if they are
   * equivalent to each other. If `callback` is passed, it will be executed to
   * compare values. If `callback` returns `undefined`, comparisons will be handled
   * by the method instead. The `callback` is bound to `thisArg` and invoked with
   * two arguments; (a, b).
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} a The value to compare.
   * @param {Mixed} b The other value to compare.
   * @param {Function} [callback] The function to customize comparing values.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @param- {Array} [stackA=[]] Tracks traversed `a` objects.
   * @param- {Array} [stackB=[]] Tracks traversed `b` objects.
   * @returns {Boolean} Returns `true`, if the values are equivalent, else `false`.
   * @example
   *
   * var moe = { 'name': 'moe', 'age': 40 };
   * var copy = { 'name': 'moe', 'age': 40 };
   *
   * moe == copy;
   * // => false
   *
   * _.isEqual(moe, copy);
   * // => true
   *
   * var words = ['hello', 'goodbye'];
   * var otherWords = ['hi', 'goodbye'];
   *
   * _.isEqual(words, otherWords, function(a, b) {
   *   var reGreet = /^(?:hello|hi)$/i,
   *       aGreet = _.isString(a) && reGreet.test(a),
   *       bGreet = _.isString(b) && reGreet.test(b);
   *
   *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
   * });
   * // => true
   */
  function isEqual(a, b, callback, thisArg, stackA, stackB) {
    // used to indicate that when comparing objects, `a` has at least the properties of `b`
    var whereIndicator = callback === indicatorObject;
    if (typeof callback == 'function' && !whereIndicator) {
      callback = lodash.createCallback(callback, thisArg, 2);
      var result = callback(a, b);
      if (typeof result != 'undefined') {
        return !!result;
      }
    }
    // exit early for identical values
    if (a === b) {
      // treat `+0` vs. `-0` as not equal
      return a !== 0 || (1 / a == 1 / b);
    }
    var type = typeof a,
        otherType = typeof b;

    // exit early for unlike primitive values
    if (a === a &&
        (!a || (type != 'function' && type != 'object')) &&
        (!b || (otherType != 'function' && otherType != 'object'))) {
      return false;
    }
    // exit early for `null` and `undefined`, avoiding ES3's Function#call behavior
    // http://es5.github.com/#x15.3.4.4
    if (a == null || b == null) {
      return a === b;
    }
    // compare [[Class]] names
    var className = toString.call(a),
        otherClass = toString.call(b);

    if (className == argsClass) {
      className = objectClass;
    }
    if (otherClass == argsClass) {
      otherClass = objectClass;
    }
    if (className != otherClass) {
      return false;
    }
    switch (className) {
      case boolClass:
      case dateClass:
        // coerce dates and booleans to numbers, dates to milliseconds and booleans
        // to `1` or `0`, treating invalid dates coerced to `NaN` as not equal
        return +a == +b;

      case numberClass:
        // treat `NaN` vs. `NaN` as equal
        return (a != +a)
          ? b != +b
          // but treat `+0` vs. `-0` as not equal
          : (a == 0 ? (1 / a == 1 / b) : a == +b);

      case regexpClass:
      case stringClass:
        // coerce regexes to strings (http://es5.github.com/#x15.10.6.4)
        // treat string primitives and their corresponding object instances as equal
        return a == String(b);
    }
    var isArr = className == arrayClass;
    if (!isArr) {
      // unwrap any `lodash` wrapped values
      if (hasOwnProperty.call(a, '__wrapped__ ') || hasOwnProperty.call(b, '__wrapped__')) {
        return isEqual(a.__wrapped__ || a, b.__wrapped__ || b, callback, thisArg, stackA, stackB);
      }
      // exit for functions and DOM nodes
      if (className != objectClass) {
        return false;
      }
      // in older versions of Opera, `arguments` objects have `Array` constructors
      var ctorA = a.constructor,
          ctorB = b.constructor;

      // non `Object` object instances with different constructors are not equal
      if (ctorA != ctorB && !(
            isFunction(ctorA) && ctorA instanceof ctorA &&
            isFunction(ctorB) && ctorB instanceof ctorB
          )) {
        return false;
      }
    }
    // assume cyclic structures are equal
    // the algorithm for detecting cyclic structures is adapted from ES 5.1
    // section 15.12.3, abstract operation `JO` (http://es5.github.com/#x15.12.3)
    var initedStack = !stackA;
    stackA || (stackA = getArray());
    stackB || (stackB = getArray());

    var length = stackA.length;
    while (length--) {
      if (stackA[length] == a) {
        return stackB[length] == b;
      }
    }
    var size = 0;
    result = true;

    // add `a` and `b` to the stack of traversed objects
    stackA.push(a);
    stackB.push(b);

    // recursively compare objects and arrays (susceptible to call stack limits)
    if (isArr) {
      length = a.length;
      size = b.length;

      // compare lengths to determine if a deep comparison is necessary
      result = size == a.length;
      if (!result && !whereIndicator) {
        return result;
      }
      // deep compare the contents, ignoring non-numeric properties
      while (size--) {
        var index = length,
            value = b[size];

        if (whereIndicator) {
          while (index--) {
            if ((result = isEqual(a[index], value, callback, thisArg, stackA, stackB))) {
              break;
            }
          }
        } else if (!(result = isEqual(a[size], value, callback, thisArg, stackA, stackB))) {
          break;
        }
      }
      return result;
    }
    // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
    // which, in this case, is more costly
    forIn(b, function(value, key, b) {
      if (hasOwnProperty.call(b, key)) {
        // count the number of properties.
        size++;
        // deep compare each property value.
        return (result = hasOwnProperty.call(a, key) && isEqual(a[key], value, callback, thisArg, stackA, stackB));
      }
    });

    if (result && !whereIndicator) {
      // ensure both objects have the same number of properties
      forIn(a, function(value, key, a) {
        if (hasOwnProperty.call(a, key)) {
          // `size` will be `-1` if `a` has more properties than `b`
          return (result = --size > -1);
        }
      });
    }
    if (initedStack) {
      releaseArray(stackA);
      releaseArray(stackB);
    }
    return result;
  }

  /**
   * Checks if `value` is a function.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true`, if the `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   */
  function isFunction(value) {
    return typeof value == 'function';
  }

  /**
   * Checks if `value` is the language type of Object.
   * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true`, if the `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(1);
   * // => false
   */
  function isObject(value) {
    // check if the value is the ECMAScript language type of Object
    // http://es5.github.com/#x8
    // and avoid a V8 bug
    // http://code.google.com/p/v8/issues/detail?id=2291
    return !!(value && objectTypes[typeof value]);
  }

  /**
   * Checks if a given `value` is an object created by the `Object` constructor.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true`, if `value` is a plain object, else `false`.
   * @example
   *
   * function Stooge(name, age) {
   *   this.name = name;
   *   this.age = age;
   * }
   *
   * _.isPlainObject(new Stooge('moe', 40));
   * // => false
   *
   * _.isPlainObject([1, 2, 3]);
   * // => false
   *
   * _.isPlainObject({ 'name': 'moe', 'age': 40 });
   * // => true
   */
  var isPlainObject = function(value) {
    if (!(value && toString.call(value) == objectClass)) {
      return false;
    }
    var valueOf = value.valueOf,
        objProto = typeof valueOf == 'function' && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

    return objProto
      ? (value == objProto || getPrototypeOf(value) == objProto)
      : shimIsPlainObject(value);
  };

  /**
   * Checks if `value` is a string.
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true`, if the `value` is a string, else `false`.
   * @example
   *
   * _.isString('moe');
   * // => true
   */
  function isString(value) {
    return typeof value == 'string' || toString.call(value) == stringClass;
  }

  /**
   * Recursively merges own enumerable properties of the source object(s), that
   * don't resolve to `undefined`, into the destination object. Subsequent sources
   * will overwrite property assignments of previous sources. If a `callback` function
   * is passed, it will be executed to produce the merged values of the destination
   * and source properties. If `callback` returns `undefined`, merging will be
   * handled by the method instead. The `callback` is bound to `thisArg` and
   * invoked with two arguments; (objectValue, sourceValue).
   *
   * @static
   * @memberOf _
   * @category Objects
   * @param {Object} object The destination object.
   * @param {Object} [source1, source2, ...] The source objects.
   * @param {Function} [callback] The function to customize merging properties.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @param- {Object} [deepIndicator] Indicates that `stackA` and `stackB` are
   *  arrays of traversed objects, instead of source objects.
   * @param- {Array} [stackA=[]] Tracks traversed source objects.
   * @param- {Array} [stackB=[]] Associates values with source counterparts.
   * @returns {Object} Returns the destination object.
   * @example
   *
   * var names = {
   *   'stooges': [
   *     { 'name': 'moe' },
   *     { 'name': 'larry' }
   *   ]
   * };
   *
   * var ages = {
   *   'stooges': [
   *     { 'age': 40 },
   *     { 'age': 50 }
   *   ]
   * };
   *
   * _.merge(names, ages);
   * // => { 'stooges': [{ 'name': 'moe', 'age': 40 }, { 'name': 'larry', 'age': 50 }] }
   *
   * var food = {
   *   'fruits': ['apple'],
   *   'vegetables': ['beet']
   * };
   *
   * var otherFood = {
   *   'fruits': ['banana'],
   *   'vegetables': ['carrot']
   * };
   *
   * _.merge(food, otherFood, function(a, b) {
   *   return _.isArray(a) ? a.concat(b) : undefined;
   * });
   * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
   */
  function merge(object, source, deepIndicator) {
    var args = arguments,
        index = 0,
        length = 2;

    if (!isObject(object)) {
      return object;
    }
    if (deepIndicator === indicatorObject) {
      var callback = args[3],
          stackA = args[4],
          stackB = args[5];
    } else {
      var initedStack = true;
      stackA = getArray();
      stackB = getArray();

      // allows working with `_.reduce` and `_.reduceRight` without
      // using their `callback` arguments, `index|key` and `collection`
      if (typeof deepIndicator != 'number') {
        length = args.length;
      }
      if (length > 3 && typeof args[length - 2] == 'function') {
        callback = lodash.createCallback(args[--length - 1], args[length--], 2);
      } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
      }
    }
    while (++index < length) {
      (isArray(args[index]) ? forEach : forOwn)(args[index], function(source, key) {
        var found,
            isArr,
            result = source,
            value = object[key];

        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
          // avoid merging previously merged cyclic sources
          var stackLength = stackA.length;
          while (stackLength--) {
            if ((found = stackA[stackLength] == source)) {
              value = stackB[stackLength];
              break;
            }
          }
          if (!found) {
            var isShallow;
            if (callback) {
              result = callback(value, source);
              if ((isShallow = typeof result != 'undefined')) {
                value = result;
              }
            }
            if (!isShallow) {
              value = isArr
                ? (isArray(value) ? value : [])
                : (isPlainObject(value) ? value : {});
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);

            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
              value = merge(value, source, indicatorObject, callback, stackA, stackB);
            }
          }
        }
        else {
          if (callback) {
            result = callback(value, source);
            if (typeof result == 'undefined') {
              result = source;
            }
          }
          if (typeof result != 'undefined') {
            value = result;
          }
        }
        object[key] = value;
      });
    }

    if (initedStack) {
      releaseArray(stackA);
      releaseArray(stackB);
    }
    return object;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Iterates over a `collection`, executing the `callback` for each element in
   * the `collection`. The `callback` is bound to `thisArg` and invoked with three
   * arguments; (value, index|key, collection). Callbacks may exit iteration early
   * by explicitly returning `false`.
   *
   * @static
   * @memberOf _
   * @alias each
   * @category Collections
   * @param {Array|Object|String} collection The collection to iterate over.
   * @param {Function} [callback=identity] The function called per iteration.
   * @param {Mixed} [thisArg] The `this` binding of `callback`.
   * @returns {Array|Object|String} Returns `collection`.
   * @example
   *
   * _([1, 2, 3]).forEach(alert).join(',');
   * // => alerts each number and returns '1,2,3'
   *
   * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, alert);
   * // => alerts each number value (order is not guaranteed)
   */
  function forEach(collection, callback, thisArg) {
    var index = -1,
        length = collection ? collection.length : 0;

    callback = callback && typeof thisArg == 'undefined' ? callback : lodash.createCallback(callback, thisArg);
    if (typeof length == 'number') {
      while (++index < length) {
        if (callback(collection[index], index, collection) === false) {
          break;
        }
      }
    } else {
      forOwn(collection, callback);
    }
    return collection;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Creates a function that, when called, invokes `func` with the `this`
   * binding of `thisArg` and prepends any additional `bind` arguments to those
   * passed to the bound function.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Function} func The function to bind.
   * @param {Mixed} [thisArg] The `this` binding of `func`.
   * @param {Mixed} [arg1, arg2, ...] Arguments to be partially applied.
   * @returns {Function} Returns the new bound function.
   * @example
   *
   * var func = function(greeting) {
   *   return greeting + ' ' + this.name;
   * };
   *
   * func = _.bind(func, { 'name': 'moe' }, 'hi');
   * func();
   * // => 'hi moe'
   */
  function bind(func, thisArg) {
    // use `Function#bind` if it exists and is fast
    // (in V8 `Function#bind` is slower except when partially applied)
    return support.fastBind || (nativeBind && arguments.length > 2)
      ? nativeBind.call.apply(nativeBind, arguments)
      : createBound(func, thisArg, nativeSlice.call(arguments, 2));
  }

  /**
   * Binds methods on `object` to `object`, overwriting the existing method.
   * Method names may be specified as individual arguments or as arrays of method
   * names. If no method names are provided, all the function properties of `object`
   * will be bound.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Object} object The object to bind and assign the bound methods to.
   * @param {String} [methodName1, methodName2, ...] Method names on the object to bind.
   * @returns {Object} Returns `object`.
   * @example
   *
   * var view = {
   *  'label': 'docs',
   *  'onClick': function() { alert('clicked ' + this.label); }
   * };
   *
   * _.bindAll(view);
   * jQuery('#docs').on('click', view.onClick);
   * // => alerts 'clicked docs', when the button is clicked
   */
  function bindAll(object) {
    var funcs = arguments.length > 1 ? concat.apply(arrayRef, nativeSlice.call(arguments, 1)) : functions(object),
        index = -1,
        length = funcs.length;

    while (++index < length) {
      var key = funcs[index];
      object[key] = bind(object[key], object);
    }
    return object;
  }

  /**
   * Produces a callback bound to an optional `thisArg`. If `func` is a property
   * name, the created callback will return the property value for a given element.
   * If `func` is an object, the created callback will return `true` for elements
   * that contain the equivalent object properties, otherwise it will return `false`.
   *
   * Note: All Lo-Dash methods, that accept a `callback` argument, use `_.createCallback`.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Mixed} [func=identity] The value to convert to a callback.
   * @param {Mixed} [thisArg] The `this` binding of the created callback.
   * @param {Number} [argCount=3] The number of arguments the callback accepts.
   * @returns {Function} Returns a callback function.
   * @example
   *
   * var stooges = [
   *   { 'name': 'moe', 'age': 40 },
   *   { 'name': 'larry', 'age': 50 }
   * ];
   *
   * // wrap to create custom callback shorthands
   * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
   *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
   *   return !match ? func(callback, thisArg) : function(object) {
   *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
   *   };
   * });
   *
   * _.filter(stooges, 'age__gt45');
   * // => [{ 'name': 'larry', 'age': 50 }]
   *
   * // create mixins with support for "_.pluck" and "_.where" callback shorthands
   * _.mixin({
   *   'toLookup': function(collection, callback, thisArg) {
   *     callback = _.createCallback(callback, thisArg);
   *     return _.reduce(collection, function(result, value, index, collection) {
   *       return (result[callback(value, index, collection)] = value, result);
   *     }, {});
   *   }
   * });
   *
   * _.toLookup(stooges, 'name');
   * // => { 'moe': { 'name': 'moe', 'age': 40 }, 'larry': { 'name': 'larry', 'age': 50 } }
   */
  function createCallback(func, thisArg, argCount) {
    if (func == null) {
      return identity;
    }
    var type = typeof func;
    if (type != 'function') {
      if (type != 'object') {
        return function(object) {
          return object[func];
        };
      }
      var props = keys(func);
      return function(object) {
        var length = props.length,
            result = false;
        while (length--) {
          if (!(result = isEqual(object[props[length]], func[props[length]], indicatorObject))) {
            break;
          }
        }
        return result;
      };
    }
    if (typeof thisArg == 'undefined' || (reThis && !reThis.test(fnToString.call(func)))) {
      return func;
    }
    if (argCount === 1) {
      return function(value) {
        return func.call(thisArg, value);
      };
    }
    if (argCount === 2) {
      return function(a, b) {
        return func.call(thisArg, a, b);
      };
    }
    if (argCount === 4) {
      return function(accumulator, value, index, collection) {
        return func.call(thisArg, accumulator, value, index, collection);
      };
    }
    return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
  }

  /**
   * Creates a function that will delay the execution of `func` until after
   * `wait` milliseconds have elapsed since the last time it was invoked. Pass
   * an `options` object to indicate that `func` should be invoked on the leading
   * and/or trailing edge of the `wait` timeout. Subsequent calls to the debounced
   * function will return the result of the last `func` call.
   *
   * Note: If `leading` and `trailing` options are `true`, `func` will be called
   * on the trailing edge of the timeout only if the the debounced function is
   * invoked more than once during the `wait` timeout.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Function} func The function to debounce.
   * @param {Number} wait The number of milliseconds to delay.
   * @param {Object} options The options object.
   *  [leading=false] A boolean to specify execution on the leading edge of the timeout.
   *  [maxWait] The maximum time `func` is allowed to be delayed before it's called.
   *  [trailing=true] A boolean to specify execution on the trailing edge of the timeout.
   * @returns {Function} Returns the new debounced function.
   * @example
   *
   * var lazyLayout = _.debounce(calculateLayout, 300);
   * jQuery(window).on('resize', lazyLayout);
   *
   * jQuery('#postbox').on('click', _.debounce(sendMail, 200, {
   *   'leading': true,
   *   'trailing': false
   * });
   */
  function debounce(func, wait, options) {
    var args,
        result,
        thisArg,
        callCount = 0,
        lastCalled = 0,
        maxWait = false,
        maxTimeoutId = null,
        timeoutId = null,
        trailing = true;

    function clear() {
      clearTimeout(maxTimeoutId);
      clearTimeout(timeoutId);
      callCount = 0;
      maxTimeoutId = timeoutId = null;
    }

    function delayed() {
      var isCalled = trailing && (!leading || callCount > 1);
      clear();
      if (isCalled) {
        if (maxWait !== false) {
          lastCalled = new Date;
        }
        result = func.apply(thisArg, args);
      }
    }

    function maxDelayed() {
      clear();
      if (trailing || (maxWait !== wait)) {
        lastCalled = new Date;
        result = func.apply(thisArg, args);
      }
    }

    wait = nativeMax(0, wait || 0);
    if (options === true) {
      var leading = true;
      trailing = false;
    } else if (isObject(options)) {
      leading = options.leading;
      maxWait = 'maxWait' in options && nativeMax(wait, options.maxWait || 0);
      trailing = 'trailing' in options ? options.trailing : trailing;
    }
    return function() {
      args = arguments;
      thisArg = this;
      callCount++;

      // avoid issues with Titanium and `undefined` timeout ids
      // https://github.com/appcelerator/titanium_mobile/blob/3_1_0_GA/android/titanium/src/java/ti/modules/titanium/TitaniumModule.java#L185-L192
      clearTimeout(timeoutId);

      if (maxWait === false) {
        if (leading && callCount < 2) {
          result = func.apply(thisArg, args);
        }
      } else {
        var now = new Date;
        if (!maxTimeoutId && !leading) {
          lastCalled = now;
        }
        var remaining = maxWait - (now - lastCalled);
        if (remaining <= 0) {
          clearTimeout(maxTimeoutId);
          maxTimeoutId = null;
          lastCalled = now;
          result = func.apply(thisArg, args);
        }
        else if (!maxTimeoutId) {
          maxTimeoutId = setTimeout(maxDelayed, remaining);
        }
      }
      if (wait !== maxWait) {
        timeoutId = setTimeout(delayed, wait);
      }
      return result;
    };
  }

  /**
   * Creates a function that, when executed, will only call the `func` function
   * at most once per every `wait` milliseconds. Pass an `options` object to
   * indicate that `func` should be invoked on the leading and/or trailing edge
   * of the `wait` timeout. Subsequent calls to the throttled function will
   * return the result of the last `func` call.
   *
   * Note: If `leading` and `trailing` options are `true`, `func` will be called
   * on the trailing edge of the timeout only if the the throttled function is
   * invoked more than once during the `wait` timeout.
   *
   * @static
   * @memberOf _
   * @category Functions
   * @param {Function} func The function to throttle.
   * @param {Number} wait The number of milliseconds to throttle executions to.
   * @param {Object} options The options object.
   *  [leading=true] A boolean to specify execution on the leading edge of the timeout.
   *  [trailing=true] A boolean to specify execution on the trailing edge of the timeout.
   * @returns {Function} Returns the new throttled function.
   * @example
   *
   * var throttled = _.throttle(updatePosition, 100);
   * jQuery(window).on('scroll', throttled);
   *
   * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
   *   'trailing': false
   * }));
   */
  function throttle(func, wait, options) {
    var leading = true,
        trailing = true;

    if (options === false) {
      leading = false;
    } else if (isObject(options)) {
      leading = 'leading' in options ? options.leading : leading;
      trailing = 'trailing' in options ? options.trailing : trailing;
    }
    options = getObject();
    options.leading = leading;
    options.maxWait = wait;
    options.trailing = trailing;

    var result = debounce(func, wait, options);
    releaseObject(options);
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * This method returns the first argument passed to it.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Mixed} value Any value.
   * @returns {Mixed} Returns `value`.
   * @example
   *
   * var moe = { 'name': 'moe' };
   * moe === _.identity(moe);
   * // => true
   */
  function identity(value) {
    return value;
  }

  /*--------------------------------------------------------------------------*/

  lodash.assign = assign;
  lodash.bind = bind;
  lodash.bindAll = bindAll;
  lodash.createCallback = createCallback;
  lodash.debounce = debounce;
  lodash.defaults = defaults;
  lodash.forEach = forEach;
  lodash.forIn = forIn;
  lodash.forOwn = forOwn;
  lodash.functions = functions;
  lodash.keys = keys;
  lodash.merge = merge;
  lodash.throttle = throttle;

  lodash.each = forEach;
  lodash.extend = assign;
  lodash.methods = functions;

  /*--------------------------------------------------------------------------*/

  lodash.identity = identity;
  lodash.isArguments = isArguments;
  lodash.isArray = isArray;
  lodash.isEqual = isEqual;
  lodash.isFunction = isFunction;
  lodash.isObject = isObject;
  lodash.isPlainObject = isPlainObject;
  lodash.isString = isString;

  /*--------------------------------------------------------------------------*/

  /**
   * The semantic version number.
   *
   * @static
   * @memberOf _
   * @type String
   */
  lodash.VERSION = '1.3.1';

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  // some AMD build optimizers, like r.js, check for specific condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash was injected by a third-party script and not intended to be
    // loaded as a module. The global assignment can be reverted in the Lo-Dash
    // module via its `noConflict()` method.
    window._ = lodash;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define(function() {
      return lodash;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && !freeExports.nodeType) {
    // in Node.js or RingoJS v0.8.0+
    if (freeModule) {
      (freeModule.exports = lodash)._ = lodash;
    }
    // in Narwhal or RingoJS v0.7.0-
    else {
      freeExports._ = lodash;
    }
  }
  else {
    // in a browser or Rhino
    window._ = lodash;
  }
}(this));

},{}]},{},[12])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvanBpbGxvcmEvQ29kZS9Ob2RlL3Bub2RlL2Jyb3dzZXIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi9ldmVudHMuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9Ob2RlL3Bub2RlL2Jyb3dzZXIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi9mcy5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL05vZGUvcG5vZGUvYnJvd3Nlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9idWlsdGluL3BhdGguanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9Ob2RlL3Bub2RlL2Jyb3dzZXIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi9xdWVyeXN0cmluZy5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL05vZGUvcG5vZGUvYnJvd3Nlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9idWlsdGluL3N0cmVhbS5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL05vZGUvcG5vZGUvYnJvd3Nlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9idWlsdGluL3VybC5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL05vZGUvcG5vZGUvYnJvd3Nlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9idWlsdGluL3V0aWwuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9Ob2RlL3Bub2RlL2Jyb3dzZXIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9lbXB0eS5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL05vZGUvcG5vZGUvYnJvd3Nlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9Ob2RlL3Bub2RlL2Jyb3dzZXIvbm9kZV9tb2R1bGVzL3Nob2UvYnJvd3Nlci5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL05vZGUvcG5vZGUvYnJvd3Nlci9ub2RlX21vZHVsZXMvc2hvZS9ub2RlX21vZHVsZXMvc29ja2pzLWNsaWVudC9zb2NranMuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9Ob2RlL3Bub2RlL2Jyb3dzZXIvc3JjL2luZGV4LmNvZmZlZSIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL05vZGUvcG5vZGUvYnJvd3Nlci9zcmMvdHJhbnNwb3J0cy93cy5jb2ZmZWUiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9Ob2RlL3Bub2RlL25vZGVfbW9kdWxlcy9kbm9kZS9icm93c2VyLmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTm9kZS9wbm9kZS9ub2RlX21vZHVsZXMvZG5vZGUvbGliL2Rub2RlLmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTm9kZS9wbm9kZS9ub2RlX21vZHVsZXMvZG5vZGUvbm9kZV9tb2R1bGVzL2Rub2RlLXByb3RvY29sL2luZGV4LmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTm9kZS9wbm9kZS9ub2RlX21vZHVsZXMvZG5vZGUvbm9kZV9tb2R1bGVzL2Rub2RlLXByb3RvY29sL2xpYi9mb3JlYWNoLmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTm9kZS9wbm9kZS9ub2RlX21vZHVsZXMvZG5vZGUvbm9kZV9tb2R1bGVzL2Rub2RlLXByb3RvY29sL2xpYi9pc19lbnVtLmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTm9kZS9wbm9kZS9ub2RlX21vZHVsZXMvZG5vZGUvbm9kZV9tb2R1bGVzL2Rub2RlLXByb3RvY29sL2xpYi9rZXlzLmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTm9kZS9wbm9kZS9ub2RlX21vZHVsZXMvZG5vZGUvbm9kZV9tb2R1bGVzL2Rub2RlLXByb3RvY29sL2xpYi9zY3J1Yi5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL05vZGUvcG5vZGUvbm9kZV9tb2R1bGVzL2Rub2RlL25vZGVfbW9kdWxlcy9kbm9kZS1wcm90b2NvbC9ub2RlX21vZHVsZXMvdHJhdmVyc2UvaW5kZXguanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9Ob2RlL3Bub2RlL25vZGVfbW9kdWxlcy9kbm9kZS9ub2RlX21vZHVsZXMvanNvbmlmeS9pbmRleC5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL05vZGUvcG5vZGUvbm9kZV9tb2R1bGVzL2Rub2RlL25vZGVfbW9kdWxlcy9qc29uaWZ5L2xpYi9wYXJzZS5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL05vZGUvcG5vZGUvbm9kZV9tb2R1bGVzL2Rub2RlL25vZGVfbW9kdWxlcy9qc29uaWZ5L2xpYi9zdHJpbmdpZnkuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9Ob2RlL3Bub2RlL291dC9iYXNlLmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTm9kZS9wbm9kZS9vdXQvY2xpZW50LmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTm9kZS9wbm9kZS9vdXQvaGVscGVyLmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTm9kZS9wbm9kZS9vdXQvaW5kZXguanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9Ob2RlL3Bub2RlL291dC9wZWVyLmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTm9kZS9wbm9kZS9vdXQvc2VydmVyLmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTm9kZS9wbm9kZS9vdXQvdHJhbnNwb3J0cy9pbmRleC5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL05vZGUvcG5vZGUvdmVuZG9yL2xvZGFzaC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xNQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1bEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pWQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbnhFQSxJQUFBLENBQUE7O0FBQUEsQ0FBQSxFQUFRLEVBQVIsRUFBUSxDQUFBOztBQUVSLENBRkEsQ0FFeUIsRUFBekIsQ0FBSyxFQUFvQixLQUF6QixZQUF5Qjs7QUFFekIsQ0FKQSxFQUllLEVBQWYsQ0FBTTs7OztBQ0pOLElBQUE7R0FBQSxlQUFBOztBQUFBLENBQUEsRUFBTyxDQUFQLEVBQU8sQ0FBQTs7QUFHUCxDQUhBLEVBR2dCLEVBQWhCLEVBQU8sRUFBVTtDQUNmLEdBQUEsRUFBQTtDQUFBLENBQUEsQ0FBTyxDQUFQO0FBRUcsQ0FBSCxDQUFBLENBQUcsQ0FBQSxDQUFjLENBQWQsRUFBQSxFQUFxQztDQUN0QyxFQUFBLENBQUEsS0FBTztJQUhUO0NBSUEsRUFBTyxNQUFBO0NBTE87O0FBT2hCLENBVkEsRUFVcUIsSUFBZCxFQUFjLENBQXJCO0NBRUUsT0FBTSxtQkFBTjtDQUZtQjs7QUFJckIsQ0FkQSxFQWNxQixJQUFkLEVBQWMsQ0FBckI7Q0FDRSxLQUFBLE1BQUE7Q0FBQSxDQURvQixxREFDcEI7Q0FBQSxDQUFBLENBQVMsQ0FBVCxFQUFBO0NBQ08sRUFBaUIsR0FBbEIsRUFBa0IsQ0FBeEIsT0FBQTtDQUNXLENBQWlCLEVBQWIsQ0FBSixHQUFULEdBQUE7Q0FERixFQUF3QjtDQUZMOzs7O0FDZHJCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFRBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbInZhciBwcm9jZXNzPXJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKTtpZiAoIXByb2Nlc3MuRXZlbnRFbWl0dGVyKSBwcm9jZXNzLkV2ZW50RW1pdHRlciA9IGZ1bmN0aW9uICgpIHt9O1xuXG52YXIgRXZlbnRFbWl0dGVyID0gZXhwb3J0cy5FdmVudEVtaXR0ZXIgPSBwcm9jZXNzLkV2ZW50RW1pdHRlcjtcbnZhciBpc0FycmF5ID0gdHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbidcbiAgICA/IEFycmF5LmlzQXJyYXlcbiAgICA6IGZ1bmN0aW9uICh4cykge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJ1xuICAgIH1cbjtcbmZ1bmN0aW9uIGluZGV4T2YgKHhzLCB4KSB7XG4gICAgaWYgKHhzLmluZGV4T2YpIHJldHVybiB4cy5pbmRleE9mKHgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHggPT09IHhzW2ldKSByZXR1cm4gaTtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuXG4vLyAxMCBsaXN0ZW5lcnMgYXJlIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2hcbi8vIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuLy9cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG52YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyA9IG47XG59O1xuXG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzQXJyYXkodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpXG4gICAge1xuICAgICAgaWYgKGFyZ3VtZW50c1sxXSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGFyZ3VtZW50c1sxXTsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuY2F1Z2h0LCB1bnNwZWNpZmllZCAnZXJyb3InIGV2ZW50LlwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIGZhbHNlO1xuICB2YXIgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgaWYgKCFoYW5kbGVyKSByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBoYW5kbGVyID09ICdmdW5jdGlvbicpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKGlzQXJyYXkoaGFuZGxlcikpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICB2YXIgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuLy8gRXZlbnRFbWl0dGVyIGlzIGRlZmluZWQgaW4gc3JjL25vZGVfZXZlbnRzLmNjXG4vLyBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQoKSBpcyBhbHNvIGRlZmluZWQgdGhlcmUuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBsaXN0ZW5lcikge1xuICAgIHRocm93IG5ldyBFcnJvcignYWRkTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09IFwibmV3TGlzdGVuZXJzXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyc1wiLlxuICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB7XG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIH0gZWxzZSBpZiAoaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG5cbiAgICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgICAgdmFyIG07XG4gICAgICBpZiAodGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG0gPSB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbSA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgICB9XG5cbiAgICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIH0gZWxzZSB7XG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLm9uKHR5cGUsIGZ1bmN0aW9uIGcoKSB7XG4gICAgc2VsZi5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcbiAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIGxpc3RlbmVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdyZW1vdmVMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0FycmF5KGxpc3QpKSB7XG4gICAgdmFyIGkgPSBpbmRleE9mKGxpc3QsIGxpc3RlbmVyKTtcbiAgICBpZiAoaSA8IDApIHJldHVybiB0aGlzO1xuICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgIGlmIChsaXN0Lmxlbmd0aCA9PSAwKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgfSBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0gPT09IGxpc3RlbmVyKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBkb2VzIG5vdCB1c2UgbGlzdGVuZXJzKCksIHNvIG5vIHNpZGUgZWZmZWN0IG9mIGNyZWF0aW5nIF9ldmVudHNbdHlwZV1cbiAgaWYgKHR5cGUgJiYgdGhpcy5fZXZlbnRzICYmIHRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gbnVsbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gW107XG4gIGlmICghaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2V2ZW50c1t0eXBlXTtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKHR5cGVvZiBlbWl0dGVyLl9ldmVudHNbdHlwZV0gPT09ICdmdW5jdGlvbicpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuIiwiLy8gbm90aGluZyB0byBzZWUgaGVyZS4uLiBubyBmaWxlIG1ldGhvZHMgZm9yIHRoZSBicm93c2VyXG4iLCJ2YXIgcHJvY2Vzcz1yZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIik7ZnVuY3Rpb24gZmlsdGVyICh4cywgZm4pIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZm4oeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYXN0ID0gcGFydHNbaV07XG4gICAgaWYgKGxhc3QgPT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBSZWdleCB0byBzcGxpdCBhIGZpbGVuYW1lIGludG8gWyosIGRpciwgYmFzZW5hbWUsIGV4dF1cbi8vIHBvc2l4IHZlcnNpb25cbnZhciBzcGxpdFBhdGhSZSA9IC9eKC4rXFwvKD8hJCl8XFwvKT8oKD86Lis/KT8oXFwuW14uXSopPykkLztcblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG52YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG5mb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aDsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gIHZhciBwYXRoID0gKGkgPj0gMClcbiAgICAgID8gYXJndW1lbnRzW2ldXG4gICAgICA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycgfHwgIXBhdGgpIHtcbiAgICBjb250aW51ZTtcbiAgfVxuXG4gIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufVxuXG4vLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4vLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuLy8gTm9ybWFsaXplIHRoZSBwYXRoXG5yZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG52YXIgaXNBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLycsXG4gICAgdHJhaWxpbmdTbGFzaCA9IHBhdGguc2xpY2UoLTEpID09PSAnLyc7XG5cbi8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxucGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuICBcbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgcmV0dXJuIHAgJiYgdHlwZW9mIHAgPT09ICdzdHJpbmcnO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBkaXIgPSBzcGxpdFBhdGhSZS5leGVjKHBhdGgpWzFdIHx8ICcnO1xuICB2YXIgaXNXaW5kb3dzID0gZmFsc2U7XG4gIGlmICghZGlyKSB7XG4gICAgLy8gTm8gZGlybmFtZVxuICAgIHJldHVybiAnLic7XG4gIH0gZWxzZSBpZiAoZGlyLmxlbmd0aCA9PT0gMSB8fFxuICAgICAgKGlzV2luZG93cyAmJiBkaXIubGVuZ3RoIDw9IDMgJiYgZGlyLmNoYXJBdCgxKSA9PT0gJzonKSkge1xuICAgIC8vIEl0IGlzIGp1c3QgYSBzbGFzaCBvciBhIGRyaXZlIGxldHRlciB3aXRoIGEgc2xhc2hcbiAgICByZXR1cm4gZGlyO1xuICB9IGVsc2Uge1xuICAgIC8vIEl0IGlzIGEgZnVsbCBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIHJldHVybiBkaXIuc3Vic3RyaW5nKDAsIGRpci5sZW5ndGggLSAxKTtcbiAgfVxufTtcblxuXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gc3BsaXRQYXRoUmUuZXhlYyhwYXRoKVsyXSB8fCAnJztcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xuICAgIGYgPSBmLnN1YnN0cigwLCBmLmxlbmd0aCAtIGV4dC5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBmO1xufTtcblxuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBzcGxpdFBhdGhSZS5leGVjKHBhdGgpWzNdIHx8ICcnO1xufTtcblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxuZXhwb3J0cy5zZXAgPSAnLyc7XG4iLCJcbi8qKlxuICogT2JqZWN0I3RvU3RyaW5nKCkgcmVmIGZvciBzdHJpbmdpZnkoKS5cbiAqL1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIEFycmF5I2luZGV4T2Ygc2hpbS5cbiAqL1xuXG52YXIgaW5kZXhPZiA9IHR5cGVvZiBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJ1xuICA/IGZ1bmN0aW9uKGFyciwgZWwpIHsgcmV0dXJuIGFyci5pbmRleE9mKGVsKTsgfVxuICA6IGZ1bmN0aW9uKGFyciwgZWwpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhcnJbaV0gPT09IGVsKSByZXR1cm4gaTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9O1xuXG4vKipcbiAqIEFycmF5LmlzQXJyYXkgc2hpbS5cbiAqL1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24oYXJyKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKGFycikgPT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbi8qKlxuICogT2JqZWN0LmtleXMgc2hpbS5cbiAqL1xuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uKG9iaikge1xuICB2YXIgcmV0ID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHJldC5wdXNoKGtleSk7XG4gIHJldHVybiByZXQ7XG59O1xuXG4vKipcbiAqIEFycmF5I2ZvckVhY2ggc2hpbS5cbiAqL1xuXG52YXIgZm9yRWFjaCA9IHR5cGVvZiBBcnJheS5wcm90b3R5cGUuZm9yRWFjaCA9PT0gJ2Z1bmN0aW9uJ1xuICA/IGZ1bmN0aW9uKGFyciwgZm4pIHsgcmV0dXJuIGFyci5mb3JFYWNoKGZuKTsgfVxuICA6IGZ1bmN0aW9uKGFyciwgZm4pIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSBmbihhcnJbaV0pO1xuICAgIH07XG5cbi8qKlxuICogQXJyYXkjcmVkdWNlIHNoaW0uXG4gKi9cblxudmFyIHJlZHVjZSA9IGZ1bmN0aW9uKGFyciwgZm4sIGluaXRpYWwpIHtcbiAgaWYgKHR5cGVvZiBhcnIucmVkdWNlID09PSAnZnVuY3Rpb24nKSByZXR1cm4gYXJyLnJlZHVjZShmbiwgaW5pdGlhbCk7XG4gIHZhciByZXMgPSBpbml0aWFsO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcmVzID0gZm4ocmVzLCBhcnJbaV0pO1xuICByZXR1cm4gcmVzO1xufTtcblxuLyoqXG4gKiBDYWNoZSBub24taW50ZWdlciB0ZXN0IHJlZ2V4cC5cbiAqL1xuXG52YXIgaXNpbnQgPSAvXlswLTldKyQvO1xuXG5mdW5jdGlvbiBwcm9tb3RlKHBhcmVudCwga2V5KSB7XG4gIGlmIChwYXJlbnRba2V5XS5sZW5ndGggPT0gMCkgcmV0dXJuIHBhcmVudFtrZXldID0ge307XG4gIHZhciB0ID0ge307XG4gIGZvciAodmFyIGkgaW4gcGFyZW50W2tleV0pIHRbaV0gPSBwYXJlbnRba2V5XVtpXTtcbiAgcGFyZW50W2tleV0gPSB0O1xuICByZXR1cm4gdDtcbn1cblxuZnVuY3Rpb24gcGFyc2UocGFydHMsIHBhcmVudCwga2V5LCB2YWwpIHtcbiAgdmFyIHBhcnQgPSBwYXJ0cy5zaGlmdCgpO1xuICAvLyBlbmRcbiAgaWYgKCFwYXJ0KSB7XG4gICAgaWYgKGlzQXJyYXkocGFyZW50W2tleV0pKSB7XG4gICAgICBwYXJlbnRba2V5XS5wdXNoKHZhbCk7XG4gICAgfSBlbHNlIGlmICgnb2JqZWN0JyA9PSB0eXBlb2YgcGFyZW50W2tleV0pIHtcbiAgICAgIHBhcmVudFtrZXldID0gdmFsO1xuICAgIH0gZWxzZSBpZiAoJ3VuZGVmaW5lZCcgPT0gdHlwZW9mIHBhcmVudFtrZXldKSB7XG4gICAgICBwYXJlbnRba2V5XSA9IHZhbDtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG4gICAgfVxuICAgIC8vIGFycmF5XG4gIH0gZWxzZSB7XG4gICAgdmFyIG9iaiA9IHBhcmVudFtrZXldID0gcGFyZW50W2tleV0gfHwgW107XG4gICAgaWYgKCddJyA9PSBwYXJ0KSB7XG4gICAgICBpZiAoaXNBcnJheShvYmopKSB7XG4gICAgICAgIGlmICgnJyAhPSB2YWwpIG9iai5wdXNoKHZhbCk7XG4gICAgICB9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBvYmopIHtcbiAgICAgICAgb2JqW29iamVjdEtleXMob2JqKS5sZW5ndGhdID0gdmFsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2JqID0gcGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG4gICAgICB9XG4gICAgICAvLyBwcm9wXG4gICAgfSBlbHNlIGlmICh+aW5kZXhPZihwYXJ0LCAnXScpKSB7XG4gICAgICBwYXJ0ID0gcGFydC5zdWJzdHIoMCwgcGFydC5sZW5ndGggLSAxKTtcbiAgICAgIGlmICghaXNpbnQudGVzdChwYXJ0KSAmJiBpc0FycmF5KG9iaikpIG9iaiA9IHByb21vdGUocGFyZW50LCBrZXkpO1xuICAgICAgcGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcbiAgICAgIC8vIGtleVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcbiAgICAgIHBhcnNlKHBhcnRzLCBvYmosIHBhcnQsIHZhbCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTWVyZ2UgcGFyZW50IGtleS92YWwgcGFpci5cbiAqL1xuXG5mdW5jdGlvbiBtZXJnZShwYXJlbnQsIGtleSwgdmFsKXtcbiAgaWYgKH5pbmRleE9mKGtleSwgJ10nKSkge1xuICAgIHZhciBwYXJ0cyA9IGtleS5zcGxpdCgnWycpXG4gICAgICAsIGxlbiA9IHBhcnRzLmxlbmd0aFxuICAgICAgLCBsYXN0ID0gbGVuIC0gMTtcbiAgICBwYXJzZShwYXJ0cywgcGFyZW50LCAnYmFzZScsIHZhbCk7XG4gICAgLy8gb3B0aW1pemVcbiAgfSBlbHNlIHtcbiAgICBpZiAoIWlzaW50LnRlc3Qoa2V5KSAmJiBpc0FycmF5KHBhcmVudC5iYXNlKSkge1xuICAgICAgdmFyIHQgPSB7fTtcbiAgICAgIGZvciAodmFyIGsgaW4gcGFyZW50LmJhc2UpIHRba10gPSBwYXJlbnQuYmFzZVtrXTtcbiAgICAgIHBhcmVudC5iYXNlID0gdDtcbiAgICB9XG4gICAgc2V0KHBhcmVudC5iYXNlLCBrZXksIHZhbCk7XG4gIH1cblxuICByZXR1cm4gcGFyZW50O1xufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBvYmouXG4gKi9cblxuZnVuY3Rpb24gcGFyc2VPYmplY3Qob2JqKXtcbiAgdmFyIHJldCA9IHsgYmFzZToge30gfTtcbiAgZm9yRWFjaChvYmplY3RLZXlzKG9iaiksIGZ1bmN0aW9uKG5hbWUpe1xuICAgIG1lcmdlKHJldCwgbmFtZSwgb2JqW25hbWVdKTtcbiAgfSk7XG4gIHJldHVybiByZXQuYmFzZTtcbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gc3RyLlxuICovXG5cbmZ1bmN0aW9uIHBhcnNlU3RyaW5nKHN0cil7XG4gIHJldHVybiByZWR1Y2UoU3RyaW5nKHN0cikuc3BsaXQoJyYnKSwgZnVuY3Rpb24ocmV0LCBwYWlyKXtcbiAgICB2YXIgZXFsID0gaW5kZXhPZihwYWlyLCAnPScpXG4gICAgICAsIGJyYWNlID0gbGFzdEJyYWNlSW5LZXkocGFpcilcbiAgICAgICwga2V5ID0gcGFpci5zdWJzdHIoMCwgYnJhY2UgfHwgZXFsKVxuICAgICAgLCB2YWwgPSBwYWlyLnN1YnN0cihicmFjZSB8fCBlcWwsIHBhaXIubGVuZ3RoKVxuICAgICAgLCB2YWwgPSB2YWwuc3Vic3RyKGluZGV4T2YodmFsLCAnPScpICsgMSwgdmFsLmxlbmd0aCk7XG5cbiAgICAvLyA/Zm9vXG4gICAgaWYgKCcnID09IGtleSkga2V5ID0gcGFpciwgdmFsID0gJyc7XG4gICAgaWYgKCcnID09IGtleSkgcmV0dXJuIHJldDtcblxuICAgIHJldHVybiBtZXJnZShyZXQsIGRlY29kZShrZXkpLCBkZWNvZGUodmFsKSk7XG4gIH0sIHsgYmFzZToge30gfSkuYmFzZTtcbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gcXVlcnkgYHN0cmAgb3IgYG9iamAsIHJldHVybmluZyBhbiBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0ciB8IHtPYmplY3R9IG9ialxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24oc3RyKXtcbiAgaWYgKG51bGwgPT0gc3RyIHx8ICcnID09IHN0cikgcmV0dXJuIHt9O1xuICByZXR1cm4gJ29iamVjdCcgPT0gdHlwZW9mIHN0clxuICAgID8gcGFyc2VPYmplY3Qoc3RyKVxuICAgIDogcGFyc2VTdHJpbmcoc3RyKTtcbn07XG5cbi8qKlxuICogVHVybiB0aGUgZ2l2ZW4gYG9iamAgaW50byBhIHF1ZXJ5IHN0cmluZ1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHVibGljXG4gKi9cblxudmFyIHN0cmluZ2lmeSA9IGV4cG9ydHMuc3RyaW5naWZ5ID0gZnVuY3Rpb24ob2JqLCBwcmVmaXgpIHtcbiAgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgIHJldHVybiBzdHJpbmdpZnlBcnJheShvYmosIHByZWZpeCk7XG4gIH0gZWxzZSBpZiAoJ1tvYmplY3QgT2JqZWN0XScgPT0gdG9TdHJpbmcuY2FsbChvYmopKSB7XG4gICAgcmV0dXJuIHN0cmluZ2lmeU9iamVjdChvYmosIHByZWZpeCk7XG4gIH0gZWxzZSBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIG9iaikge1xuICAgIHJldHVybiBzdHJpbmdpZnlTdHJpbmcob2JqLCBwcmVmaXgpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBwcmVmaXggKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQoU3RyaW5nKG9iaikpO1xuICB9XG59O1xuXG4vKipcbiAqIFN0cmluZ2lmeSB0aGUgZ2l2ZW4gYHN0cmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHBhcmFtIHtTdHJpbmd9IHByZWZpeFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc3RyaW5naWZ5U3RyaW5nKHN0ciwgcHJlZml4KSB7XG4gIGlmICghcHJlZml4KSB0aHJvdyBuZXcgVHlwZUVycm9yKCdzdHJpbmdpZnkgZXhwZWN0cyBhbiBvYmplY3QnKTtcbiAgcmV0dXJuIHByZWZpeCArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChzdHIpO1xufVxuXG4vKipcbiAqIFN0cmluZ2lmeSB0aGUgZ2l2ZW4gYGFycmAuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYXJyXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJlZml4XG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzdHJpbmdpZnlBcnJheShhcnIsIHByZWZpeCkge1xuICB2YXIgcmV0ID0gW107XG4gIGlmICghcHJlZml4KSB0aHJvdyBuZXcgVHlwZUVycm9yKCdzdHJpbmdpZnkgZXhwZWN0cyBhbiBvYmplY3QnKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICByZXQucHVzaChzdHJpbmdpZnkoYXJyW2ldLCBwcmVmaXggKyAnWycgKyBpICsgJ10nKSk7XG4gIH1cbiAgcmV0dXJuIHJldC5qb2luKCcmJyk7XG59XG5cbi8qKlxuICogU3RyaW5naWZ5IHRoZSBnaXZlbiBgb2JqYC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJlZml4XG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzdHJpbmdpZnlPYmplY3Qob2JqLCBwcmVmaXgpIHtcbiAgdmFyIHJldCA9IFtdXG4gICAgLCBrZXlzID0gb2JqZWN0S2V5cyhvYmopXG4gICAgLCBrZXk7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBrZXkgPSBrZXlzW2ldO1xuICAgIGlmIChudWxsID09IG9ialtrZXldKSB7XG4gICAgICByZXQucHVzaChlbmNvZGVVUklDb21wb25lbnQoa2V5KSArICc9Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldC5wdXNoKHN0cmluZ2lmeShvYmpba2V5XSwgcHJlZml4XG4gICAgICAgID8gcHJlZml4ICsgJ1snICsgZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyAnXSdcbiAgICAgICAgOiBlbmNvZGVVUklDb21wb25lbnQoa2V5KSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXQuam9pbignJicpO1xufVxuXG4vKipcbiAqIFNldCBgb2JqYCdzIGBrZXlgIHRvIGB2YWxgIHJlc3BlY3RpbmdcbiAqIHRoZSB3ZWlyZCBhbmQgd29uZGVyZnVsIHN5bnRheCBvZiBhIHFzLFxuICogd2hlcmUgXCJmb289YmFyJmZvbz1iYXpcIiBiZWNvbWVzIGFuIGFycmF5LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWxcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNldChvYmosIGtleSwgdmFsKSB7XG4gIHZhciB2ID0gb2JqW2tleV07XG4gIGlmICh1bmRlZmluZWQgPT09IHYpIHtcbiAgICBvYmpba2V5XSA9IHZhbDtcbiAgfSBlbHNlIGlmIChpc0FycmF5KHYpKSB7XG4gICAgdi5wdXNoKHZhbCk7XG4gIH0gZWxzZSB7XG4gICAgb2JqW2tleV0gPSBbdiwgdmFsXTtcbiAgfVxufVxuXG4vKipcbiAqIExvY2F0ZSBsYXN0IGJyYWNlIGluIGBzdHJgIHdpdGhpbiB0aGUga2V5LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxhc3RCcmFjZUluS2V5KHN0cikge1xuICB2YXIgbGVuID0gc3RyLmxlbmd0aFxuICAgICwgYnJhY2VcbiAgICAsIGM7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBjID0gc3RyW2ldO1xuICAgIGlmICgnXScgPT0gYykgYnJhY2UgPSBmYWxzZTtcbiAgICBpZiAoJ1snID09IGMpIGJyYWNlID0gdHJ1ZTtcbiAgICBpZiAoJz0nID09IGMgJiYgIWJyYWNlKSByZXR1cm4gaTtcbiAgfVxufVxuXG4vKipcbiAqIERlY29kZSBgc3RyYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBkZWNvZGUoc3RyKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzdHIucmVwbGFjZSgvXFwrL2csICcgJykpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG4iLCJ2YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxuZnVuY3Rpb24gU3RyZWFtKCkge1xuICBldmVudHMuRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG59XG51dGlsLmluaGVyaXRzKFN0cmVhbSwgZXZlbnRzLkV2ZW50RW1pdHRlcik7XG5tb2R1bGUuZXhwb3J0cyA9IFN0cmVhbTtcbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuNC54XG5TdHJlYW0uU3RyZWFtID0gU3RyZWFtO1xuXG5TdHJlYW0ucHJvdG90eXBlLnBpcGUgPSBmdW5jdGlvbihkZXN0LCBvcHRpb25zKSB7XG4gIHZhciBzb3VyY2UgPSB0aGlzO1xuXG4gIGZ1bmN0aW9uIG9uZGF0YShjaHVuaykge1xuICAgIGlmIChkZXN0LndyaXRhYmxlKSB7XG4gICAgICBpZiAoZmFsc2UgPT09IGRlc3Qud3JpdGUoY2h1bmspICYmIHNvdXJjZS5wYXVzZSkge1xuICAgICAgICBzb3VyY2UucGF1c2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzb3VyY2Uub24oJ2RhdGEnLCBvbmRhdGEpO1xuXG4gIGZ1bmN0aW9uIG9uZHJhaW4oKSB7XG4gICAgaWYgKHNvdXJjZS5yZWFkYWJsZSAmJiBzb3VyY2UucmVzdW1lKSB7XG4gICAgICBzb3VyY2UucmVzdW1lKCk7XG4gICAgfVxuICB9XG5cbiAgZGVzdC5vbignZHJhaW4nLCBvbmRyYWluKTtcblxuICAvLyBJZiB0aGUgJ2VuZCcgb3B0aW9uIGlzIG5vdCBzdXBwbGllZCwgZGVzdC5lbmQoKSB3aWxsIGJlIGNhbGxlZCB3aGVuXG4gIC8vIHNvdXJjZSBnZXRzIHRoZSAnZW5kJyBvciAnY2xvc2UnIGV2ZW50cy4gIE9ubHkgZGVzdC5lbmQoKSBvbmNlLCBhbmRcbiAgLy8gb25seSB3aGVuIGFsbCBzb3VyY2VzIGhhdmUgZW5kZWQuXG4gIGlmICghZGVzdC5faXNTdGRpbyAmJiAoIW9wdGlvbnMgfHwgb3B0aW9ucy5lbmQgIT09IGZhbHNlKSkge1xuICAgIGRlc3QuX3BpcGVDb3VudCA9IGRlc3QuX3BpcGVDb3VudCB8fCAwO1xuICAgIGRlc3QuX3BpcGVDb3VudCsrO1xuXG4gICAgc291cmNlLm9uKCdlbmQnLCBvbmVuZCk7XG4gICAgc291cmNlLm9uKCdjbG9zZScsIG9uY2xvc2UpO1xuICB9XG5cbiAgdmFyIGRpZE9uRW5kID0gZmFsc2U7XG4gIGZ1bmN0aW9uIG9uZW5kKCkge1xuICAgIGlmIChkaWRPbkVuZCkgcmV0dXJuO1xuICAgIGRpZE9uRW5kID0gdHJ1ZTtcblxuICAgIGRlc3QuX3BpcGVDb3VudC0tO1xuXG4gICAgLy8gcmVtb3ZlIHRoZSBsaXN0ZW5lcnNcbiAgICBjbGVhbnVwKCk7XG5cbiAgICBpZiAoZGVzdC5fcGlwZUNvdW50ID4gMCkge1xuICAgICAgLy8gd2FpdGluZyBmb3Igb3RoZXIgaW5jb21pbmcgc3RyZWFtcyB0byBlbmQuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZGVzdC5lbmQoKTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gb25jbG9zZSgpIHtcbiAgICBpZiAoZGlkT25FbmQpIHJldHVybjtcbiAgICBkaWRPbkVuZCA9IHRydWU7XG5cbiAgICBkZXN0Ll9waXBlQ291bnQtLTtcblxuICAgIC8vIHJlbW92ZSB0aGUgbGlzdGVuZXJzXG4gICAgY2xlYW51cCgpO1xuXG4gICAgaWYgKGRlc3QuX3BpcGVDb3VudCA+IDApIHtcbiAgICAgIC8vIHdhaXRpbmcgZm9yIG90aGVyIGluY29taW5nIHN0cmVhbXMgdG8gZW5kLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRlc3QuZGVzdHJveSgpO1xuICB9XG5cbiAgLy8gZG9uJ3QgbGVhdmUgZGFuZ2xpbmcgcGlwZXMgd2hlbiB0aGVyZSBhcmUgZXJyb3JzLlxuICBmdW5jdGlvbiBvbmVycm9yKGVyKSB7XG4gICAgY2xlYW51cCgpO1xuICAgIGlmICh0aGlzLmxpc3RlbmVycygnZXJyb3InKS5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgc3RyZWFtIGVycm9yIGluIHBpcGUuXG4gICAgfVxuICB9XG5cbiAgc291cmNlLm9uKCdlcnJvcicsIG9uZXJyb3IpO1xuICBkZXN0Lm9uKCdlcnJvcicsIG9uZXJyb3IpO1xuXG4gIC8vIHJlbW92ZSBhbGwgdGhlIGV2ZW50IGxpc3RlbmVycyB0aGF0IHdlcmUgYWRkZWQuXG4gIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKCdkYXRhJywgb25kYXRhKTtcbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCdkcmFpbicsIG9uZHJhaW4pO1xuXG4gICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKCdlbmQnLCBvbmVuZCk7XG4gICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKCdjbG9zZScsIG9uY2xvc2UpO1xuXG4gICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG9uZXJyb3IpO1xuICAgIGRlc3QucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgb25lcnJvcik7XG5cbiAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIoJ2VuZCcsIGNsZWFudXApO1xuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignY2xvc2UnLCBjbGVhbnVwKTtcblxuICAgIGRlc3QucmVtb3ZlTGlzdGVuZXIoJ2VuZCcsIGNsZWFudXApO1xuICAgIGRlc3QucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlJywgY2xlYW51cCk7XG4gIH1cblxuICBzb3VyY2Uub24oJ2VuZCcsIGNsZWFudXApO1xuICBzb3VyY2Uub24oJ2Nsb3NlJywgY2xlYW51cCk7XG5cbiAgZGVzdC5vbignZW5kJywgY2xlYW51cCk7XG4gIGRlc3Qub24oJ2Nsb3NlJywgY2xlYW51cCk7XG5cbiAgZGVzdC5lbWl0KCdwaXBlJywgc291cmNlKTtcblxuICAvLyBBbGxvdyBmb3IgdW5peC1saWtlIHVzYWdlOiBBLnBpcGUoQikucGlwZShDKVxuICByZXR1cm4gZGVzdDtcbn07XG4iLCJ2YXIgcHVueWNvZGUgPSB7IGVuY29kZSA6IGZ1bmN0aW9uIChzKSB7IHJldHVybiBzIH0gfTtcblxuZXhwb3J0cy5wYXJzZSA9IHVybFBhcnNlO1xuZXhwb3J0cy5yZXNvbHZlID0gdXJsUmVzb2x2ZTtcbmV4cG9ydHMucmVzb2x2ZU9iamVjdCA9IHVybFJlc29sdmVPYmplY3Q7XG5leHBvcnRzLmZvcm1hdCA9IHVybEZvcm1hdDtcblxuZnVuY3Rpb24gYXJyYXlJbmRleE9mKGFycmF5LCBzdWJqZWN0KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSBhcnJheS5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgaWYoYXJyYXlbaV0gPT0gc3ViamVjdCkgcmV0dXJuIGk7XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiBvYmplY3RLZXlzKG9iamVjdCkge1xuICAgIGlmIChvYmplY3QgIT09IE9iamVjdChvYmplY3QpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIG9iamVjdCcpO1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkgaWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShrZXkpKSBrZXlzW2tleXMubGVuZ3RoXSA9IGtleTtcbiAgICByZXR1cm4ga2V5cztcbn1cblxuLy8gUmVmZXJlbmNlOiBSRkMgMzk4NiwgUkZDIDE4MDgsIFJGQyAyMzk2XG5cbi8vIGRlZmluZSB0aGVzZSBoZXJlIHNvIGF0IGxlYXN0IHRoZXkgb25seSBoYXZlIHRvIGJlXG4vLyBjb21waWxlZCBvbmNlIG9uIHRoZSBmaXJzdCBtb2R1bGUgbG9hZC5cbnZhciBwcm90b2NvbFBhdHRlcm4gPSAvXihbYS16MC05ListXSs6KS9pLFxuICAgIHBvcnRQYXR0ZXJuID0gLzpbMC05XSskLyxcbiAgICAvLyBSRkMgMjM5NjogY2hhcmFjdGVycyByZXNlcnZlZCBmb3IgZGVsaW1pdGluZyBVUkxzLlxuICAgIGRlbGltcyA9IFsnPCcsICc+JywgJ1wiJywgJ2AnLCAnICcsICdcXHInLCAnXFxuJywgJ1xcdCddLFxuICAgIC8vIFJGQyAyMzk2OiBjaGFyYWN0ZXJzIG5vdCBhbGxvd2VkIGZvciB2YXJpb3VzIHJlYXNvbnMuXG4gICAgdW53aXNlID0gWyd7JywgJ30nLCAnfCcsICdcXFxcJywgJ14nLCAnficsICdbJywgJ10nLCAnYCddLmNvbmNhdChkZWxpbXMpLFxuICAgIC8vIEFsbG93ZWQgYnkgUkZDcywgYnV0IGNhdXNlIG9mIFhTUyBhdHRhY2tzLiAgQWx3YXlzIGVzY2FwZSB0aGVzZS5cbiAgICBhdXRvRXNjYXBlID0gWydcXCcnXSxcbiAgICAvLyBDaGFyYWN0ZXJzIHRoYXQgYXJlIG5ldmVyIGV2ZXIgYWxsb3dlZCBpbiBhIGhvc3RuYW1lLlxuICAgIC8vIE5vdGUgdGhhdCBhbnkgaW52YWxpZCBjaGFycyBhcmUgYWxzbyBoYW5kbGVkLCBidXQgdGhlc2VcbiAgICAvLyBhcmUgdGhlIG9uZXMgdGhhdCBhcmUgKmV4cGVjdGVkKiB0byBiZSBzZWVuLCBzbyB3ZSBmYXN0LXBhdGhcbiAgICAvLyB0aGVtLlxuICAgIG5vbkhvc3RDaGFycyA9IFsnJScsICcvJywgJz8nLCAnOycsICcjJ11cbiAgICAgIC5jb25jYXQodW53aXNlKS5jb25jYXQoYXV0b0VzY2FwZSksXG4gICAgbm9uQXV0aENoYXJzID0gWycvJywgJ0AnLCAnPycsICcjJ10uY29uY2F0KGRlbGltcyksXG4gICAgaG9zdG5hbWVNYXhMZW4gPSAyNTUsXG4gICAgaG9zdG5hbWVQYXJ0UGF0dGVybiA9IC9eW2EtekEtWjAtOV1bYS16MC05QS1aXy1dezAsNjJ9JC8sXG4gICAgaG9zdG5hbWVQYXJ0U3RhcnQgPSAvXihbYS16QS1aMC05XVthLXowLTlBLVpfLV17MCw2Mn0pKC4qKSQvLFxuICAgIC8vIHByb3RvY29scyB0aGF0IGNhbiBhbGxvdyBcInVuc2FmZVwiIGFuZCBcInVud2lzZVwiIGNoYXJzLlxuICAgIHVuc2FmZVByb3RvY29sID0ge1xuICAgICAgJ2phdmFzY3JpcHQnOiB0cnVlLFxuICAgICAgJ2phdmFzY3JpcHQ6JzogdHJ1ZVxuICAgIH0sXG4gICAgLy8gcHJvdG9jb2xzIHRoYXQgbmV2ZXIgaGF2ZSBhIGhvc3RuYW1lLlxuICAgIGhvc3RsZXNzUHJvdG9jb2wgPSB7XG4gICAgICAnamF2YXNjcmlwdCc6IHRydWUsXG4gICAgICAnamF2YXNjcmlwdDonOiB0cnVlXG4gICAgfSxcbiAgICAvLyBwcm90b2NvbHMgdGhhdCBhbHdheXMgaGF2ZSBhIHBhdGggY29tcG9uZW50LlxuICAgIHBhdGhlZFByb3RvY29sID0ge1xuICAgICAgJ2h0dHAnOiB0cnVlLFxuICAgICAgJ2h0dHBzJzogdHJ1ZSxcbiAgICAgICdmdHAnOiB0cnVlLFxuICAgICAgJ2dvcGhlcic6IHRydWUsXG4gICAgICAnZmlsZSc6IHRydWUsXG4gICAgICAnaHR0cDonOiB0cnVlLFxuICAgICAgJ2Z0cDonOiB0cnVlLFxuICAgICAgJ2dvcGhlcjonOiB0cnVlLFxuICAgICAgJ2ZpbGU6JzogdHJ1ZVxuICAgIH0sXG4gICAgLy8gcHJvdG9jb2xzIHRoYXQgYWx3YXlzIGNvbnRhaW4gYSAvLyBiaXQuXG4gICAgc2xhc2hlZFByb3RvY29sID0ge1xuICAgICAgJ2h0dHAnOiB0cnVlLFxuICAgICAgJ2h0dHBzJzogdHJ1ZSxcbiAgICAgICdmdHAnOiB0cnVlLFxuICAgICAgJ2dvcGhlcic6IHRydWUsXG4gICAgICAnZmlsZSc6IHRydWUsXG4gICAgICAnaHR0cDonOiB0cnVlLFxuICAgICAgJ2h0dHBzOic6IHRydWUsXG4gICAgICAnZnRwOic6IHRydWUsXG4gICAgICAnZ29waGVyOic6IHRydWUsXG4gICAgICAnZmlsZTonOiB0cnVlXG4gICAgfSxcbiAgICBxdWVyeXN0cmluZyA9IHJlcXVpcmUoJ3F1ZXJ5c3RyaW5nJyk7XG5cbmZ1bmN0aW9uIHVybFBhcnNlKHVybCwgcGFyc2VRdWVyeVN0cmluZywgc2xhc2hlc0Rlbm90ZUhvc3QpIHtcbiAgaWYgKHVybCAmJiB0eXBlb2YodXJsKSA9PT0gJ29iamVjdCcgJiYgdXJsLmhyZWYpIHJldHVybiB1cmw7XG5cbiAgaWYgKHR5cGVvZiB1cmwgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlBhcmFtZXRlciAndXJsJyBtdXN0IGJlIGEgc3RyaW5nLCBub3QgXCIgKyB0eXBlb2YgdXJsKTtcbiAgfVxuXG4gIHZhciBvdXQgPSB7fSxcbiAgICAgIHJlc3QgPSB1cmw7XG5cbiAgLy8gY3V0IG9mZiBhbnkgZGVsaW1pdGVycy5cbiAgLy8gVGhpcyBpcyB0byBzdXBwb3J0IHBhcnNlIHN0dWZmIGxpa2UgXCI8aHR0cDovL2Zvby5jb20+XCJcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSByZXN0Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlmIChhcnJheUluZGV4T2YoZGVsaW1zLCByZXN0LmNoYXJBdChpKSkgPT09IC0xKSBicmVhaztcbiAgfVxuICBpZiAoaSAhPT0gMCkgcmVzdCA9IHJlc3Quc3Vic3RyKGkpO1xuXG5cbiAgdmFyIHByb3RvID0gcHJvdG9jb2xQYXR0ZXJuLmV4ZWMocmVzdCk7XG4gIGlmIChwcm90bykge1xuICAgIHByb3RvID0gcHJvdG9bMF07XG4gICAgdmFyIGxvd2VyUHJvdG8gPSBwcm90by50b0xvd2VyQ2FzZSgpO1xuICAgIG91dC5wcm90b2NvbCA9IGxvd2VyUHJvdG87XG4gICAgcmVzdCA9IHJlc3Quc3Vic3RyKHByb3RvLmxlbmd0aCk7XG4gIH1cblxuICAvLyBmaWd1cmUgb3V0IGlmIGl0J3MgZ290IGEgaG9zdFxuICAvLyB1c2VyQHNlcnZlciBpcyAqYWx3YXlzKiBpbnRlcnByZXRlZCBhcyBhIGhvc3RuYW1lLCBhbmQgdXJsXG4gIC8vIHJlc29sdXRpb24gd2lsbCB0cmVhdCAvL2Zvby9iYXIgYXMgaG9zdD1mb28scGF0aD1iYXIgYmVjYXVzZSB0aGF0J3NcbiAgLy8gaG93IHRoZSBicm93c2VyIHJlc29sdmVzIHJlbGF0aXZlIFVSTHMuXG4gIGlmIChzbGFzaGVzRGVub3RlSG9zdCB8fCBwcm90byB8fCByZXN0Lm1hdGNoKC9eXFwvXFwvW15AXFwvXStAW15AXFwvXSsvKSkge1xuICAgIHZhciBzbGFzaGVzID0gcmVzdC5zdWJzdHIoMCwgMikgPT09ICcvLyc7XG4gICAgaWYgKHNsYXNoZXMgJiYgIShwcm90byAmJiBob3N0bGVzc1Byb3RvY29sW3Byb3RvXSkpIHtcbiAgICAgIHJlc3QgPSByZXN0LnN1YnN0cigyKTtcbiAgICAgIG91dC5zbGFzaGVzID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWhvc3RsZXNzUHJvdG9jb2xbcHJvdG9dICYmXG4gICAgICAoc2xhc2hlcyB8fCAocHJvdG8gJiYgIXNsYXNoZWRQcm90b2NvbFtwcm90b10pKSkge1xuICAgIC8vIHRoZXJlJ3MgYSBob3N0bmFtZS5cbiAgICAvLyB0aGUgZmlyc3QgaW5zdGFuY2Ugb2YgLywgPywgOywgb3IgIyBlbmRzIHRoZSBob3N0LlxuICAgIC8vIGRvbid0IGVuZm9yY2UgZnVsbCBSRkMgY29ycmVjdG5lc3MsIGp1c3QgYmUgdW5zdHVwaWQgYWJvdXQgaXQuXG5cbiAgICAvLyBJZiB0aGVyZSBpcyBhbiBAIGluIHRoZSBob3N0bmFtZSwgdGhlbiBub24taG9zdCBjaGFycyAqYXJlKiBhbGxvd2VkXG4gICAgLy8gdG8gdGhlIGxlZnQgb2YgdGhlIGZpcnN0IEAgc2lnbiwgdW5sZXNzIHNvbWUgbm9uLWF1dGggY2hhcmFjdGVyXG4gICAgLy8gY29tZXMgKmJlZm9yZSogdGhlIEAtc2lnbi5cbiAgICAvLyBVUkxzIGFyZSBvYm5veGlvdXMuXG4gICAgdmFyIGF0U2lnbiA9IGFycmF5SW5kZXhPZihyZXN0LCAnQCcpO1xuICAgIGlmIChhdFNpZ24gIT09IC0xKSB7XG4gICAgICAvLyB0aGVyZSAqbWF5IGJlKiBhbiBhdXRoXG4gICAgICB2YXIgaGFzQXV0aCA9IHRydWU7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5vbkF1dGhDaGFycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIGluZGV4ID0gYXJyYXlJbmRleE9mKHJlc3QsIG5vbkF1dGhDaGFyc1tpXSk7XG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEgJiYgaW5kZXggPCBhdFNpZ24pIHtcbiAgICAgICAgICAvLyBub3QgYSB2YWxpZCBhdXRoLiAgU29tZXRoaW5nIGxpa2UgaHR0cDovL2Zvby5jb20vYmFyQGJhei9cbiAgICAgICAgICBoYXNBdXRoID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChoYXNBdXRoKSB7XG4gICAgICAgIC8vIHBsdWNrIG9mZiB0aGUgYXV0aCBwb3J0aW9uLlxuICAgICAgICBvdXQuYXV0aCA9IHJlc3Quc3Vic3RyKDAsIGF0U2lnbik7XG4gICAgICAgIHJlc3QgPSByZXN0LnN1YnN0cihhdFNpZ24gKyAxKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZmlyc3ROb25Ib3N0ID0gLTE7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBub25Ib3N0Q2hhcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgaW5kZXggPSBhcnJheUluZGV4T2YocmVzdCwgbm9uSG9zdENoYXJzW2ldKTtcbiAgICAgIGlmIChpbmRleCAhPT0gLTEgJiZcbiAgICAgICAgICAoZmlyc3ROb25Ib3N0IDwgMCB8fCBpbmRleCA8IGZpcnN0Tm9uSG9zdCkpIGZpcnN0Tm9uSG9zdCA9IGluZGV4O1xuICAgIH1cblxuICAgIGlmIChmaXJzdE5vbkhvc3QgIT09IC0xKSB7XG4gICAgICBvdXQuaG9zdCA9IHJlc3Quc3Vic3RyKDAsIGZpcnN0Tm9uSG9zdCk7XG4gICAgICByZXN0ID0gcmVzdC5zdWJzdHIoZmlyc3ROb25Ib3N0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0Lmhvc3QgPSByZXN0O1xuICAgICAgcmVzdCA9ICcnO1xuICAgIH1cblxuICAgIC8vIHB1bGwgb3V0IHBvcnQuXG4gICAgdmFyIHAgPSBwYXJzZUhvc3Qob3V0Lmhvc3QpO1xuICAgIHZhciBrZXlzID0gb2JqZWN0S2V5cyhwKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgIG91dFtrZXldID0gcFtrZXldO1xuICAgIH1cblxuICAgIC8vIHdlJ3ZlIGluZGljYXRlZCB0aGF0IHRoZXJlIGlzIGEgaG9zdG5hbWUsXG4gICAgLy8gc28gZXZlbiBpZiBpdCdzIGVtcHR5LCBpdCBoYXMgdG8gYmUgcHJlc2VudC5cbiAgICBvdXQuaG9zdG5hbWUgPSBvdXQuaG9zdG5hbWUgfHwgJyc7XG5cbiAgICAvLyB2YWxpZGF0ZSBhIGxpdHRsZS5cbiAgICBpZiAob3V0Lmhvc3RuYW1lLmxlbmd0aCA+IGhvc3RuYW1lTWF4TGVuKSB7XG4gICAgICBvdXQuaG9zdG5hbWUgPSAnJztcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGhvc3RwYXJ0cyA9IG91dC5ob3N0bmFtZS5zcGxpdCgvXFwuLyk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGhvc3RwYXJ0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIHBhcnQgPSBob3N0cGFydHNbaV07XG4gICAgICAgIGlmICghcGFydCkgY29udGludWU7XG4gICAgICAgIGlmICghcGFydC5tYXRjaChob3N0bmFtZVBhcnRQYXR0ZXJuKSkge1xuICAgICAgICAgIHZhciBuZXdwYXJ0ID0gJyc7XG4gICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGsgPSBwYXJ0Lmxlbmd0aDsgaiA8IGs7IGorKykge1xuICAgICAgICAgICAgaWYgKHBhcnQuY2hhckNvZGVBdChqKSA+IDEyNykge1xuICAgICAgICAgICAgICAvLyB3ZSByZXBsYWNlIG5vbi1BU0NJSSBjaGFyIHdpdGggYSB0ZW1wb3JhcnkgcGxhY2Vob2xkZXJcbiAgICAgICAgICAgICAgLy8gd2UgbmVlZCB0aGlzIHRvIG1ha2Ugc3VyZSBzaXplIG9mIGhvc3RuYW1lIGlzIG5vdFxuICAgICAgICAgICAgICAvLyBicm9rZW4gYnkgcmVwbGFjaW5nIG5vbi1BU0NJSSBieSBub3RoaW5nXG4gICAgICAgICAgICAgIG5ld3BhcnQgKz0gJ3gnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbmV3cGFydCArPSBwYXJ0W2pdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyB3ZSB0ZXN0IGFnYWluIHdpdGggQVNDSUkgY2hhciBvbmx5XG4gICAgICAgICAgaWYgKCFuZXdwYXJ0Lm1hdGNoKGhvc3RuYW1lUGFydFBhdHRlcm4pKSB7XG4gICAgICAgICAgICB2YXIgdmFsaWRQYXJ0cyA9IGhvc3RwYXJ0cy5zbGljZSgwLCBpKTtcbiAgICAgICAgICAgIHZhciBub3RIb3N0ID0gaG9zdHBhcnRzLnNsaWNlKGkgKyAxKTtcbiAgICAgICAgICAgIHZhciBiaXQgPSBwYXJ0Lm1hdGNoKGhvc3RuYW1lUGFydFN0YXJ0KTtcbiAgICAgICAgICAgIGlmIChiaXQpIHtcbiAgICAgICAgICAgICAgdmFsaWRQYXJ0cy5wdXNoKGJpdFsxXSk7XG4gICAgICAgICAgICAgIG5vdEhvc3QudW5zaGlmdChiaXRbMl0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vdEhvc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHJlc3QgPSAnLycgKyBub3RIb3N0LmpvaW4oJy4nKSArIHJlc3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvdXQuaG9zdG5hbWUgPSB2YWxpZFBhcnRzLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGhvc3RuYW1lcyBhcmUgYWx3YXlzIGxvd2VyIGNhc2UuXG4gICAgb3V0Lmhvc3RuYW1lID0gb3V0Lmhvc3RuYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAvLyBJRE5BIFN1cHBvcnQ6IFJldHVybnMgYSBwdW55IGNvZGVkIHJlcHJlc2VudGF0aW9uIG9mIFwiZG9tYWluXCIuXG4gICAgLy8gSXQgb25seSBjb252ZXJ0cyB0aGUgcGFydCBvZiB0aGUgZG9tYWluIG5hbWUgdGhhdFxuICAgIC8vIGhhcyBub24gQVNDSUkgY2hhcmFjdGVycy4gSS5lLiBpdCBkb3NlbnQgbWF0dGVyIGlmXG4gICAgLy8geW91IGNhbGwgaXQgd2l0aCBhIGRvbWFpbiB0aGF0IGFscmVhZHkgaXMgaW4gQVNDSUkuXG4gICAgdmFyIGRvbWFpbkFycmF5ID0gb3V0Lmhvc3RuYW1lLnNwbGl0KCcuJyk7XG4gICAgdmFyIG5ld091dCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZG9tYWluQXJyYXkubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBzID0gZG9tYWluQXJyYXlbaV07XG4gICAgICBuZXdPdXQucHVzaChzLm1hdGNoKC9bXkEtWmEtejAtOV8tXS8pID9cbiAgICAgICAgICAneG4tLScgKyBwdW55Y29kZS5lbmNvZGUocykgOiBzKTtcbiAgICB9XG4gICAgb3V0Lmhvc3RuYW1lID0gbmV3T3V0LmpvaW4oJy4nKTtcblxuICAgIG91dC5ob3N0ID0gKG91dC5ob3N0bmFtZSB8fCAnJykgK1xuICAgICAgICAoKG91dC5wb3J0KSA/ICc6JyArIG91dC5wb3J0IDogJycpO1xuICAgIG91dC5ocmVmICs9IG91dC5ob3N0O1xuICB9XG5cbiAgLy8gbm93IHJlc3QgaXMgc2V0IHRvIHRoZSBwb3N0LWhvc3Qgc3R1ZmYuXG4gIC8vIGNob3Agb2ZmIGFueSBkZWxpbSBjaGFycy5cbiAgaWYgKCF1bnNhZmVQcm90b2NvbFtsb3dlclByb3RvXSkge1xuXG4gICAgLy8gRmlyc3QsIG1ha2UgMTAwJSBzdXJlIHRoYXQgYW55IFwiYXV0b0VzY2FwZVwiIGNoYXJzIGdldFxuICAgIC8vIGVzY2FwZWQsIGV2ZW4gaWYgZW5jb2RlVVJJQ29tcG9uZW50IGRvZXNuJ3QgdGhpbmsgdGhleVxuICAgIC8vIG5lZWQgdG8gYmUuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdXRvRXNjYXBlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGFlID0gYXV0b0VzY2FwZVtpXTtcbiAgICAgIHZhciBlc2MgPSBlbmNvZGVVUklDb21wb25lbnQoYWUpO1xuICAgICAgaWYgKGVzYyA9PT0gYWUpIHtcbiAgICAgICAgZXNjID0gZXNjYXBlKGFlKTtcbiAgICAgIH1cbiAgICAgIHJlc3QgPSByZXN0LnNwbGl0KGFlKS5qb2luKGVzYyk7XG4gICAgfVxuXG4gICAgLy8gTm93IG1ha2Ugc3VyZSB0aGF0IGRlbGltcyBuZXZlciBhcHBlYXIgaW4gYSB1cmwuXG4gICAgdmFyIGNob3AgPSByZXN0Lmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGRlbGltcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBjID0gYXJyYXlJbmRleE9mKHJlc3QsIGRlbGltc1tpXSk7XG4gICAgICBpZiAoYyAhPT0gLTEpIHtcbiAgICAgICAgY2hvcCA9IE1hdGgubWluKGMsIGNob3ApO1xuICAgICAgfVxuICAgIH1cbiAgICByZXN0ID0gcmVzdC5zdWJzdHIoMCwgY2hvcCk7XG4gIH1cblxuXG4gIC8vIGNob3Agb2ZmIGZyb20gdGhlIHRhaWwgZmlyc3QuXG4gIHZhciBoYXNoID0gYXJyYXlJbmRleE9mKHJlc3QsICcjJyk7XG4gIGlmIChoYXNoICE9PSAtMSkge1xuICAgIC8vIGdvdCBhIGZyYWdtZW50IHN0cmluZy5cbiAgICBvdXQuaGFzaCA9IHJlc3Quc3Vic3RyKGhhc2gpO1xuICAgIHJlc3QgPSByZXN0LnNsaWNlKDAsIGhhc2gpO1xuICB9XG4gIHZhciBxbSA9IGFycmF5SW5kZXhPZihyZXN0LCAnPycpO1xuICBpZiAocW0gIT09IC0xKSB7XG4gICAgb3V0LnNlYXJjaCA9IHJlc3Quc3Vic3RyKHFtKTtcbiAgICBvdXQucXVlcnkgPSByZXN0LnN1YnN0cihxbSArIDEpO1xuICAgIGlmIChwYXJzZVF1ZXJ5U3RyaW5nKSB7XG4gICAgICBvdXQucXVlcnkgPSBxdWVyeXN0cmluZy5wYXJzZShvdXQucXVlcnkpO1xuICAgIH1cbiAgICByZXN0ID0gcmVzdC5zbGljZSgwLCBxbSk7XG4gIH0gZWxzZSBpZiAocGFyc2VRdWVyeVN0cmluZykge1xuICAgIC8vIG5vIHF1ZXJ5IHN0cmluZywgYnV0IHBhcnNlUXVlcnlTdHJpbmcgc3RpbGwgcmVxdWVzdGVkXG4gICAgb3V0LnNlYXJjaCA9ICcnO1xuICAgIG91dC5xdWVyeSA9IHt9O1xuICB9XG4gIGlmIChyZXN0KSBvdXQucGF0aG5hbWUgPSByZXN0O1xuICBpZiAoc2xhc2hlZFByb3RvY29sW3Byb3RvXSAmJlxuICAgICAgb3V0Lmhvc3RuYW1lICYmICFvdXQucGF0aG5hbWUpIHtcbiAgICBvdXQucGF0aG5hbWUgPSAnLyc7XG4gIH1cblxuICAvL3RvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gIGlmIChvdXQucGF0aG5hbWUgfHwgb3V0LnNlYXJjaCkge1xuICAgIG91dC5wYXRoID0gKG91dC5wYXRobmFtZSA/IG91dC5wYXRobmFtZSA6ICcnKSArXG4gICAgICAgICAgICAgICAob3V0LnNlYXJjaCA/IG91dC5zZWFyY2ggOiAnJyk7XG4gIH1cblxuICAvLyBmaW5hbGx5LCByZWNvbnN0cnVjdCB0aGUgaHJlZiBiYXNlZCBvbiB3aGF0IGhhcyBiZWVuIHZhbGlkYXRlZC5cbiAgb3V0LmhyZWYgPSB1cmxGb3JtYXQob3V0KTtcbiAgcmV0dXJuIG91dDtcbn1cblxuLy8gZm9ybWF0IGEgcGFyc2VkIG9iamVjdCBpbnRvIGEgdXJsIHN0cmluZ1xuZnVuY3Rpb24gdXJsRm9ybWF0KG9iaikge1xuICAvLyBlbnN1cmUgaXQncyBhbiBvYmplY3QsIGFuZCBub3QgYSBzdHJpbmcgdXJsLlxuICAvLyBJZiBpdCdzIGFuIG9iaiwgdGhpcyBpcyBhIG5vLW9wLlxuICAvLyB0aGlzIHdheSwgeW91IGNhbiBjYWxsIHVybF9mb3JtYXQoKSBvbiBzdHJpbmdzXG4gIC8vIHRvIGNsZWFuIHVwIHBvdGVudGlhbGx5IHdvbmt5IHVybHMuXG4gIGlmICh0eXBlb2Yob2JqKSA9PT0gJ3N0cmluZycpIG9iaiA9IHVybFBhcnNlKG9iaik7XG5cbiAgdmFyIGF1dGggPSBvYmouYXV0aCB8fCAnJztcbiAgaWYgKGF1dGgpIHtcbiAgICBhdXRoID0gYXV0aC5zcGxpdCgnQCcpLmpvaW4oJyU0MCcpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gbm9uQXV0aENoYXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIG5BQyA9IG5vbkF1dGhDaGFyc1tpXTtcbiAgICAgIGF1dGggPSBhdXRoLnNwbGl0KG5BQykuam9pbihlbmNvZGVVUklDb21wb25lbnQobkFDKSk7XG4gICAgfVxuICAgIGF1dGggKz0gJ0AnO1xuICB9XG5cbiAgdmFyIHByb3RvY29sID0gb2JqLnByb3RvY29sIHx8ICcnLFxuICAgICAgaG9zdCA9IChvYmouaG9zdCAhPT0gdW5kZWZpbmVkKSA/IGF1dGggKyBvYmouaG9zdCA6XG4gICAgICAgICAgb2JqLmhvc3RuYW1lICE9PSB1bmRlZmluZWQgPyAoXG4gICAgICAgICAgICAgIGF1dGggKyBvYmouaG9zdG5hbWUgK1xuICAgICAgICAgICAgICAob2JqLnBvcnQgPyAnOicgKyBvYmoucG9ydCA6ICcnKVxuICAgICAgICAgICkgOlxuICAgICAgICAgIGZhbHNlLFxuICAgICAgcGF0aG5hbWUgPSBvYmoucGF0aG5hbWUgfHwgJycsXG4gICAgICBxdWVyeSA9IG9iai5xdWVyeSAmJlxuICAgICAgICAgICAgICAoKHR5cGVvZiBvYmoucXVlcnkgPT09ICdvYmplY3QnICYmXG4gICAgICAgICAgICAgICAgb2JqZWN0S2V5cyhvYmoucXVlcnkpLmxlbmd0aCkgP1xuICAgICAgICAgICAgICAgICBxdWVyeXN0cmluZy5zdHJpbmdpZnkob2JqLnF1ZXJ5KSA6XG4gICAgICAgICAgICAgICAgICcnKSB8fCAnJyxcbiAgICAgIHNlYXJjaCA9IG9iai5zZWFyY2ggfHwgKHF1ZXJ5ICYmICgnPycgKyBxdWVyeSkpIHx8ICcnLFxuICAgICAgaGFzaCA9IG9iai5oYXNoIHx8ICcnO1xuXG4gIGlmIChwcm90b2NvbCAmJiBwcm90b2NvbC5zdWJzdHIoLTEpICE9PSAnOicpIHByb3RvY29sICs9ICc6JztcblxuICAvLyBvbmx5IHRoZSBzbGFzaGVkUHJvdG9jb2xzIGdldCB0aGUgLy8uICBOb3QgbWFpbHRvOiwgeG1wcDosIGV0Yy5cbiAgLy8gdW5sZXNzIHRoZXkgaGFkIHRoZW0gdG8gYmVnaW4gd2l0aC5cbiAgaWYgKG9iai5zbGFzaGVzIHx8XG4gICAgICAoIXByb3RvY29sIHx8IHNsYXNoZWRQcm90b2NvbFtwcm90b2NvbF0pICYmIGhvc3QgIT09IGZhbHNlKSB7XG4gICAgaG9zdCA9ICcvLycgKyAoaG9zdCB8fCAnJyk7XG4gICAgaWYgKHBhdGhuYW1lICYmIHBhdGhuYW1lLmNoYXJBdCgwKSAhPT0gJy8nKSBwYXRobmFtZSA9ICcvJyArIHBhdGhuYW1lO1xuICB9IGVsc2UgaWYgKCFob3N0KSB7XG4gICAgaG9zdCA9ICcnO1xuICB9XG5cbiAgaWYgKGhhc2ggJiYgaGFzaC5jaGFyQXQoMCkgIT09ICcjJykgaGFzaCA9ICcjJyArIGhhc2g7XG4gIGlmIChzZWFyY2ggJiYgc2VhcmNoLmNoYXJBdCgwKSAhPT0gJz8nKSBzZWFyY2ggPSAnPycgKyBzZWFyY2g7XG5cbiAgcmV0dXJuIHByb3RvY29sICsgaG9zdCArIHBhdGhuYW1lICsgc2VhcmNoICsgaGFzaDtcbn1cblxuZnVuY3Rpb24gdXJsUmVzb2x2ZShzb3VyY2UsIHJlbGF0aXZlKSB7XG4gIHJldHVybiB1cmxGb3JtYXQodXJsUmVzb2x2ZU9iamVjdChzb3VyY2UsIHJlbGF0aXZlKSk7XG59XG5cbmZ1bmN0aW9uIHVybFJlc29sdmVPYmplY3Qoc291cmNlLCByZWxhdGl2ZSkge1xuICBpZiAoIXNvdXJjZSkgcmV0dXJuIHJlbGF0aXZlO1xuXG4gIHNvdXJjZSA9IHVybFBhcnNlKHVybEZvcm1hdChzb3VyY2UpLCBmYWxzZSwgdHJ1ZSk7XG4gIHJlbGF0aXZlID0gdXJsUGFyc2UodXJsRm9ybWF0KHJlbGF0aXZlKSwgZmFsc2UsIHRydWUpO1xuXG4gIC8vIGhhc2ggaXMgYWx3YXlzIG92ZXJyaWRkZW4sIG5vIG1hdHRlciB3aGF0LlxuICBzb3VyY2UuaGFzaCA9IHJlbGF0aXZlLmhhc2g7XG5cbiAgaWYgKHJlbGF0aXZlLmhyZWYgPT09ICcnKSB7XG4gICAgc291cmNlLmhyZWYgPSB1cmxGb3JtYXQoc291cmNlKTtcbiAgICByZXR1cm4gc291cmNlO1xuICB9XG5cbiAgLy8gaHJlZnMgbGlrZSAvL2Zvby9iYXIgYWx3YXlzIGN1dCB0byB0aGUgcHJvdG9jb2wuXG4gIGlmIChyZWxhdGl2ZS5zbGFzaGVzICYmICFyZWxhdGl2ZS5wcm90b2NvbCkge1xuICAgIHJlbGF0aXZlLnByb3RvY29sID0gc291cmNlLnByb3RvY29sO1xuICAgIC8vdXJsUGFyc2UgYXBwZW5kcyB0cmFpbGluZyAvIHRvIHVybHMgbGlrZSBodHRwOi8vd3d3LmV4YW1wbGUuY29tXG4gICAgaWYgKHNsYXNoZWRQcm90b2NvbFtyZWxhdGl2ZS5wcm90b2NvbF0gJiZcbiAgICAgICAgcmVsYXRpdmUuaG9zdG5hbWUgJiYgIXJlbGF0aXZlLnBhdGhuYW1lKSB7XG4gICAgICByZWxhdGl2ZS5wYXRoID0gcmVsYXRpdmUucGF0aG5hbWUgPSAnLyc7XG4gICAgfVxuICAgIHJlbGF0aXZlLmhyZWYgPSB1cmxGb3JtYXQocmVsYXRpdmUpO1xuICAgIHJldHVybiByZWxhdGl2ZTtcbiAgfVxuXG4gIGlmIChyZWxhdGl2ZS5wcm90b2NvbCAmJiByZWxhdGl2ZS5wcm90b2NvbCAhPT0gc291cmNlLnByb3RvY29sKSB7XG4gICAgLy8gaWYgaXQncyBhIGtub3duIHVybCBwcm90b2NvbCwgdGhlbiBjaGFuZ2luZ1xuICAgIC8vIHRoZSBwcm90b2NvbCBkb2VzIHdlaXJkIHRoaW5nc1xuICAgIC8vIGZpcnN0LCBpZiBpdCdzIG5vdCBmaWxlOiwgdGhlbiB3ZSBNVVNUIGhhdmUgYSBob3N0LFxuICAgIC8vIGFuZCBpZiB0aGVyZSB3YXMgYSBwYXRoXG4gICAgLy8gdG8gYmVnaW4gd2l0aCwgdGhlbiB3ZSBNVVNUIGhhdmUgYSBwYXRoLlxuICAgIC8vIGlmIGl0IGlzIGZpbGU6LCB0aGVuIHRoZSBob3N0IGlzIGRyb3BwZWQsXG4gICAgLy8gYmVjYXVzZSB0aGF0J3Mga25vd24gdG8gYmUgaG9zdGxlc3MuXG4gICAgLy8gYW55dGhpbmcgZWxzZSBpcyBhc3N1bWVkIHRvIGJlIGFic29sdXRlLlxuICAgIGlmICghc2xhc2hlZFByb3RvY29sW3JlbGF0aXZlLnByb3RvY29sXSkge1xuICAgICAgcmVsYXRpdmUuaHJlZiA9IHVybEZvcm1hdChyZWxhdGl2ZSk7XG4gICAgICByZXR1cm4gcmVsYXRpdmU7XG4gICAgfVxuICAgIHNvdXJjZS5wcm90b2NvbCA9IHJlbGF0aXZlLnByb3RvY29sO1xuICAgIGlmICghcmVsYXRpdmUuaG9zdCAmJiAhaG9zdGxlc3NQcm90b2NvbFtyZWxhdGl2ZS5wcm90b2NvbF0pIHtcbiAgICAgIHZhciByZWxQYXRoID0gKHJlbGF0aXZlLnBhdGhuYW1lIHx8ICcnKS5zcGxpdCgnLycpO1xuICAgICAgd2hpbGUgKHJlbFBhdGgubGVuZ3RoICYmICEocmVsYXRpdmUuaG9zdCA9IHJlbFBhdGguc2hpZnQoKSkpO1xuICAgICAgaWYgKCFyZWxhdGl2ZS5ob3N0KSByZWxhdGl2ZS5ob3N0ID0gJyc7XG4gICAgICBpZiAoIXJlbGF0aXZlLmhvc3RuYW1lKSByZWxhdGl2ZS5ob3N0bmFtZSA9ICcnO1xuICAgICAgaWYgKHJlbFBhdGhbMF0gIT09ICcnKSByZWxQYXRoLnVuc2hpZnQoJycpO1xuICAgICAgaWYgKHJlbFBhdGgubGVuZ3RoIDwgMikgcmVsUGF0aC51bnNoaWZ0KCcnKTtcbiAgICAgIHJlbGF0aXZlLnBhdGhuYW1lID0gcmVsUGF0aC5qb2luKCcvJyk7XG4gICAgfVxuICAgIHNvdXJjZS5wYXRobmFtZSA9IHJlbGF0aXZlLnBhdGhuYW1lO1xuICAgIHNvdXJjZS5zZWFyY2ggPSByZWxhdGl2ZS5zZWFyY2g7XG4gICAgc291cmNlLnF1ZXJ5ID0gcmVsYXRpdmUucXVlcnk7XG4gICAgc291cmNlLmhvc3QgPSByZWxhdGl2ZS5ob3N0IHx8ICcnO1xuICAgIHNvdXJjZS5hdXRoID0gcmVsYXRpdmUuYXV0aDtcbiAgICBzb3VyY2UuaG9zdG5hbWUgPSByZWxhdGl2ZS5ob3N0bmFtZSB8fCByZWxhdGl2ZS5ob3N0O1xuICAgIHNvdXJjZS5wb3J0ID0gcmVsYXRpdmUucG9ydDtcbiAgICAvL3RvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gICAgaWYgKHNvdXJjZS5wYXRobmFtZSAhPT0gdW5kZWZpbmVkIHx8IHNvdXJjZS5zZWFyY2ggIT09IHVuZGVmaW5lZCkge1xuICAgICAgc291cmNlLnBhdGggPSAoc291cmNlLnBhdGhuYW1lID8gc291cmNlLnBhdGhuYW1lIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgKHNvdXJjZS5zZWFyY2ggPyBzb3VyY2Uuc2VhcmNoIDogJycpO1xuICAgIH1cbiAgICBzb3VyY2Uuc2xhc2hlcyA9IHNvdXJjZS5zbGFzaGVzIHx8IHJlbGF0aXZlLnNsYXNoZXM7XG4gICAgc291cmNlLmhyZWYgPSB1cmxGb3JtYXQoc291cmNlKTtcbiAgICByZXR1cm4gc291cmNlO1xuICB9XG5cbiAgdmFyIGlzU291cmNlQWJzID0gKHNvdXJjZS5wYXRobmFtZSAmJiBzb3VyY2UucGF0aG5hbWUuY2hhckF0KDApID09PSAnLycpLFxuICAgICAgaXNSZWxBYnMgPSAoXG4gICAgICAgICAgcmVsYXRpdmUuaG9zdCAhPT0gdW5kZWZpbmVkIHx8XG4gICAgICAgICAgcmVsYXRpdmUucGF0aG5hbWUgJiYgcmVsYXRpdmUucGF0aG5hbWUuY2hhckF0KDApID09PSAnLydcbiAgICAgICksXG4gICAgICBtdXN0RW5kQWJzID0gKGlzUmVsQWJzIHx8IGlzU291cmNlQWJzIHx8XG4gICAgICAgICAgICAgICAgICAgIChzb3VyY2UuaG9zdCAmJiByZWxhdGl2ZS5wYXRobmFtZSkpLFxuICAgICAgcmVtb3ZlQWxsRG90cyA9IG11c3RFbmRBYnMsXG4gICAgICBzcmNQYXRoID0gc291cmNlLnBhdGhuYW1lICYmIHNvdXJjZS5wYXRobmFtZS5zcGxpdCgnLycpIHx8IFtdLFxuICAgICAgcmVsUGF0aCA9IHJlbGF0aXZlLnBhdGhuYW1lICYmIHJlbGF0aXZlLnBhdGhuYW1lLnNwbGl0KCcvJykgfHwgW10sXG4gICAgICBwc3ljaG90aWMgPSBzb3VyY2UucHJvdG9jb2wgJiZcbiAgICAgICAgICAhc2xhc2hlZFByb3RvY29sW3NvdXJjZS5wcm90b2NvbF07XG5cbiAgLy8gaWYgdGhlIHVybCBpcyBhIG5vbi1zbGFzaGVkIHVybCwgdGhlbiByZWxhdGl2ZVxuICAvLyBsaW5rcyBsaWtlIC4uLy4uIHNob3VsZCBiZSBhYmxlXG4gIC8vIHRvIGNyYXdsIHVwIHRvIHRoZSBob3N0bmFtZSwgYXMgd2VsbC4gIFRoaXMgaXMgc3RyYW5nZS5cbiAgLy8gc291cmNlLnByb3RvY29sIGhhcyBhbHJlYWR5IGJlZW4gc2V0IGJ5IG5vdy5cbiAgLy8gTGF0ZXIgb24sIHB1dCB0aGUgZmlyc3QgcGF0aCBwYXJ0IGludG8gdGhlIGhvc3QgZmllbGQuXG4gIGlmIChwc3ljaG90aWMpIHtcblxuICAgIGRlbGV0ZSBzb3VyY2UuaG9zdG5hbWU7XG4gICAgZGVsZXRlIHNvdXJjZS5wb3J0O1xuICAgIGlmIChzb3VyY2UuaG9zdCkge1xuICAgICAgaWYgKHNyY1BhdGhbMF0gPT09ICcnKSBzcmNQYXRoWzBdID0gc291cmNlLmhvc3Q7XG4gICAgICBlbHNlIHNyY1BhdGgudW5zaGlmdChzb3VyY2UuaG9zdCk7XG4gICAgfVxuICAgIGRlbGV0ZSBzb3VyY2UuaG9zdDtcbiAgICBpZiAocmVsYXRpdmUucHJvdG9jb2wpIHtcbiAgICAgIGRlbGV0ZSByZWxhdGl2ZS5ob3N0bmFtZTtcbiAgICAgIGRlbGV0ZSByZWxhdGl2ZS5wb3J0O1xuICAgICAgaWYgKHJlbGF0aXZlLmhvc3QpIHtcbiAgICAgICAgaWYgKHJlbFBhdGhbMF0gPT09ICcnKSByZWxQYXRoWzBdID0gcmVsYXRpdmUuaG9zdDtcbiAgICAgICAgZWxzZSByZWxQYXRoLnVuc2hpZnQocmVsYXRpdmUuaG9zdCk7XG4gICAgICB9XG4gICAgICBkZWxldGUgcmVsYXRpdmUuaG9zdDtcbiAgICB9XG4gICAgbXVzdEVuZEFicyA9IG11c3RFbmRBYnMgJiYgKHJlbFBhdGhbMF0gPT09ICcnIHx8IHNyY1BhdGhbMF0gPT09ICcnKTtcbiAgfVxuXG4gIGlmIChpc1JlbEFicykge1xuICAgIC8vIGl0J3MgYWJzb2x1dGUuXG4gICAgc291cmNlLmhvc3QgPSAocmVsYXRpdmUuaG9zdCB8fCByZWxhdGl2ZS5ob3N0ID09PSAnJykgP1xuICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aXZlLmhvc3QgOiBzb3VyY2UuaG9zdDtcbiAgICBzb3VyY2UuaG9zdG5hbWUgPSAocmVsYXRpdmUuaG9zdG5hbWUgfHwgcmVsYXRpdmUuaG9zdG5hbWUgPT09ICcnKSA/XG4gICAgICAgICAgICAgICAgICAgICAgcmVsYXRpdmUuaG9zdG5hbWUgOiBzb3VyY2UuaG9zdG5hbWU7XG4gICAgc291cmNlLnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICBzb3VyY2UucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgICBzcmNQYXRoID0gcmVsUGF0aDtcbiAgICAvLyBmYWxsIHRocm91Z2ggdG8gdGhlIGRvdC1oYW5kbGluZyBiZWxvdy5cbiAgfSBlbHNlIGlmIChyZWxQYXRoLmxlbmd0aCkge1xuICAgIC8vIGl0J3MgcmVsYXRpdmVcbiAgICAvLyB0aHJvdyBhd2F5IHRoZSBleGlzdGluZyBmaWxlLCBhbmQgdGFrZSB0aGUgbmV3IHBhdGggaW5zdGVhZC5cbiAgICBpZiAoIXNyY1BhdGgpIHNyY1BhdGggPSBbXTtcbiAgICBzcmNQYXRoLnBvcCgpO1xuICAgIHNyY1BhdGggPSBzcmNQYXRoLmNvbmNhdChyZWxQYXRoKTtcbiAgICBzb3VyY2Uuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgIHNvdXJjZS5xdWVyeSA9IHJlbGF0aXZlLnF1ZXJ5O1xuICB9IGVsc2UgaWYgKCdzZWFyY2gnIGluIHJlbGF0aXZlKSB7XG4gICAgLy8ganVzdCBwdWxsIG91dCB0aGUgc2VhcmNoLlxuICAgIC8vIGxpa2UgaHJlZj0nP2ZvbycuXG4gICAgLy8gUHV0IHRoaXMgYWZ0ZXIgdGhlIG90aGVyIHR3byBjYXNlcyBiZWNhdXNlIGl0IHNpbXBsaWZpZXMgdGhlIGJvb2xlYW5zXG4gICAgaWYgKHBzeWNob3RpYykge1xuICAgICAgc291cmNlLmhvc3RuYW1lID0gc291cmNlLmhvc3QgPSBzcmNQYXRoLnNoaWZ0KCk7XG4gICAgICAvL29jY2F0aW9uYWx5IHRoZSBhdXRoIGNhbiBnZXQgc3R1Y2sgb25seSBpbiBob3N0XG4gICAgICAvL3RoaXMgZXNwZWNpYWx5IGhhcHBlbnMgaW4gY2FzZXMgbGlrZVxuICAgICAgLy91cmwucmVzb2x2ZU9iamVjdCgnbWFpbHRvOmxvY2FsMUBkb21haW4xJywgJ2xvY2FsMkBkb21haW4yJylcbiAgICAgIHZhciBhdXRoSW5Ib3N0ID0gc291cmNlLmhvc3QgJiYgYXJyYXlJbmRleE9mKHNvdXJjZS5ob3N0LCAnQCcpID4gMCA/XG4gICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZS5ob3N0LnNwbGl0KCdAJykgOiBmYWxzZTtcbiAgICAgIGlmIChhdXRoSW5Ib3N0KSB7XG4gICAgICAgIHNvdXJjZS5hdXRoID0gYXV0aEluSG9zdC5zaGlmdCgpO1xuICAgICAgICBzb3VyY2UuaG9zdCA9IHNvdXJjZS5ob3N0bmFtZSA9IGF1dGhJbkhvc3Quc2hpZnQoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgc291cmNlLnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICBzb3VyY2UucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgICAvL3RvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gICAgaWYgKHNvdXJjZS5wYXRobmFtZSAhPT0gdW5kZWZpbmVkIHx8IHNvdXJjZS5zZWFyY2ggIT09IHVuZGVmaW5lZCkge1xuICAgICAgc291cmNlLnBhdGggPSAoc291cmNlLnBhdGhuYW1lID8gc291cmNlLnBhdGhuYW1lIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgKHNvdXJjZS5zZWFyY2ggPyBzb3VyY2Uuc2VhcmNoIDogJycpO1xuICAgIH1cbiAgICBzb3VyY2UuaHJlZiA9IHVybEZvcm1hdChzb3VyY2UpO1xuICAgIHJldHVybiBzb3VyY2U7XG4gIH1cbiAgaWYgKCFzcmNQYXRoLmxlbmd0aCkge1xuICAgIC8vIG5vIHBhdGggYXQgYWxsLiAgZWFzeS5cbiAgICAvLyB3ZSd2ZSBhbHJlYWR5IGhhbmRsZWQgdGhlIG90aGVyIHN0dWZmIGFib3ZlLlxuICAgIGRlbGV0ZSBzb3VyY2UucGF0aG5hbWU7XG4gICAgLy90byBzdXBwb3J0IGh0dHAucmVxdWVzdFxuICAgIGlmICghc291cmNlLnNlYXJjaCkge1xuICAgICAgc291cmNlLnBhdGggPSAnLycgKyBzb3VyY2Uuc2VhcmNoO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgc291cmNlLnBhdGg7XG4gICAgfVxuICAgIHNvdXJjZS5ocmVmID0gdXJsRm9ybWF0KHNvdXJjZSk7XG4gICAgcmV0dXJuIHNvdXJjZTtcbiAgfVxuICAvLyBpZiBhIHVybCBFTkRzIGluIC4gb3IgLi4sIHRoZW4gaXQgbXVzdCBnZXQgYSB0cmFpbGluZyBzbGFzaC5cbiAgLy8gaG93ZXZlciwgaWYgaXQgZW5kcyBpbiBhbnl0aGluZyBlbHNlIG5vbi1zbGFzaHksXG4gIC8vIHRoZW4gaXQgbXVzdCBOT1QgZ2V0IGEgdHJhaWxpbmcgc2xhc2guXG4gIHZhciBsYXN0ID0gc3JjUGF0aC5zbGljZSgtMSlbMF07XG4gIHZhciBoYXNUcmFpbGluZ1NsYXNoID0gKFxuICAgICAgKHNvdXJjZS5ob3N0IHx8IHJlbGF0aXZlLmhvc3QpICYmIChsYXN0ID09PSAnLicgfHwgbGFzdCA9PT0gJy4uJykgfHxcbiAgICAgIGxhc3QgPT09ICcnKTtcblxuICAvLyBzdHJpcCBzaW5nbGUgZG90cywgcmVzb2x2ZSBkb3VibGUgZG90cyB0byBwYXJlbnQgZGlyXG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBzcmNQYXRoLmxlbmd0aDsgaSA+PSAwOyBpLS0pIHtcbiAgICBsYXN0ID0gc3JjUGF0aFtpXTtcbiAgICBpZiAobGFzdCA9PSAnLicpIHtcbiAgICAgIHNyY1BhdGguc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgc3JjUGF0aC5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHNyY1BhdGguc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmICghbXVzdEVuZEFicyAmJiAhcmVtb3ZlQWxsRG90cykge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgc3JjUGF0aC51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChtdXN0RW5kQWJzICYmIHNyY1BhdGhbMF0gIT09ICcnICYmXG4gICAgICAoIXNyY1BhdGhbMF0gfHwgc3JjUGF0aFswXS5jaGFyQXQoMCkgIT09ICcvJykpIHtcbiAgICBzcmNQYXRoLnVuc2hpZnQoJycpO1xuICB9XG5cbiAgaWYgKGhhc1RyYWlsaW5nU2xhc2ggJiYgKHNyY1BhdGguam9pbignLycpLnN1YnN0cigtMSkgIT09ICcvJykpIHtcbiAgICBzcmNQYXRoLnB1c2goJycpO1xuICB9XG5cbiAgdmFyIGlzQWJzb2x1dGUgPSBzcmNQYXRoWzBdID09PSAnJyB8fFxuICAgICAgKHNyY1BhdGhbMF0gJiYgc3JjUGF0aFswXS5jaGFyQXQoMCkgPT09ICcvJyk7XG5cbiAgLy8gcHV0IHRoZSBob3N0IGJhY2tcbiAgaWYgKHBzeWNob3RpYykge1xuICAgIHNvdXJjZS5ob3N0bmFtZSA9IHNvdXJjZS5ob3N0ID0gaXNBYnNvbHV0ZSA/ICcnIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1BhdGgubGVuZ3RoID8gc3JjUGF0aC5zaGlmdCgpIDogJyc7XG4gICAgLy9vY2NhdGlvbmFseSB0aGUgYXV0aCBjYW4gZ2V0IHN0dWNrIG9ubHkgaW4gaG9zdFxuICAgIC8vdGhpcyBlc3BlY2lhbHkgaGFwcGVucyBpbiBjYXNlcyBsaWtlXG4gICAgLy91cmwucmVzb2x2ZU9iamVjdCgnbWFpbHRvOmxvY2FsMUBkb21haW4xJywgJ2xvY2FsMkBkb21haW4yJylcbiAgICB2YXIgYXV0aEluSG9zdCA9IHNvdXJjZS5ob3N0ICYmIGFycmF5SW5kZXhPZihzb3VyY2UuaG9zdCwgJ0AnKSA+IDAgP1xuICAgICAgICAgICAgICAgICAgICAgc291cmNlLmhvc3Quc3BsaXQoJ0AnKSA6IGZhbHNlO1xuICAgIGlmIChhdXRoSW5Ib3N0KSB7XG4gICAgICBzb3VyY2UuYXV0aCA9IGF1dGhJbkhvc3Quc2hpZnQoKTtcbiAgICAgIHNvdXJjZS5ob3N0ID0gc291cmNlLmhvc3RuYW1lID0gYXV0aEluSG9zdC5zaGlmdCgpO1xuICAgIH1cbiAgfVxuXG4gIG11c3RFbmRBYnMgPSBtdXN0RW5kQWJzIHx8IChzb3VyY2UuaG9zdCAmJiBzcmNQYXRoLmxlbmd0aCk7XG5cbiAgaWYgKG11c3RFbmRBYnMgJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBzcmNQYXRoLnVuc2hpZnQoJycpO1xuICB9XG5cbiAgc291cmNlLnBhdGhuYW1lID0gc3JjUGF0aC5qb2luKCcvJyk7XG4gIC8vdG8gc3VwcG9ydCByZXF1ZXN0Lmh0dHBcbiAgaWYgKHNvdXJjZS5wYXRobmFtZSAhPT0gdW5kZWZpbmVkIHx8IHNvdXJjZS5zZWFyY2ggIT09IHVuZGVmaW5lZCkge1xuICAgIHNvdXJjZS5wYXRoID0gKHNvdXJjZS5wYXRobmFtZSA/IHNvdXJjZS5wYXRobmFtZSA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAoc291cmNlLnNlYXJjaCA/IHNvdXJjZS5zZWFyY2ggOiAnJyk7XG4gIH1cbiAgc291cmNlLmF1dGggPSByZWxhdGl2ZS5hdXRoIHx8IHNvdXJjZS5hdXRoO1xuICBzb3VyY2Uuc2xhc2hlcyA9IHNvdXJjZS5zbGFzaGVzIHx8IHJlbGF0aXZlLnNsYXNoZXM7XG4gIHNvdXJjZS5ocmVmID0gdXJsRm9ybWF0KHNvdXJjZSk7XG4gIHJldHVybiBzb3VyY2U7XG59XG5cbmZ1bmN0aW9uIHBhcnNlSG9zdChob3N0KSB7XG4gIHZhciBvdXQgPSB7fTtcbiAgdmFyIHBvcnQgPSBwb3J0UGF0dGVybi5leGVjKGhvc3QpO1xuICBpZiAocG9ydCkge1xuICAgIHBvcnQgPSBwb3J0WzBdO1xuICAgIG91dC5wb3J0ID0gcG9ydC5zdWJzdHIoMSk7XG4gICAgaG9zdCA9IGhvc3Quc3Vic3RyKDAsIGhvc3QubGVuZ3RoIC0gcG9ydC5sZW5ndGgpO1xuICB9XG4gIGlmIChob3N0KSBvdXQuaG9zdG5hbWUgPSBob3N0O1xuICByZXR1cm4gb3V0O1xufVxuIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuXG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuZXhwb3J0cy5pc0RhdGUgPSBmdW5jdGlvbihvYmope3JldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRGF0ZV0nfTtcbmV4cG9ydHMuaXNSZWdFeHAgPSBmdW5jdGlvbihvYmope3JldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSd9O1xuXG5cbmV4cG9ydHMucHJpbnQgPSBmdW5jdGlvbiAoKSB7fTtcbmV4cG9ydHMucHV0cyA9IGZ1bmN0aW9uICgpIHt9O1xuZXhwb3J0cy5kZWJ1ZyA9IGZ1bmN0aW9uKCkge307XG5cbmV4cG9ydHMuaW5zcGVjdCA9IGZ1bmN0aW9uKG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycykge1xuICB2YXIgc2VlbiA9IFtdO1xuXG4gIHZhciBzdHlsaXplID0gZnVuY3Rpb24oc3RyLCBzdHlsZVR5cGUpIHtcbiAgICAvLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3NcbiAgICB2YXIgc3R5bGVzID1cbiAgICAgICAgeyAnYm9sZCcgOiBbMSwgMjJdLFxuICAgICAgICAgICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgICAgICAgICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICAgICAgICAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgICAgICAgICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICAgICAgICAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICAgICAgICAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAgICAgICAgICdibHVlJyA6IFszNCwgMzldLFxuICAgICAgICAgICdjeWFuJyA6IFszNiwgMzldLFxuICAgICAgICAgICdncmVlbicgOiBbMzIsIDM5XSxcbiAgICAgICAgICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgICAgICAgICAncmVkJyA6IFszMSwgMzldLFxuICAgICAgICAgICd5ZWxsb3cnIDogWzMzLCAzOV0gfTtcblxuICAgIHZhciBzdHlsZSA9XG4gICAgICAgIHsgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICAgICAgICAgJ251bWJlcic6ICdibHVlJyxcbiAgICAgICAgICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAgICAgICAgICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICAgICAgICAgJ251bGwnOiAnYm9sZCcsXG4gICAgICAgICAgJ3N0cmluZyc6ICdncmVlbicsXG4gICAgICAgICAgJ2RhdGUnOiAnbWFnZW50YScsXG4gICAgICAgICAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgICAgICAgICAncmVnZXhwJzogJ3JlZCcgfVtzdHlsZVR5cGVdO1xuXG4gICAgaWYgKHN0eWxlKSB7XG4gICAgICByZXR1cm4gJ1xcdTAwMWJbJyArIHN0eWxlc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAgICdcXHUwMDFiWycgKyBzdHlsZXNbc3R5bGVdWzFdICsgJ20nO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgfTtcbiAgaWYgKCEgY29sb3JzKSB7XG4gICAgc3R5bGl6ZSA9IGZ1bmN0aW9uKHN0ciwgc3R5bGVUeXBlKSB7IHJldHVybiBzdHI7IH07XG4gIH1cblxuICBmdW5jdGlvbiBmb3JtYXQodmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAgIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlLmluc3BlY3QgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICAgIHZhbHVlICE9PSBleHBvcnRzICYmXG4gICAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgICByZXR1cm4gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMpO1xuICAgIH1cblxuICAgIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gICAgc3dpdGNoICh0eXBlb2YgdmFsdWUpIHtcbiAgICAgIGNhc2UgJ3VuZGVmaW5lZCc6XG4gICAgICAgIHJldHVybiBzdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG5cbiAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgICAgIHJldHVybiBzdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuXG4gICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG5cbiAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAgIH1cbiAgICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG4gICAgfVxuXG4gICAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICAgIHZhciB2aXNpYmxlX2tleXMgPSBPYmplY3Rfa2V5cyh2YWx1ZSk7XG4gICAgdmFyIGtleXMgPSBzaG93SGlkZGVuID8gT2JqZWN0X2dldE93blByb3BlcnR5TmFtZXModmFsdWUpIDogdmlzaWJsZV9rZXlzO1xuXG4gICAgLy8gRnVuY3Rpb25zIHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiBrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnJyArIHZhbHVlLCAncmVnZXhwJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRGF0ZXMgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZFxuICAgIGlmIChpc0RhdGUodmFsdWUpICYmIGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gc3R5bGl6ZSh2YWx1ZS50b1VUQ1N0cmluZygpLCAnZGF0ZScpO1xuICAgIH1cblxuICAgIHZhciBiYXNlLCB0eXBlLCBicmFjZXM7XG4gICAgLy8gRGV0ZXJtaW5lIHRoZSBvYmplY3QgdHlwZVxuICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgdHlwZSA9ICdBcnJheSc7XG4gICAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eXBlID0gJ09iamVjdCc7XG4gICAgICBicmFjZXMgPSBbJ3snLCAnfSddO1xuICAgIH1cblxuICAgIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICBiYXNlID0gKGlzUmVnRXhwKHZhbHVlKSkgPyAnICcgKyB2YWx1ZSA6ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJhc2UgPSAnJztcbiAgICB9XG5cbiAgICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgYmFzZSA9ICcgJyArIHZhbHVlLnRvVVRDU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgICB9XG5cbiAgICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnJyArIHZhbHVlLCAncmVnZXhwJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgICB2YXIgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICB2YXIgbmFtZSwgc3RyO1xuICAgICAgaWYgKHZhbHVlLl9fbG9va3VwR2V0dGVyX18pIHtcbiAgICAgICAgaWYgKHZhbHVlLl9fbG9va3VwR2V0dGVyX18oa2V5KSkge1xuICAgICAgICAgIGlmICh2YWx1ZS5fX2xvb2t1cFNldHRlcl9fKGtleSkpIHtcbiAgICAgICAgICAgIHN0ciA9IHN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0ciA9IHN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHZhbHVlLl9fbG9va3VwU2V0dGVyX18oa2V5KSkge1xuICAgICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHZpc2libGVfa2V5cy5pbmRleE9mKGtleSkgPCAwKSB7XG4gICAgICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gICAgICB9XG4gICAgICBpZiAoIXN0cikge1xuICAgICAgICBpZiAoc2Vlbi5pbmRleE9mKHZhbHVlW2tleV0pIDwgMCkge1xuICAgICAgICAgIGlmIChyZWN1cnNlVGltZXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHN0ciA9IGZvcm1hdCh2YWx1ZVtrZXldKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyID0gZm9ybWF0KHZhbHVlW2tleV0sIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdBcnJheScgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICAgICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICAgICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICAgICAgbmFtZSA9IHN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgICAgIG5hbWUgPSBzdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG4gICAgfSk7XG5cbiAgICBzZWVuLnBvcCgpO1xuXG4gICAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICAgIG51bUxpbmVzRXN0Kys7XG4gICAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgICByZXR1cm4gcHJldiArIGN1ci5sZW5ndGggKyAxO1xuICAgIH0sIDApO1xuXG4gICAgaWYgKGxlbmd0aCA+IDUwKSB7XG4gICAgICBvdXRwdXQgPSBicmFjZXNbMF0gK1xuICAgICAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICAgICAnICcgK1xuICAgICAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgICAgICcgJyArXG4gICAgICAgICAgICAgICBicmFjZXNbMV07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0ID0gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xuICAgIH1cblxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cbiAgcmV0dXJuIGZvcm1hdChvYmosICh0eXBlb2YgZGVwdGggPT09ICd1bmRlZmluZWQnID8gMiA6IGRlcHRoKSk7XG59O1xuXG5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpIHx8XG4gICAgICAgICAodHlwZW9mIGFyID09PSAnb2JqZWN0JyAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXIpID09PSAnW29iamVjdCBBcnJheV0nKTtcbn1cblxuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICB0eXBlb2YgcmUgPT09ICdvYmplY3QnICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuXG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiB0eXBlb2YgZCA9PT0gJ29iamVjdCcgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uIChtc2cpIHt9O1xuXG5leHBvcnRzLnB1bXAgPSBudWxsO1xuXG52YXIgT2JqZWN0X2tleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHJlcy5wdXNoKGtleSk7XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbnZhciBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSByZXMucHVzaChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufTtcblxudmFyIE9iamVjdF9jcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IGZ1bmN0aW9uIChwcm90b3R5cGUsIHByb3BlcnRpZXMpIHtcbiAgICAvLyBmcm9tIGVzNS1zaGltXG4gICAgdmFyIG9iamVjdDtcbiAgICBpZiAocHJvdG90eXBlID09PSBudWxsKSB7XG4gICAgICAgIG9iamVjdCA9IHsgJ19fcHJvdG9fXycgOiBudWxsIH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAodHlwZW9mIHByb3RvdHlwZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgICAgJ3R5cGVvZiBwcm90b3R5cGVbJyArICh0eXBlb2YgcHJvdG90eXBlKSArICddICE9IFxcJ29iamVjdFxcJydcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIFR5cGUgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgVHlwZS5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG4gICAgICAgIG9iamVjdCA9IG5ldyBUeXBlKCk7XG4gICAgICAgIG9iamVjdC5fX3Byb3RvX18gPSBwcm90b3R5cGU7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJvcGVydGllcyAhPT0gJ3VuZGVmaW5lZCcgJiYgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMob2JqZWN0LCBwcm9wZXJ0aWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbn07XG5cbmV4cG9ydHMuaW5oZXJpdHMgPSBmdW5jdGlvbihjdG9yLCBzdXBlckN0b3IpIHtcbiAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3I7XG4gIGN0b3IucHJvdG90eXBlID0gT2JqZWN0X2NyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgY29uc3RydWN0b3I6IHtcbiAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH1cbiAgfSk7XG59O1xuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAodHlwZW9mIGYgIT09ICdzdHJpbmcnKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGV4cG9ydHMuaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6IHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSl7XG4gICAgaWYgKHggPT09IG51bGwgfHwgdHlwZW9mIHggIT09ICdvYmplY3QnKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGV4cG9ydHMuaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG4iLG51bGwsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICBpZiAoZXYuc291cmNlID09PSB3aW5kb3cgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwidmFyIFN0cmVhbSA9IHJlcXVpcmUoJ3N0cmVhbScpO1xudmFyIHNvY2tqcyA9IHJlcXVpcmUoJ3NvY2tqcy1jbGllbnQnKTtcbnZhciByZXNvbHZlID0gcmVxdWlyZSgndXJsJykucmVzb2x2ZTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodSwgY2IpIHtcbiAgICB2YXIgdXJpID0gcmVzb2x2ZSh3aW5kb3cubG9jYXRpb24uaHJlZiwgdSk7XG4gICAgXG4gICAgdmFyIHN0cmVhbSA9IG5ldyBTdHJlYW07XG4gICAgc3RyZWFtLnJlYWRhYmxlID0gdHJ1ZTtcbiAgICBzdHJlYW0ud3JpdGFibGUgPSB0cnVlO1xuICAgIFxuICAgIHZhciByZWFkeSA9IGZhbHNlO1xuICAgIHZhciBidWZmZXIgPSBbXTtcbiAgICBcbiAgICB2YXIgc29jayA9IHNvY2tqcyh1cmkpO1xuICAgIHN0cmVhbS5zb2NrID0gc29jaztcbiAgICBcbiAgICBzdHJlYW0ud3JpdGUgPSBmdW5jdGlvbiAobXNnKSB7XG4gICAgICAgIGlmICghcmVhZHkgfHwgYnVmZmVyLmxlbmd0aCkgYnVmZmVyLnB1c2gobXNnKVxuICAgICAgICBlbHNlIHNvY2suc2VuZChtc2cpXG4gICAgfTtcbiAgICBcbiAgICBzdHJlYW0uZW5kID0gZnVuY3Rpb24gKG1zZykge1xuICAgICAgICBpZiAobXNnICE9PSB1bmRlZmluZWQpIHN0cmVhbS53cml0ZShtc2cpO1xuICAgICAgICBpZiAoIXJlYWR5KSB7XG4gICAgICAgICAgICBzdHJlYW0uX2VuZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzdHJlYW0ud3JpdGFibGUgPSBmYWxzZTtcbiAgICAgICAgc29jay5jbG9zZSgpO1xuICAgIH07XG4gICAgXG4gICAgc3RyZWFtLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN0cmVhbS5fZW5kZWQgPSB0cnVlO1xuICAgICAgICBzdHJlYW0ud3JpdGFibGUgPSBzdHJlYW0ucmVhZGFibGUgPSBmYWxzZTtcbiAgICAgICAgYnVmZmVyLmxlbmd0aCA9IDBcbiAgICAgICAgc29jay5jbG9zZSgpO1xuICAgIH07XG4gICAgXG4gICAgc29jay5vbm9wZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIGNiKCk7XG4gICAgICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBidWZmZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHNvY2suc2VuZChidWZmZXJbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGJ1ZmZlciA9IFtdO1xuICAgICAgICBzdHJlYW0uZW1pdCgnY29ubmVjdCcpO1xuICAgICAgICBpZiAoc3RyZWFtLl9lbmRlZCkgc3RyZWFtLmVuZCgpO1xuICAgIH07XG4gICAgXG4gICAgc29jay5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICBzdHJlYW0uZW1pdCgnZGF0YScsIGUuZGF0YSk7XG4gICAgfTtcbiAgICBcbiAgICBzb2NrLm9uY2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN0cmVhbS5lbWl0KCdlbmQnKTtcbiAgICAgICAgc3RyZWFtLndyaXRhYmxlID0gZmFsc2U7XG4gICAgICAgIHN0cmVhbS5yZWFkYWJsZSA9IGZhbHNlO1xuICAgIH07XG4gICAgXG4gICAgcmV0dXJuIHN0cmVhbTtcbn07XG4iLCIvKiBTb2NrSlMgY2xpZW50LCB2ZXJzaW9uIDAuMy4xLjcuZ2E2N2YuZGlydHksIGh0dHA6Ly9zb2NranMub3JnLCBNSVQgTGljZW5zZVxuXG5Db3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLlxuKi9cblxuLy8gSlNPTjIgYnkgRG91Z2xhcyBDcm9ja2ZvcmQgKG1pbmlmaWVkKS5cbnZhciBKU09OO0pTT058fChKU09OPXt9KSxmdW5jdGlvbigpe2Z1bmN0aW9uIHN0cihhLGIpe3ZhciBjLGQsZSxmLGc9Z2FwLGgsaT1iW2FdO2kmJnR5cGVvZiBpPT1cIm9iamVjdFwiJiZ0eXBlb2YgaS50b0pTT049PVwiZnVuY3Rpb25cIiYmKGk9aS50b0pTT04oYSkpLHR5cGVvZiByZXA9PVwiZnVuY3Rpb25cIiYmKGk9cmVwLmNhbGwoYixhLGkpKTtzd2l0Y2godHlwZW9mIGkpe2Nhc2VcInN0cmluZ1wiOnJldHVybiBxdW90ZShpKTtjYXNlXCJudW1iZXJcIjpyZXR1cm4gaXNGaW5pdGUoaSk/U3RyaW5nKGkpOlwibnVsbFwiO2Nhc2VcImJvb2xlYW5cIjpjYXNlXCJudWxsXCI6cmV0dXJuIFN0cmluZyhpKTtjYXNlXCJvYmplY3RcIjppZighaSlyZXR1cm5cIm51bGxcIjtnYXArPWluZGVudCxoPVtdO2lmKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuYXBwbHkoaSk9PT1cIltvYmplY3QgQXJyYXldXCIpe2Y9aS5sZW5ndGg7Zm9yKGM9MDtjPGY7Yys9MSloW2NdPXN0cihjLGkpfHxcIm51bGxcIjtlPWgubGVuZ3RoPT09MD9cIltdXCI6Z2FwP1wiW1xcblwiK2dhcCtoLmpvaW4oXCIsXFxuXCIrZ2FwKStcIlxcblwiK2crXCJdXCI6XCJbXCIraC5qb2luKFwiLFwiKStcIl1cIixnYXA9ZztyZXR1cm4gZX1pZihyZXAmJnR5cGVvZiByZXA9PVwib2JqZWN0XCIpe2Y9cmVwLmxlbmd0aDtmb3IoYz0wO2M8ZjtjKz0xKXR5cGVvZiByZXBbY109PVwic3RyaW5nXCImJihkPXJlcFtjXSxlPXN0cihkLGkpLGUmJmgucHVzaChxdW90ZShkKSsoZ2FwP1wiOiBcIjpcIjpcIikrZSkpfWVsc2UgZm9yKGQgaW4gaSlPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoaSxkKSYmKGU9c3RyKGQsaSksZSYmaC5wdXNoKHF1b3RlKGQpKyhnYXA/XCI6IFwiOlwiOlwiKStlKSk7ZT1oLmxlbmd0aD09PTA/XCJ7fVwiOmdhcD9cIntcXG5cIitnYXAraC5qb2luKFwiLFxcblwiK2dhcCkrXCJcXG5cIitnK1wifVwiOlwie1wiK2guam9pbihcIixcIikrXCJ9XCIsZ2FwPWc7cmV0dXJuIGV9fWZ1bmN0aW9uIHF1b3RlKGEpe2VzY2FwYWJsZS5sYXN0SW5kZXg9MDtyZXR1cm4gZXNjYXBhYmxlLnRlc3QoYSk/J1wiJythLnJlcGxhY2UoZXNjYXBhYmxlLGZ1bmN0aW9uKGEpe3ZhciBiPW1ldGFbYV07cmV0dXJuIHR5cGVvZiBiPT1cInN0cmluZ1wiP2I6XCJcXFxcdVwiKyhcIjAwMDBcIithLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zbGljZSgtNCl9KSsnXCInOidcIicrYSsnXCInfWZ1bmN0aW9uIGYoYSl7cmV0dXJuIGE8MTA/XCIwXCIrYTphfVwidXNlIHN0cmljdFwiLHR5cGVvZiBEYXRlLnByb3RvdHlwZS50b0pTT04hPVwiZnVuY3Rpb25cIiYmKERhdGUucHJvdG90eXBlLnRvSlNPTj1mdW5jdGlvbihhKXtyZXR1cm4gaXNGaW5pdGUodGhpcy52YWx1ZU9mKCkpP3RoaXMuZ2V0VVRDRnVsbFllYXIoKStcIi1cIitmKHRoaXMuZ2V0VVRDTW9udGgoKSsxKStcIi1cIitmKHRoaXMuZ2V0VVRDRGF0ZSgpKStcIlRcIitmKHRoaXMuZ2V0VVRDSG91cnMoKSkrXCI6XCIrZih0aGlzLmdldFVUQ01pbnV0ZXMoKSkrXCI6XCIrZih0aGlzLmdldFVUQ1NlY29uZHMoKSkrXCJaXCI6bnVsbH0sU3RyaW5nLnByb3RvdHlwZS50b0pTT049TnVtYmVyLnByb3RvdHlwZS50b0pTT049Qm9vbGVhbi5wcm90b3R5cGUudG9KU09OPWZ1bmN0aW9uKGEpe3JldHVybiB0aGlzLnZhbHVlT2YoKX0pO3ZhciBjeD0vW1xcdTAwMDBcXHUwMGFkXFx1MDYwMC1cXHUwNjA0XFx1MDcwZlxcdTE3YjRcXHUxN2I1XFx1MjAwYy1cXHUyMDBmXFx1MjAyOC1cXHUyMDJmXFx1MjA2MC1cXHUyMDZmXFx1ZmVmZlxcdWZmZjAtXFx1ZmZmZl0vZyxlc2NhcGFibGU9L1tcXFxcXFxcIlxceDAwLVxceDFmXFx4N2YtXFx4OWZcXHUwMGFkXFx1MDYwMC1cXHUwNjA0XFx1MDcwZlxcdTE3YjRcXHUxN2I1XFx1MjAwYy1cXHUyMDBmXFx1MjAyOC1cXHUyMDJmXFx1MjA2MC1cXHUyMDZmXFx1ZmVmZlxcdWZmZjAtXFx1ZmZmZl0vZyxnYXAsaW5kZW50LG1ldGE9e1wiXFxiXCI6XCJcXFxcYlwiLFwiXFx0XCI6XCJcXFxcdFwiLFwiXFxuXCI6XCJcXFxcblwiLFwiXFxmXCI6XCJcXFxcZlwiLFwiXFxyXCI6XCJcXFxcclwiLCdcIic6J1xcXFxcIicsXCJcXFxcXCI6XCJcXFxcXFxcXFwifSxyZXA7dHlwZW9mIEpTT04uc3RyaW5naWZ5IT1cImZ1bmN0aW9uXCImJihKU09OLnN0cmluZ2lmeT1mdW5jdGlvbihhLGIsYyl7dmFyIGQ7Z2FwPVwiXCIsaW5kZW50PVwiXCI7aWYodHlwZW9mIGM9PVwibnVtYmVyXCIpZm9yKGQ9MDtkPGM7ZCs9MSlpbmRlbnQrPVwiIFwiO2Vsc2UgdHlwZW9mIGM9PVwic3RyaW5nXCImJihpbmRlbnQ9Yyk7cmVwPWI7aWYoIWJ8fHR5cGVvZiBiPT1cImZ1bmN0aW9uXCJ8fHR5cGVvZiBiPT1cIm9iamVjdFwiJiZ0eXBlb2YgYi5sZW5ndGg9PVwibnVtYmVyXCIpcmV0dXJuIHN0cihcIlwiLHtcIlwiOmF9KTt0aHJvdyBuZXcgRXJyb3IoXCJKU09OLnN0cmluZ2lmeVwiKX0pLHR5cGVvZiBKU09OLnBhcnNlIT1cImZ1bmN0aW9uXCImJihKU09OLnBhcnNlPWZ1bmN0aW9uKHRleHQscmV2aXZlcil7ZnVuY3Rpb24gd2FsayhhLGIpe3ZhciBjLGQsZT1hW2JdO2lmKGUmJnR5cGVvZiBlPT1cIm9iamVjdFwiKWZvcihjIGluIGUpT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGUsYykmJihkPXdhbGsoZSxjKSxkIT09dW5kZWZpbmVkP2VbY109ZDpkZWxldGUgZVtjXSk7cmV0dXJuIHJldml2ZXIuY2FsbChhLGIsZSl9dmFyIGo7dGV4dD1TdHJpbmcodGV4dCksY3gubGFzdEluZGV4PTAsY3gudGVzdCh0ZXh0KSYmKHRleHQ9dGV4dC5yZXBsYWNlKGN4LGZ1bmN0aW9uKGEpe3JldHVyblwiXFxcXHVcIisoXCIwMDAwXCIrYS5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTQpfSkpO2lmKC9eW1xcXSw6e31cXHNdKiQvLnRlc3QodGV4dC5yZXBsYWNlKC9cXFxcKD86W1wiXFxcXFxcL2JmbnJ0XXx1WzAtOWEtZkEtRl17NH0pL2csXCJAXCIpLnJlcGxhY2UoL1wiW15cIlxcXFxcXG5cXHJdKlwifHRydWV8ZmFsc2V8bnVsbHwtP1xcZCsoPzpcXC5cXGQqKT8oPzpbZUVdWytcXC1dP1xcZCspPy9nLFwiXVwiKS5yZXBsYWNlKC8oPzpefDp8LCkoPzpcXHMqXFxbKSsvZyxcIlwiKSkpe2o9ZXZhbChcIihcIit0ZXh0K1wiKVwiKTtyZXR1cm4gdHlwZW9mIHJldml2ZXI9PVwiZnVuY3Rpb25cIj93YWxrKHtcIlwiOmp9LFwiXCIpOmp9dGhyb3cgbmV3IFN5bnRheEVycm9yKFwiSlNPTi5wYXJzZVwiKX0pfSgpXG5cblxuLy8gICAgIFsqXSBJbmNsdWRpbmcgbGliL2luZGV4LmpzXG4vLyBQdWJsaWMgb2JqZWN0XG52YXIgU29ja0pTID0gKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIHZhciBfZG9jdW1lbnQgPSBkb2N1bWVudDtcbiAgICAgICAgICAgICAgdmFyIF93aW5kb3cgPSB3aW5kb3c7XG4gICAgICAgICAgICAgIHZhciB1dGlscyA9IHt9O1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvcmV2ZW50dGFyZ2V0LmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG4vKiBTaW1wbGlmaWVkIGltcGxlbWVudGF0aW9uIG9mIERPTTIgRXZlbnRUYXJnZXQuXG4gKiAgIGh0dHA6Ly93d3cudzMub3JnL1RSL0RPTS1MZXZlbC0yLUV2ZW50cy9ldmVudHMuaHRtbCNFdmVudHMtRXZlbnRUYXJnZXRcbiAqL1xudmFyIFJFdmVudFRhcmdldCA9IGZ1bmN0aW9uKCkge307XG5SRXZlbnRUYXJnZXQucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBsaXN0ZW5lcikge1xuICAgIGlmKCF0aGlzLl9saXN0ZW5lcnMpIHtcbiAgICAgICAgIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xuICAgIH1cbiAgICBpZighKGV2ZW50VHlwZSBpbiB0aGlzLl9saXN0ZW5lcnMpKSB7XG4gICAgICAgIHRoaXMuX2xpc3RlbmVyc1tldmVudFR5cGVdID0gW107XG4gICAgfVxuICAgIHZhciBhcnIgPSB0aGlzLl9saXN0ZW5lcnNbZXZlbnRUeXBlXTtcbiAgICBpZih1dGlscy5hcnJJbmRleE9mKGFyciwgbGlzdGVuZXIpID09PSAtMSkge1xuICAgICAgICBhcnIucHVzaChsaXN0ZW5lcik7XG4gICAgfVxuICAgIHJldHVybjtcbn07XG5cblJFdmVudFRhcmdldC5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChldmVudFR5cGUsIGxpc3RlbmVyKSB7XG4gICAgaWYoISh0aGlzLl9saXN0ZW5lcnMgJiYgKGV2ZW50VHlwZSBpbiB0aGlzLl9saXN0ZW5lcnMpKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBhcnIgPSB0aGlzLl9saXN0ZW5lcnNbZXZlbnRUeXBlXTtcbiAgICB2YXIgaWR4ID0gdXRpbHMuYXJySW5kZXhPZihhcnIsIGxpc3RlbmVyKTtcbiAgICBpZiAoaWR4ICE9PSAtMSkge1xuICAgICAgICBpZihhcnIubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgdGhpcy5fbGlzdGVuZXJzW2V2ZW50VHlwZV0gPSBhcnIuc2xpY2UoMCwgaWR4KS5jb25jYXQoIGFyci5zbGljZShpZHgrMSkgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9saXN0ZW5lcnNbZXZlbnRUeXBlXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybjtcbn07XG5cblJFdmVudFRhcmdldC5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciB0ID0gZXZlbnQudHlwZTtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgaWYgKHRoaXNbJ29uJyt0XSkge1xuICAgICAgICB0aGlzWydvbicrdF0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9saXN0ZW5lcnMgJiYgdCBpbiB0aGlzLl9saXN0ZW5lcnMpIHtcbiAgICAgICAgZm9yKHZhciBpPTA7IGkgPCB0aGlzLl9saXN0ZW5lcnNbdF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuX2xpc3RlbmVyc1t0XVtpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3JldmVudHRhcmdldC5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvc2ltcGxlZXZlbnQuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBTaW1wbGVFdmVudCA9IGZ1bmN0aW9uKHR5cGUsIG9iaikge1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgaWYgKHR5cGVvZiBvYmogIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGZvcih2YXIgayBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KGspKSBjb250aW51ZTtcbiAgICAgICAgICAgIHRoaXNba10gPSBvYmpba107XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5TaW1wbGVFdmVudC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgciA9IFtdO1xuICAgIGZvcih2YXIgayBpbiB0aGlzKSB7XG4gICAgICAgIGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eShrKSkgY29udGludWU7XG4gICAgICAgIHZhciB2ID0gdGhpc1trXTtcbiAgICAgICAgaWYgKHR5cGVvZiB2ID09PSAnZnVuY3Rpb24nKSB2ID0gJ1tmdW5jdGlvbl0nO1xuICAgICAgICByLnB1c2goayArICc9JyArIHYpO1xuICAgIH1cbiAgICByZXR1cm4gJ1NpbXBsZUV2ZW50KCcgKyByLmpvaW4oJywgJykgKyAnKSc7XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi9zaW1wbGVldmVudC5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvZXZlbnRlbWl0dGVyLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgRXZlbnRFbWl0dGVyID0gZnVuY3Rpb24oZXZlbnRzKSB7XG4gICAgdGhpcy5ldmVudHMgPSBldmVudHMgfHwgW107XG59O1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgaWYgKCF0aGF0Lm51a2VkICYmIHRoYXRbJ29uJyt0eXBlXSkge1xuICAgICAgICB0aGF0WydvbicrdHlwZV0uYXBwbHkodGhhdCwgYXJncyk7XG4gICAgfVxuICAgIGlmICh1dGlscy5hcnJJbmRleE9mKHRoYXQuZXZlbnRzLCB0eXBlKSA9PT0gLTEpIHtcbiAgICAgICAgdXRpbHMubG9nKCdFdmVudCAnICsgSlNPTi5zdHJpbmdpZnkodHlwZSkgK1xuICAgICAgICAgICAgICAgICAgJyBub3QgbGlzdGVkICcgKyBKU09OLnN0cmluZ2lmeSh0aGF0LmV2ZW50cykgK1xuICAgICAgICAgICAgICAgICAgJyBpbiAnICsgdGhhdCk7XG4gICAgfVxufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5udWtlID0gZnVuY3Rpb24odHlwZSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0Lm51a2VkID0gdHJ1ZTtcbiAgICBmb3IodmFyIGk9MDsgaTx0aGF0LmV2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBkZWxldGUgdGhhdFt0aGF0LmV2ZW50c1tpXV07XG4gICAgfVxufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvZXZlbnRlbWl0dGVyLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi91dGlscy5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIHJhbmRvbV9zdHJpbmdfY2hhcnMgPSAnYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Xyc7XG51dGlscy5yYW5kb21fc3RyaW5nID0gZnVuY3Rpb24obGVuZ3RoLCBtYXgpIHtcbiAgICBtYXggPSBtYXggfHwgcmFuZG9tX3N0cmluZ19jaGFycy5sZW5ndGg7XG4gICAgdmFyIGksIHJldCA9IFtdO1xuICAgIGZvcihpPTA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICByZXQucHVzaCggcmFuZG9tX3N0cmluZ19jaGFycy5zdWJzdHIoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KSwxKSApO1xuICAgIH1cbiAgICByZXR1cm4gcmV0LmpvaW4oJycpO1xufTtcbnV0aWxzLnJhbmRvbV9udW1iZXIgPSBmdW5jdGlvbihtYXgpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcbn07XG51dGlscy5yYW5kb21fbnVtYmVyX3N0cmluZyA9IGZ1bmN0aW9uKG1heCkge1xuICAgIHZhciB0ID0gKCcnKyhtYXggLSAxKSkubGVuZ3RoO1xuICAgIHZhciBwID0gQXJyYXkodCsxKS5qb2luKCcwJyk7XG4gICAgcmV0dXJuIChwICsgdXRpbHMucmFuZG9tX251bWJlcihtYXgpKS5zbGljZSgtdCk7XG59O1xuXG4vLyBBc3N1bWluZyB0aGF0IHVybCBsb29rcyBsaWtlOiBodHRwOi8vYXNkYXNkOjExMS9hc2RcbnV0aWxzLmdldE9yaWdpbiA9IGZ1bmN0aW9uKHVybCkge1xuICAgIHVybCArPSAnLyc7XG4gICAgdmFyIHBhcnRzID0gdXJsLnNwbGl0KCcvJykuc2xpY2UoMCwgMyk7XG4gICAgcmV0dXJuIHBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbnV0aWxzLmlzU2FtZU9yaWdpblVybCA9IGZ1bmN0aW9uKHVybF9hLCB1cmxfYikge1xuICAgIC8vIGxvY2F0aW9uLm9yaWdpbiB3b3VsZCBkbywgYnV0IGl0J3Mgbm90IGFsd2F5cyBhdmFpbGFibGUuXG4gICAgaWYgKCF1cmxfYikgdXJsX2IgPSBfd2luZG93LmxvY2F0aW9uLmhyZWY7XG5cbiAgICByZXR1cm4gKHVybF9hLnNwbGl0KCcvJykuc2xpY2UoMCwzKS5qb2luKCcvJylcbiAgICAgICAgICAgICAgICA9PT1cbiAgICAgICAgICAgIHVybF9iLnNwbGl0KCcvJykuc2xpY2UoMCwzKS5qb2luKCcvJykpO1xufTtcblxudXRpbHMuZ2V0UGFyZW50RG9tYWluID0gZnVuY3Rpb24odXJsKSB7XG4gICAgLy8gaXB2NCBpcCBhZGRyZXNzXG4gICAgaWYgKC9eWzAtOS5dKiQvLnRlc3QodXJsKSkgcmV0dXJuIHVybDtcbiAgICAvLyBpcHY2IGlwIGFkZHJlc3NcbiAgICBpZiAoL15cXFsvLnRlc3QodXJsKSkgcmV0dXJuIHVybDtcbiAgICAvLyBubyBkb3RzXG4gICAgaWYgKCEoL1suXS8udGVzdCh1cmwpKSkgcmV0dXJuIHVybDtcblxuICAgIHZhciBwYXJ0cyA9IHVybC5zcGxpdCgnLicpLnNsaWNlKDEpO1xuICAgIHJldHVybiBwYXJ0cy5qb2luKCcuJyk7XG59O1xuXG51dGlscy5vYmplY3RFeHRlbmQgPSBmdW5jdGlvbihkc3QsIHNyYykge1xuICAgIGZvcih2YXIgayBpbiBzcmMpIHtcbiAgICAgICAgaWYgKHNyYy5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgZHN0W2tdID0gc3JjW2tdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkc3Q7XG59O1xuXG52YXIgV1ByZWZpeCA9ICdfanAnO1xuXG51dGlscy5wb2xsdXRlR2xvYmFsTmFtZXNwYWNlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEoV1ByZWZpeCBpbiBfd2luZG93KSkge1xuICAgICAgICBfd2luZG93W1dQcmVmaXhdID0ge307XG4gICAgfVxufTtcblxudXRpbHMuY2xvc2VGcmFtZSA9IGZ1bmN0aW9uIChjb2RlLCByZWFzb24pIHtcbiAgICByZXR1cm4gJ2MnK0pTT04uc3RyaW5naWZ5KFtjb2RlLCByZWFzb25dKTtcbn07XG5cbnV0aWxzLnVzZXJTZXRDb2RlID0gZnVuY3Rpb24gKGNvZGUpIHtcbiAgICByZXR1cm4gY29kZSA9PT0gMTAwMCB8fCAoY29kZSA+PSAzMDAwICYmIGNvZGUgPD0gNDk5OSk7XG59O1xuXG4vLyBTZWU6IGh0dHA6Ly93d3cuZXJnLmFiZG4uYWMudWsvfmdlcnJpdC9kY2NwL25vdGVzL2NjaWQyL3J0b19lc3RpbWF0b3IvXG4vLyBhbmQgUkZDIDI5ODguXG51dGlscy5jb3VudFJUTyA9IGZ1bmN0aW9uIChydHQpIHtcbiAgICB2YXIgcnRvO1xuICAgIGlmIChydHQgPiAxMDApIHtcbiAgICAgICAgcnRvID0gMyAqIHJ0dDsgLy8gcnRvID4gMzAwbXNlY1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJ0byA9IHJ0dCArIDIwMDsgLy8gMjAwbXNlYyA8IHJ0byA8PSAzMDBtc2VjXG4gICAgfVxuICAgIHJldHVybiBydG87XG59XG5cbnV0aWxzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChfd2luZG93LmNvbnNvbGUgJiYgY29uc29sZS5sb2cgJiYgY29uc29sZS5sb2cuYXBwbHkpIHtcbiAgICAgICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcbiAgICB9XG59O1xuXG51dGlscy5iaW5kID0gZnVuY3Rpb24oZnVuLCB0aGF0KSB7XG4gICAgaWYgKGZ1bi5iaW5kKSB7XG4gICAgICAgIHJldHVybiBmdW4uYmluZCh0aGF0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuLmFwcGx5KHRoYXQsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfVxufTtcblxudXRpbHMuZmxhdFVybCA9IGZ1bmN0aW9uKHVybCkge1xuICAgIHJldHVybiB1cmwuaW5kZXhPZignPycpID09PSAtMSAmJiB1cmwuaW5kZXhPZignIycpID09PSAtMTtcbn07XG5cbnV0aWxzLmFtZW5kVXJsID0gZnVuY3Rpb24odXJsKSB7XG4gICAgdmFyIGRsID0gX2RvY3VtZW50LmxvY2F0aW9uO1xuICAgIGlmICghdXJsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignV3JvbmcgdXJsIGZvciBTb2NrSlMnKTtcbiAgICB9XG4gICAgaWYgKCF1dGlscy5mbGF0VXJsKHVybCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPbmx5IGJhc2ljIHVybHMgYXJlIHN1cHBvcnRlZCBpbiBTb2NrSlMnKTtcbiAgICB9XG5cbiAgICAvLyAgJy8vYWJjJyAtLT4gJ2h0dHA6Ly9hYmMnXG4gICAgaWYgKHVybC5pbmRleE9mKCcvLycpID09PSAwKSB7XG4gICAgICAgIHVybCA9IGRsLnByb3RvY29sICsgdXJsO1xuICAgIH1cbiAgICAvLyAnL2FiYycgLS0+ICdodHRwOi8vbG9jYWxob3N0OjgwL2FiYydcbiAgICBpZiAodXJsLmluZGV4T2YoJy8nKSA9PT0gMCkge1xuICAgICAgICB1cmwgPSBkbC5wcm90b2NvbCArICcvLycgKyBkbC5ob3N0ICsgdXJsO1xuICAgIH1cbiAgICAvLyBzdHJpcCB0cmFpbGluZyBzbGFzaGVzXG4gICAgdXJsID0gdXJsLnJlcGxhY2UoL1svXSskLywnJyk7XG4gICAgcmV0dXJuIHVybDtcbn07XG5cbi8vIElFIGRvZXNuJ3Qgc3VwcG9ydCBbXS5pbmRleE9mLlxudXRpbHMuYXJySW5kZXhPZiA9IGZ1bmN0aW9uKGFyciwgb2JqKXtcbiAgICBmb3IodmFyIGk9MDsgaSA8IGFyci5sZW5ndGg7IGkrKyl7XG4gICAgICAgIGlmKGFycltpXSA9PT0gb2JqKXtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn07XG5cbnV0aWxzLmFyclNraXAgPSBmdW5jdGlvbihhcnIsIG9iaikge1xuICAgIHZhciBpZHggPSB1dGlscy5hcnJJbmRleE9mKGFyciwgb2JqKTtcbiAgICBpZiAoaWR4ID09PSAtMSkge1xuICAgICAgICByZXR1cm4gYXJyLnNsaWNlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGRzdCA9IGFyci5zbGljZSgwLCBpZHgpO1xuICAgICAgICByZXR1cm4gZHN0LmNvbmNhdChhcnIuc2xpY2UoaWR4KzEpKTtcbiAgICB9XG59O1xuXG4vLyBWaWE6IGh0dHBzOi8vZ2lzdC5naXRodWIuY29tLzExMzMxMjIvMjEyMWM2MDFjNTU0OTE1NTQ4M2Y1MGJlM2RhNTMwNWU4M2I4YzVkZlxudXRpbHMuaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4ge30udG9TdHJpbmcuY2FsbCh2YWx1ZSkuaW5kZXhPZignQXJyYXknKSA+PSAwXG59O1xuXG51dGlscy5kZWxheSA9IGZ1bmN0aW9uKHQsIGZ1bikge1xuICAgIGlmKHR5cGVvZiB0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGZ1biA9IHQ7XG4gICAgICAgIHQgPSAwO1xuICAgIH1cbiAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIHQpO1xufTtcblxuXG4vLyBDaGFycyB3b3J0aCBlc2NhcGluZywgYXMgZGVmaW5lZCBieSBEb3VnbGFzIENyb2NrZm9yZDpcbi8vICAgaHR0cHM6Ly9naXRodWIuY29tL2RvdWdsYXNjcm9ja2ZvcmQvSlNPTi1qcy9ibG9iLzQ3YTk4ODJjZGRlYjFlODUyOWUwN2FmOTczNjIxODA3NTM3MmI4YWMvanNvbjIuanMjTDE5NlxudmFyIGpzb25fZXNjYXBhYmxlID0gL1tcXFxcXFxcIlxceDAwLVxceDFmXFx4N2YtXFx4OWZcXHUwMGFkXFx1MDYwMC1cXHUwNjA0XFx1MDcwZlxcdTE3YjRcXHUxN2I1XFx1MjAwYy1cXHUyMDBmXFx1MjAyOC1cXHUyMDJmXFx1MjA2MC1cXHUyMDZmXFx1ZmVmZlxcdWZmZjAtXFx1ZmZmZl0vZyxcbiAgICBqc29uX2xvb2t1cCA9IHtcblwiXFx1MDAwMFwiOlwiXFxcXHUwMDAwXCIsXCJcXHUwMDAxXCI6XCJcXFxcdTAwMDFcIixcIlxcdTAwMDJcIjpcIlxcXFx1MDAwMlwiLFwiXFx1MDAwM1wiOlwiXFxcXHUwMDAzXCIsXG5cIlxcdTAwMDRcIjpcIlxcXFx1MDAwNFwiLFwiXFx1MDAwNVwiOlwiXFxcXHUwMDA1XCIsXCJcXHUwMDA2XCI6XCJcXFxcdTAwMDZcIixcIlxcdTAwMDdcIjpcIlxcXFx1MDAwN1wiLFxuXCJcXGJcIjpcIlxcXFxiXCIsXCJcXHRcIjpcIlxcXFx0XCIsXCJcXG5cIjpcIlxcXFxuXCIsXCJcXHUwMDBiXCI6XCJcXFxcdTAwMGJcIixcIlxcZlwiOlwiXFxcXGZcIixcIlxcclwiOlwiXFxcXHJcIixcblwiXFx1MDAwZVwiOlwiXFxcXHUwMDBlXCIsXCJcXHUwMDBmXCI6XCJcXFxcdTAwMGZcIixcIlxcdTAwMTBcIjpcIlxcXFx1MDAxMFwiLFwiXFx1MDAxMVwiOlwiXFxcXHUwMDExXCIsXG5cIlxcdTAwMTJcIjpcIlxcXFx1MDAxMlwiLFwiXFx1MDAxM1wiOlwiXFxcXHUwMDEzXCIsXCJcXHUwMDE0XCI6XCJcXFxcdTAwMTRcIixcIlxcdTAwMTVcIjpcIlxcXFx1MDAxNVwiLFxuXCJcXHUwMDE2XCI6XCJcXFxcdTAwMTZcIixcIlxcdTAwMTdcIjpcIlxcXFx1MDAxN1wiLFwiXFx1MDAxOFwiOlwiXFxcXHUwMDE4XCIsXCJcXHUwMDE5XCI6XCJcXFxcdTAwMTlcIixcblwiXFx1MDAxYVwiOlwiXFxcXHUwMDFhXCIsXCJcXHUwMDFiXCI6XCJcXFxcdTAwMWJcIixcIlxcdTAwMWNcIjpcIlxcXFx1MDAxY1wiLFwiXFx1MDAxZFwiOlwiXFxcXHUwMDFkXCIsXG5cIlxcdTAwMWVcIjpcIlxcXFx1MDAxZVwiLFwiXFx1MDAxZlwiOlwiXFxcXHUwMDFmXCIsXCJcXFwiXCI6XCJcXFxcXFxcIlwiLFwiXFxcXFwiOlwiXFxcXFxcXFxcIixcblwiXFx1MDA3ZlwiOlwiXFxcXHUwMDdmXCIsXCJcXHUwMDgwXCI6XCJcXFxcdTAwODBcIixcIlxcdTAwODFcIjpcIlxcXFx1MDA4MVwiLFwiXFx1MDA4MlwiOlwiXFxcXHUwMDgyXCIsXG5cIlxcdTAwODNcIjpcIlxcXFx1MDA4M1wiLFwiXFx1MDA4NFwiOlwiXFxcXHUwMDg0XCIsXCJcXHUwMDg1XCI6XCJcXFxcdTAwODVcIixcIlxcdTAwODZcIjpcIlxcXFx1MDA4NlwiLFxuXCJcXHUwMDg3XCI6XCJcXFxcdTAwODdcIixcIlxcdTAwODhcIjpcIlxcXFx1MDA4OFwiLFwiXFx1MDA4OVwiOlwiXFxcXHUwMDg5XCIsXCJcXHUwMDhhXCI6XCJcXFxcdTAwOGFcIixcblwiXFx1MDA4YlwiOlwiXFxcXHUwMDhiXCIsXCJcXHUwMDhjXCI6XCJcXFxcdTAwOGNcIixcIlxcdTAwOGRcIjpcIlxcXFx1MDA4ZFwiLFwiXFx1MDA4ZVwiOlwiXFxcXHUwMDhlXCIsXG5cIlxcdTAwOGZcIjpcIlxcXFx1MDA4ZlwiLFwiXFx1MDA5MFwiOlwiXFxcXHUwMDkwXCIsXCJcXHUwMDkxXCI6XCJcXFxcdTAwOTFcIixcIlxcdTAwOTJcIjpcIlxcXFx1MDA5MlwiLFxuXCJcXHUwMDkzXCI6XCJcXFxcdTAwOTNcIixcIlxcdTAwOTRcIjpcIlxcXFx1MDA5NFwiLFwiXFx1MDA5NVwiOlwiXFxcXHUwMDk1XCIsXCJcXHUwMDk2XCI6XCJcXFxcdTAwOTZcIixcblwiXFx1MDA5N1wiOlwiXFxcXHUwMDk3XCIsXCJcXHUwMDk4XCI6XCJcXFxcdTAwOThcIixcIlxcdTAwOTlcIjpcIlxcXFx1MDA5OVwiLFwiXFx1MDA5YVwiOlwiXFxcXHUwMDlhXCIsXG5cIlxcdTAwOWJcIjpcIlxcXFx1MDA5YlwiLFwiXFx1MDA5Y1wiOlwiXFxcXHUwMDljXCIsXCJcXHUwMDlkXCI6XCJcXFxcdTAwOWRcIixcIlxcdTAwOWVcIjpcIlxcXFx1MDA5ZVwiLFxuXCJcXHUwMDlmXCI6XCJcXFxcdTAwOWZcIixcIlxcdTAwYWRcIjpcIlxcXFx1MDBhZFwiLFwiXFx1MDYwMFwiOlwiXFxcXHUwNjAwXCIsXCJcXHUwNjAxXCI6XCJcXFxcdTA2MDFcIixcblwiXFx1MDYwMlwiOlwiXFxcXHUwNjAyXCIsXCJcXHUwNjAzXCI6XCJcXFxcdTA2MDNcIixcIlxcdTA2MDRcIjpcIlxcXFx1MDYwNFwiLFwiXFx1MDcwZlwiOlwiXFxcXHUwNzBmXCIsXG5cIlxcdTE3YjRcIjpcIlxcXFx1MTdiNFwiLFwiXFx1MTdiNVwiOlwiXFxcXHUxN2I1XCIsXCJcXHUyMDBjXCI6XCJcXFxcdTIwMGNcIixcIlxcdTIwMGRcIjpcIlxcXFx1MjAwZFwiLFxuXCJcXHUyMDBlXCI6XCJcXFxcdTIwMGVcIixcIlxcdTIwMGZcIjpcIlxcXFx1MjAwZlwiLFwiXFx1MjAyOFwiOlwiXFxcXHUyMDI4XCIsXCJcXHUyMDI5XCI6XCJcXFxcdTIwMjlcIixcblwiXFx1MjAyYVwiOlwiXFxcXHUyMDJhXCIsXCJcXHUyMDJiXCI6XCJcXFxcdTIwMmJcIixcIlxcdTIwMmNcIjpcIlxcXFx1MjAyY1wiLFwiXFx1MjAyZFwiOlwiXFxcXHUyMDJkXCIsXG5cIlxcdTIwMmVcIjpcIlxcXFx1MjAyZVwiLFwiXFx1MjAyZlwiOlwiXFxcXHUyMDJmXCIsXCJcXHUyMDYwXCI6XCJcXFxcdTIwNjBcIixcIlxcdTIwNjFcIjpcIlxcXFx1MjA2MVwiLFxuXCJcXHUyMDYyXCI6XCJcXFxcdTIwNjJcIixcIlxcdTIwNjNcIjpcIlxcXFx1MjA2M1wiLFwiXFx1MjA2NFwiOlwiXFxcXHUyMDY0XCIsXCJcXHUyMDY1XCI6XCJcXFxcdTIwNjVcIixcblwiXFx1MjA2NlwiOlwiXFxcXHUyMDY2XCIsXCJcXHUyMDY3XCI6XCJcXFxcdTIwNjdcIixcIlxcdTIwNjhcIjpcIlxcXFx1MjA2OFwiLFwiXFx1MjA2OVwiOlwiXFxcXHUyMDY5XCIsXG5cIlxcdTIwNmFcIjpcIlxcXFx1MjA2YVwiLFwiXFx1MjA2YlwiOlwiXFxcXHUyMDZiXCIsXCJcXHUyMDZjXCI6XCJcXFxcdTIwNmNcIixcIlxcdTIwNmRcIjpcIlxcXFx1MjA2ZFwiLFxuXCJcXHUyMDZlXCI6XCJcXFxcdTIwNmVcIixcIlxcdTIwNmZcIjpcIlxcXFx1MjA2ZlwiLFwiXFx1ZmVmZlwiOlwiXFxcXHVmZWZmXCIsXCJcXHVmZmYwXCI6XCJcXFxcdWZmZjBcIixcblwiXFx1ZmZmMVwiOlwiXFxcXHVmZmYxXCIsXCJcXHVmZmYyXCI6XCJcXFxcdWZmZjJcIixcIlxcdWZmZjNcIjpcIlxcXFx1ZmZmM1wiLFwiXFx1ZmZmNFwiOlwiXFxcXHVmZmY0XCIsXG5cIlxcdWZmZjVcIjpcIlxcXFx1ZmZmNVwiLFwiXFx1ZmZmNlwiOlwiXFxcXHVmZmY2XCIsXCJcXHVmZmY3XCI6XCJcXFxcdWZmZjdcIixcIlxcdWZmZjhcIjpcIlxcXFx1ZmZmOFwiLFxuXCJcXHVmZmY5XCI6XCJcXFxcdWZmZjlcIixcIlxcdWZmZmFcIjpcIlxcXFx1ZmZmYVwiLFwiXFx1ZmZmYlwiOlwiXFxcXHVmZmZiXCIsXCJcXHVmZmZjXCI6XCJcXFxcdWZmZmNcIixcblwiXFx1ZmZmZFwiOlwiXFxcXHVmZmZkXCIsXCJcXHVmZmZlXCI6XCJcXFxcdWZmZmVcIixcIlxcdWZmZmZcIjpcIlxcXFx1ZmZmZlwifTtcblxuLy8gU29tZSBleHRyYSBjaGFyYWN0ZXJzIHRoYXQgQ2hyb21lIGdldHMgd3JvbmcsIGFuZCBzdWJzdGl0dXRlcyB3aXRoXG4vLyBzb21ldGhpbmcgZWxzZSBvbiB0aGUgd2lyZS5cbnZhciBleHRyYV9lc2NhcGFibGUgPSAvW1xceDAwLVxceDFmXFx1ZDgwMC1cXHVkZmZmXFx1ZmZmZVxcdWZmZmZcXHUwMzAwLVxcdTAzMzNcXHUwMzNkLVxcdTAzNDZcXHUwMzRhLVxcdTAzNGNcXHUwMzUwLVxcdTAzNTJcXHUwMzU3LVxcdTAzNThcXHUwMzVjLVxcdTAzNjJcXHUwMzc0XFx1MDM3ZVxcdTAzODdcXHUwNTkxLVxcdTA1YWZcXHUwNWM0XFx1MDYxMC1cXHUwNjE3XFx1MDY1My1cXHUwNjU0XFx1MDY1Ny1cXHUwNjViXFx1MDY1ZC1cXHUwNjVlXFx1MDZkZi1cXHUwNmUyXFx1MDZlYi1cXHUwNmVjXFx1MDczMFxcdTA3MzItXFx1MDczM1xcdTA3MzUtXFx1MDczNlxcdTA3M2FcXHUwNzNkXFx1MDczZi1cXHUwNzQxXFx1MDc0M1xcdTA3NDVcXHUwNzQ3XFx1MDdlYi1cXHUwN2YxXFx1MDk1MVxcdTA5NTgtXFx1MDk1ZlxcdTA5ZGMtXFx1MDlkZFxcdTA5ZGZcXHUwYTMzXFx1MGEzNlxcdTBhNTktXFx1MGE1YlxcdTBhNWVcXHUwYjVjLVxcdTBiNWRcXHUwZTM4LVxcdTBlMzlcXHUwZjQzXFx1MGY0ZFxcdTBmNTJcXHUwZjU3XFx1MGY1Y1xcdTBmNjlcXHUwZjcyLVxcdTBmNzZcXHUwZjc4XFx1MGY4MC1cXHUwZjgzXFx1MGY5M1xcdTBmOWRcXHUwZmEyXFx1MGZhN1xcdTBmYWNcXHUwZmI5XFx1MTkzOS1cXHUxOTNhXFx1MWExN1xcdTFiNmJcXHUxY2RhLVxcdTFjZGJcXHUxZGMwLVxcdTFkY2ZcXHUxZGZjXFx1MWRmZVxcdTFmNzFcXHUxZjczXFx1MWY3NVxcdTFmNzdcXHUxZjc5XFx1MWY3YlxcdTFmN2RcXHUxZmJiXFx1MWZiZVxcdTFmYzlcXHUxZmNiXFx1MWZkM1xcdTFmZGJcXHUxZmUzXFx1MWZlYlxcdTFmZWUtXFx1MWZlZlxcdTFmZjlcXHUxZmZiXFx1MWZmZFxcdTIwMDAtXFx1MjAwMVxcdTIwZDAtXFx1MjBkMVxcdTIwZDQtXFx1MjBkN1xcdTIwZTctXFx1MjBlOVxcdTIxMjZcXHUyMTJhLVxcdTIxMmJcXHUyMzI5LVxcdTIzMmFcXHUyYWRjXFx1MzAyYi1cXHUzMDJjXFx1YWFiMi1cXHVhYWIzXFx1ZjkwMC1cXHVmYTBkXFx1ZmExMFxcdWZhMTJcXHVmYTE1LVxcdWZhMWVcXHVmYTIwXFx1ZmEyMlxcdWZhMjUtXFx1ZmEyNlxcdWZhMmEtXFx1ZmEyZFxcdWZhMzAtXFx1ZmE2ZFxcdWZhNzAtXFx1ZmFkOVxcdWZiMWRcXHVmYjFmXFx1ZmIyYS1cXHVmYjM2XFx1ZmIzOC1cXHVmYjNjXFx1ZmIzZVxcdWZiNDAtXFx1ZmI0MVxcdWZiNDMtXFx1ZmI0NFxcdWZiNDYtXFx1ZmI0ZVxcdWZmZjAtXFx1ZmZmZl0vZyxcbiAgICBleHRyYV9sb29rdXA7XG5cbi8vIEpTT04gUXVvdGUgc3RyaW5nLiBVc2UgbmF0aXZlIGltcGxlbWVudGF0aW9uIHdoZW4gcG9zc2libGUuXG52YXIgSlNPTlF1b3RlID0gKEpTT04gJiYgSlNPTi5zdHJpbmdpZnkpIHx8IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIGpzb25fZXNjYXBhYmxlLmxhc3RJbmRleCA9IDA7XG4gICAgaWYgKGpzb25fZXNjYXBhYmxlLnRlc3Qoc3RyaW5nKSkge1xuICAgICAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZShqc29uX2VzY2FwYWJsZSwgZnVuY3Rpb24oYSkge1xuICAgICAgICAgICAgcmV0dXJuIGpzb25fbG9va3VwW2FdO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuICdcIicgKyBzdHJpbmcgKyAnXCInO1xufTtcblxuLy8gVGhpcyBtYXkgYmUgcXVpdGUgc2xvdywgc28gbGV0J3MgZGVsYXkgdW50aWwgdXNlciBhY3R1YWxseSB1c2VzIGJhZFxuLy8gY2hhcmFjdGVycy5cbnZhciB1bnJvbGxfbG9va3VwID0gZnVuY3Rpb24oZXNjYXBhYmxlKSB7XG4gICAgdmFyIGk7XG4gICAgdmFyIHVucm9sbGVkID0ge31cbiAgICB2YXIgYyA9IFtdXG4gICAgZm9yKGk9MDsgaTw2NTUzNjsgaSsrKSB7XG4gICAgICAgIGMucHVzaCggU3RyaW5nLmZyb21DaGFyQ29kZShpKSApO1xuICAgIH1cbiAgICBlc2NhcGFibGUubGFzdEluZGV4ID0gMDtcbiAgICBjLmpvaW4oJycpLnJlcGxhY2UoZXNjYXBhYmxlLCBmdW5jdGlvbiAoYSkge1xuICAgICAgICB1bnJvbGxlZFsgYSBdID0gJ1xcXFx1JyArICgnMDAwMCcgKyBhLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zbGljZSgtNCk7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9KTtcbiAgICBlc2NhcGFibGUubGFzdEluZGV4ID0gMDtcbiAgICByZXR1cm4gdW5yb2xsZWQ7XG59O1xuXG4vLyBRdW90ZSBzdHJpbmcsIGFsc28gdGFraW5nIGNhcmUgb2YgdW5pY29kZSBjaGFyYWN0ZXJzIHRoYXQgYnJvd3NlcnNcbi8vIG9mdGVuIGJyZWFrLiBFc3BlY2lhbGx5LCB0YWtlIGNhcmUgb2YgdW5pY29kZSBzdXJyb2dhdGVzOlxuLy8gICAgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NYXBwaW5nX29mX1VuaWNvZGVfY2hhcmFjdGVycyNTdXJyb2dhdGVzXG51dGlscy5xdW90ZSA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIHZhciBxdW90ZWQgPSBKU09OUXVvdGUoc3RyaW5nKTtcblxuICAgIC8vIEluIG1vc3QgY2FzZXMgdGhpcyBzaG91bGQgYmUgdmVyeSBmYXN0IGFuZCBnb29kIGVub3VnaC5cbiAgICBleHRyYV9lc2NhcGFibGUubGFzdEluZGV4ID0gMDtcbiAgICBpZighZXh0cmFfZXNjYXBhYmxlLnRlc3QocXVvdGVkKSkge1xuICAgICAgICByZXR1cm4gcXVvdGVkO1xuICAgIH1cblxuICAgIGlmKCFleHRyYV9sb29rdXApIGV4dHJhX2xvb2t1cCA9IHVucm9sbF9sb29rdXAoZXh0cmFfZXNjYXBhYmxlKTtcblxuICAgIHJldHVybiBxdW90ZWQucmVwbGFjZShleHRyYV9lc2NhcGFibGUsIGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgcmV0dXJuIGV4dHJhX2xvb2t1cFthXTtcbiAgICB9KTtcbn1cblxudmFyIF9hbGxfcHJvdG9jb2xzID0gWyd3ZWJzb2NrZXQnLFxuICAgICAgICAgICAgICAgICAgICAgICd4ZHItc3RyZWFtaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAneGhyLXN0cmVhbWluZycsXG4gICAgICAgICAgICAgICAgICAgICAgJ2lmcmFtZS1ldmVudHNvdXJjZScsXG4gICAgICAgICAgICAgICAgICAgICAgJ2lmcmFtZS1odG1sZmlsZScsXG4gICAgICAgICAgICAgICAgICAgICAgJ3hkci1wb2xsaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAneGhyLXBvbGxpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICdpZnJhbWUteGhyLXBvbGxpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICdqc29ucC1wb2xsaW5nJ107XG5cbnV0aWxzLnByb2JlUHJvdG9jb2xzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHByb2JlZCA9IHt9O1xuICAgIGZvcih2YXIgaT0wOyBpPF9hbGxfcHJvdG9jb2xzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBwcm90b2NvbCA9IF9hbGxfcHJvdG9jb2xzW2ldO1xuICAgICAgICAvLyBVc2VyIGNhbiBoYXZlIGEgdHlwbyBpbiBwcm90b2NvbCBuYW1lLlxuICAgICAgICBwcm9iZWRbcHJvdG9jb2xdID0gU29ja0pTW3Byb3RvY29sXSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgU29ja0pTW3Byb3RvY29sXS5lbmFibGVkKCk7XG4gICAgfVxuICAgIHJldHVybiBwcm9iZWQ7XG59O1xuXG51dGlscy5kZXRlY3RQcm90b2NvbHMgPSBmdW5jdGlvbihwcm9iZWQsIHByb3RvY29sc193aGl0ZWxpc3QsIGluZm8pIHtcbiAgICB2YXIgcGUgPSB7fSxcbiAgICAgICAgcHJvdG9jb2xzID0gW107XG4gICAgaWYgKCFwcm90b2NvbHNfd2hpdGVsaXN0KSBwcm90b2NvbHNfd2hpdGVsaXN0ID0gX2FsbF9wcm90b2NvbHM7XG4gICAgZm9yKHZhciBpPTA7IGk8cHJvdG9jb2xzX3doaXRlbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcHJvdG9jb2wgPSBwcm90b2NvbHNfd2hpdGVsaXN0W2ldO1xuICAgICAgICBwZVtwcm90b2NvbF0gPSBwcm9iZWRbcHJvdG9jb2xdO1xuICAgIH1cbiAgICB2YXIgbWF5YmVfcHVzaCA9IGZ1bmN0aW9uKHByb3Rvcykge1xuICAgICAgICB2YXIgcHJvdG8gPSBwcm90b3Muc2hpZnQoKTtcbiAgICAgICAgaWYgKHBlW3Byb3RvXSkge1xuICAgICAgICAgICAgcHJvdG9jb2xzLnB1c2gocHJvdG8pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHByb3Rvcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbWF5YmVfcHVzaChwcm90b3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gMS4gV2Vic29ja2V0XG4gICAgaWYgKGluZm8ud2Vic29ja2V0ICE9PSBmYWxzZSkge1xuICAgICAgICBtYXliZV9wdXNoKFsnd2Vic29ja2V0J10pO1xuICAgIH1cblxuICAgIC8vIDIuIFN0cmVhbWluZ1xuICAgIGlmIChwZVsneGhyLXN0cmVhbWluZyddICYmICFpbmZvLm51bGxfb3JpZ2luKSB7XG4gICAgICAgIHByb3RvY29scy5wdXNoKCd4aHItc3RyZWFtaW5nJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHBlWyd4ZHItc3RyZWFtaW5nJ10gJiYgIWluZm8uY29va2llX25lZWRlZCAmJiAhaW5mby5udWxsX29yaWdpbikge1xuICAgICAgICAgICAgcHJvdG9jb2xzLnB1c2goJ3hkci1zdHJlYW1pbmcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1heWJlX3B1c2goWydpZnJhbWUtZXZlbnRzb3VyY2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2lmcmFtZS1odG1sZmlsZSddKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIDMuIFBvbGxpbmdcbiAgICBpZiAocGVbJ3hoci1wb2xsaW5nJ10gJiYgIWluZm8ubnVsbF9vcmlnaW4pIHtcbiAgICAgICAgcHJvdG9jb2xzLnB1c2goJ3hoci1wb2xsaW5nJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHBlWyd4ZHItcG9sbGluZyddICYmICFpbmZvLmNvb2tpZV9uZWVkZWQgJiYgIWluZm8ubnVsbF9vcmlnaW4pIHtcbiAgICAgICAgICAgIHByb3RvY29scy5wdXNoKCd4ZHItcG9sbGluZycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWF5YmVfcHVzaChbJ2lmcmFtZS14aHItcG9sbGluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAnanNvbnAtcG9sbGluZyddKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcHJvdG9jb2xzO1xufVxuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi91dGlscy5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvZG9tLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG4vLyBNYXkgYmUgdXNlZCBieSBodG1sZmlsZSBqc29ucCBhbmQgdHJhbnNwb3J0cy5cbnZhciBNUHJlZml4ID0gJ19zb2NranNfZ2xvYmFsJztcbnV0aWxzLmNyZWF0ZUhvb2sgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgd2luZG93X2lkID0gJ2EnICsgdXRpbHMucmFuZG9tX3N0cmluZyg4KTtcbiAgICBpZiAoIShNUHJlZml4IGluIF93aW5kb3cpKSB7XG4gICAgICAgIHZhciBtYXAgPSB7fTtcbiAgICAgICAgX3dpbmRvd1tNUHJlZml4XSA9IGZ1bmN0aW9uKHdpbmRvd19pZCkge1xuICAgICAgICAgICAgaWYgKCEod2luZG93X2lkIGluIG1hcCkpIHtcbiAgICAgICAgICAgICAgICBtYXBbd2luZG93X2lkXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHdpbmRvd19pZCxcbiAgICAgICAgICAgICAgICAgICAgZGVsOiBmdW5jdGlvbigpIHtkZWxldGUgbWFwW3dpbmRvd19pZF07fVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWFwW3dpbmRvd19pZF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIF93aW5kb3dbTVByZWZpeF0od2luZG93X2lkKTtcbn07XG5cblxuXG51dGlscy5hdHRhY2hNZXNzYWdlID0gZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICB1dGlscy5hdHRhY2hFdmVudCgnbWVzc2FnZScsIGxpc3RlbmVyKTtcbn07XG51dGlscy5hdHRhY2hFdmVudCA9IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgX3dpbmRvdy5hZGRFdmVudExpc3RlbmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBfd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyLCBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSUUgcXVpcmtzLlxuICAgICAgICAvLyBBY2NvcmRpbmcgdG86IGh0dHA6Ly9zdGV2ZXNvdWRlcnMuY29tL21pc2MvdGVzdC1wb3N0bWVzc2FnZS5waHBcbiAgICAgICAgLy8gdGhlIG1lc3NhZ2UgZ2V0cyBkZWxpdmVyZWQgb25seSB0byAnZG9jdW1lbnQnLCBub3QgJ3dpbmRvdycuXG4gICAgICAgIF9kb2N1bWVudC5hdHRhY2hFdmVudChcIm9uXCIgKyBldmVudCwgbGlzdGVuZXIpO1xuICAgICAgICAvLyBJIGdldCAnd2luZG93JyBmb3IgaWU4LlxuICAgICAgICBfd2luZG93LmF0dGFjaEV2ZW50KFwib25cIiArIGV2ZW50LCBsaXN0ZW5lcik7XG4gICAgfVxufTtcblxudXRpbHMuZGV0YWNoTWVzc2FnZSA9IGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgdXRpbHMuZGV0YWNoRXZlbnQoJ21lc3NhZ2UnLCBsaXN0ZW5lcik7XG59O1xudXRpbHMuZGV0YWNoRXZlbnQgPSBmdW5jdGlvbihldmVudCwgbGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIF93aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgX3dpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lciwgZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIF9kb2N1bWVudC5kZXRhY2hFdmVudChcIm9uXCIgKyBldmVudCwgbGlzdGVuZXIpO1xuICAgICAgICBfd2luZG93LmRldGFjaEV2ZW50KFwib25cIiArIGV2ZW50LCBsaXN0ZW5lcik7XG4gICAgfVxufTtcblxuXG52YXIgb25fdW5sb2FkID0ge307XG4vLyBUaGluZ3MgcmVnaXN0ZXJlZCBhZnRlciBiZWZvcmV1bmxvYWQgYXJlIHRvIGJlIGNhbGxlZCBpbW1lZGlhdGVseS5cbnZhciBhZnRlcl91bmxvYWQgPSBmYWxzZTtcblxudmFyIHRyaWdnZXJfdW5sb2FkX2NhbGxiYWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIGZvcih2YXIgcmVmIGluIG9uX3VubG9hZCkge1xuICAgICAgICBvbl91bmxvYWRbcmVmXSgpO1xuICAgICAgICBkZWxldGUgb25fdW5sb2FkW3JlZl07XG4gICAgfTtcbn07XG5cbnZhciB1bmxvYWRfdHJpZ2dlcmVkID0gZnVuY3Rpb24oKSB7XG4gICAgaWYoYWZ0ZXJfdW5sb2FkKSByZXR1cm47XG4gICAgYWZ0ZXJfdW5sb2FkID0gdHJ1ZTtcbiAgICB0cmlnZ2VyX3VubG9hZF9jYWxsYmFja3MoKTtcbn07XG5cbi8vIE9uYmVmb3JldW5sb2FkIGFsb25lIGlzIG5vdCByZWxpYWJsZS4gV2UgY291bGQgdXNlIG9ubHkgJ3VubG9hZCdcbi8vIGJ1dCBpdCdzIG5vdCB3b3JraW5nIGluIG9wZXJhIHdpdGhpbiBhbiBpZnJhbWUuIExldCdzIHVzZSBib3RoLlxudXRpbHMuYXR0YWNoRXZlbnQoJ2JlZm9yZXVubG9hZCcsIHVubG9hZF90cmlnZ2VyZWQpO1xudXRpbHMuYXR0YWNoRXZlbnQoJ3VubG9hZCcsIHVubG9hZF90cmlnZ2VyZWQpO1xuXG51dGlscy51bmxvYWRfYWRkID0gZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICB2YXIgcmVmID0gdXRpbHMucmFuZG9tX3N0cmluZyg4KTtcbiAgICBvbl91bmxvYWRbcmVmXSA9IGxpc3RlbmVyO1xuICAgIGlmIChhZnRlcl91bmxvYWQpIHtcbiAgICAgICAgdXRpbHMuZGVsYXkodHJpZ2dlcl91bmxvYWRfY2FsbGJhY2tzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlZjtcbn07XG51dGlscy51bmxvYWRfZGVsID0gZnVuY3Rpb24ocmVmKSB7XG4gICAgaWYgKHJlZiBpbiBvbl91bmxvYWQpXG4gICAgICAgIGRlbGV0ZSBvbl91bmxvYWRbcmVmXTtcbn07XG5cblxudXRpbHMuY3JlYXRlSWZyYW1lID0gZnVuY3Rpb24gKGlmcmFtZV91cmwsIGVycm9yX2NhbGxiYWNrKSB7XG4gICAgdmFyIGlmcmFtZSA9IF9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICB2YXIgdHJlZiwgdW5sb2FkX3JlZjtcbiAgICB2YXIgdW5hdHRhY2ggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRyZWYpO1xuICAgICAgICAvLyBFeHBsb3JlciBoYWQgcHJvYmxlbXMgd2l0aCB0aGF0LlxuICAgICAgICB0cnkge2lmcmFtZS5vbmxvYWQgPSBudWxsO30gY2F0Y2ggKHgpIHt9XG4gICAgICAgIGlmcmFtZS5vbmVycm9yID0gbnVsbDtcbiAgICB9O1xuICAgIHZhciBjbGVhbnVwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChpZnJhbWUpIHtcbiAgICAgICAgICAgIHVuYXR0YWNoKCk7XG4gICAgICAgICAgICAvLyBUaGlzIHRpbWVvdXQgbWFrZXMgY2hyb21lIGZpcmUgb25iZWZvcmV1bmxvYWQgZXZlbnRcbiAgICAgICAgICAgIC8vIHdpdGhpbiBpZnJhbWUuIFdpdGhvdXQgdGhlIHRpbWVvdXQgaXQgZ29lcyBzdHJhaWdodCB0b1xuICAgICAgICAgICAgLy8gb251bmxvYWQuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmKGlmcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBpZnJhbWUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpZnJhbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZnJhbWUgPSBudWxsO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB1dGlscy51bmxvYWRfZGVsKHVubG9hZF9yZWYpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgb25lcnJvciA9IGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgaWYgKGlmcmFtZSkge1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgZXJyb3JfY2FsbGJhY2socik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHZhciBwb3N0ID0gZnVuY3Rpb24obXNnLCBvcmlnaW4pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gdGhlIGlmcmFtZSBpcyBub3QgbG9hZGVkLCBJRSByYWlzZXMgYW4gZXhjZXB0aW9uXG4gICAgICAgICAgICAvLyBvbiAnY29udGVudFdpbmRvdycuXG4gICAgICAgICAgICBpZiAoaWZyYW1lICYmIGlmcmFtZS5jb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICAgICAgaWZyYW1lLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UobXNnLCBvcmlnaW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoICh4KSB7fTtcbiAgICB9O1xuXG4gICAgaWZyYW1lLnNyYyA9IGlmcmFtZV91cmw7XG4gICAgaWZyYW1lLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgaWZyYW1lLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBpZnJhbWUub25lcnJvciA9IGZ1bmN0aW9uKCl7b25lcnJvcignb25lcnJvcicpO307XG4gICAgaWZyYW1lLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBgb25sb2FkYCBpcyB0cmlnZ2VyZWQgYmVmb3JlIHNjcmlwdHMgb24gdGhlIGlmcmFtZSBhcmVcbiAgICAgICAgLy8gZXhlY3V0ZWQuIEdpdmUgaXQgZmV3IHNlY29uZHMgdG8gYWN0dWFsbHkgbG9hZCBzdHVmZi5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHRyZWYpO1xuICAgICAgICB0cmVmID0gc2V0VGltZW91dChmdW5jdGlvbigpe29uZXJyb3IoJ29ubG9hZCB0aW1lb3V0Jyk7fSwgMjAwMCk7XG4gICAgfTtcbiAgICBfZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICAgIHRyZWYgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7b25lcnJvcigndGltZW91dCcpO30sIDE1MDAwKTtcbiAgICB1bmxvYWRfcmVmID0gdXRpbHMudW5sb2FkX2FkZChjbGVhbnVwKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwb3N0OiBwb3N0LFxuICAgICAgICBjbGVhbnVwOiBjbGVhbnVwLFxuICAgICAgICBsb2FkZWQ6IHVuYXR0YWNoXG4gICAgfTtcbn07XG5cbnV0aWxzLmNyZWF0ZUh0bWxmaWxlID0gZnVuY3Rpb24gKGlmcmFtZV91cmwsIGVycm9yX2NhbGxiYWNrKSB7XG4gICAgdmFyIGRvYyA9IG5ldyBBY3RpdmVYT2JqZWN0KCdodG1sZmlsZScpO1xuICAgIHZhciB0cmVmLCB1bmxvYWRfcmVmO1xuICAgIHZhciBpZnJhbWU7XG4gICAgdmFyIHVuYXR0YWNoID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0cmVmKTtcbiAgICB9O1xuICAgIHZhciBjbGVhbnVwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChkb2MpIHtcbiAgICAgICAgICAgIHVuYXR0YWNoKCk7XG4gICAgICAgICAgICB1dGlscy51bmxvYWRfZGVsKHVubG9hZF9yZWYpO1xuICAgICAgICAgICAgaWZyYW1lLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgICAgIGlmcmFtZSA9IGRvYyA9IG51bGw7XG4gICAgICAgICAgICBDb2xsZWN0R2FyYmFnZSgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgb25lcnJvciA9IGZ1bmN0aW9uKHIpICB7XG4gICAgICAgIGlmIChkb2MpIHtcbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIGVycm9yX2NhbGxiYWNrKHIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgcG9zdCA9IGZ1bmN0aW9uKG1zZywgb3JpZ2luKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHRoZSBpZnJhbWUgaXMgbm90IGxvYWRlZCwgSUUgcmFpc2VzIGFuIGV4Y2VwdGlvblxuICAgICAgICAgICAgLy8gb24gJ2NvbnRlbnRXaW5kb3cnLlxuICAgICAgICAgICAgaWYgKGlmcmFtZSAmJiBpZnJhbWUuY29udGVudFdpbmRvdykge1xuICAgICAgICAgICAgICAgIGlmcmFtZS5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKG1zZywgb3JpZ2luKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoeCkge307XG4gICAgfTtcblxuICAgIGRvYy5vcGVuKCk7XG4gICAgZG9jLndyaXRlKCc8aHRtbD48cycgKyAnY3JpcHQ+JyArXG4gICAgICAgICAgICAgICdkb2N1bWVudC5kb21haW49XCInICsgZG9jdW1lbnQuZG9tYWluICsgJ1wiOycgK1xuICAgICAgICAgICAgICAnPC9zJyArICdjcmlwdD48L2h0bWw+Jyk7XG4gICAgZG9jLmNsb3NlKCk7XG4gICAgZG9jLnBhcmVudFdpbmRvd1tXUHJlZml4XSA9IF93aW5kb3dbV1ByZWZpeF07XG4gICAgdmFyIGMgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZG9jLmJvZHkuYXBwZW5kQ2hpbGQoYyk7XG4gICAgaWZyYW1lID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICAgIGMuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICBpZnJhbWUuc3JjID0gaWZyYW1lX3VybDtcbiAgICB0cmVmID0gc2V0VGltZW91dChmdW5jdGlvbigpe29uZXJyb3IoJ3RpbWVvdXQnKTt9LCAxNTAwMCk7XG4gICAgdW5sb2FkX3JlZiA9IHV0aWxzLnVubG9hZF9hZGQoY2xlYW51cCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcG9zdDogcG9zdCxcbiAgICAgICAgY2xlYW51cDogY2xlYW51cCxcbiAgICAgICAgbG9hZGVkOiB1bmF0dGFjaFxuICAgIH07XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi9kb20uanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL2RvbTIuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBBYnN0cmFjdFhIUk9iamVjdCA9IGZ1bmN0aW9uKCl7fTtcbkFic3RyYWN0WEhST2JqZWN0LnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoWydjaHVuaycsICdmaW5pc2gnXSk7XG5cbkFic3RyYWN0WEhST2JqZWN0LnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbihtZXRob2QsIHVybCwgcGF5bG9hZCwgb3B0cykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHRyeSB7XG4gICAgICAgIHRoYXQueGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgfSBjYXRjaCh4KSB7fTtcblxuICAgIGlmICghdGhhdC54aHIpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoYXQueGhyID0gbmV3IF93aW5kb3cuQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKTtcbiAgICAgICAgfSBjYXRjaCh4KSB7fTtcbiAgICB9XG4gICAgaWYgKF93aW5kb3cuQWN0aXZlWE9iamVjdCB8fCBfd2luZG93LlhEb21haW5SZXF1ZXN0KSB7XG4gICAgICAgIC8vIElFOCBjYWNoZXMgZXZlbiBQT1NUc1xuICAgICAgICB1cmwgKz0gKCh1cmwuaW5kZXhPZignPycpID09PSAtMSkgPyAnPycgOiAnJicpICsgJ3Q9JysoK25ldyBEYXRlKTtcbiAgICB9XG5cbiAgICAvLyBFeHBsb3JlciB0ZW5kcyB0byBrZWVwIGNvbm5lY3Rpb24gb3BlbiwgZXZlbiBhZnRlciB0aGVcbiAgICAvLyB0YWIgZ2V0cyBjbG9zZWQ6IGh0dHA6Ly9idWdzLmpxdWVyeS5jb20vdGlja2V0LzUyODBcbiAgICB0aGF0LnVubG9hZF9yZWYgPSB1dGlscy51bmxvYWRfYWRkKGZ1bmN0aW9uKCl7dGhhdC5fY2xlYW51cCh0cnVlKTt9KTtcbiAgICB0cnkge1xuICAgICAgICB0aGF0Lnhoci5vcGVuKG1ldGhvZCwgdXJsLCB0cnVlKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgLy8gSUUgcmFpc2VzIGFuIGV4Y2VwdGlvbiBvbiB3cm9uZyBwb3J0LlxuICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcsIDAsICcnKTtcbiAgICAgICAgdGhhdC5fY2xlYW51cCgpO1xuICAgICAgICByZXR1cm47XG4gICAgfTtcblxuICAgIGlmICghb3B0cyB8fCAhb3B0cy5ub19jcmVkZW50aWFscykge1xuICAgICAgICAvLyBNb3ppbGxhIGRvY3Mgc2F5cyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9YTUxIdHRwUmVxdWVzdCA6XG4gICAgICAgIC8vIFwiVGhpcyBuZXZlciBhZmZlY3RzIHNhbWUtc2l0ZSByZXF1ZXN0cy5cIlxuICAgICAgICB0aGF0Lnhoci53aXRoQ3JlZGVudGlhbHMgPSAndHJ1ZSc7XG4gICAgfVxuICAgIGlmIChvcHRzICYmIG9wdHMuaGVhZGVycykge1xuICAgICAgICBmb3IodmFyIGtleSBpbiBvcHRzLmhlYWRlcnMpIHtcbiAgICAgICAgICAgIHRoYXQueGhyLnNldFJlcXVlc3RIZWFkZXIoa2V5LCBvcHRzLmhlYWRlcnNba2V5XSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGF0Lnhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoYXQueGhyKSB7XG4gICAgICAgICAgICB2YXIgeCA9IHRoYXQueGhyO1xuICAgICAgICAgICAgc3dpdGNoICh4LnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAvLyBJRSBkb2Vzbid0IGxpa2UgcGVla2luZyBpbnRvIHJlc3BvbnNlVGV4dCBvciBzdGF0dXNcbiAgICAgICAgICAgICAgICAvLyBvbiBNaWNyb3NvZnQuWE1MSFRUUCBhbmQgcmVhZHlzdGF0ZT0zXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXR1cyA9IHguc3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IHgucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKHgpIHt9O1xuICAgICAgICAgICAgICAgIC8vIElFIGRvZXMgcmV0dXJuIHJlYWR5c3RhdGUgPT0gMyBmb3IgNDA0IGFuc3dlcnMuXG4gICAgICAgICAgICAgICAgaWYgKHRleHQgJiYgdGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuZW1pdCgnY2h1bmsnLCBzdGF0dXMsIHRleHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcsIHguc3RhdHVzLCB4LnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgdGhhdC5fY2xlYW51cChmYWxzZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoYXQueGhyLnNlbmQocGF5bG9hZCk7XG59O1xuXG5BYnN0cmFjdFhIUk9iamVjdC5wcm90b3R5cGUuX2NsZWFudXAgPSBmdW5jdGlvbihhYm9ydCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAoIXRoYXQueGhyKSByZXR1cm47XG4gICAgdXRpbHMudW5sb2FkX2RlbCh0aGF0LnVubG9hZF9yZWYpO1xuXG4gICAgLy8gSUUgbmVlZHMgdGhpcyBmaWVsZCB0byBiZSBhIGZ1bmN0aW9uXG4gICAgdGhhdC54aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKXt9O1xuXG4gICAgaWYgKGFib3J0KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGF0Lnhoci5hYm9ydCgpO1xuICAgICAgICB9IGNhdGNoKHgpIHt9O1xuICAgIH1cbiAgICB0aGF0LnVubG9hZF9yZWYgPSB0aGF0LnhociA9IG51bGw7XG59O1xuXG5BYnN0cmFjdFhIUk9iamVjdC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5udWtlKCk7XG4gICAgdGhhdC5fY2xlYW51cCh0cnVlKTtcbn07XG5cbnZhciBYSFJDb3JzT2JqZWN0ID0gdXRpbHMuWEhSQ29yc09iamVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcbiAgICB1dGlscy5kZWxheShmdW5jdGlvbigpe3RoYXQuX3N0YXJ0LmFwcGx5KHRoYXQsIGFyZ3MpO30pO1xufTtcblhIUkNvcnNPYmplY3QucHJvdG90eXBlID0gbmV3IEFic3RyYWN0WEhST2JqZWN0KCk7XG5cbnZhciBYSFJMb2NhbE9iamVjdCA9IHV0aWxzLlhIUkxvY2FsT2JqZWN0ID0gZnVuY3Rpb24obWV0aG9kLCB1cmwsIHBheWxvYWQpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdXRpbHMuZGVsYXkoZnVuY3Rpb24oKXtcbiAgICAgICAgdGhhdC5fc3RhcnQobWV0aG9kLCB1cmwsIHBheWxvYWQsIHtcbiAgICAgICAgICAgIG5vX2NyZWRlbnRpYWxzOiB0cnVlXG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblhIUkxvY2FsT2JqZWN0LnByb3RvdHlwZSA9IG5ldyBBYnN0cmFjdFhIUk9iamVjdCgpO1xuXG5cblxuLy8gUmVmZXJlbmNlczpcbi8vICAgaHR0cDovL2FqYXhpYW4uY29tL2FyY2hpdmVzLzEwMC1saW5lLWFqYXgtd3JhcHBlclxuLy8gICBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvY2MyODgwNjAodj1WUy44NSkuYXNweFxudmFyIFhEUk9iamVjdCA9IHV0aWxzLlhEUk9iamVjdCA9IGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBwYXlsb2FkKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHV0aWxzLmRlbGF5KGZ1bmN0aW9uKCl7dGhhdC5fc3RhcnQobWV0aG9kLCB1cmwsIHBheWxvYWQpO30pO1xufTtcblhEUk9iamVjdC5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKFsnY2h1bmsnLCAnZmluaXNoJ10pO1xuWERST2JqZWN0LnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbihtZXRob2QsIHVybCwgcGF5bG9hZCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgeGRyID0gbmV3IFhEb21haW5SZXF1ZXN0KCk7XG4gICAgLy8gSUUgY2FjaGVzIGV2ZW4gUE9TVHNcbiAgICB1cmwgKz0gKCh1cmwuaW5kZXhPZignPycpID09PSAtMSkgPyAnPycgOiAnJicpICsgJ3Q9JysoK25ldyBEYXRlKTtcblxuICAgIHZhciBvbmVycm9yID0geGRyLm9udGltZW91dCA9IHhkci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoYXQuZW1pdCgnZmluaXNoJywgMCwgJycpO1xuICAgICAgICB0aGF0Ll9jbGVhbnVwKGZhbHNlKTtcbiAgICB9O1xuICAgIHhkci5vbnByb2dyZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoYXQuZW1pdCgnY2h1bmsnLCAyMDAsIHhkci5yZXNwb25zZVRleHQpO1xuICAgIH07XG4gICAgeGRyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcsIDIwMCwgeGRyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgIHRoYXQuX2NsZWFudXAoZmFsc2UpO1xuICAgIH07XG4gICAgdGhhdC54ZHIgPSB4ZHI7XG4gICAgdGhhdC51bmxvYWRfcmVmID0gdXRpbHMudW5sb2FkX2FkZChmdW5jdGlvbigpe3RoYXQuX2NsZWFudXAodHJ1ZSk7fSk7XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gRmFpbHMgd2l0aCBBY2Nlc3NEZW5pZWQgaWYgcG9ydCBudW1iZXIgaXMgYm9ndXNcbiAgICAgICAgdGhhdC54ZHIub3BlbihtZXRob2QsIHVybCk7XG4gICAgICAgIHRoYXQueGRyLnNlbmQocGF5bG9hZCk7XG4gICAgfSBjYXRjaCh4KSB7XG4gICAgICAgIG9uZXJyb3IoKTtcbiAgICB9XG59O1xuXG5YRFJPYmplY3QucHJvdG90eXBlLl9jbGVhbnVwID0gZnVuY3Rpb24oYWJvcnQpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKCF0aGF0LnhkcikgcmV0dXJuO1xuICAgIHV0aWxzLnVubG9hZF9kZWwodGhhdC51bmxvYWRfcmVmKTtcblxuICAgIHRoYXQueGRyLm9udGltZW91dCA9IHRoYXQueGRyLm9uZXJyb3IgPSB0aGF0Lnhkci5vbnByb2dyZXNzID1cbiAgICAgICAgdGhhdC54ZHIub25sb2FkID0gbnVsbDtcbiAgICBpZiAoYWJvcnQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoYXQueGRyLmFib3J0KCk7XG4gICAgICAgIH0gY2F0Y2goeCkge307XG4gICAgfVxuICAgIHRoYXQudW5sb2FkX3JlZiA9IHRoYXQueGRyID0gbnVsbDtcbn07XG5cblhEUk9iamVjdC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5udWtlKCk7XG4gICAgdGhhdC5fY2xlYW51cCh0cnVlKTtcbn07XG5cbi8vIDEuIElzIG5hdGl2ZWx5IHZpYSBYSFJcbi8vIDIuIElzIG5hdGl2ZWx5IHZpYSBYRFJcbi8vIDMuIE5vcGUsIGJ1dCBwb3N0TWVzc2FnZSBpcyB0aGVyZSBzbyBpdCBzaG91bGQgd29yayB2aWEgdGhlIElmcmFtZS5cbi8vIDQuIE5vcGUsIHNvcnJ5LlxudXRpbHMuaXNYSFJDb3JzQ2FwYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChfd2luZG93LlhNTEh0dHBSZXF1ZXN0ICYmICd3aXRoQ3JlZGVudGlhbHMnIGluIG5ldyBYTUxIdHRwUmVxdWVzdCgpKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICAvLyBYRG9tYWluUmVxdWVzdCBkb2Vzbid0IHdvcmsgaWYgcGFnZSBpcyBzZXJ2ZWQgZnJvbSBmaWxlOi8vXG4gICAgaWYgKF93aW5kb3cuWERvbWFpblJlcXVlc3QgJiYgX2RvY3VtZW50LmRvbWFpbikge1xuICAgICAgICByZXR1cm4gMjtcbiAgICB9XG4gICAgaWYgKElmcmFtZVRyYW5zcG9ydC5lbmFibGVkKCkpIHtcbiAgICAgICAgcmV0dXJuIDM7XG4gICAgfVxuICAgIHJldHVybiA0O1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvZG9tMi5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvc29ja2pzLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgU29ja0pTID0gZnVuY3Rpb24odXJsLCBkZXBfcHJvdG9jb2xzX3doaXRlbGlzdCwgb3B0aW9ucykge1xuICAgIGlmICh0aGlzID09PSB3aW5kb3cpIHtcbiAgICAgICAgLy8gbWFrZXMgYG5ld2Agb3B0aW9uYWxcbiAgICAgICAgcmV0dXJuIG5ldyBTb2NrSlModXJsLCBkZXBfcHJvdG9jb2xzX3doaXRlbGlzdCwgb3B0aW9ucyk7XG4gICAgfVxuICAgIFxuICAgIHZhciB0aGF0ID0gdGhpcywgcHJvdG9jb2xzX3doaXRlbGlzdDtcbiAgICB0aGF0Ll9vcHRpb25zID0ge2RldmVsOiBmYWxzZSwgZGVidWc6IGZhbHNlLCBwcm90b2NvbHNfd2hpdGVsaXN0OiBbXSxcbiAgICAgICAgICAgICAgICAgICAgIGluZm86IHVuZGVmaW5lZCwgcnR0OiB1bmRlZmluZWR9O1xuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgIHV0aWxzLm9iamVjdEV4dGVuZCh0aGF0Ll9vcHRpb25zLCBvcHRpb25zKTtcbiAgICB9XG4gICAgdGhhdC5fYmFzZV91cmwgPSB1dGlscy5hbWVuZFVybCh1cmwpO1xuICAgIHRoYXQuX3NlcnZlciA9IHRoYXQuX29wdGlvbnMuc2VydmVyIHx8IHV0aWxzLnJhbmRvbV9udW1iZXJfc3RyaW5nKDEwMDApO1xuICAgIGlmICh0aGF0Ll9vcHRpb25zLnByb3RvY29sc193aGl0ZWxpc3QgJiZcbiAgICAgICAgdGhhdC5fb3B0aW9ucy5wcm90b2NvbHNfd2hpdGVsaXN0Lmxlbmd0aCkge1xuICAgICAgICBwcm90b2NvbHNfd2hpdGVsaXN0ID0gdGhhdC5fb3B0aW9ucy5wcm90b2NvbHNfd2hpdGVsaXN0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIERlcHJlY2F0ZWQgQVBJXG4gICAgICAgIGlmICh0eXBlb2YgZGVwX3Byb3RvY29sc193aGl0ZWxpc3QgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICBkZXBfcHJvdG9jb2xzX3doaXRlbGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBwcm90b2NvbHNfd2hpdGVsaXN0ID0gW2RlcF9wcm90b2NvbHNfd2hpdGVsaXN0XTtcbiAgICAgICAgfSBlbHNlIGlmICh1dGlscy5pc0FycmF5KGRlcF9wcm90b2NvbHNfd2hpdGVsaXN0KSkge1xuICAgICAgICAgICAgcHJvdG9jb2xzX3doaXRlbGlzdCA9IGRlcF9wcm90b2NvbHNfd2hpdGVsaXN0XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm90b2NvbHNfd2hpdGVsaXN0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJvdG9jb2xzX3doaXRlbGlzdCkge1xuICAgICAgICAgICAgdGhhdC5fZGVidWcoJ0RlcHJlY2F0ZWQgQVBJOiBVc2UgXCJwcm90b2NvbHNfd2hpdGVsaXN0XCIgb3B0aW9uICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2luc3RlYWQgb2Ygc3VwcGx5aW5nIHByb3RvY29sIGxpc3QgYXMgYSBzZWNvbmQgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAncGFyYW1ldGVyIHRvIFNvY2tKUyBjb25zdHJ1Y3Rvci4nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGF0Ll9wcm90b2NvbHMgPSBbXTtcbiAgICB0aGF0LnByb3RvY29sID0gbnVsbDtcbiAgICB0aGF0LnJlYWR5U3RhdGUgPSBTb2NrSlMuQ09OTkVDVElORztcbiAgICB0aGF0Ll9pciA9IGNyZWF0ZUluZm9SZWNlaXZlcih0aGF0Ll9iYXNlX3VybCk7XG4gICAgdGhhdC5faXIub25maW5pc2ggPSBmdW5jdGlvbihpbmZvLCBydHQpIHtcbiAgICAgICAgdGhhdC5faXIgPSBudWxsO1xuICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgICAgaWYgKHRoYXQuX29wdGlvbnMuaW5mbykge1xuICAgICAgICAgICAgICAgIC8vIE92ZXJyaWRlIGlmIHVzZXIgc3VwcGxpZXMgdGhlIG9wdGlvblxuICAgICAgICAgICAgICAgIGluZm8gPSB1dGlscy5vYmplY3RFeHRlbmQoaW5mbywgdGhhdC5fb3B0aW9ucy5pbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGF0Ll9vcHRpb25zLnJ0dCkge1xuICAgICAgICAgICAgICAgIHJ0dCA9IHRoYXQuX29wdGlvbnMucnR0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhhdC5fYXBwbHlJbmZvKGluZm8sIHJ0dCwgcHJvdG9jb2xzX3doaXRlbGlzdCk7XG4gICAgICAgICAgICB0aGF0Ll9kaWRDbG9zZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhhdC5fZGlkQ2xvc2UoMTAwMiwgJ0NhblxcJ3QgY29ubmVjdCB0byBzZXJ2ZXInLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuLy8gSW5oZXJpdGFuY2VcblNvY2tKUy5wcm90b3R5cGUgPSBuZXcgUkV2ZW50VGFyZ2V0KCk7XG5cblNvY2tKUy52ZXJzaW9uID0gXCIwLjMuMS43LmdhNjdmLmRpcnR5XCI7XG5cblNvY2tKUy5DT05ORUNUSU5HID0gMDtcblNvY2tKUy5PUEVOID0gMTtcblNvY2tKUy5DTE9TSU5HID0gMjtcblNvY2tKUy5DTE9TRUQgPSAzO1xuXG5Tb2NrSlMucHJvdG90eXBlLl9kZWJ1ZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9vcHRpb25zLmRlYnVnKVxuICAgICAgICB1dGlscy5sb2cuYXBwbHkodXRpbHMsIGFyZ3VtZW50cyk7XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLl9kaXNwYXRjaE9wZW4gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQucmVhZHlTdGF0ZSA9PT0gU29ja0pTLkNPTk5FQ1RJTkcpIHtcbiAgICAgICAgaWYgKHRoYXQuX3RyYW5zcG9ydF90cmVmKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhhdC5fdHJhbnNwb3J0X3RyZWYpO1xuICAgICAgICAgICAgdGhhdC5fdHJhbnNwb3J0X3RyZWYgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoYXQucmVhZHlTdGF0ZSA9IFNvY2tKUy5PUEVOO1xuICAgICAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KFwib3BlblwiKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhlIHNlcnZlciBtaWdodCBoYXZlIGJlZW4gcmVzdGFydGVkLCBhbmQgbG9zdCB0cmFjayBvZiBvdXJcbiAgICAgICAgLy8gY29ubmVjdGlvbi5cbiAgICAgICAgdGhhdC5fZGlkQ2xvc2UoMTAwNiwgXCJTZXJ2ZXIgbG9zdCBzZXNzaW9uXCIpO1xuICAgIH1cbn07XG5cblNvY2tKUy5wcm90b3R5cGUuX2Rpc3BhdGNoTWVzc2FnZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQucmVhZHlTdGF0ZSAhPT0gU29ja0pTLk9QRU4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudChcIm1lc3NhZ2VcIiwge2RhdGE6IGRhdGF9KSk7XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLl9kaXNwYXRjaEhlYXJ0YmVhdCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQucmVhZHlTdGF0ZSAhPT0gU29ja0pTLk9QRU4pXG4gICAgICAgIHJldHVybjtcbiAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KCdoZWFydGJlYXQnLCB7fSkpO1xufTtcblxuU29ja0pTLnByb3RvdHlwZS5fZGlkQ2xvc2UgPSBmdW5jdGlvbihjb2RlLCByZWFzb24sIGZvcmNlKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnJlYWR5U3RhdGUgIT09IFNvY2tKUy5DT05ORUNUSU5HICYmXG4gICAgICAgIHRoYXQucmVhZHlTdGF0ZSAhPT0gU29ja0pTLk9QRU4gJiZcbiAgICAgICAgdGhhdC5yZWFkeVN0YXRlICE9PSBTb2NrSlMuQ0xPU0lORylcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSU5WQUxJRF9TVEFURV9FUlInKTtcbiAgICBpZiAodGhhdC5faXIpIHtcbiAgICAgICAgdGhhdC5faXIubnVrZSgpO1xuICAgICAgICB0aGF0Ll9pciA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHRoYXQuX3RyYW5zcG9ydCkge1xuICAgICAgICB0aGF0Ll90cmFuc3BvcnQuZG9DbGVhbnVwKCk7XG4gICAgICAgIHRoYXQuX3RyYW5zcG9ydCA9IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGNsb3NlX2V2ZW50ID0gbmV3IFNpbXBsZUV2ZW50KFwiY2xvc2VcIiwge1xuICAgICAgICBjb2RlOiBjb2RlLFxuICAgICAgICByZWFzb246IHJlYXNvbixcbiAgICAgICAgd2FzQ2xlYW46IHV0aWxzLnVzZXJTZXRDb2RlKGNvZGUpfSk7XG5cbiAgICBpZiAoIXV0aWxzLnVzZXJTZXRDb2RlKGNvZGUpICYmXG4gICAgICAgIHRoYXQucmVhZHlTdGF0ZSA9PT0gU29ja0pTLkNPTk5FQ1RJTkcgJiYgIWZvcmNlKSB7XG4gICAgICAgIGlmICh0aGF0Ll90cnlfbmV4dF9wcm90b2NvbChjbG9zZV9ldmVudCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjbG9zZV9ldmVudCA9IG5ldyBTaW1wbGVFdmVudChcImNsb3NlXCIsIHtjb2RlOiAyMDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVhc29uOiBcIkFsbCB0cmFuc3BvcnRzIGZhaWxlZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2FzQ2xlYW46IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdF9ldmVudDogY2xvc2VfZXZlbnR9KTtcbiAgICB9XG4gICAgdGhhdC5yZWFkeVN0YXRlID0gU29ja0pTLkNMT1NFRDtcblxuICAgIHV0aWxzLmRlbGF5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgIHRoYXQuZGlzcGF0Y2hFdmVudChjbG9zZV9ldmVudCk7XG4gICAgICAgICAgICAgICAgfSk7XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLl9kaWRNZXNzYWdlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgdHlwZSA9IGRhdGEuc2xpY2UoMCwgMSk7XG4gICAgc3dpdGNoKHR5cGUpIHtcbiAgICBjYXNlICdvJzpcbiAgICAgICAgdGhhdC5fZGlzcGF0Y2hPcGVuKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2EnOlxuICAgICAgICB2YXIgcGF5bG9hZCA9IEpTT04ucGFyc2UoZGF0YS5zbGljZSgxKSB8fCAnW10nKTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGkgPCBwYXlsb2FkLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIHRoYXQuX2Rpc3BhdGNoTWVzc2FnZShwYXlsb2FkW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICBjYXNlICdtJzpcbiAgICAgICAgdmFyIHBheWxvYWQgPSBKU09OLnBhcnNlKGRhdGEuc2xpY2UoMSkgfHwgJ251bGwnKTtcbiAgICAgICAgdGhhdC5fZGlzcGF0Y2hNZXNzYWdlKHBheWxvYWQpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlICdjJzpcbiAgICAgICAgdmFyIHBheWxvYWQgPSBKU09OLnBhcnNlKGRhdGEuc2xpY2UoMSkgfHwgJ1tdJyk7XG4gICAgICAgIHRoYXQuX2RpZENsb3NlKHBheWxvYWRbMF0sIHBheWxvYWRbMV0pO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlICdoJzpcbiAgICAgICAgdGhhdC5fZGlzcGF0Y2hIZWFydGJlYXQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcblxuU29ja0pTLnByb3RvdHlwZS5fdHJ5X25leHRfcHJvdG9jb2wgPSBmdW5jdGlvbihjbG9zZV9ldmVudCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5wcm90b2NvbCkge1xuICAgICAgICB0aGF0Ll9kZWJ1ZygnQ2xvc2VkIHRyYW5zcG9ydDonLCB0aGF0LnByb3RvY29sLCAnJytjbG9zZV9ldmVudCk7XG4gICAgICAgIHRoYXQucHJvdG9jb2wgPSBudWxsO1xuICAgIH1cbiAgICBpZiAodGhhdC5fdHJhbnNwb3J0X3RyZWYpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoYXQuX3RyYW5zcG9ydF90cmVmKTtcbiAgICAgICAgdGhhdC5fdHJhbnNwb3J0X3RyZWYgPSBudWxsO1xuICAgIH1cblxuICAgIHdoaWxlKDEpIHtcbiAgICAgICAgdmFyIHByb3RvY29sID0gdGhhdC5wcm90b2NvbCA9IHRoYXQuX3Byb3RvY29scy5zaGlmdCgpO1xuICAgICAgICBpZiAoIXByb3RvY29sKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU29tZSBwcm90b2NvbHMgcmVxdWlyZSBhY2Nlc3MgdG8gYGJvZHlgLCB3aGF0IGlmIHdlcmUgaW5cbiAgICAgICAgLy8gdGhlIGBoZWFkYD9cbiAgICAgICAgaWYgKFNvY2tKU1twcm90b2NvbF0gJiZcbiAgICAgICAgICAgIFNvY2tKU1twcm90b2NvbF0ubmVlZF9ib2R5ID09PSB0cnVlICYmXG4gICAgICAgICAgICAoIV9kb2N1bWVudC5ib2R5IHx8XG4gICAgICAgICAgICAgKHR5cGVvZiBfZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgJiYgX2RvY3VtZW50LnJlYWR5U3RhdGUgIT09ICdjb21wbGV0ZScpKSkge1xuICAgICAgICAgICAgdGhhdC5fcHJvdG9jb2xzLnVuc2hpZnQocHJvdG9jb2wpO1xuICAgICAgICAgICAgdGhhdC5wcm90b2NvbCA9ICd3YWl0aW5nLWZvci1sb2FkJztcbiAgICAgICAgICAgIHV0aWxzLmF0dGFjaEV2ZW50KCdsb2FkJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB0aGF0Ll90cnlfbmV4dF9wcm90b2NvbCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghU29ja0pTW3Byb3RvY29sXSB8fFxuICAgICAgICAgICAgICAhU29ja0pTW3Byb3RvY29sXS5lbmFibGVkKHRoYXQuX29wdGlvbnMpKSB7XG4gICAgICAgICAgICB0aGF0Ll9kZWJ1ZygnU2tpcHBpbmcgdHJhbnNwb3J0OicsIHByb3RvY29sKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciByb3VuZFRyaXBzID0gU29ja0pTW3Byb3RvY29sXS5yb3VuZFRyaXBzIHx8IDE7XG4gICAgICAgICAgICB2YXIgdG8gPSAoKHRoYXQuX29wdGlvbnMucnRvIHx8IDApICogcm91bmRUcmlwcykgfHwgNTAwMDtcbiAgICAgICAgICAgIHRoYXQuX3RyYW5zcG9ydF90cmVmID0gdXRpbHMuZGVsYXkodG8sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGF0LnJlYWR5U3RhdGUgPT09IFNvY2tKUy5DT05ORUNUSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEkgY2FuJ3QgdW5kZXJzdGFuZCBob3cgaXQgaXMgcG9zc2libGUgdG8gcnVuXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgdGltZXIsIHdoZW4gdGhlIHN0YXRlIGlzIENMT1NFRCwgYnV0XG4gICAgICAgICAgICAgICAgICAgIC8vIGFwcGFyZW50bHkgaW4gSUUgZXZlcnl0aGluIGlzIHBvc3NpYmxlLlxuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9kaWRDbG9zZSgyMDA3LCBcIlRyYW5zcG9ydCB0aW1lb3V0ZWRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciBjb25uaWQgPSB1dGlscy5yYW5kb21fc3RyaW5nKDgpO1xuICAgICAgICAgICAgdmFyIHRyYW5zX3VybCA9IHRoYXQuX2Jhc2VfdXJsICsgJy8nICsgdGhhdC5fc2VydmVyICsgJy8nICsgY29ubmlkO1xuICAgICAgICAgICAgdGhhdC5fZGVidWcoJ09wZW5pbmcgdHJhbnNwb3J0OicsIHByb3RvY29sLCAnIHVybDonK3RyYW5zX3VybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICcgUlRPOicrdGhhdC5fb3B0aW9ucy5ydG8pO1xuICAgICAgICAgICAgdGhhdC5fdHJhbnNwb3J0ID0gbmV3IFNvY2tKU1twcm90b2NvbF0odGhhdCwgdHJhbnNfdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fYmFzZV91cmwpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oY29kZSwgcmVhc29uKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmIChjb2RlICYmICF1dGlscy51c2VyU2V0Q29kZShjb2RlKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSU5WQUxJRF9BQ0NFU1NfRVJSXCIpO1xuICAgIGlmKHRoYXQucmVhZHlTdGF0ZSAhPT0gU29ja0pTLkNPTk5FQ1RJTkcgJiZcbiAgICAgICB0aGF0LnJlYWR5U3RhdGUgIT09IFNvY2tKUy5PUEVOKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhhdC5yZWFkeVN0YXRlID0gU29ja0pTLkNMT1NJTkc7XG4gICAgdGhhdC5fZGlkQ2xvc2UoY29kZSB8fCAxMDAwLCByZWFzb24gfHwgXCJOb3JtYWwgY2xvc3VyZVwiKTtcbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cblNvY2tKUy5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQucmVhZHlTdGF0ZSA9PT0gU29ja0pTLkNPTk5FQ1RJTkcpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSU5WQUxJRF9TVEFURV9FUlInKTtcbiAgICBpZiAodGhhdC5yZWFkeVN0YXRlID09PSBTb2NrSlMuT1BFTikge1xuICAgICAgICB0aGF0Ll90cmFuc3BvcnQuZG9TZW5kKHV0aWxzLnF1b3RlKCcnICsgZGF0YSkpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cblNvY2tKUy5wcm90b3R5cGUuX2FwcGx5SW5mbyA9IGZ1bmN0aW9uKGluZm8sIHJ0dCwgcHJvdG9jb2xzX3doaXRlbGlzdCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0Ll9vcHRpb25zLmluZm8gPSBpbmZvO1xuICAgIHRoYXQuX29wdGlvbnMucnR0ID0gcnR0O1xuICAgIHRoYXQuX29wdGlvbnMucnRvID0gdXRpbHMuY291bnRSVE8ocnR0KTtcbiAgICB0aGF0Ll9vcHRpb25zLmluZm8ubnVsbF9vcmlnaW4gPSAhX2RvY3VtZW50LmRvbWFpbjtcbiAgICB2YXIgcHJvYmVkID0gdXRpbHMucHJvYmVQcm90b2NvbHMoKTtcbiAgICB0aGF0Ll9wcm90b2NvbHMgPSB1dGlscy5kZXRlY3RQcm90b2NvbHMocHJvYmVkLCBwcm90b2NvbHNfd2hpdGVsaXN0LCBpbmZvKTtcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3NvY2tqcy5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtd2Vic29ja2V0LmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgV2ViU29ja2V0VHJhbnNwb3J0ID0gU29ja0pTLndlYnNvY2tldCA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHVybCA9IHRyYW5zX3VybCArICcvd2Vic29ja2V0JztcbiAgICBpZiAodXJsLnNsaWNlKDAsIDUpID09PSAnaHR0cHMnKSB7XG4gICAgICAgIHVybCA9ICd3c3MnICsgdXJsLnNsaWNlKDUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCA9ICd3cycgKyB1cmwuc2xpY2UoNCk7XG4gICAgfVxuICAgIHRoYXQucmkgPSByaTtcbiAgICB0aGF0LnVybCA9IHVybDtcbiAgICB2YXIgQ29uc3RydWN0b3IgPSBfd2luZG93LldlYlNvY2tldCB8fCBfd2luZG93Lk1veldlYlNvY2tldDtcblxuICAgIHRoYXQud3MgPSBuZXcgQ29uc3RydWN0b3IodGhhdC51cmwpO1xuICAgIHRoYXQud3Mub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGF0LnJpLl9kaWRNZXNzYWdlKGUuZGF0YSk7XG4gICAgfTtcbiAgICAvLyBGaXJlZm94IGhhcyBhbiBpbnRlcmVzdGluZyBidWcuIElmIGEgd2Vic29ja2V0IGNvbm5lY3Rpb24gaXNcbiAgICAvLyBjcmVhdGVkIGFmdGVyIG9uYmVmb3JldW5sb2FkLCBpdCBzdGF5cyBhbGl2ZSBldmVuIHdoZW4gdXNlclxuICAgIC8vIG5hdmlnYXRlcyBhd2F5IGZyb20gdGhlIHBhZ2UuIEluIHN1Y2ggc2l0dWF0aW9uIGxldCdzIGxpZSAtXG4gICAgLy8gbGV0J3Mgbm90IG9wZW4gdGhlIHdzIGNvbm5lY3Rpb24gYXQgYWxsLiBTZWU6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3NvY2tqcy9zb2NranMtY2xpZW50L2lzc3Vlcy8yOFxuICAgIC8vIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NjA4NVxuICAgIHRoYXQudW5sb2FkX3JlZiA9IHV0aWxzLnVubG9hZF9hZGQoZnVuY3Rpb24oKXt0aGF0LndzLmNsb3NlKCl9KTtcbiAgICB0aGF0LndzLm9uY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhhdC5yaS5fZGlkTWVzc2FnZSh1dGlscy5jbG9zZUZyYW1lKDEwMDYsIFwiV2ViU29ja2V0IGNvbm5lY3Rpb24gYnJva2VuXCIpKTtcbiAgICB9O1xufTtcblxuV2ViU29ja2V0VHJhbnNwb3J0LnByb3RvdHlwZS5kb1NlbmQgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdGhpcy53cy5zZW5kKCdbJyArIGRhdGEgKyAnXScpO1xufTtcblxuV2ViU29ja2V0VHJhbnNwb3J0LnByb3RvdHlwZS5kb0NsZWFudXAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHdzID0gdGhhdC53cztcbiAgICBpZiAod3MpIHtcbiAgICAgICAgd3Mub25tZXNzYWdlID0gd3Mub25jbG9zZSA9IG51bGw7XG4gICAgICAgIHdzLmNsb3NlKCk7XG4gICAgICAgIHV0aWxzLnVubG9hZF9kZWwodGhhdC51bmxvYWRfcmVmKTtcbiAgICAgICAgdGhhdC51bmxvYWRfcmVmID0gdGhhdC5yaSA9IHRoYXQud3MgPSBudWxsO1xuICAgIH1cbn07XG5cbldlYlNvY2tldFRyYW5zcG9ydC5lbmFibGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICEhKF93aW5kb3cuV2ViU29ja2V0IHx8IF93aW5kb3cuTW96V2ViU29ja2V0KTtcbn07XG5cbi8vIEluIHRoZW9yeSwgd3Mgc2hvdWxkIHJlcXVpcmUgMSByb3VuZCB0cmlwLiBCdXQgaW4gY2hyb21lLCB0aGlzIGlzXG4vLyBub3QgdmVyeSBzdGFibGUgb3ZlciBTU0wuIE1vc3QgbGlrZWx5IGEgd3MgY29ubmVjdGlvbiByZXF1aXJlcyBhXG4vLyBzZXBhcmF0ZSBTU0wgY29ubmVjdGlvbiwgaW4gd2hpY2ggY2FzZSAyIHJvdW5kIHRyaXBzIGFyZSBhblxuLy8gYWJzb2x1dGUgbWludW11bS5cbldlYlNvY2tldFRyYW5zcG9ydC5yb3VuZFRyaXBzID0gMjtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtd2Vic29ja2V0LmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1zZW5kZXIuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBCdWZmZXJlZFNlbmRlciA9IGZ1bmN0aW9uKCkge307XG5CdWZmZXJlZFNlbmRlci5wcm90b3R5cGUuc2VuZF9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKHNlbmRlcikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnNlbmRfYnVmZmVyID0gW107XG4gICAgdGhhdC5zZW5kZXIgPSBzZW5kZXI7XG59O1xuQnVmZmVyZWRTZW5kZXIucHJvdG90eXBlLmRvU2VuZCA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5zZW5kX2J1ZmZlci5wdXNoKG1lc3NhZ2UpO1xuICAgIGlmICghdGhhdC5zZW5kX3N0b3ApIHtcbiAgICAgICAgdGhhdC5zZW5kX3NjaGVkdWxlKCk7XG4gICAgfVxufTtcblxuLy8gRm9yIHBvbGxpbmcgdHJhbnNwb3J0cyBpbiBhIHNpdHVhdGlvbiB3aGVuIGluIHRoZSBtZXNzYWdlIGNhbGxiYWNrLFxuLy8gbmV3IG1lc3NhZ2UgaXMgYmVpbmcgc2VuZC4gSWYgdGhlIHNlbmRpbmcgY29ubmVjdGlvbiB3YXMgc3RhcnRlZFxuLy8gYmVmb3JlIHJlY2VpdmluZyBvbmUsIGl0IGlzIHBvc3NpYmxlIHRvIHNhdHVyYXRlIHRoZSBuZXR3b3JrIGFuZFxuLy8gdGltZW91dCBkdWUgdG8gdGhlIGxhY2sgb2YgcmVjZWl2aW5nIHNvY2tldC4gVG8gYXZvaWQgdGhhdCB3ZSBkZWxheVxuLy8gc2VuZGluZyBtZXNzYWdlcyBieSBzb21lIHNtYWxsIHRpbWUsIGluIG9yZGVyIHRvIGxldCByZWNlaXZpbmdcbi8vIGNvbm5lY3Rpb24gYmUgc3RhcnRlZCBiZWZvcmVoYW5kLiBUaGlzIGlzIG9ubHkgYSBoYWxmbWVhc3VyZSBhbmRcbi8vIGRvZXMgbm90IGZpeCB0aGUgYmlnIHByb2JsZW0sIGJ1dCBpdCBkb2VzIG1ha2UgdGhlIHRlc3RzIGdvIG1vcmVcbi8vIHN0YWJsZSBvbiBzbG93IG5ldHdvcmtzLlxuQnVmZmVyZWRTZW5kZXIucHJvdG90eXBlLnNlbmRfc2NoZWR1bGVfd2FpdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgdHJlZjtcbiAgICB0aGF0LnNlbmRfc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGF0LnNlbmRfc3RvcCA9IG51bGw7XG4gICAgICAgIGNsZWFyVGltZW91dCh0cmVmKTtcbiAgICB9O1xuICAgIHRyZWYgPSB1dGlscy5kZWxheSgyNSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoYXQuc2VuZF9zdG9wID0gbnVsbDtcbiAgICAgICAgdGhhdC5zZW5kX3NjaGVkdWxlKCk7XG4gICAgfSk7XG59O1xuXG5CdWZmZXJlZFNlbmRlci5wcm90b3R5cGUuc2VuZF9zY2hlZHVsZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5zZW5kX2J1ZmZlci5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBwYXlsb2FkID0gJ1snICsgdGhhdC5zZW5kX2J1ZmZlci5qb2luKCcsJykgKyAnXSc7XG4gICAgICAgIHRoYXQuc2VuZF9zdG9wID0gdGhhdC5zZW5kZXIodGhhdC50cmFuc191cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zZW5kX3N0b3AgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNlbmRfc2NoZWR1bGVfd2FpdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB0aGF0LnNlbmRfYnVmZmVyID0gW107XG4gICAgfVxufTtcblxuQnVmZmVyZWRTZW5kZXIucHJvdG90eXBlLnNlbmRfZGVzdHJ1Y3RvciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5fc2VuZF9zdG9wKSB7XG4gICAgICAgIHRoYXQuX3NlbmRfc3RvcCgpO1xuICAgIH1cbiAgICB0aGF0Ll9zZW5kX3N0b3AgPSBudWxsO1xufTtcblxudmFyIGpzb25QR2VuZXJpY1NlbmRlciA9IGZ1bmN0aW9uKHVybCwgcGF5bG9hZCwgY2FsbGJhY2spIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZiAoISgnX3NlbmRfZm9ybScgaW4gdGhhdCkpIHtcbiAgICAgICAgdmFyIGZvcm0gPSB0aGF0Ll9zZW5kX2Zvcm0gPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZm9ybScpO1xuICAgICAgICB2YXIgYXJlYSA9IHRoYXQuX3NlbmRfYXJlYSA9IF9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICAgICAgICBhcmVhLm5hbWUgPSAnZCc7XG4gICAgICAgIGZvcm0uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZm9ybS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIGZvcm0ubWV0aG9kID0gJ1BPU1QnO1xuICAgICAgICBmb3JtLmVuY3R5cGUgPSAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJztcbiAgICAgICAgZm9ybS5hY2NlcHRDaGFyc2V0ID0gXCJVVEYtOFwiO1xuICAgICAgICBmb3JtLmFwcGVuZENoaWxkKGFyZWEpO1xuICAgICAgICBfZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmb3JtKTtcbiAgICB9XG4gICAgdmFyIGZvcm0gPSB0aGF0Ll9zZW5kX2Zvcm07XG4gICAgdmFyIGFyZWEgPSB0aGF0Ll9zZW5kX2FyZWE7XG4gICAgdmFyIGlkID0gJ2EnICsgdXRpbHMucmFuZG9tX3N0cmluZyg4KTtcbiAgICBmb3JtLnRhcmdldCA9IGlkO1xuICAgIGZvcm0uYWN0aW9uID0gdXJsICsgJy9qc29ucF9zZW5kP2k9JyArIGlkO1xuXG4gICAgdmFyIGlmcmFtZTtcbiAgICB0cnkge1xuICAgICAgICAvLyBpZTYgZHluYW1pYyBpZnJhbWVzIHdpdGggdGFyZ2V0PVwiXCIgc3VwcG9ydCAodGhhbmtzIENocmlzIExhbWJhY2hlcilcbiAgICAgICAgaWZyYW1lID0gX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJzxpZnJhbWUgbmFtZT1cIicrIGlkICsnXCI+Jyk7XG4gICAgfSBjYXRjaCh4KSB7XG4gICAgICAgIGlmcmFtZSA9IF9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICAgICAgaWZyYW1lLm5hbWUgPSBpZDtcbiAgICB9XG4gICAgaWZyYW1lLmlkID0gaWQ7XG4gICAgZm9ybS5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICAgIGlmcmFtZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgYXJlYS52YWx1ZSA9IHBheWxvYWQ7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHV0aWxzLmxvZygnWW91ciBicm93c2VyIGlzIHNlcmlvdXNseSBicm9rZW4uIEdvIGhvbWUhICcgKyBlLm1lc3NhZ2UpO1xuICAgIH1cbiAgICBmb3JtLnN1Ym1pdCgpO1xuXG4gICAgdmFyIGNvbXBsZXRlZCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKCFpZnJhbWUub25lcnJvcikgcmV0dXJuO1xuICAgICAgICBpZnJhbWUub25yZWFkeXN0YXRlY2hhbmdlID0gaWZyYW1lLm9uZXJyb3IgPSBpZnJhbWUub25sb2FkID0gbnVsbDtcbiAgICAgICAgLy8gT3BlcmEgbWluaSBkb2Vzbid0IGxpa2UgaWYgd2UgR0MgaWZyYW1lXG4gICAgICAgIC8vIGltbWVkaWF0ZWx5LCB0aHVzIHRoaXMgdGltZW91dC5cbiAgICAgICAgdXRpbHMuZGVsYXkoNTAwLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgaWZyYW1lLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgaWZyYW1lID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgYXJlYS52YWx1ZSA9ICcnO1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgIH07XG4gICAgaWZyYW1lLm9uZXJyb3IgPSBpZnJhbWUub25sb2FkID0gY29tcGxldGVkO1xuICAgIGlmcmFtZS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChpZnJhbWUucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnKSBjb21wbGV0ZWQoKTtcbiAgICB9O1xuICAgIHJldHVybiBjb21wbGV0ZWQ7XG59O1xuXG52YXIgY3JlYXRlQWpheFNlbmRlciA9IGZ1bmN0aW9uKEFqYXhPYmplY3QpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odXJsLCBwYXlsb2FkLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgeG8gPSBuZXcgQWpheE9iamVjdCgnUE9TVCcsIHVybCArICcveGhyX3NlbmQnLCBwYXlsb2FkKTtcbiAgICAgICAgeG8ub25maW5pc2ggPSBmdW5jdGlvbihzdGF0dXMsIHRleHQpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHN0YXR1cyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihhYm9ydF9yZWFzb24pIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKDAsIGFib3J0X3JlYXNvbik7XG4gICAgICAgIH07XG4gICAgfTtcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLXNlbmRlci5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtanNvbnAtcmVjZWl2ZXIuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbi8vIFBhcnRzIGRlcml2ZWQgZnJvbSBTb2NrZXQuaW86XG4vLyAgICBodHRwczovL2dpdGh1Yi5jb20vTGVhcm5Cb29zdC9zb2NrZXQuaW8vYmxvYi8wLjYuMTcvbGliL3NvY2tldC5pby90cmFuc3BvcnRzL2pzb25wLXBvbGxpbmcuanNcbi8vIGFuZCBqUXVlcnktSlNPTlA6XG4vLyAgICBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2pxdWVyeS1qc29ucC9zb3VyY2UvYnJvd3NlL3RydW5rL2NvcmUvanF1ZXJ5Lmpzb25wLmpzXG52YXIganNvblBHZW5lcmljUmVjZWl2ZXIgPSBmdW5jdGlvbih1cmwsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHRyZWY7XG4gICAgdmFyIHNjcmlwdCA9IF9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICB2YXIgc2NyaXB0MjsgIC8vIE9wZXJhIHN5bmNocm9ub3VzIGxvYWQgdHJpY2suXG4gICAgdmFyIGNsb3NlX3NjcmlwdCA9IGZ1bmN0aW9uKGZyYW1lKSB7XG4gICAgICAgIGlmIChzY3JpcHQyKSB7XG4gICAgICAgICAgICBzY3JpcHQyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0Mik7XG4gICAgICAgICAgICBzY3JpcHQyID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NyaXB0KSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodHJlZik7XG4gICAgICAgICAgICBzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xuICAgICAgICAgICAgc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IHNjcmlwdC5vbmVycm9yID1cbiAgICAgICAgICAgICAgICBzY3JpcHQub25sb2FkID0gc2NyaXB0Lm9uY2xpY2sgPSBudWxsO1xuICAgICAgICAgICAgc2NyaXB0ID0gbnVsbDtcbiAgICAgICAgICAgIGNhbGxiYWNrKGZyYW1lKTtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBJRTkgZmlyZXMgJ2Vycm9yJyBldmVudCBhZnRlciBvcnNjIG9yIGJlZm9yZSwgaW4gcmFuZG9tIG9yZGVyLlxuICAgIHZhciBsb2FkZWRfb2theSA9IGZhbHNlO1xuICAgIHZhciBlcnJvcl90aW1lciA9IG51bGw7XG5cbiAgICBzY3JpcHQuaWQgPSAnYScgKyB1dGlscy5yYW5kb21fc3RyaW5nKDgpO1xuICAgIHNjcmlwdC5zcmMgPSB1cmw7XG4gICAgc2NyaXB0LnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0JztcbiAgICBzY3JpcHQuY2hhcnNldCA9ICdVVEYtOCc7XG4gICAgc2NyaXB0Lm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmICghZXJyb3JfdGltZXIpIHtcbiAgICAgICAgICAgIC8vIERlbGF5IGZpcmluZyBjbG9zZV9zY3JpcHQuXG4gICAgICAgICAgICBlcnJvcl90aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFsb2FkZWRfb2theSkge1xuICAgICAgICAgICAgICAgICAgICBjbG9zZV9zY3JpcHQodXRpbHMuY2xvc2VGcmFtZShcbiAgICAgICAgICAgICAgICAgICAgICAgIDEwMDYsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkpTT05QIHNjcmlwdCBsb2FkZWQgYWJub3JtYWxseSAob25lcnJvcilcIikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDEwMDApO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBzY3JpcHQub25sb2FkID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBjbG9zZV9zY3JpcHQodXRpbHMuY2xvc2VGcmFtZSgxMDA2LCBcIkpTT05QIHNjcmlwdCBsb2FkZWQgYWJub3JtYWxseSAob25sb2FkKVwiKSk7XG4gICAgfTtcblxuICAgIHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmICgvbG9hZGVkfGNsb3NlZC8udGVzdChzY3JpcHQucmVhZHlTdGF0ZSkpIHtcbiAgICAgICAgICAgIGlmIChzY3JpcHQgJiYgc2NyaXB0Lmh0bWxGb3IgJiYgc2NyaXB0Lm9uY2xpY2spIHtcbiAgICAgICAgICAgICAgICBsb2FkZWRfb2theSA9IHRydWU7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSW4gSUUsIGFjdHVhbGx5IGV4ZWN1dGUgdGhlIHNjcmlwdC5cbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0Lm9uY2xpY2soKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoICh4KSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNjcmlwdCkge1xuICAgICAgICAgICAgICAgIGNsb3NlX3NjcmlwdCh1dGlscy5jbG9zZUZyYW1lKDEwMDYsIFwiSlNPTlAgc2NyaXB0IGxvYWRlZCBhYm5vcm1hbGx5IChvbnJlYWR5c3RhdGVjaGFuZ2UpXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgLy8gSUU6IGV2ZW50L2h0bWxGb3Ivb25jbGljayB0cmljay5cbiAgICAvLyBPbmUgY2FuJ3QgcmVseSBvbiBwcm9wZXIgb3JkZXIgZm9yIG9ucmVhZHlzdGF0ZWNoYW5nZS4gSW4gb3JkZXIgdG9cbiAgICAvLyBtYWtlIHN1cmUsIHNldCBhICdodG1sRm9yJyBhbmQgJ2V2ZW50JyBwcm9wZXJ0aWVzLCBzbyB0aGF0XG4gICAgLy8gc2NyaXB0IGNvZGUgd2lsbCBiZSBpbnN0YWxsZWQgYXMgJ29uY2xpY2snIGhhbmRsZXIgZm9yIHRoZVxuICAgIC8vIHNjcmlwdCBvYmplY3QuIExhdGVyLCBvbnJlYWR5c3RhdGVjaGFuZ2UsIG1hbnVhbGx5IGV4ZWN1dGUgdGhpc1xuICAgIC8vIGNvZGUuIEZGIGFuZCBDaHJvbWUgZG9lc24ndCB3b3JrIHdpdGggJ2V2ZW50JyBhbmQgJ2h0bWxGb3InXG4gICAgLy8gc2V0LiBGb3IgcmVmZXJlbmNlIHNlZTpcbiAgICAvLyAgIGh0dHA6Ly9qYXVib3VyZy5uZXQvMjAxMC8wNy9sb2FkaW5nLXNjcmlwdC1hcy1vbmNsaWNrLWhhbmRsZXItb2YuaHRtbFxuICAgIC8vIEFsc28sIHJlYWQgb24gdGhhdCBhYm91dCBzY3JpcHQgb3JkZXJpbmc6XG4gICAgLy8gICBodHRwOi8vd2lraS53aGF0d2cub3JnL3dpa2kvRHluYW1pY19TY3JpcHRfRXhlY3V0aW9uX09yZGVyXG4gICAgaWYgKHR5cGVvZiBzY3JpcHQuYXN5bmMgPT09ICd1bmRlZmluZWQnICYmIF9kb2N1bWVudC5hdHRhY2hFdmVudCkge1xuICAgICAgICAvLyBBY2NvcmRpbmcgdG8gbW96aWxsYSBkb2NzLCBpbiByZWNlbnQgYnJvd3NlcnMgc2NyaXB0LmFzeW5jIGRlZmF1bHRzXG4gICAgICAgIC8vIHRvICd0cnVlJywgc28gd2UgbWF5IHVzZSBpdCB0byBkZXRlY3QgYSBnb29kIGJyb3dzZXI6XG4gICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0hUTUwvRWxlbWVudC9zY3JpcHRcbiAgICAgICAgaWYgKCEvb3BlcmEvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG4gICAgICAgICAgICAvLyBOYWl2ZWx5IGFzc3VtZSB3ZSdyZSBpbiBJRVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBzY3JpcHQuaHRtbEZvciA9IHNjcmlwdC5pZDtcbiAgICAgICAgICAgICAgICBzY3JpcHQuZXZlbnQgPSBcIm9uY2xpY2tcIjtcbiAgICAgICAgICAgIH0gY2F0Y2ggKHgpIHt9XG4gICAgICAgICAgICBzY3JpcHQuYXN5bmMgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gT3BlcmEsIHNlY29uZCBzeW5jIHNjcmlwdCBoYWNrXG4gICAgICAgICAgICBzY3JpcHQyID0gX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICAgICAgc2NyaXB0Mi50ZXh0ID0gXCJ0cnl7dmFyIGEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnXCIrc2NyaXB0LmlkK1wiJyk7IGlmKGEpYS5vbmVycm9yKCk7fWNhdGNoKHgpe307XCI7XG4gICAgICAgICAgICBzY3JpcHQuYXN5bmMgPSBzY3JpcHQyLmFzeW5jID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzY3JpcHQuYXN5bmMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHNjcmlwdC5hc3luYyA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gRmFsbGJhY2sgbW9zdGx5IGZvciBLb25xdWVyb3IgLSBzdHVwaWQgdGltZXIsIDM1IHNlY29uZHMgc2hhbGwgYmUgcGxlbnR5LlxuICAgIHRyZWYgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9zZV9zY3JpcHQodXRpbHMuY2xvc2VGcmFtZSgxMDA2LCBcIkpTT05QIHNjcmlwdCBsb2FkZWQgYWJub3JtYWxseSAodGltZW91dClcIikpO1xuICAgICAgICAgICAgICAgICAgICAgIH0sIDM1MDAwKTtcblxuICAgIHZhciBoZWFkID0gX2RvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgaGVhZC5pbnNlcnRCZWZvcmUoc2NyaXB0LCBoZWFkLmZpcnN0Q2hpbGQpO1xuICAgIGlmIChzY3JpcHQyKSB7XG4gICAgICAgIGhlYWQuaW5zZXJ0QmVmb3JlKHNjcmlwdDIsIGhlYWQuZmlyc3RDaGlsZCk7XG4gICAgfVxuICAgIHJldHVybiBjbG9zZV9zY3JpcHQ7XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1qc29ucC1yZWNlaXZlci5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtanNvbnAtcG9sbGluZy5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxuLy8gVGhlIHNpbXBsZXN0IGFuZCBtb3N0IHJvYnVzdCB0cmFuc3BvcnQsIHVzaW5nIHRoZSB3ZWxsLWtub3cgY3Jvc3Ncbi8vIGRvbWFpbiBoYWNrIC0gSlNPTlAuIFRoaXMgdHJhbnNwb3J0IGlzIHF1aXRlIGluZWZmaWNpZW50IC0gb25lXG4vLyBtc3NhZ2UgY291bGQgdXNlIHVwIHRvIG9uZSBodHRwIHJlcXVlc3QuIEJ1dCBhdCBsZWFzdCBpdCB3b3JrcyBhbG1vc3Rcbi8vIGV2ZXJ5d2hlcmUuXG4vLyBLbm93biBsaW1pdGF0aW9uczpcbi8vICAgbyB5b3Ugd2lsbCBnZXQgYSBzcGlubmluZyBjdXJzb3Jcbi8vICAgbyBmb3IgS29ucXVlcm9yIGEgZHVtYiB0aW1lciBpcyBuZWVkZWQgdG8gZGV0ZWN0IGVycm9yc1xuXG5cbnZhciBKc29uUFRyYW5zcG9ydCA9IFNvY2tKU1snanNvbnAtcG9sbGluZyddID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCkge1xuICAgIHV0aWxzLnBvbGx1dGVHbG9iYWxOYW1lc3BhY2UoKTtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5yaSA9IHJpO1xuICAgIHRoYXQudHJhbnNfdXJsID0gdHJhbnNfdXJsO1xuICAgIHRoYXQuc2VuZF9jb25zdHJ1Y3Rvcihqc29uUEdlbmVyaWNTZW5kZXIpO1xuICAgIHRoYXQuX3NjaGVkdWxlX3JlY3YoKTtcbn07XG5cbi8vIEluaGVyaXRuYWNlXG5Kc29uUFRyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgQnVmZmVyZWRTZW5kZXIoKTtcblxuSnNvblBUcmFuc3BvcnQucHJvdG90eXBlLl9zY2hlZHVsZV9yZWN2ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGhhdC5fcmVjdl9zdG9wID0gbnVsbDtcbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIC8vIG5vIGRhdGEgLSBoZWFydGJlYXQ7XG4gICAgICAgICAgICBpZiAoIXRoYXQuX2lzX2Nsb3NpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnJpLl9kaWRNZXNzYWdlKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFRoZSBtZXNzYWdlIGNhbiBiZSBhIGNsb3NlIG1lc3NhZ2UsIGFuZCBjaGFuZ2UgaXNfY2xvc2luZyBzdGF0ZS5cbiAgICAgICAgaWYgKCF0aGF0Ll9pc19jbG9zaW5nKSB7XG4gICAgICAgICAgICB0aGF0Ll9zY2hlZHVsZV9yZWN2KCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoYXQuX3JlY3Zfc3RvcCA9IGpzb25QUmVjZWl2ZXJXcmFwcGVyKHRoYXQudHJhbnNfdXJsICsgJy9qc29ucCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvblBHZW5lcmljUmVjZWl2ZXIsIGNhbGxiYWNrKTtcbn07XG5cbkpzb25QVHJhbnNwb3J0LmVuYWJsZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbkpzb25QVHJhbnNwb3J0Lm5lZWRfYm9keSA9IHRydWU7XG5cblxuSnNvblBUcmFuc3BvcnQucHJvdG90eXBlLmRvQ2xlYW51cCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0Ll9pc19jbG9zaW5nID0gdHJ1ZTtcbiAgICBpZiAodGhhdC5fcmVjdl9zdG9wKSB7XG4gICAgICAgIHRoYXQuX3JlY3Zfc3RvcCgpO1xuICAgIH1cbiAgICB0aGF0LnJpID0gdGhhdC5fcmVjdl9zdG9wID0gbnVsbDtcbiAgICB0aGF0LnNlbmRfZGVzdHJ1Y3RvcigpO1xufTtcblxuXG4vLyBBYnN0cmFjdCBhd2F5IGNvZGUgdGhhdCBoYW5kbGVzIGdsb2JhbCBuYW1lc3BhY2UgcG9sbHV0aW9uLlxudmFyIGpzb25QUmVjZWl2ZXJXcmFwcGVyID0gZnVuY3Rpb24odXJsLCBjb25zdHJ1Y3RSZWNlaXZlciwgdXNlcl9jYWxsYmFjaykge1xuICAgIHZhciBpZCA9ICdhJyArIHV0aWxzLnJhbmRvbV9zdHJpbmcoNik7XG4gICAgdmFyIHVybF9pZCA9IHVybCArICc/Yz0nICsgZXNjYXBlKFdQcmVmaXggKyAnLicgKyBpZCk7XG4gICAgLy8gQ2FsbGJhY2sgd2lsbCBiZSBjYWxsZWQgZXhhY3RseSBvbmNlLlxuICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKGZyYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBfd2luZG93W1dQcmVmaXhdW2lkXTtcbiAgICAgICAgdXNlcl9jYWxsYmFjayhmcmFtZSk7XG4gICAgfTtcblxuICAgIHZhciBjbG9zZV9zY3JpcHQgPSBjb25zdHJ1Y3RSZWNlaXZlcih1cmxfaWQsIGNhbGxiYWNrKTtcbiAgICBfd2luZG93W1dQcmVmaXhdW2lkXSA9IGNsb3NlX3NjcmlwdDtcbiAgICB2YXIgc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoX3dpbmRvd1tXUHJlZml4XVtpZF0pIHtcbiAgICAgICAgICAgIF93aW5kb3dbV1ByZWZpeF1baWRdKHV0aWxzLmNsb3NlRnJhbWUoMTAwMCwgXCJKU09OUCB1c2VyIGFib3J0ZWQgcmVhZFwiKSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBzdG9wO1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtanNvbnAtcG9sbGluZy5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMteGhyLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgQWpheEJhc2VkVHJhbnNwb3J0ID0gZnVuY3Rpb24oKSB7fTtcbkFqYXhCYXNlZFRyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgQnVmZmVyZWRTZW5kZXIoKTtcblxuQWpheEJhc2VkVHJhbnNwb3J0LnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmxfc3VmZml4LCBSZWNlaXZlciwgQWpheE9iamVjdCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnJpID0gcmk7XG4gICAgdGhhdC50cmFuc191cmwgPSB0cmFuc191cmw7XG4gICAgdGhhdC5zZW5kX2NvbnN0cnVjdG9yKGNyZWF0ZUFqYXhTZW5kZXIoQWpheE9iamVjdCkpO1xuICAgIHRoYXQucG9sbCA9IG5ldyBQb2xsaW5nKHJpLCBSZWNlaXZlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc191cmwgKyB1cmxfc3VmZml4LCBBamF4T2JqZWN0KTtcbn07XG5cbkFqYXhCYXNlZFRyYW5zcG9ydC5wcm90b3R5cGUuZG9DbGVhbnVwID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnBvbGwpIHtcbiAgICAgICAgdGhhdC5wb2xsLmFib3J0KCk7XG4gICAgICAgIHRoYXQucG9sbCA9IG51bGw7XG4gICAgfVxufTtcblxuLy8geGhyLXN0cmVhbWluZ1xudmFyIFhoclN0cmVhbWluZ1RyYW5zcG9ydCA9IFNvY2tKU1sneGhyLXN0cmVhbWluZyddID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCkge1xuICAgIHRoaXMucnVuKHJpLCB0cmFuc191cmwsICcveGhyX3N0cmVhbWluZycsIFhoclJlY2VpdmVyLCB1dGlscy5YSFJDb3JzT2JqZWN0KTtcbn07XG5cblhoclN0cmVhbWluZ1RyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgQWpheEJhc2VkVHJhbnNwb3J0KCk7XG5cblhoclN0cmVhbWluZ1RyYW5zcG9ydC5lbmFibGVkID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gU3VwcG9ydCBmb3IgQ09SUyBBamF4IGFrYSBBamF4Mj8gT3BlcmEgMTIgY2xhaW1zIENPUlMgYnV0XG4gICAgLy8gZG9lc24ndCBkbyBzdHJlYW1pbmcuXG4gICAgcmV0dXJuIChfd2luZG93LlhNTEh0dHBSZXF1ZXN0ICYmXG4gICAgICAgICAgICAnd2l0aENyZWRlbnRpYWxzJyBpbiBuZXcgWE1MSHR0cFJlcXVlc3QoKSAmJlxuICAgICAgICAgICAgKCEvb3BlcmEvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSk7XG59O1xuWGhyU3RyZWFtaW5nVHJhbnNwb3J0LnJvdW5kVHJpcHMgPSAyOyAvLyBwcmVmbGlnaHQsIGFqYXhcblxuLy8gU2FmYXJpIGdldHMgY29uZnVzZWQgd2hlbiBhIHN0cmVhbWluZyBhamF4IHJlcXVlc3QgaXMgc3RhcnRlZFxuLy8gYmVmb3JlIG9ubG9hZC4gVGhpcyBjYXVzZXMgdGhlIGxvYWQgaW5kaWNhdG9yIHRvIHNwaW4gaW5kZWZpbmV0ZWx5LlxuWGhyU3RyZWFtaW5nVHJhbnNwb3J0Lm5lZWRfYm9keSA9IHRydWU7XG5cblxuLy8gQWNjb3JkaW5nIHRvOlxuLy8gICBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE2NDE1MDcvZGV0ZWN0LWJyb3dzZXItc3VwcG9ydC1mb3ItY3Jvc3MtZG9tYWluLXhtbGh0dHByZXF1ZXN0c1xuLy8gICBodHRwOi8vaGFja3MubW96aWxsYS5vcmcvMjAwOS8wNy9jcm9zcy1zaXRlLXhtbGh0dHByZXF1ZXN0LXdpdGgtY29ycy9cblxuXG4vLyB4ZHItc3RyZWFtaW5nXG52YXIgWGRyU3RyZWFtaW5nVHJhbnNwb3J0ID0gU29ja0pTWyd4ZHItc3RyZWFtaW5nJ10gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdGhpcy5ydW4ocmksIHRyYW5zX3VybCwgJy94aHJfc3RyZWFtaW5nJywgWGhyUmVjZWl2ZXIsIHV0aWxzLlhEUk9iamVjdCk7XG59O1xuXG5YZHJTdHJlYW1pbmdUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEFqYXhCYXNlZFRyYW5zcG9ydCgpO1xuXG5YZHJTdHJlYW1pbmdUcmFuc3BvcnQuZW5hYmxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAhIV93aW5kb3cuWERvbWFpblJlcXVlc3Q7XG59O1xuWGRyU3RyZWFtaW5nVHJhbnNwb3J0LnJvdW5kVHJpcHMgPSAyOyAvLyBwcmVmbGlnaHQsIGFqYXhcblxuXG5cbi8vIHhoci1wb2xsaW5nXG52YXIgWGhyUG9sbGluZ1RyYW5zcG9ydCA9IFNvY2tKU1sneGhyLXBvbGxpbmcnXSA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB0aGlzLnJ1bihyaSwgdHJhbnNfdXJsLCAnL3hocicsIFhoclJlY2VpdmVyLCB1dGlscy5YSFJDb3JzT2JqZWN0KTtcbn07XG5cblhoclBvbGxpbmdUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEFqYXhCYXNlZFRyYW5zcG9ydCgpO1xuXG5YaHJQb2xsaW5nVHJhbnNwb3J0LmVuYWJsZWQgPSBYaHJTdHJlYW1pbmdUcmFuc3BvcnQuZW5hYmxlZDtcblhoclBvbGxpbmdUcmFuc3BvcnQucm91bmRUcmlwcyA9IDI7IC8vIHByZWZsaWdodCwgYWpheFxuXG5cbi8vIHhkci1wb2xsaW5nXG52YXIgWGRyUG9sbGluZ1RyYW5zcG9ydCA9IFNvY2tKU1sneGRyLXBvbGxpbmcnXSA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB0aGlzLnJ1bihyaSwgdHJhbnNfdXJsLCAnL3hocicsIFhoclJlY2VpdmVyLCB1dGlscy5YRFJPYmplY3QpO1xufTtcblxuWGRyUG9sbGluZ1RyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgQWpheEJhc2VkVHJhbnNwb3J0KCk7XG5cblhkclBvbGxpbmdUcmFuc3BvcnQuZW5hYmxlZCA9IFhkclN0cmVhbWluZ1RyYW5zcG9ydC5lbmFibGVkO1xuWGRyUG9sbGluZ1RyYW5zcG9ydC5yb3VuZFRyaXBzID0gMjsgLy8gcHJlZmxpZ2h0LCBhamF4XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLXhoci5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtaWZyYW1lLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG4vLyBGZXcgY29vbCB0cmFuc3BvcnRzIGRvIHdvcmsgb25seSBmb3Igc2FtZS1vcmlnaW4uIEluIG9yZGVyIHRvIG1ha2Vcbi8vIHRoZW0gd29ya2luZyBjcm9zcy1kb21haW4gd2Ugc2hhbGwgdXNlIGlmcmFtZSwgc2VydmVkIGZvcm0gdGhlXG4vLyByZW1vdGUgZG9tYWluLiBOZXcgYnJvd3NlcnMsIGhhdmUgY2FwYWJpbGl0aWVzIHRvIGNvbW11bmljYXRlIHdpdGhcbi8vIGNyb3NzIGRvbWFpbiBpZnJhbWUsIHVzaW5nIHBvc3RNZXNzYWdlKCkuIEluIElFIGl0IHdhcyBpbXBsZW1lbnRlZFxuLy8gZnJvbSBJRSA4KywgYnV0IG9mIGNvdXJzZSwgSUUgZ290IHNvbWUgZGV0YWlscyB3cm9uZzpcbi8vICAgIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9jYzE5NzAxNSh2PVZTLjg1KS5hc3B4XG4vLyAgICBodHRwOi8vc3RldmVzb3VkZXJzLmNvbS9taXNjL3Rlc3QtcG9zdG1lc3NhZ2UucGhwXG5cbnZhciBJZnJhbWVUcmFuc3BvcnQgPSBmdW5jdGlvbigpIHt9O1xuXG5JZnJhbWVUcmFuc3BvcnQucHJvdG90eXBlLmlfY29uc3RydWN0b3IgPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsLCBiYXNlX3VybCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnJpID0gcmk7XG4gICAgdGhhdC5vcmlnaW4gPSB1dGlscy5nZXRPcmlnaW4oYmFzZV91cmwpO1xuICAgIHRoYXQuYmFzZV91cmwgPSBiYXNlX3VybDtcbiAgICB0aGF0LnRyYW5zX3VybCA9IHRyYW5zX3VybDtcblxuICAgIHZhciBpZnJhbWVfdXJsID0gYmFzZV91cmwgKyAnL2lmcmFtZS5odG1sJztcbiAgICBpZiAodGhhdC5yaS5fb3B0aW9ucy5kZXZlbCkge1xuICAgICAgICBpZnJhbWVfdXJsICs9ICc/dD0nICsgKCtuZXcgRGF0ZSk7XG4gICAgfVxuICAgIHRoYXQud2luZG93X2lkID0gdXRpbHMucmFuZG9tX3N0cmluZyg4KTtcbiAgICBpZnJhbWVfdXJsICs9ICcjJyArIHRoYXQud2luZG93X2lkO1xuXG4gICAgdGhhdC5pZnJhbWVPYmogPSB1dGlscy5jcmVhdGVJZnJhbWUoaWZyYW1lX3VybCwgZnVuY3Rpb24ocikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnJpLl9kaWRDbG9zZSgxMDA2LCBcIlVuYWJsZSB0byBsb2FkIGFuIGlmcmFtZSAoXCIgKyByICsgXCIpXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgdGhhdC5vbm1lc3NhZ2VfY2IgPSB1dGlscy5iaW5kKHRoYXQub25tZXNzYWdlLCB0aGF0KTtcbiAgICB1dGlscy5hdHRhY2hNZXNzYWdlKHRoYXQub25tZXNzYWdlX2NiKTtcbn07XG5cbklmcmFtZVRyYW5zcG9ydC5wcm90b3R5cGUuZG9DbGVhbnVwID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LmlmcmFtZU9iaikge1xuICAgICAgICB1dGlscy5kZXRhY2hNZXNzYWdlKHRoYXQub25tZXNzYWdlX2NiKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gdGhlIGlmcmFtZSBpcyBub3QgbG9hZGVkLCBJRSByYWlzZXMgYW4gZXhjZXB0aW9uXG4gICAgICAgICAgICAvLyBvbiAnY29udGVudFdpbmRvdycuXG4gICAgICAgICAgICBpZiAodGhhdC5pZnJhbWVPYmouaWZyYW1lLmNvbnRlbnRXaW5kb3cpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnBvc3RNZXNzYWdlKCdjJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKHgpIHt9XG4gICAgICAgIHRoYXQuaWZyYW1lT2JqLmNsZWFudXAoKTtcbiAgICAgICAgdGhhdC5pZnJhbWVPYmogPSBudWxsO1xuICAgICAgICB0aGF0Lm9ubWVzc2FnZV9jYiA9IHRoYXQuaWZyYW1lT2JqID0gbnVsbDtcbiAgICB9XG59O1xuXG5JZnJhbWVUcmFuc3BvcnQucHJvdG90eXBlLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKGUub3JpZ2luICE9PSB0aGF0Lm9yaWdpbikgcmV0dXJuO1xuICAgIHZhciB3aW5kb3dfaWQgPSBlLmRhdGEuc2xpY2UoMCwgOCk7XG4gICAgdmFyIHR5cGUgPSBlLmRhdGEuc2xpY2UoOCwgOSk7XG4gICAgdmFyIGRhdGEgPSBlLmRhdGEuc2xpY2UoOSk7XG5cbiAgICBpZiAod2luZG93X2lkICE9PSB0aGF0LndpbmRvd19pZCkgcmV0dXJuO1xuXG4gICAgc3dpdGNoKHR5cGUpIHtcbiAgICBjYXNlICdzJzpcbiAgICAgICAgdGhhdC5pZnJhbWVPYmoubG9hZGVkKCk7XG4gICAgICAgIHRoYXQucG9zdE1lc3NhZ2UoJ3MnLCBKU09OLnN0cmluZ2lmeShbU29ja0pTLnZlcnNpb24sIHRoYXQucHJvdG9jb2wsIHRoYXQudHJhbnNfdXJsLCB0aGF0LmJhc2VfdXJsXSkpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlICd0JzpcbiAgICAgICAgdGhhdC5yaS5fZGlkTWVzc2FnZShkYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcblxuSWZyYW1lVHJhbnNwb3J0LnByb3RvdHlwZS5wb3N0TWVzc2FnZSA9IGZ1bmN0aW9uKHR5cGUsIGRhdGEpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5pZnJhbWVPYmoucG9zdCh0aGF0LndpbmRvd19pZCArIHR5cGUgKyAoZGF0YSB8fCAnJyksIHRoYXQub3JpZ2luKTtcbn07XG5cbklmcmFtZVRyYW5zcG9ydC5wcm90b3R5cGUuZG9TZW5kID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICB0aGlzLnBvc3RNZXNzYWdlKCdtJywgbWVzc2FnZSk7XG59O1xuXG5JZnJhbWVUcmFuc3BvcnQuZW5hYmxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIHBvc3RNZXNzYWdlIG1pc2JlaGF2ZXMgaW4ga29ucXVlcm9yIDQuNi41IC0gdGhlIG1lc3NhZ2VzIGFyZSBkZWxpdmVyZWQgd2l0aFxuICAgIC8vIGh1Z2UgZGVsYXksIG9yIG5vdCBhdCBhbGwuXG4gICAgdmFyIGtvbnF1ZXJvciA9IG5hdmlnYXRvciAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignS29ucXVlcm9yJykgIT09IC0xO1xuICAgIHJldHVybiAoKHR5cGVvZiBfd2luZG93LnBvc3RNZXNzYWdlID09PSAnZnVuY3Rpb24nIHx8XG4gICAgICAgICAgICB0eXBlb2YgX3dpbmRvdy5wb3N0TWVzc2FnZSA9PT0gJ29iamVjdCcpICYmICgha29ucXVlcm9yKSk7XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1pZnJhbWUuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLWlmcmFtZS13aXRoaW4uanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBjdXJyX3dpbmRvd19pZDtcblxudmFyIHBvc3RNZXNzYWdlID0gZnVuY3Rpb24gKHR5cGUsIGRhdGEpIHtcbiAgICBpZihwYXJlbnQgIT09IF93aW5kb3cpIHtcbiAgICAgICAgcGFyZW50LnBvc3RNZXNzYWdlKGN1cnJfd2luZG93X2lkICsgdHlwZSArIChkYXRhIHx8ICcnKSwgJyonKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1dGlscy5sb2coXCJDYW4ndCBwb3N0TWVzc2FnZSwgbm8gcGFyZW50IHdpbmRvdy5cIiwgdHlwZSwgZGF0YSk7XG4gICAgfVxufTtcblxudmFyIEZhY2FkZUpTID0gZnVuY3Rpb24oKSB7fTtcbkZhY2FkZUpTLnByb3RvdHlwZS5fZGlkQ2xvc2UgPSBmdW5jdGlvbiAoY29kZSwgcmVhc29uKSB7XG4gICAgcG9zdE1lc3NhZ2UoJ3QnLCB1dGlscy5jbG9zZUZyYW1lKGNvZGUsIHJlYXNvbikpO1xufTtcbkZhY2FkZUpTLnByb3RvdHlwZS5fZGlkTWVzc2FnZSA9IGZ1bmN0aW9uIChmcmFtZSkge1xuICAgIHBvc3RNZXNzYWdlKCd0JywgZnJhbWUpO1xufTtcbkZhY2FkZUpTLnByb3RvdHlwZS5fZG9TZW5kID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB0aGlzLl90cmFuc3BvcnQuZG9TZW5kKGRhdGEpO1xufTtcbkZhY2FkZUpTLnByb3RvdHlwZS5fZG9DbGVhbnVwID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3RyYW5zcG9ydC5kb0NsZWFudXAoKTtcbn07XG5cbnV0aWxzLnBhcmVudF9vcmlnaW4gPSB1bmRlZmluZWQ7XG5cblNvY2tKUy5ib290c3RyYXBfaWZyYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZhY2FkZTtcbiAgICBjdXJyX3dpbmRvd19pZCA9IF9kb2N1bWVudC5sb2NhdGlvbi5oYXNoLnNsaWNlKDEpO1xuICAgIHZhciBvbk1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmKGUuc291cmNlICE9PSBwYXJlbnQpIHJldHVybjtcbiAgICAgICAgaWYodHlwZW9mIHV0aWxzLnBhcmVudF9vcmlnaW4gPT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgdXRpbHMucGFyZW50X29yaWdpbiA9IGUub3JpZ2luO1xuICAgICAgICBpZiAoZS5vcmlnaW4gIT09IHV0aWxzLnBhcmVudF9vcmlnaW4pIHJldHVybjtcblxuICAgICAgICB2YXIgd2luZG93X2lkID0gZS5kYXRhLnNsaWNlKDAsIDgpO1xuICAgICAgICB2YXIgdHlwZSA9IGUuZGF0YS5zbGljZSg4LCA5KTtcbiAgICAgICAgdmFyIGRhdGEgPSBlLmRhdGEuc2xpY2UoOSk7XG4gICAgICAgIGlmICh3aW5kb3dfaWQgIT09IGN1cnJfd2luZG93X2lkKSByZXR1cm47XG4gICAgICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgICAgIGNhc2UgJ3MnOlxuICAgICAgICAgICAgdmFyIHAgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgICAgdmFyIHZlcnNpb24gPSBwWzBdO1xuICAgICAgICAgICAgdmFyIHByb3RvY29sID0gcFsxXTtcbiAgICAgICAgICAgIHZhciB0cmFuc191cmwgPSBwWzJdO1xuICAgICAgICAgICAgdmFyIGJhc2VfdXJsID0gcFszXTtcbiAgICAgICAgICAgIGlmICh2ZXJzaW9uICE9PSBTb2NrSlMudmVyc2lvbikge1xuICAgICAgICAgICAgICAgIHV0aWxzLmxvZyhcIkluY29tcGF0aWJpbGUgU29ja0pTISBNYWluIHNpdGUgdXNlczpcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFwiIFxcXCJcIiArIHZlcnNpb24gKyBcIlxcXCIsIHRoZSBpZnJhbWU6XCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcXFwiXCIgKyBTb2NrSlMudmVyc2lvbiArIFwiXFxcIi5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXV0aWxzLmZsYXRVcmwodHJhbnNfdXJsKSB8fCAhdXRpbHMuZmxhdFVybChiYXNlX3VybCkpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5sb2coXCJPbmx5IGJhc2ljIHVybHMgYXJlIHN1cHBvcnRlZCBpbiBTb2NrSlNcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXV0aWxzLmlzU2FtZU9yaWdpblVybCh0cmFuc191cmwpIHx8XG4gICAgICAgICAgICAgICAgIXV0aWxzLmlzU2FtZU9yaWdpblVybChiYXNlX3VybCkpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5sb2coXCJDYW4ndCBjb25uZWN0IHRvIGRpZmZlcmVudCBkb21haW4gZnJvbSB3aXRoaW4gYW4gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBcImlmcmFtZS4gKFwiICsgSlNPTi5zdHJpbmdpZnkoW193aW5kb3cubG9jYXRpb24uaHJlZiwgdHJhbnNfdXJsLCBiYXNlX3VybF0pICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXCIpXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZhY2FkZSA9IG5ldyBGYWNhZGVKUygpO1xuICAgICAgICAgICAgZmFjYWRlLl90cmFuc3BvcnQgPSBuZXcgRmFjYWRlSlNbcHJvdG9jb2xdKGZhY2FkZSwgdHJhbnNfdXJsLCBiYXNlX3VybCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbSc6XG4gICAgICAgICAgICBmYWNhZGUuX2RvU2VuZChkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjJzpcbiAgICAgICAgICAgIGlmIChmYWNhZGUpXG4gICAgICAgICAgICAgICAgZmFjYWRlLl9kb0NsZWFudXAoKTtcbiAgICAgICAgICAgIGZhY2FkZSA9IG51bGw7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBhbGVydCgndGVzdCB0aWNrZXInKTtcbiAgICAvLyBmYWNhZGUgPSBuZXcgRmFjYWRlSlMoKTtcbiAgICAvLyBmYWNhZGUuX3RyYW5zcG9ydCA9IG5ldyBGYWNhZGVKU1sndy1pZnJhbWUteGhyLXBvbGxpbmcnXShmYWNhZGUsICdodHRwOi8vaG9zdC5jb206OTk5OS90aWNrZXIvMTIvYmFzZCcpO1xuXG4gICAgdXRpbHMuYXR0YWNoTWVzc2FnZShvbk1lc3NhZ2UpO1xuXG4gICAgLy8gU3RhcnRcbiAgICBwb3N0TWVzc2FnZSgncycpO1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtaWZyYW1lLXdpdGhpbi5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvaW5mby5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIEluZm9SZWNlaXZlciA9IGZ1bmN0aW9uKGJhc2VfdXJsLCBBamF4T2JqZWN0KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHV0aWxzLmRlbGF5KGZ1bmN0aW9uKCl7dGhhdC5kb1hocihiYXNlX3VybCwgQWpheE9iamVjdCk7fSk7XG59O1xuXG5JbmZvUmVjZWl2ZXIucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcihbJ2ZpbmlzaCddKTtcblxuSW5mb1JlY2VpdmVyLnByb3RvdHlwZS5kb1hociA9IGZ1bmN0aW9uKGJhc2VfdXJsLCBBamF4T2JqZWN0KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciB0MCA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgdmFyIHhvID0gbmV3IEFqYXhPYmplY3QoJ0dFVCcsIGJhc2VfdXJsICsgJy9pbmZvJyk7XG5cbiAgICB2YXIgdHJlZiA9IHV0aWxzLmRlbGF5KDgwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpe3hvLm9udGltZW91dCgpO30pO1xuXG4gICAgeG8ub25maW5pc2ggPSBmdW5jdGlvbihzdGF0dXMsIHRleHQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRyZWYpO1xuICAgICAgICB0cmVmID0gbnVsbDtcbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICB2YXIgcnR0ID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKSAtIHQwO1xuICAgICAgICAgICAgdmFyIGluZm8gPSBKU09OLnBhcnNlKHRleHQpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbmZvICE9PSAnb2JqZWN0JykgaW5mbyA9IHt9O1xuICAgICAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnLCBpbmZvLCBydHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgeG8ub250aW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHhvLmNsb3NlKCk7XG4gICAgICAgIHRoYXQuZW1pdCgnZmluaXNoJyk7XG4gICAgfTtcbn07XG5cbnZhciBJbmZvUmVjZWl2ZXJJZnJhbWUgPSBmdW5jdGlvbihiYXNlX3VybCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgZ28gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlmciA9IG5ldyBJZnJhbWVUcmFuc3BvcnQoKTtcbiAgICAgICAgaWZyLnByb3RvY29sID0gJ3ctaWZyYW1lLWluZm8tcmVjZWl2ZXInO1xuICAgICAgICB2YXIgZnVuID0gZnVuY3Rpb24ocikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByID09PSAnc3RyaW5nJyAmJiByLnN1YnN0cigwLDEpID09PSAnbScpIHtcbiAgICAgICAgICAgICAgICB2YXIgZCA9IEpTT04ucGFyc2Uoci5zdWJzdHIoMSkpO1xuICAgICAgICAgICAgICAgIHZhciBpbmZvID0gZFswXSwgcnR0ID0gZFsxXTtcbiAgICAgICAgICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcsIGluZm8sIHJ0dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoYXQuZW1pdCgnZmluaXNoJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZnIuZG9DbGVhbnVwKCk7XG4gICAgICAgICAgICBpZnIgPSBudWxsO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgbW9ja19yaSA9IHtcbiAgICAgICAgICAgIF9vcHRpb25zOiB7fSxcbiAgICAgICAgICAgIF9kaWRDbG9zZTogZnVuLFxuICAgICAgICAgICAgX2RpZE1lc3NhZ2U6IGZ1blxuICAgICAgICB9O1xuICAgICAgICBpZnIuaV9jb25zdHJ1Y3Rvcihtb2NrX3JpLCBiYXNlX3VybCwgYmFzZV91cmwpO1xuICAgIH1cbiAgICBpZighX2RvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgdXRpbHMuYXR0YWNoRXZlbnQoJ2xvYWQnLCBnbyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZ28oKTtcbiAgICB9XG59O1xuSW5mb1JlY2VpdmVySWZyYW1lLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoWydmaW5pc2gnXSk7XG5cblxudmFyIEluZm9SZWNlaXZlckZha2UgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBJdCBtYXkgbm90IGJlIHBvc3NpYmxlIHRvIGRvIGNyb3NzIGRvbWFpbiBBSkFYIHRvIGdldCB0aGUgaW5mb1xuICAgIC8vIGRhdGEsIGZvciBleGFtcGxlIGZvciBJRTcuIEJ1dCB3ZSB3YW50IHRvIHJ1biBKU09OUCwgc28gbGV0J3NcbiAgICAvLyBmYWtlIHRoZSByZXNwb25zZSwgd2l0aCBydHQ9MnMgKHJ0bz02cykuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHV0aWxzLmRlbGF5KGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcsIHt9LCAyMDAwKTtcbiAgICB9KTtcbn07XG5JbmZvUmVjZWl2ZXJGYWtlLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoWydmaW5pc2gnXSk7XG5cbnZhciBjcmVhdGVJbmZvUmVjZWl2ZXIgPSBmdW5jdGlvbihiYXNlX3VybCkge1xuICAgIGlmICh1dGlscy5pc1NhbWVPcmlnaW5VcmwoYmFzZV91cmwpKSB7XG4gICAgICAgIC8vIElmLCBmb3Igc29tZSByZWFzb24sIHdlIGhhdmUgU29ja0pTIGxvY2FsbHkgLSB0aGVyZSdzIG5vXG4gICAgICAgIC8vIG5lZWQgdG8gc3RhcnQgdXAgdGhlIGNvbXBsZXggbWFjaGluZXJ5LiBKdXN0IHVzZSBhamF4LlxuICAgICAgICByZXR1cm4gbmV3IEluZm9SZWNlaXZlcihiYXNlX3VybCwgdXRpbHMuWEhSTG9jYWxPYmplY3QpO1xuICAgIH1cbiAgICBzd2l0Y2ggKHV0aWxzLmlzWEhSQ29yc0NhcGFibGUoKSkge1xuICAgIGNhc2UgMTpcbiAgICAgICAgcmV0dXJuIG5ldyBJbmZvUmVjZWl2ZXIoYmFzZV91cmwsIHV0aWxzLlhIUkNvcnNPYmplY3QpO1xuICAgIGNhc2UgMjpcbiAgICAgICAgcmV0dXJuIG5ldyBJbmZvUmVjZWl2ZXIoYmFzZV91cmwsIHV0aWxzLlhEUk9iamVjdCk7XG4gICAgY2FzZSAzOlxuICAgICAgICAvLyBPcGVyYVxuICAgICAgICByZXR1cm4gbmV3IEluZm9SZWNlaXZlcklmcmFtZShiYXNlX3VybCk7XG4gICAgZGVmYXVsdDpcbiAgICAgICAgLy8gSUUgN1xuICAgICAgICByZXR1cm4gbmV3IEluZm9SZWNlaXZlckZha2UoKTtcbiAgICB9O1xufTtcblxuXG52YXIgV0luZm9SZWNlaXZlcklmcmFtZSA9IEZhY2FkZUpTWyd3LWlmcmFtZS1pbmZvLXJlY2VpdmVyJ10gPSBmdW5jdGlvbihyaSwgX3RyYW5zX3VybCwgYmFzZV91cmwpIHtcbiAgICB2YXIgaXIgPSBuZXcgSW5mb1JlY2VpdmVyKGJhc2VfdXJsLCB1dGlscy5YSFJMb2NhbE9iamVjdCk7XG4gICAgaXIub25maW5pc2ggPSBmdW5jdGlvbihpbmZvLCBydHQpIHtcbiAgICAgICAgcmkuX2RpZE1lc3NhZ2UoJ20nK0pTT04uc3RyaW5naWZ5KFtpbmZvLCBydHRdKSk7XG4gICAgICAgIHJpLl9kaWRDbG9zZSgpO1xuICAgIH1cbn07XG5XSW5mb1JlY2VpdmVySWZyYW1lLnByb3RvdHlwZS5kb0NsZWFudXAgPSBmdW5jdGlvbigpIHt9O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi9pbmZvLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1pZnJhbWUtZXZlbnRzb3VyY2UuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBFdmVudFNvdXJjZUlmcmFtZVRyYW5zcG9ydCA9IFNvY2tKU1snaWZyYW1lLWV2ZW50c291cmNlJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQucHJvdG9jb2wgPSAndy1pZnJhbWUtZXZlbnRzb3VyY2UnO1xuICAgIHRoYXQuaV9jb25zdHJ1Y3Rvci5hcHBseSh0aGF0LCBhcmd1bWVudHMpO1xufTtcblxuRXZlbnRTb3VyY2VJZnJhbWVUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IElmcmFtZVRyYW5zcG9ydCgpO1xuXG5FdmVudFNvdXJjZUlmcmFtZVRyYW5zcG9ydC5lbmFibGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAoJ0V2ZW50U291cmNlJyBpbiBfd2luZG93KSAmJiBJZnJhbWVUcmFuc3BvcnQuZW5hYmxlZCgpO1xufTtcblxuRXZlbnRTb3VyY2VJZnJhbWVUcmFuc3BvcnQubmVlZF9ib2R5ID0gdHJ1ZTtcbkV2ZW50U291cmNlSWZyYW1lVHJhbnNwb3J0LnJvdW5kVHJpcHMgPSAzOyAvLyBodG1sLCBqYXZhc2NyaXB0LCBldmVudHNvdXJjZVxuXG5cbi8vIHctaWZyYW1lLWV2ZW50c291cmNlXG52YXIgRXZlbnRTb3VyY2VUcmFuc3BvcnQgPSBGYWNhZGVKU1sndy1pZnJhbWUtZXZlbnRzb3VyY2UnXSA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB0aGlzLnJ1bihyaSwgdHJhbnNfdXJsLCAnL2V2ZW50c291cmNlJywgRXZlbnRTb3VyY2VSZWNlaXZlciwgdXRpbHMuWEhSTG9jYWxPYmplY3QpO1xufVxuRXZlbnRTb3VyY2VUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEFqYXhCYXNlZFRyYW5zcG9ydCgpO1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1pZnJhbWUtZXZlbnRzb3VyY2UuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLWlmcmFtZS14aHItcG9sbGluZy5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIFhoclBvbGxpbmdJZnJhbWVUcmFuc3BvcnQgPSBTb2NrSlNbJ2lmcmFtZS14aHItcG9sbGluZyddID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnByb3RvY29sID0gJ3ctaWZyYW1lLXhoci1wb2xsaW5nJztcbiAgICB0aGF0LmlfY29uc3RydWN0b3IuYXBwbHkodGhhdCwgYXJndW1lbnRzKTtcbn07XG5cblhoclBvbGxpbmdJZnJhbWVUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IElmcmFtZVRyYW5zcG9ydCgpO1xuXG5YaHJQb2xsaW5nSWZyYW1lVHJhbnNwb3J0LmVuYWJsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF93aW5kb3cuWE1MSHR0cFJlcXVlc3QgJiYgSWZyYW1lVHJhbnNwb3J0LmVuYWJsZWQoKTtcbn07XG5cblhoclBvbGxpbmdJZnJhbWVUcmFuc3BvcnQubmVlZF9ib2R5ID0gdHJ1ZTtcblhoclBvbGxpbmdJZnJhbWVUcmFuc3BvcnQucm91bmRUcmlwcyA9IDM7IC8vIGh0bWwsIGphdmFzY3JpcHQsIHhoclxuXG5cbi8vIHctaWZyYW1lLXhoci1wb2xsaW5nXG52YXIgWGhyUG9sbGluZ0lUcmFuc3BvcnQgPSBGYWNhZGVKU1sndy1pZnJhbWUteGhyLXBvbGxpbmcnXSA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB0aGlzLnJ1bihyaSwgdHJhbnNfdXJsLCAnL3hocicsIFhoclJlY2VpdmVyLCB1dGlscy5YSFJMb2NhbE9iamVjdCk7XG59O1xuXG5YaHJQb2xsaW5nSVRyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgQWpheEJhc2VkVHJhbnNwb3J0KCk7XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLWlmcmFtZS14aHItcG9sbGluZy5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtaWZyYW1lLWh0bWxmaWxlLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG4vLyBUaGlzIHRyYW5zcG9ydCBnZW5lcmFsbHkgd29ya3MgaW4gYW55IGJyb3dzZXIsIGJ1dCB3aWxsIGNhdXNlIGFcbi8vIHNwaW5uaW5nIGN1cnNvciB0byBhcHBlYXIgaW4gYW55IGJyb3dzZXIgb3RoZXIgdGhhbiBJRS5cbi8vIFdlIG1heSB0ZXN0IHRoaXMgdHJhbnNwb3J0IGluIGFsbCBicm93c2VycyAtIHdoeSBub3QsIGJ1dCBpblxuLy8gcHJvZHVjdGlvbiBpdCBzaG91bGQgYmUgb25seSBydW4gaW4gSUUuXG5cbnZhciBIdG1sRmlsZUlmcmFtZVRyYW5zcG9ydCA9IFNvY2tKU1snaWZyYW1lLWh0bWxmaWxlJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQucHJvdG9jb2wgPSAndy1pZnJhbWUtaHRtbGZpbGUnO1xuICAgIHRoYXQuaV9jb25zdHJ1Y3Rvci5hcHBseSh0aGF0LCBhcmd1bWVudHMpO1xufTtcblxuLy8gSW5oZXJpdGFuY2UuXG5IdG1sRmlsZUlmcmFtZVRyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgSWZyYW1lVHJhbnNwb3J0KCk7XG5cbkh0bWxGaWxlSWZyYW1lVHJhbnNwb3J0LmVuYWJsZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gSWZyYW1lVHJhbnNwb3J0LmVuYWJsZWQoKTtcbn07XG5cbkh0bWxGaWxlSWZyYW1lVHJhbnNwb3J0Lm5lZWRfYm9keSA9IHRydWU7XG5IdG1sRmlsZUlmcmFtZVRyYW5zcG9ydC5yb3VuZFRyaXBzID0gMzsgLy8gaHRtbCwgamF2YXNjcmlwdCwgaHRtbGZpbGVcblxuXG4vLyB3LWlmcmFtZS1odG1sZmlsZVxudmFyIEh0bWxGaWxlVHJhbnNwb3J0ID0gRmFjYWRlSlNbJ3ctaWZyYW1lLWh0bWxmaWxlJ10gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdGhpcy5ydW4ocmksIHRyYW5zX3VybCwgJy9odG1sZmlsZScsIEh0bWxmaWxlUmVjZWl2ZXIsIHV0aWxzLlhIUkxvY2FsT2JqZWN0KTtcbn07XG5IdG1sRmlsZVRyYW5zcG9ydC5wcm90b3R5cGUgPSBuZXcgQWpheEJhc2VkVHJhbnNwb3J0KCk7XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLWlmcmFtZS1odG1sZmlsZS5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtcG9sbGluZy5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIFBvbGxpbmcgPSBmdW5jdGlvbihyaSwgUmVjZWl2ZXIsIHJlY3ZfdXJsLCBBamF4T2JqZWN0KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQucmkgPSByaTtcbiAgICB0aGF0LlJlY2VpdmVyID0gUmVjZWl2ZXI7XG4gICAgdGhhdC5yZWN2X3VybCA9IHJlY3ZfdXJsO1xuICAgIHRoYXQuQWpheE9iamVjdCA9IEFqYXhPYmplY3Q7XG4gICAgdGhhdC5fc2NoZWR1bGVSZWN2KCk7XG59O1xuXG5Qb2xsaW5nLnByb3RvdHlwZS5fc2NoZWR1bGVSZWN2ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciBwb2xsID0gdGhhdC5wb2xsID0gbmV3IHRoYXQuUmVjZWl2ZXIodGhhdC5yZWN2X3VybCwgdGhhdC5BamF4T2JqZWN0KTtcbiAgICB2YXIgbXNnX2NvdW50ZXIgPSAwO1xuICAgIHBvbGwub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBtc2dfY291bnRlciArPSAxO1xuICAgICAgICB0aGF0LnJpLl9kaWRNZXNzYWdlKGUuZGF0YSk7XG4gICAgfTtcbiAgICBwb2xsLm9uY2xvc2UgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoYXQucG9sbCA9IHBvbGwgPSBwb2xsLm9ubWVzc2FnZSA9IHBvbGwub25jbG9zZSA9IG51bGw7XG4gICAgICAgIGlmICghdGhhdC5wb2xsX2lzX2Nsb3NpbmcpIHtcbiAgICAgICAgICAgIGlmIChlLnJlYXNvbiA9PT0gJ3Blcm1hbmVudCcpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnJpLl9kaWRDbG9zZSgxMDA2LCAnUG9sbGluZyBlcnJvciAoJyArIGUucmVhc29uICsgJyknKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhhdC5fc2NoZWR1bGVSZWN2KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuUG9sbGluZy5wcm90b3R5cGUuYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5wb2xsX2lzX2Nsb3NpbmcgPSB0cnVlO1xuICAgIGlmICh0aGF0LnBvbGwpIHtcbiAgICAgICAgdGhhdC5wb2xsLmFib3J0KCk7XG4gICAgfVxufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtcG9sbGluZy5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtcmVjZWl2ZXItZXZlbnRzb3VyY2UuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBFdmVudFNvdXJjZVJlY2VpdmVyID0gZnVuY3Rpb24odXJsKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciBlcyA9IG5ldyBFdmVudFNvdXJjZSh1cmwpO1xuICAgIGVzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudCgnbWVzc2FnZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeydkYXRhJzogdW5lc2NhcGUoZS5kYXRhKX0pKTtcbiAgICB9O1xuICAgIHRoYXQuZXNfY2xvc2UgPSBlcy5vbmVycm9yID0gZnVuY3Rpb24oZSwgYWJvcnRfcmVhc29uKSB7XG4gICAgICAgIC8vIEVTIG9uIHJlY29ubmVjdGlvbiBoYXMgcmVhZHlTdGF0ZSA9IDAgb3IgMS5cbiAgICAgICAgLy8gb24gbmV0d29yayBlcnJvciBpdCdzIENMT1NFRCA9IDJcbiAgICAgICAgdmFyIHJlYXNvbiA9IGFib3J0X3JlYXNvbiA/ICd1c2VyJyA6XG4gICAgICAgICAgICAoZXMucmVhZHlTdGF0ZSAhPT0gMiA/ICduZXR3b3JrJyA6ICdwZXJtYW5lbnQnKTtcbiAgICAgICAgdGhhdC5lc19jbG9zZSA9IGVzLm9ubWVzc2FnZSA9IGVzLm9uZXJyb3IgPSBudWxsO1xuICAgICAgICAvLyBFdmVudFNvdXJjZSByZWNvbm5lY3RzIGF1dG9tYXRpY2FsbHkuXG4gICAgICAgIGVzLmNsb3NlKCk7XG4gICAgICAgIGVzID0gbnVsbDtcbiAgICAgICAgLy8gU2FmYXJpIGFuZCBjaHJvbWUgPCAxNSBjcmFzaCBpZiB3ZSBjbG9zZSB3aW5kb3cgYmVmb3JlXG4gICAgICAgIC8vIHdhaXRpbmcgZm9yIEVTIGNsZWFudXAuIFNlZTpcbiAgICAgICAgLy8gICBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9ODkxNTVcbiAgICAgICAgdXRpbHMuZGVsYXkoMjAwLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoJ2Nsb3NlJywge3JlYXNvbjogcmVhc29ufSkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICB9O1xufTtcblxuRXZlbnRTb3VyY2VSZWNlaXZlci5wcm90b3R5cGUgPSBuZXcgUkV2ZW50VGFyZ2V0KCk7XG5cbkV2ZW50U291cmNlUmVjZWl2ZXIucHJvdG90eXBlLmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LmVzX2Nsb3NlKSB7XG4gICAgICAgIHRoYXQuZXNfY2xvc2Uoe30sIHRydWUpO1xuICAgIH1cbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLXJlY2VpdmVyLWV2ZW50c291cmNlLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1yZWNlaXZlci1odG1sZmlsZS5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIF9pc19pZV9odG1sZmlsZV9jYXBhYmxlO1xudmFyIGlzSWVIdG1sZmlsZUNhcGFibGUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoX2lzX2llX2h0bWxmaWxlX2NhcGFibGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoJ0FjdGl2ZVhPYmplY3QnIGluIF93aW5kb3cpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgX2lzX2llX2h0bWxmaWxlX2NhcGFibGUgPSAhIW5ldyBBY3RpdmVYT2JqZWN0KCdodG1sZmlsZScpO1xuICAgICAgICAgICAgfSBjYXRjaCAoeCkge31cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF9pc19pZV9odG1sZmlsZV9jYXBhYmxlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIF9pc19pZV9odG1sZmlsZV9jYXBhYmxlO1xufTtcblxuXG52YXIgSHRtbGZpbGVSZWNlaXZlciA9IGZ1bmN0aW9uKHVybCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB1dGlscy5wb2xsdXRlR2xvYmFsTmFtZXNwYWNlKCk7XG5cbiAgICB0aGF0LmlkID0gJ2EnICsgdXRpbHMucmFuZG9tX3N0cmluZyg2LCAyNik7XG4gICAgdXJsICs9ICgodXJsLmluZGV4T2YoJz8nKSA9PT0gLTEpID8gJz8nIDogJyYnKSArXG4gICAgICAgICdjPScgKyBlc2NhcGUoV1ByZWZpeCArICcuJyArIHRoYXQuaWQpO1xuXG4gICAgdmFyIGNvbnN0cnVjdG9yID0gaXNJZUh0bWxmaWxlQ2FwYWJsZSgpID9cbiAgICAgICAgdXRpbHMuY3JlYXRlSHRtbGZpbGUgOiB1dGlscy5jcmVhdGVJZnJhbWU7XG5cbiAgICB2YXIgaWZyYW1lT2JqO1xuICAgIF93aW5kb3dbV1ByZWZpeF1bdGhhdC5pZF0gPSB7XG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZnJhbWVPYmoubG9hZGVkKCk7XG4gICAgICAgIH0sXG4gICAgICAgIG1lc3NhZ2U6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KCdtZXNzYWdlJywgeydkYXRhJzogZGF0YX0pKTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhhdC5pZnJhbWVfY2xvc2Uoe30sICduZXR3b3JrJyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoYXQuaWZyYW1lX2Nsb3NlID0gZnVuY3Rpb24oZSwgYWJvcnRfcmVhc29uKSB7XG4gICAgICAgIGlmcmFtZU9iai5jbGVhbnVwKCk7XG4gICAgICAgIHRoYXQuaWZyYW1lX2Nsb3NlID0gaWZyYW1lT2JqID0gbnVsbDtcbiAgICAgICAgZGVsZXRlIF93aW5kb3dbV1ByZWZpeF1bdGhhdC5pZF07XG4gICAgICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoJ2Nsb3NlJywge3JlYXNvbjogYWJvcnRfcmVhc29ufSkpO1xuICAgIH07XG4gICAgaWZyYW1lT2JqID0gY29uc3RydWN0b3IodXJsLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuaWZyYW1lX2Nsb3NlKHt9LCAncGVybWFuZW50Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG59O1xuXG5IdG1sZmlsZVJlY2VpdmVyLnByb3RvdHlwZSA9IG5ldyBSRXZlbnRUYXJnZXQoKTtcblxuSHRtbGZpbGVSZWNlaXZlci5wcm90b3R5cGUuYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQuaWZyYW1lX2Nsb3NlKSB7XG4gICAgICAgIHRoYXQuaWZyYW1lX2Nsb3NlKHt9LCAndXNlcicpO1xuICAgIH1cbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLXJlY2VpdmVyLWh0bWxmaWxlLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1yZWNlaXZlci14aHIuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBYaHJSZWNlaXZlciA9IGZ1bmN0aW9uKHVybCwgQWpheE9iamVjdCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgYnVmX3BvcyA9IDA7XG5cbiAgICB0aGF0LnhvID0gbmV3IEFqYXhPYmplY3QoJ1BPU1QnLCB1cmwsIG51bGwpO1xuICAgIHRoYXQueG8ub25jaHVuayA9IGZ1bmN0aW9uKHN0YXR1cywgdGV4dCkge1xuICAgICAgICBpZiAoc3RhdHVzICE9PSAyMDApIHJldHVybjtcbiAgICAgICAgd2hpbGUgKDEpIHtcbiAgICAgICAgICAgIHZhciBidWYgPSB0ZXh0LnNsaWNlKGJ1Zl9wb3MpO1xuICAgICAgICAgICAgdmFyIHAgPSBidWYuaW5kZXhPZignXFxuJyk7XG4gICAgICAgICAgICBpZiAocCA9PT0gLTEpIGJyZWFrO1xuICAgICAgICAgICAgYnVmX3BvcyArPSBwKzE7XG4gICAgICAgICAgICB2YXIgbXNnID0gYnVmLnNsaWNlKDAsIHApO1xuICAgICAgICAgICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudCgnbWVzc2FnZScsIHtkYXRhOiBtc2d9KSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoYXQueG8ub25maW5pc2ggPSBmdW5jdGlvbihzdGF0dXMsIHRleHQpIHtcbiAgICAgICAgdGhhdC54by5vbmNodW5rKHN0YXR1cywgdGV4dCk7XG4gICAgICAgIHRoYXQueG8gPSBudWxsO1xuICAgICAgICB2YXIgcmVhc29uID0gc3RhdHVzID09PSAyMDAgPyAnbmV0d29yaycgOiAncGVybWFuZW50JztcbiAgICAgICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudCgnY2xvc2UnLCB7cmVhc29uOiByZWFzb259KSk7XG4gICAgfVxufTtcblxuWGhyUmVjZWl2ZXIucHJvdG90eXBlID0gbmV3IFJFdmVudFRhcmdldCgpO1xuXG5YaHJSZWNlaXZlci5wcm90b3R5cGUuYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQueG8pIHtcbiAgICAgICAgdGhhdC54by5jbG9zZSgpO1xuICAgICAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KCdjbG9zZScsIHtyZWFzb246ICd1c2VyJ30pKTtcbiAgICAgICAgdGhhdC54byA9IG51bGw7XG4gICAgfVxufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtcmVjZWl2ZXIteGhyLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90ZXN0LWhvb2tzLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG4vLyBGb3IgdGVzdGluZ1xuU29ja0pTLmdldFV0aWxzID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gdXRpbHM7XG59O1xuXG5Tb2NrSlMuZ2V0SWZyYW1lVHJhbnNwb3J0ID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gSWZyYW1lVHJhbnNwb3J0O1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdGVzdC1ob29rcy5qc1xuXG4gICAgICAgICAgICAgICAgICByZXR1cm4gU29ja0pTO1xuICAgICAgICAgIH0pKCk7XG5pZiAoJ19zb2NranNfb25sb2FkJyBpbiB3aW5kb3cpIHNldFRpbWVvdXQoX3NvY2tqc19vbmxvYWQsIDEpO1xuXG4vLyBBTUQgY29tcGxpYW5jZVxuaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZSgnc29ja2pzJywgW10sIGZ1bmN0aW9uKCl7cmV0dXJuIFNvY2tKUzt9KTtcbn1cblxuaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gU29ja0pTO1xufVxuLy8gICAgIFsqXSBFbmQgb2YgbGliL2luZGV4LmpzXG5cbi8vIFsqXSBFbmQgb2YgbGliL2FsbC5qc1xuXG4iLCJwbm9kZSA9IHJlcXVpcmUgXCIuLi8uLi9cIlxuXG5wbm9kZS5hZGRUcmFuc3BvcnQgXCJ3c1wiLCByZXF1aXJlIFwiLi90cmFuc3BvcnRzL3dzLmNvZmZlZVwiXG5cbndpbmRvdy5wbm9kZSA9IHBub2RlXG4iLCJzb2NrID0gcmVxdWlyZSAnc2hvZSdcblxuI2N1c3RvbSBwYXJzZSB0byBpbmNsdWRlIHBhdGhcbmV4cG9ydHMucGFyc2UgPSAoc3RyKSAtPlxuICBhcmdzID0gW11cbiAgI3ByZXBlbmQgaHR0cCBpZiBoYXMgc3R1ZmYgYmVmb3JlIHRoZSBzbGFzaFxuICBpZiB0eXBlb2Ygc3RyIGlzICdzdHJpbmcnIGFuZCAvXi4rXFwvLiskLy50ZXN0IHN0clxuICAgIHN0ciA9IFwiaHR0cDovLyN7c3RyfVwiXG4gIHJldHVybiBbc3RyXVxuXG5leHBvcnRzLmJpbmRTZXJ2ZXIgPSAtPlxuICAjIHNlZSAnc3JjL3RyYW5zcG9ydHMvd3MuY29mZmVlJ1xuICB0aHJvdyBcImJpbmQgc2VydmVyIG5vdCBzdXBwb3J0ZWRcIlxuXG5leHBvcnRzLmJpbmRDbGllbnQgPSAoYXJncy4uLikgLT5cbiAgY2xpZW50ID0gQFxuICBjbGllbnQuY3JlYXRlQ29ubmVjdGlvbiAoY2FsbGJhY2spIC0+XG4gICAgY2FsbGJhY2sgc29jay5hcHBseSBudWxsLCBhcmdzIiwidmFyIGRub2RlID0gcmVxdWlyZSgnLi9saWIvZG5vZGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29ucywgb3B0cykge1xuICAgIHJldHVybiBuZXcgZG5vZGUoY29ucywgb3B0cyk7XG59O1xuIiwidmFyIHByb2Nlc3M9cmVxdWlyZShcIl9fYnJvd3NlcmlmeV9wcm9jZXNzXCIpO3ZhciBwcm90b2NvbCA9IHJlcXVpcmUoJ2Rub2RlLXByb3RvY29sJyk7XG52YXIgU3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJyk7XG52YXIganNvbiA9IHR5cGVvZiBKU09OID09PSAnb2JqZWN0JyA/IEpTT04gOiByZXF1aXJlKCdqc29uaWZ5Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZG5vZGU7XG5kbm9kZS5wcm90b3R5cGUgPSB7fTtcbihmdW5jdGlvbiAoKSB7IC8vIGJyb3dzZXJzIGV0Y1xuICAgIGZvciAodmFyIGtleSBpbiBTdHJlYW0ucHJvdG90eXBlKSB7XG4gICAgICAgIGRub2RlLnByb3RvdHlwZVtrZXldID0gU3RyZWFtLnByb3RvdHlwZVtrZXldO1xuICAgIH1cbn0pKCk7XG5cbmZ1bmN0aW9uIGRub2RlIChjb25zLCBvcHRzKSB7XG4gICAgU3RyZWFtLmNhbGwodGhpcyk7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIFxuICAgIHNlbGYub3B0cyA9IG9wdHMgfHwge307XG4gICAgXG4gICAgc2VsZi5jb25zID0gdHlwZW9mIGNvbnMgPT09ICdmdW5jdGlvbidcbiAgICAgICAgPyBjb25zXG4gICAgICAgIDogZnVuY3Rpb24gKCkgeyByZXR1cm4gY29ucyB8fCB7fSB9XG4gICAgO1xuICAgIFxuICAgIHNlbGYucmVhZGFibGUgPSB0cnVlO1xuICAgIHNlbGYud3JpdGFibGUgPSB0cnVlO1xuICAgIFxuICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoc2VsZi5fZW5kZWQpIHJldHVybjtcbiAgICAgICAgc2VsZi5wcm90byA9IHNlbGYuX2NyZWF0ZVByb3RvKCk7XG4gICAgICAgIHNlbGYucHJvdG8uc3RhcnQoKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghc2VsZi5faGFuZGxlUXVldWUpIHJldHVybjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLl9oYW5kbGVRdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc2VsZi5oYW5kbGUoc2VsZi5faGFuZGxlUXVldWVbaV0pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmRub2RlLnByb3RvdHlwZS5fY3JlYXRlUHJvdG8gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBwcm90byA9IHByb3RvY29sKGZ1bmN0aW9uIChyZW1vdGUpIHtcbiAgICAgICAgaWYgKHNlbGYuX2VuZGVkKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICB2YXIgcmVmID0gc2VsZi5jb25zLmNhbGwodGhpcywgcmVtb3RlLCBzZWxmKTtcbiAgICAgICAgaWYgKHR5cGVvZiByZWYgIT09ICdvYmplY3QnKSByZWYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgc2VsZi5lbWl0KCdsb2NhbCcsIHJlZiwgc2VsZik7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gcmVmO1xuICAgIH0sIHNlbGYub3B0cy5wcm90byk7XG4gICAgXG4gICAgcHJvdG8ub24oJ3JlbW90ZScsIGZ1bmN0aW9uIChyZW1vdGUpIHtcbiAgICAgICAgc2VsZi5lbWl0KCdyZW1vdGUnLCByZW1vdGUsIHNlbGYpO1xuICAgICAgICBzZWxmLmVtaXQoJ3JlYWR5Jyk7IC8vIGJhY2t3YXJkcyBjb21wYXRhYmlsaXR5LCBkZXByZWNhdGVkXG4gICAgfSk7XG4gICAgXG4gICAgcHJvdG8ub24oJ3JlcXVlc3QnLCBmdW5jdGlvbiAocmVxKSB7XG4gICAgICAgIGlmICghc2VsZi5yZWFkYWJsZSkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgaWYgKHNlbGYub3B0cy5lbWl0ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgc2VsZi5lbWl0KCdkYXRhJywgcmVxKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHNlbGYuZW1pdCgnZGF0YScsIGpzb24uc3RyaW5naWZ5KHJlcSkgKyAnXFxuJyk7XG4gICAgfSk7XG4gICAgXG4gICAgcHJvdG8ub24oJ2ZhaWwnLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIC8vIGVycm9ycyB0aGF0IHRoZSByZW1vdGUgZW5kIHdhcyByZXNwb25zaWJsZSBmb3JcbiAgICAgICAgc2VsZi5lbWl0KCdmYWlsJywgZXJyKTtcbiAgICB9KTtcbiAgICBcbiAgICBwcm90by5vbignZXJyb3InLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIC8vIGVycm9ycyB0aGF0IHRoZSBsb2NhbCBjb2RlIHdhcyByZXNwb25zaWJsZSBmb3JcbiAgICAgICAgc2VsZi5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgfSk7XG4gICAgXG4gICAgcmV0dXJuIHByb3RvO1xufTtcblxuZG5vZGUucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gKGJ1Zikge1xuICAgIGlmICh0aGlzLl9lbmRlZCkgcmV0dXJuO1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgcm93O1xuICAgIFxuICAgIGlmIChidWYgJiYgdHlwZW9mIGJ1ZiA9PT0gJ29iamVjdCdcbiAgICAmJiBidWYuY29uc3RydWN0b3IgJiYgYnVmLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdCdWZmZXInXG4gICAgJiYgYnVmLmxlbmd0aFxuICAgICYmIHR5cGVvZiBidWYuc2xpY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gdHJlYXQgbGlrZSBhIGJ1ZmZlclxuICAgICAgICBpZiAoIXNlbGYuX2J1ZnMpIHNlbGYuX2J1ZnMgPSBbXTtcbiAgICAgICAgXG4gICAgICAgIC8vIHRyZWF0IGxpa2UgYSBidWZmZXJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBpIDwgYnVmLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoYnVmW2ldID09PSAweDBhKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fYnVmcy5wdXNoKGJ1Zi5zbGljZShqLCBpKSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIGxpbmUgPSAnJztcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IHNlbGYuX2J1ZnMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZSArPSBTdHJpbmcoc2VsZi5fYnVmc1trXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRyeSB7IHJvdyA9IGpzb24ucGFyc2UobGluZSkgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHsgcmV0dXJuIHNlbGYuZW5kKCkgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGogPSBpICsgMTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBzZWxmLmhhbmRsZShyb3cpO1xuICAgICAgICAgICAgICAgIHNlbGYuX2J1ZnMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGogPCBidWYubGVuZ3RoKSBzZWxmLl9idWZzLnB1c2goYnVmLnNsaWNlKGosIGJ1Zi5sZW5ndGgpKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoYnVmICYmIHR5cGVvZiBidWYgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIC8vIC5pc0J1ZmZlcigpIHdpdGhvdXQgdGhlIEJ1ZmZlclxuICAgICAgICAvLyBVc2Ugc2VsZiB0byBwaXBlIEpTT05TdHJlYW0ucGFyc2UoKSBzdHJlYW1zLlxuICAgICAgICBzZWxmLmhhbmRsZShidWYpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBidWYgIT09ICdzdHJpbmcnKSBidWYgPSBTdHJpbmcoYnVmKTtcbiAgICAgICAgaWYgKCFzZWxmLl9saW5lKSBzZWxmLl9saW5lID0gJyc7XG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1Zi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGJ1Zi5jaGFyQ29kZUF0KGkpID09PSAweDBhKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHsgcm93ID0ganNvbi5wYXJzZShzZWxmLl9saW5lKSB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycikgeyByZXR1cm4gc2VsZi5lbmQoKSB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2VsZi5fbGluZSA9ICcnO1xuICAgICAgICAgICAgICAgIHNlbGYuaGFuZGxlKHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHNlbGYuX2xpbmUgKz0gYnVmLmNoYXJBdChpKVxuICAgICAgICB9XG4gICAgfVxufTtcblxuZG5vZGUucHJvdG90eXBlLmhhbmRsZSA9IGZ1bmN0aW9uIChyb3cpIHtcbiAgICBpZiAoIXRoaXMucHJvdG8pIHtcbiAgICAgICAgaWYgKCF0aGlzLl9oYW5kbGVRdWV1ZSkgdGhpcy5faGFuZGxlUXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5faGFuZGxlUXVldWUucHVzaChyb3cpO1xuICAgIH1cbiAgICBlbHNlIHRoaXMucHJvdG8uaGFuZGxlKHJvdyk7XG59O1xuXG5kbm9kZS5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9lbmRlZCkgcmV0dXJuO1xuICAgIHRoaXMuX2VuZGVkID0gdHJ1ZTtcbiAgICB0aGlzLndyaXRhYmxlID0gZmFsc2U7XG4gICAgdGhpcy5yZWFkYWJsZSA9IGZhbHNlO1xuICAgIHRoaXMuZW1pdCgnZW5kJyk7XG59O1xuXG5kbm9kZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmVuZCgpO1xufTtcbiIsInZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XG52YXIgc2NydWJiZXIgPSByZXF1aXJlKCcuL2xpYi9zY3J1YicpO1xudmFyIG9iamVjdEtleXMgPSByZXF1aXJlKCcuL2xpYi9rZXlzJyk7XG52YXIgZm9yRWFjaCA9IHJlcXVpcmUoJy4vbGliL2ZvcmVhY2gnKTtcbnZhciBpc0VudW1lcmFibGUgPSByZXF1aXJlKCcuL2xpYi9pc19lbnVtJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbnMsIG9wdHMpIHtcbiAgICByZXR1cm4gbmV3IFByb3RvKGNvbnMsIG9wdHMpO1xufTtcblxuKGZ1bmN0aW9uICgpIHsgLy8gYnJvd3NlcnMgYmxlaFxuICAgIGZvciAodmFyIGtleSBpbiBFdmVudEVtaXR0ZXIucHJvdG90eXBlKSB7XG4gICAgICAgIFByb3RvLnByb3RvdHlwZVtrZXldID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZVtrZXldO1xuICAgIH1cbn0pKCk7XG5cbmZ1bmN0aW9uIFByb3RvIChjb25zLCBvcHRzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIEV2ZW50RW1pdHRlci5jYWxsKHNlbGYpO1xuICAgIGlmICghb3B0cykgb3B0cyA9IHt9O1xuICAgIFxuICAgIHNlbGYucmVtb3RlID0ge307XG4gICAgc2VsZi5jYWxsYmFja3MgPSB7IGxvY2FsIDogW10sIHJlbW90ZSA6IFtdIH07XG4gICAgc2VsZi53cmFwID0gb3B0cy53cmFwO1xuICAgIHNlbGYudW53cmFwID0gb3B0cy51bndyYXA7XG4gICAgXG4gICAgc2VsZi5zY3J1YmJlciA9IHNjcnViYmVyKHNlbGYuY2FsbGJhY2tzLmxvY2FsKTtcbiAgICBcbiAgICBpZiAodHlwZW9mIGNvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgc2VsZi5pbnN0YW5jZSA9IG5ldyBjb25zKHNlbGYucmVtb3RlLCBzZWxmKTtcbiAgICB9XG4gICAgZWxzZSBzZWxmLmluc3RhbmNlID0gY29ucyB8fCB7fTtcbn1cblxuUHJvdG8ucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucmVxdWVzdCgnbWV0aG9kcycsIFsgdGhpcy5pbnN0YW5jZSBdKTtcbn07XG5cblByb3RvLnByb3RvdHlwZS5jdWxsID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgZGVsZXRlIHRoaXMuY2FsbGJhY2tzLnJlbW90ZVtpZF07XG4gICAgdGhpcy5lbWl0KCdyZXF1ZXN0Jywge1xuICAgICAgICBtZXRob2QgOiAnY3VsbCcsXG4gICAgICAgIGFyZ3VtZW50cyA6IFsgaWQgXVxuICAgIH0pO1xufTtcblxuUHJvdG8ucHJvdG90eXBlLnJlcXVlc3QgPSBmdW5jdGlvbiAobWV0aG9kLCBhcmdzKSB7XG4gICAgdmFyIHNjcnViID0gdGhpcy5zY3J1YmJlci5zY3J1YihhcmdzKTtcbiAgICBcbiAgICB0aGlzLmVtaXQoJ3JlcXVlc3QnLCB7XG4gICAgICAgIG1ldGhvZCA6IG1ldGhvZCxcbiAgICAgICAgYXJndW1lbnRzIDogc2NydWIuYXJndW1lbnRzLFxuICAgICAgICBjYWxsYmFja3MgOiBzY3J1Yi5jYWxsYmFja3MsXG4gICAgICAgIGxpbmtzIDogc2NydWIubGlua3NcbiAgICB9KTtcbn07XG5cblByb3RvLnByb3RvdHlwZS5oYW5kbGUgPSBmdW5jdGlvbiAocmVxKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBhcmdzID0gc2VsZi5zY3J1YmJlci51bnNjcnViKHJlcSwgZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIGlmIChzZWxmLmNhbGxiYWNrcy5yZW1vdGVbaWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhIG5ldyBmdW5jdGlvbiBvbmx5IGlmIG9uZSBoYXNuJ3QgYWxyZWFkeSBiZWVuIGNyZWF0ZWRcbiAgICAgICAgICAgIC8vIGZvciBhIHBhcnRpY3VsYXIgaWRcbiAgICAgICAgICAgIHZhciBjYiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnJlcXVlc3QoaWQsIFtdLnNsaWNlLmFwcGx5KGFyZ3VtZW50cykpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHNlbGYuY2FsbGJhY2tzLnJlbW90ZVtpZF0gPSBzZWxmLndyYXAgPyBzZWxmLndyYXAoY2IsIGlkKSA6IGNiO1xuICAgICAgICAgICAgcmV0dXJuIGNiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZWxmLnVud3JhcFxuICAgICAgICAgICAgPyBzZWxmLnVud3JhcChzZWxmLmNhbGxiYWNrcy5yZW1vdGVbaWRdLCBpZClcbiAgICAgICAgICAgIDogc2VsZi5jYWxsYmFja3MucmVtb3RlW2lkXVxuICAgICAgICA7XG4gICAgfSk7XG4gICAgXG4gICAgaWYgKHJlcS5tZXRob2QgPT09ICdtZXRob2RzJykge1xuICAgICAgICBzZWxmLmhhbmRsZU1ldGhvZHMoYXJnc1swXSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHJlcS5tZXRob2QgPT09ICdjdWxsJykge1xuICAgICAgICBmb3JFYWNoKGFyZ3MsIGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgZGVsZXRlIHNlbGYuY2FsbGJhY2tzLmxvY2FsW2lkXTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiByZXEubWV0aG9kID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAoaXNFbnVtZXJhYmxlKHNlbGYuaW5zdGFuY2UsIHJlcS5tZXRob2QpKSB7XG4gICAgICAgICAgICBzZWxmLmFwcGx5KHNlbGYuaW5zdGFuY2VbcmVxLm1ldGhvZF0sIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5lbWl0KCdmYWlsJywgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICdyZXF1ZXN0IGZvciBub24tZW51bWVyYWJsZSBtZXRob2Q6ICcgKyByZXEubWV0aG9kXG4gICAgICAgICAgICApKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgcmVxLm1ldGhvZCA9PSAnbnVtYmVyJykge1xuICAgICAgICB2YXIgZm4gPSBzZWxmLmNhbGxiYWNrcy5sb2NhbFtyZXEubWV0aG9kXTtcbiAgICAgICAgaWYgKCFmbikge1xuICAgICAgICAgICAgc2VsZi5lbWl0KCdmYWlsJywgbmV3IEVycm9yKCdubyBzdWNoIG1ldGhvZCcpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHNlbGYuYXBwbHkoZm4sIGFyZ3MpO1xuICAgIH1cbn07XG5cblByb3RvLnByb3RvdHlwZS5oYW5kbGVNZXRob2RzID0gZnVuY3Rpb24gKG1ldGhvZHMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHR5cGVvZiBtZXRob2RzICE9ICdvYmplY3QnKSB7XG4gICAgICAgIG1ldGhvZHMgPSB7fTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29weSBzaW5jZSBhc3NpZ25tZW50IGRpc2NhcmRzIHRoZSBwcmV2aW91cyByZWZzXG4gICAgZm9yRWFjaChvYmplY3RLZXlzKHNlbGYucmVtb3RlKSwgZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBkZWxldGUgc2VsZi5yZW1vdGVba2V5XTtcbiAgICB9KTtcbiAgICBcbiAgICBmb3JFYWNoKG9iamVjdEtleXMobWV0aG9kcyksIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgc2VsZi5yZW1vdGVba2V5XSA9IG1ldGhvZHNba2V5XTtcbiAgICB9KTtcbiAgICBcbiAgICBzZWxmLmVtaXQoJ3JlbW90ZScsIHNlbGYucmVtb3RlKTtcbiAgICBzZWxmLmVtaXQoJ3JlYWR5Jyk7XG59O1xuXG5Qcm90by5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbiAoZiwgYXJncykge1xuICAgIHRyeSB7IGYuYXBwbHkodW5kZWZpbmVkLCBhcmdzKSB9XG4gICAgY2F0Y2ggKGVycikgeyB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKSB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmb3JFYWNoICh4cywgZikge1xuICAgIGlmICh4cy5mb3JFYWNoKSByZXR1cm4geHMuZm9yRWFjaChmKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZi5jYWxsKHhzLCB4c1tpXSwgaSk7XG4gICAgfVxufVxuIiwidmFyIG9iamVjdEtleXMgPSByZXF1aXJlKCcuL2tleXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqLCBrZXkpIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZSkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iaiwga2V5KTtcbiAgICB9XG4gICAgdmFyIGtleXMgPSBvYmplY3RLZXlzKG9iaik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChrZXkgPT09IGtleXNbaV0pIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBrZXlzLnB1c2goa2V5KTtcbiAgICByZXR1cm4ga2V5cztcbn07XG4iLCJ2YXIgdHJhdmVyc2UgPSByZXF1aXJlKCd0cmF2ZXJzZScpO1xudmFyIG9iamVjdEtleXMgPSByZXF1aXJlKCcuL2tleXMnKTtcbnZhciBmb3JFYWNoID0gcmVxdWlyZSgnLi9mb3JlYWNoJyk7XG5cbmZ1bmN0aW9uIGluZGV4T2YgKHhzLCB4KSB7XG4gICAgaWYgKHhzLmluZGV4T2YpIHJldHVybiB4cy5pbmRleE9mKHgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIGlmICh4c1tpXSA9PT0geCkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xufVxuXG4vLyBzY3J1YiBjYWxsYmFja3Mgb3V0IG9mIHJlcXVlc3RzIGluIG9yZGVyIHRvIGNhbGwgdGhlbSBhZ2FpbiBsYXRlclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY2FsbGJhY2tzKSB7XG4gICAgcmV0dXJuIG5ldyBTY3J1YmJlcihjYWxsYmFja3MpO1xufTtcblxuZnVuY3Rpb24gU2NydWJiZXIgKGNhbGxiYWNrcykge1xuICAgIHRoaXMuY2FsbGJhY2tzID0gY2FsbGJhY2tzO1xufVxuXG4vLyBUYWtlIHRoZSBmdW5jdGlvbnMgb3V0IGFuZCBub3RlIHRoZW0gZm9yIGZ1dHVyZSB1c2VcblNjcnViYmVyLnByb3RvdHlwZS5zY3J1YiA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHBhdGhzID0ge307XG4gICAgdmFyIGxpbmtzID0gW107XG4gICAgXG4gICAgdmFyIGFyZ3MgPSB0cmF2ZXJzZShvYmopLm1hcChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICBpZiAodHlwZW9mIG5vZGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHZhciBpID0gaW5kZXhPZihzZWxmLmNhbGxiYWNrcywgbm9kZSk7XG4gICAgICAgICAgICBpZiAoaSA+PSAwICYmICEoaSBpbiBwYXRocykpIHtcbiAgICAgICAgICAgICAgICAvLyBLZWVwIHByZXZpb3VzIGZ1bmN0aW9uIElEcyBvbmx5IGZvciB0aGUgZmlyc3QgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICAvLyBmb3VuZC4gVGhpcyBpcyBzb21ld2hhdCBzdWJvcHRpbWFsIGJ1dCB0aGUgYWx0ZXJuYXRpdmVzXG4gICAgICAgICAgICAgICAgLy8gYXJlIHdvcnNlLlxuICAgICAgICAgICAgICAgIHBhdGhzW2ldID0gdGhpcy5wYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGlkID0gc2VsZi5jYWxsYmFja3MubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHNlbGYuY2FsbGJhY2tzLnB1c2gobm9kZSk7XG4gICAgICAgICAgICAgICAgcGF0aHNbaWRdID0gdGhpcy5wYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSgnW0Z1bmN0aW9uXScpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuY2lyY3VsYXIpIHtcbiAgICAgICAgICAgIGxpbmtzLnB1c2goeyBmcm9tIDogdGhpcy5jaXJjdWxhci5wYXRoLCB0byA6IHRoaXMucGF0aCB9KTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlKCdbQ2lyY3VsYXJdJyk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgICBhcmd1bWVudHMgOiBhcmdzLFxuICAgICAgICBjYWxsYmFja3MgOiBwYXRocyxcbiAgICAgICAgbGlua3MgOiBsaW5rc1xuICAgIH07XG59O1xuIFxuLy8gUmVwbGFjZSBjYWxsYmFja3MuIFRoZSBzdXBwbGllZCBmdW5jdGlvbiBzaG91bGQgdGFrZSBhIGNhbGxiYWNrIGlkIGFuZFxuLy8gcmV0dXJuIGEgY2FsbGJhY2sgb2YgaXRzIG93bi5cblNjcnViYmVyLnByb3RvdHlwZS51bnNjcnViID0gZnVuY3Rpb24gKG1zZywgZikge1xuICAgIHZhciBhcmdzID0gbXNnLmFyZ3VtZW50cyB8fCBbXTtcbiAgICBmb3JFYWNoKG9iamVjdEtleXMobXNnLmNhbGxiYWNrcyB8fCB7fSksIGZ1bmN0aW9uIChzaWQpIHtcbiAgICAgICAgdmFyIGlkID0gcGFyc2VJbnQoc2lkLCAxMCk7XG4gICAgICAgIHZhciBwYXRoID0gbXNnLmNhbGxiYWNrc1tpZF07XG4gICAgICAgIHRyYXZlcnNlLnNldChhcmdzLCBwYXRoLCBmKGlkKSk7XG4gICAgfSk7XG4gICAgXG4gICAgZm9yRWFjaChtc2cubGlua3MgfHwgW10sIGZ1bmN0aW9uIChsaW5rKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IHRyYXZlcnNlLmdldChhcmdzLCBsaW5rLmZyb20pO1xuICAgICAgICB0cmF2ZXJzZS5zZXQoYXJncywgbGluay50bywgdmFsdWUpO1xuICAgIH0pO1xuICAgIFxuICAgIHJldHVybiBhcmdzO1xufTtcbiIsInZhciB0cmF2ZXJzZSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiBuZXcgVHJhdmVyc2Uob2JqKTtcbn07XG5cbmZ1bmN0aW9uIFRyYXZlcnNlIChvYmopIHtcbiAgICB0aGlzLnZhbHVlID0gb2JqO1xufVxuXG5UcmF2ZXJzZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKHBzKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLnZhbHVlO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHMubGVuZ3RoOyBpICsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBwc1tpXTtcbiAgICAgICAgaWYgKCFPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChub2RlLCBrZXkpKSB7XG4gICAgICAgICAgICBub2RlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGVba2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG59O1xuXG5UcmF2ZXJzZS5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24gKHBzKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLnZhbHVlO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHMubGVuZ3RoOyBpICsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBwc1tpXTtcbiAgICAgICAgaWYgKCFPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChub2RlLCBrZXkpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGVba2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5UcmF2ZXJzZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHBzLCB2YWx1ZSkge1xuICAgIHZhciBub2RlID0gdGhpcy52YWx1ZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBzLmxlbmd0aCAtIDE7IGkgKyspIHtcbiAgICAgICAgdmFyIGtleSA9IHBzW2ldO1xuICAgICAgICBpZiAoIU9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKG5vZGUsIGtleSkpIG5vZGVba2V5XSA9IHt9O1xuICAgICAgICBub2RlID0gbm9kZVtrZXldO1xuICAgIH1cbiAgICBub2RlW3BzW2ldXSA9IHZhbHVlO1xuICAgIHJldHVybiB2YWx1ZTtcbn07XG5cblRyYXZlcnNlLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICByZXR1cm4gd2Fsayh0aGlzLnZhbHVlLCBjYiwgdHJ1ZSk7XG59O1xuXG5UcmF2ZXJzZS5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChjYikge1xuICAgIHRoaXMudmFsdWUgPSB3YWxrKHRoaXMudmFsdWUsIGNiLCBmYWxzZSk7XG4gICAgcmV0dXJuIHRoaXMudmFsdWU7XG59O1xuXG5UcmF2ZXJzZS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKGNiLCBpbml0KSB7XG4gICAgdmFyIHNraXAgPSBhcmd1bWVudHMubGVuZ3RoID09PSAxO1xuICAgIHZhciBhY2MgPSBza2lwID8gdGhpcy52YWx1ZSA6IGluaXQ7XG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICghdGhpcy5pc1Jvb3QgfHwgIXNraXApIHtcbiAgICAgICAgICAgIGFjYyA9IGNiLmNhbGwodGhpcywgYWNjLCB4KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBhY2M7XG59O1xuXG5UcmF2ZXJzZS5wcm90b3R5cGUucGF0aHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFjYyA9IFtdO1xuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoeCkge1xuICAgICAgICBhY2MucHVzaCh0aGlzLnBhdGgpOyBcbiAgICB9KTtcbiAgICByZXR1cm4gYWNjO1xufTtcblxuVHJhdmVyc2UucHJvdG90eXBlLm5vZGVzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhY2MgPSBbXTtcbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgYWNjLnB1c2godGhpcy5ub2RlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gYWNjO1xufTtcblxuVHJhdmVyc2UucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBwYXJlbnRzID0gW10sIG5vZGVzID0gW107XG4gICAgXG4gICAgcmV0dXJuIChmdW5jdGlvbiBjbG9uZSAoc3JjKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHBhcmVudHNbaV0gPT09IHNyYykge1xuICAgICAgICAgICAgICAgIHJldHVybiBub2Rlc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBzcmMgPT09ICdvYmplY3QnICYmIHNyYyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGRzdCA9IGNvcHkoc3JjKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcGFyZW50cy5wdXNoKHNyYyk7XG4gICAgICAgICAgICBub2Rlcy5wdXNoKGRzdCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvckVhY2gob2JqZWN0S2V5cyhzcmMpLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgZHN0W2tleV0gPSBjbG9uZShzcmNba2V5XSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcGFyZW50cy5wb3AoKTtcbiAgICAgICAgICAgIG5vZGVzLnBvcCgpO1xuICAgICAgICAgICAgcmV0dXJuIGRzdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBzcmM7XG4gICAgICAgIH1cbiAgICB9KSh0aGlzLnZhbHVlKTtcbn07XG5cbmZ1bmN0aW9uIHdhbGsgKHJvb3QsIGNiLCBpbW11dGFibGUpIHtcbiAgICB2YXIgcGF0aCA9IFtdO1xuICAgIHZhciBwYXJlbnRzID0gW107XG4gICAgdmFyIGFsaXZlID0gdHJ1ZTtcbiAgICBcbiAgICByZXR1cm4gKGZ1bmN0aW9uIHdhbGtlciAobm9kZV8pIHtcbiAgICAgICAgdmFyIG5vZGUgPSBpbW11dGFibGUgPyBjb3B5KG5vZGVfKSA6IG5vZGVfO1xuICAgICAgICB2YXIgbW9kaWZpZXJzID0ge307XG4gICAgICAgIFxuICAgICAgICB2YXIga2VlcEdvaW5nID0gdHJ1ZTtcbiAgICAgICAgXG4gICAgICAgIHZhciBzdGF0ZSA9IHtcbiAgICAgICAgICAgIG5vZGUgOiBub2RlLFxuICAgICAgICAgICAgbm9kZV8gOiBub2RlXyxcbiAgICAgICAgICAgIHBhdGggOiBbXS5jb25jYXQocGF0aCksXG4gICAgICAgICAgICBwYXJlbnQgOiBwYXJlbnRzW3BhcmVudHMubGVuZ3RoIC0gMV0sXG4gICAgICAgICAgICBwYXJlbnRzIDogcGFyZW50cyxcbiAgICAgICAgICAgIGtleSA6IHBhdGguc2xpY2UoLTEpWzBdLFxuICAgICAgICAgICAgaXNSb290IDogcGF0aC5sZW5ndGggPT09IDAsXG4gICAgICAgICAgICBsZXZlbCA6IHBhdGgubGVuZ3RoLFxuICAgICAgICAgICAgY2lyY3VsYXIgOiBudWxsLFxuICAgICAgICAgICAgdXBkYXRlIDogZnVuY3Rpb24gKHgsIHN0b3BIZXJlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzdGF0ZS5pc1Jvb3QpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUucGFyZW50Lm5vZGVbc3RhdGUua2V5XSA9IHg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN0YXRlLm5vZGUgPSB4O1xuICAgICAgICAgICAgICAgIGlmIChzdG9wSGVyZSkga2VlcEdvaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ2RlbGV0ZScgOiBmdW5jdGlvbiAoc3RvcEhlcmUpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgc3RhdGUucGFyZW50Lm5vZGVbc3RhdGUua2V5XTtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcEhlcmUpIGtlZXBHb2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlbW92ZSA6IGZ1bmN0aW9uIChzdG9wSGVyZSkge1xuICAgICAgICAgICAgICAgIGlmIChpc0FycmF5KHN0YXRlLnBhcmVudC5ub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5wYXJlbnQubm9kZS5zcGxpY2Uoc3RhdGUua2V5LCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBzdGF0ZS5wYXJlbnQubm9kZVtzdGF0ZS5rZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3RvcEhlcmUpIGtlZXBHb2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGtleXMgOiBudWxsLFxuICAgICAgICAgICAgYmVmb3JlIDogZnVuY3Rpb24gKGYpIHsgbW9kaWZpZXJzLmJlZm9yZSA9IGYgfSxcbiAgICAgICAgICAgIGFmdGVyIDogZnVuY3Rpb24gKGYpIHsgbW9kaWZpZXJzLmFmdGVyID0gZiB9LFxuICAgICAgICAgICAgcHJlIDogZnVuY3Rpb24gKGYpIHsgbW9kaWZpZXJzLnByZSA9IGYgfSxcbiAgICAgICAgICAgIHBvc3QgOiBmdW5jdGlvbiAoZikgeyBtb2RpZmllcnMucG9zdCA9IGYgfSxcbiAgICAgICAgICAgIHN0b3AgOiBmdW5jdGlvbiAoKSB7IGFsaXZlID0gZmFsc2UgfSxcbiAgICAgICAgICAgIGJsb2NrIDogZnVuY3Rpb24gKCkgeyBrZWVwR29pbmcgPSBmYWxzZSB9XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBpZiAoIWFsaXZlKSByZXR1cm4gc3RhdGU7XG4gICAgICAgIFxuICAgICAgICBmdW5jdGlvbiB1cGRhdGVTdGF0ZSgpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhdGUubm9kZSA9PT0gJ29iamVjdCcgJiYgc3RhdGUubm9kZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmICghc3RhdGUua2V5cyB8fCBzdGF0ZS5ub2RlXyAhPT0gc3RhdGUubm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5rZXlzID0gb2JqZWN0S2V5cyhzdGF0ZS5ub2RlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBzdGF0ZS5pc0xlYWYgPSBzdGF0ZS5rZXlzLmxlbmd0aCA9PSAwO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50c1tpXS5ub2RlXyA9PT0gbm9kZV8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLmNpcmN1bGFyID0gcGFyZW50c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhdGUuaXNMZWFmID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzdGF0ZS5rZXlzID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3RhdGUubm90TGVhZiA9ICFzdGF0ZS5pc0xlYWY7XG4gICAgICAgICAgICBzdGF0ZS5ub3RSb290ID0gIXN0YXRlLmlzUm9vdDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdXBkYXRlU3RhdGUoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHVzZSByZXR1cm4gdmFsdWVzIHRvIHVwZGF0ZSBpZiBkZWZpbmVkXG4gICAgICAgIHZhciByZXQgPSBjYi5jYWxsKHN0YXRlLCBzdGF0ZS5ub2RlKTtcbiAgICAgICAgaWYgKHJldCAhPT0gdW5kZWZpbmVkICYmIHN0YXRlLnVwZGF0ZSkgc3RhdGUudXBkYXRlKHJldCk7XG4gICAgICAgIFxuICAgICAgICBpZiAobW9kaWZpZXJzLmJlZm9yZSkgbW9kaWZpZXJzLmJlZm9yZS5jYWxsKHN0YXRlLCBzdGF0ZS5ub2RlKTtcbiAgICAgICAgXG4gICAgICAgIGlmICgha2VlcEdvaW5nKSByZXR1cm4gc3RhdGU7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIHN0YXRlLm5vZGUgPT0gJ29iamVjdCdcbiAgICAgICAgJiYgc3RhdGUubm9kZSAhPT0gbnVsbCAmJiAhc3RhdGUuY2lyY3VsYXIpIHtcbiAgICAgICAgICAgIHBhcmVudHMucHVzaChzdGF0ZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHVwZGF0ZVN0YXRlKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvckVhY2goc3RhdGUua2V5cywgZnVuY3Rpb24gKGtleSwgaSkge1xuICAgICAgICAgICAgICAgIHBhdGgucHVzaChrZXkpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChtb2RpZmllcnMucHJlKSBtb2RpZmllcnMucHJlLmNhbGwoc3RhdGUsIHN0YXRlLm5vZGVba2V5XSwga2V5KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSB3YWxrZXIoc3RhdGUubm9kZVtrZXldKTtcbiAgICAgICAgICAgICAgICBpZiAoaW1tdXRhYmxlICYmIE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKHN0YXRlLm5vZGUsIGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUubm9kZVtrZXldID0gY2hpbGQubm9kZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2hpbGQuaXNMYXN0ID0gaSA9PSBzdGF0ZS5rZXlzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgY2hpbGQuaXNGaXJzdCA9IGkgPT0gMDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAobW9kaWZpZXJzLnBvc3QpIG1vZGlmaWVycy5wb3N0LmNhbGwoc3RhdGUsIGNoaWxkKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBwYXRoLnBvcCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBwYXJlbnRzLnBvcCgpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAobW9kaWZpZXJzLmFmdGVyKSBtb2RpZmllcnMuYWZ0ZXIuY2FsbChzdGF0ZSwgc3RhdGUubm9kZSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSkocm9vdCkubm9kZTtcbn1cblxuZnVuY3Rpb24gY29weSAoc3JjKSB7XG4gICAgaWYgKHR5cGVvZiBzcmMgPT09ICdvYmplY3QnICYmIHNyYyAhPT0gbnVsbCkge1xuICAgICAgICB2YXIgZHN0O1xuICAgICAgICBcbiAgICAgICAgaWYgKGlzQXJyYXkoc3JjKSkge1xuICAgICAgICAgICAgZHN0ID0gW107XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNEYXRlKHNyYykpIHtcbiAgICAgICAgICAgIGRzdCA9IG5ldyBEYXRlKHNyYyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNSZWdFeHAoc3JjKSkge1xuICAgICAgICAgICAgZHN0ID0gbmV3IFJlZ0V4cChzcmMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzRXJyb3Ioc3JjKSkge1xuICAgICAgICAgICAgZHN0ID0geyBtZXNzYWdlOiBzcmMubWVzc2FnZSB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzQm9vbGVhbihzcmMpKSB7XG4gICAgICAgICAgICBkc3QgPSBuZXcgQm9vbGVhbihzcmMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzTnVtYmVyKHNyYykpIHtcbiAgICAgICAgICAgIGRzdCA9IG5ldyBOdW1iZXIoc3JjKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc1N0cmluZyhzcmMpKSB7XG4gICAgICAgICAgICBkc3QgPSBuZXcgU3RyaW5nKHNyYyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoT2JqZWN0LmNyZWF0ZSAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YpIHtcbiAgICAgICAgICAgIGRzdCA9IE9iamVjdC5jcmVhdGUoT2JqZWN0LmdldFByb3RvdHlwZU9mKHNyYykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNyYy5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0KSB7XG4gICAgICAgICAgICBkc3QgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBwcm90byA9XG4gICAgICAgICAgICAgICAgKHNyYy5jb25zdHJ1Y3RvciAmJiBzcmMuY29uc3RydWN0b3IucHJvdG90eXBlKVxuICAgICAgICAgICAgICAgIHx8IHNyYy5fX3Byb3RvX19cbiAgICAgICAgICAgICAgICB8fCB7fVxuICAgICAgICAgICAgO1xuICAgICAgICAgICAgdmFyIFQgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgICAgIFQucHJvdG90eXBlID0gcHJvdG87XG4gICAgICAgICAgICBkc3QgPSBuZXcgVDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yRWFjaChvYmplY3RLZXlzKHNyYyksIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIGRzdFtrZXldID0gc3JjW2tleV07XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZHN0O1xuICAgIH1cbiAgICBlbHNlIHJldHVybiBzcmM7XG59XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24ga2V5cyAob2JqKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHJlcy5wdXNoKGtleSlcbiAgICByZXR1cm4gcmVzO1xufTtcblxuZnVuY3Rpb24gdG9TIChvYmopIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopIH1cbmZ1bmN0aW9uIGlzRGF0ZSAob2JqKSB7IHJldHVybiB0b1Mob2JqKSA9PT0gJ1tvYmplY3QgRGF0ZV0nIH1cbmZ1bmN0aW9uIGlzUmVnRXhwIChvYmopIHsgcmV0dXJuIHRvUyhvYmopID09PSAnW29iamVjdCBSZWdFeHBdJyB9XG5mdW5jdGlvbiBpc0Vycm9yIChvYmopIHsgcmV0dXJuIHRvUyhvYmopID09PSAnW29iamVjdCBFcnJvcl0nIH1cbmZ1bmN0aW9uIGlzQm9vbGVhbiAob2JqKSB7IHJldHVybiB0b1Mob2JqKSA9PT0gJ1tvYmplY3QgQm9vbGVhbl0nIH1cbmZ1bmN0aW9uIGlzTnVtYmVyIChvYmopIHsgcmV0dXJuIHRvUyhvYmopID09PSAnW29iamVjdCBOdW1iZXJdJyB9XG5mdW5jdGlvbiBpc1N0cmluZyAob2JqKSB7IHJldHVybiB0b1Mob2JqKSA9PT0gJ1tvYmplY3QgU3RyaW5nXScgfVxuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gaXNBcnJheSAoeHMpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbnZhciBmb3JFYWNoID0gZnVuY3Rpb24gKHhzLCBmbikge1xuICAgIGlmICh4cy5mb3JFYWNoKSByZXR1cm4geHMuZm9yRWFjaChmbilcbiAgICBlbHNlIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZm4oeHNbaV0sIGksIHhzKTtcbiAgICB9XG59O1xuXG5mb3JFYWNoKG9iamVjdEtleXMoVHJhdmVyc2UucHJvdG90eXBlKSwgZnVuY3Rpb24gKGtleSkge1xuICAgIHRyYXZlcnNlW2tleV0gPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICB2YXIgdCA9IG5ldyBUcmF2ZXJzZShvYmopO1xuICAgICAgICByZXR1cm4gdFtrZXldLmFwcGx5KHQsIGFyZ3MpO1xuICAgIH07XG59KTtcbiIsImV4cG9ydHMucGFyc2UgPSByZXF1aXJlKCcuL2xpYi9wYXJzZScpO1xuZXhwb3J0cy5zdHJpbmdpZnkgPSByZXF1aXJlKCcuL2xpYi9zdHJpbmdpZnknKTtcbiIsInZhciBhdCwgLy8gVGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGNoYXJhY3RlclxuICAgIGNoLCAvLyBUaGUgY3VycmVudCBjaGFyYWN0ZXJcbiAgICBlc2NhcGVlID0ge1xuICAgICAgICAnXCInOiAgJ1wiJyxcbiAgICAgICAgJ1xcXFwnOiAnXFxcXCcsXG4gICAgICAgICcvJzogICcvJyxcbiAgICAgICAgYjogICAgJ1xcYicsXG4gICAgICAgIGY6ICAgICdcXGYnLFxuICAgICAgICBuOiAgICAnXFxuJyxcbiAgICAgICAgcjogICAgJ1xccicsXG4gICAgICAgIHQ6ICAgICdcXHQnXG4gICAgfSxcbiAgICB0ZXh0LFxuXG4gICAgZXJyb3IgPSBmdW5jdGlvbiAobSkge1xuICAgICAgICAvLyBDYWxsIGVycm9yIHdoZW4gc29tZXRoaW5nIGlzIHdyb25nLlxuICAgICAgICB0aHJvdyB7XG4gICAgICAgICAgICBuYW1lOiAgICAnU3ludGF4RXJyb3InLFxuICAgICAgICAgICAgbWVzc2FnZTogbSxcbiAgICAgICAgICAgIGF0OiAgICAgIGF0LFxuICAgICAgICAgICAgdGV4dDogICAgdGV4dFxuICAgICAgICB9O1xuICAgIH0sXG4gICAgXG4gICAgbmV4dCA9IGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIC8vIElmIGEgYyBwYXJhbWV0ZXIgaXMgcHJvdmlkZWQsIHZlcmlmeSB0aGF0IGl0IG1hdGNoZXMgdGhlIGN1cnJlbnQgY2hhcmFjdGVyLlxuICAgICAgICBpZiAoYyAmJiBjICE9PSBjaCkge1xuICAgICAgICAgICAgZXJyb3IoXCJFeHBlY3RlZCAnXCIgKyBjICsgXCInIGluc3RlYWQgb2YgJ1wiICsgY2ggKyBcIidcIik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEdldCB0aGUgbmV4dCBjaGFyYWN0ZXIuIFdoZW4gdGhlcmUgYXJlIG5vIG1vcmUgY2hhcmFjdGVycyxcbiAgICAgICAgLy8gcmV0dXJuIHRoZSBlbXB0eSBzdHJpbmcuXG4gICAgICAgIFxuICAgICAgICBjaCA9IHRleHQuY2hhckF0KGF0KTtcbiAgICAgICAgYXQgKz0gMTtcbiAgICAgICAgcmV0dXJuIGNoO1xuICAgIH0sXG4gICAgXG4gICAgbnVtYmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBQYXJzZSBhIG51bWJlciB2YWx1ZS5cbiAgICAgICAgdmFyIG51bWJlcixcbiAgICAgICAgICAgIHN0cmluZyA9ICcnO1xuICAgICAgICBcbiAgICAgICAgaWYgKGNoID09PSAnLScpIHtcbiAgICAgICAgICAgIHN0cmluZyA9ICctJztcbiAgICAgICAgICAgIG5leHQoJy0nKTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoY2ggPj0gJzAnICYmIGNoIDw9ICc5Jykge1xuICAgICAgICAgICAgc3RyaW5nICs9IGNoO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaCA9PT0gJy4nKSB7XG4gICAgICAgICAgICBzdHJpbmcgKz0gJy4nO1xuICAgICAgICAgICAgd2hpbGUgKG5leHQoKSAmJiBjaCA+PSAnMCcgJiYgY2ggPD0gJzknKSB7XG4gICAgICAgICAgICAgICAgc3RyaW5nICs9IGNoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChjaCA9PT0gJ2UnIHx8IGNoID09PSAnRScpIHtcbiAgICAgICAgICAgIHN0cmluZyArPSBjaDtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgIGlmIChjaCA9PT0gJy0nIHx8IGNoID09PSAnKycpIHtcbiAgICAgICAgICAgICAgICBzdHJpbmcgKz0gY2g7XG4gICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2hpbGUgKGNoID49ICcwJyAmJiBjaCA8PSAnOScpIHtcbiAgICAgICAgICAgICAgICBzdHJpbmcgKz0gY2g7XG4gICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG51bWJlciA9ICtzdHJpbmc7XG4gICAgICAgIGlmICghaXNGaW5pdGUobnVtYmVyKSkge1xuICAgICAgICAgICAgZXJyb3IoXCJCYWQgbnVtYmVyXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bWJlcjtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgc3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBQYXJzZSBhIHN0cmluZyB2YWx1ZS5cbiAgICAgICAgdmFyIGhleCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBzdHJpbmcgPSAnJyxcbiAgICAgICAgICAgIHVmZmZmO1xuICAgICAgICBcbiAgICAgICAgLy8gV2hlbiBwYXJzaW5nIGZvciBzdHJpbmcgdmFsdWVzLCB3ZSBtdXN0IGxvb2sgZm9yIFwiIGFuZCBcXCBjaGFyYWN0ZXJzLlxuICAgICAgICBpZiAoY2ggPT09ICdcIicpIHtcbiAgICAgICAgICAgIHdoaWxlIChuZXh0KCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICdcIicpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RyaW5nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICdcXFxcJykge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ3UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1ZmZmZiA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGV4ID0gcGFyc2VJbnQobmV4dCgpLCAxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZShoZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1ZmZmZiA9IHVmZmZmICogMTYgKyBoZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSh1ZmZmZik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVzY2FwZWVbY2hdID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nICs9IGVzY2FwZWVbY2hdO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdHJpbmcgKz0gY2g7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVycm9yKFwiQmFkIHN0cmluZ1wiKTtcbiAgICB9LFxuXG4gICAgd2hpdGUgPSBmdW5jdGlvbiAoKSB7XG5cbi8vIFNraXAgd2hpdGVzcGFjZS5cblxuICAgICAgICB3aGlsZSAoY2ggJiYgY2ggPD0gJyAnKSB7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgd29yZCA9IGZ1bmN0aW9uICgpIHtcblxuLy8gdHJ1ZSwgZmFsc2UsIG9yIG51bGwuXG5cbiAgICAgICAgc3dpdGNoIChjaCkge1xuICAgICAgICBjYXNlICd0JzpcbiAgICAgICAgICAgIG5leHQoJ3QnKTtcbiAgICAgICAgICAgIG5leHQoJ3InKTtcbiAgICAgICAgICAgIG5leHQoJ3UnKTtcbiAgICAgICAgICAgIG5leHQoJ2UnKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBjYXNlICdmJzpcbiAgICAgICAgICAgIG5leHQoJ2YnKTtcbiAgICAgICAgICAgIG5leHQoJ2EnKTtcbiAgICAgICAgICAgIG5leHQoJ2wnKTtcbiAgICAgICAgICAgIG5leHQoJ3MnKTtcbiAgICAgICAgICAgIG5leHQoJ2UnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgY2FzZSAnbic6XG4gICAgICAgICAgICBuZXh0KCduJyk7XG4gICAgICAgICAgICBuZXh0KCd1Jyk7XG4gICAgICAgICAgICBuZXh0KCdsJyk7XG4gICAgICAgICAgICBuZXh0KCdsJyk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBlcnJvcihcIlVuZXhwZWN0ZWQgJ1wiICsgY2ggKyBcIidcIik7XG4gICAgfSxcblxuICAgIHZhbHVlLCAgLy8gUGxhY2UgaG9sZGVyIGZvciB0aGUgdmFsdWUgZnVuY3Rpb24uXG5cbiAgICBhcnJheSA9IGZ1bmN0aW9uICgpIHtcblxuLy8gUGFyc2UgYW4gYXJyYXkgdmFsdWUuXG5cbiAgICAgICAgdmFyIGFycmF5ID0gW107XG5cbiAgICAgICAgaWYgKGNoID09PSAnWycpIHtcbiAgICAgICAgICAgIG5leHQoJ1snKTtcbiAgICAgICAgICAgIHdoaXRlKCk7XG4gICAgICAgICAgICBpZiAoY2ggPT09ICddJykge1xuICAgICAgICAgICAgICAgIG5leHQoJ10nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyYXk7ICAgLy8gZW1wdHkgYXJyYXlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlIChjaCkge1xuICAgICAgICAgICAgICAgIGFycmF5LnB1c2godmFsdWUoKSk7XG4gICAgICAgICAgICAgICAgd2hpdGUoKTtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICddJykge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCddJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcnJheTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmV4dCgnLCcpO1xuICAgICAgICAgICAgICAgIHdoaXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3IoXCJCYWQgYXJyYXlcIik7XG4gICAgfSxcblxuICAgIG9iamVjdCA9IGZ1bmN0aW9uICgpIHtcblxuLy8gUGFyc2UgYW4gb2JqZWN0IHZhbHVlLlxuXG4gICAgICAgIHZhciBrZXksXG4gICAgICAgICAgICBvYmplY3QgPSB7fTtcblxuICAgICAgICBpZiAoY2ggPT09ICd7Jykge1xuICAgICAgICAgICAgbmV4dCgneycpO1xuICAgICAgICAgICAgd2hpdGUoKTtcbiAgICAgICAgICAgIGlmIChjaCA9PT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgbmV4dCgnfScpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3Q7ICAgLy8gZW1wdHkgb2JqZWN0XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aGlsZSAoY2gpIHtcbiAgICAgICAgICAgICAgICBrZXkgPSBzdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB3aGl0ZSgpO1xuICAgICAgICAgICAgICAgIG5leHQoJzonKTtcbiAgICAgICAgICAgICAgICBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yKCdEdXBsaWNhdGUga2V5IFwiJyArIGtleSArICdcIicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IHZhbHVlKCk7XG4gICAgICAgICAgICAgICAgd2hpdGUoKTtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICd9Jykge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5leHQoJywnKTtcbiAgICAgICAgICAgICAgICB3aGl0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVycm9yKFwiQmFkIG9iamVjdFwiKTtcbiAgICB9O1xuXG52YWx1ZSA9IGZ1bmN0aW9uICgpIHtcblxuLy8gUGFyc2UgYSBKU09OIHZhbHVlLiBJdCBjb3VsZCBiZSBhbiBvYmplY3QsIGFuIGFycmF5LCBhIHN0cmluZywgYSBudW1iZXIsXG4vLyBvciBhIHdvcmQuXG5cbiAgICB3aGl0ZSgpO1xuICAgIHN3aXRjaCAoY2gpIHtcbiAgICBjYXNlICd7JzpcbiAgICAgICAgcmV0dXJuIG9iamVjdCgpO1xuICAgIGNhc2UgJ1snOlxuICAgICAgICByZXR1cm4gYXJyYXkoKTtcbiAgICBjYXNlICdcIic6XG4gICAgICAgIHJldHVybiBzdHJpbmcoKTtcbiAgICBjYXNlICctJzpcbiAgICAgICAgcmV0dXJuIG51bWJlcigpO1xuICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBjaCA+PSAnMCcgJiYgY2ggPD0gJzknID8gbnVtYmVyKCkgOiB3b3JkKCk7XG4gICAgfVxufTtcblxuLy8gUmV0dXJuIHRoZSBqc29uX3BhcnNlIGZ1bmN0aW9uLiBJdCB3aWxsIGhhdmUgYWNjZXNzIHRvIGFsbCBvZiB0aGUgYWJvdmVcbi8vIGZ1bmN0aW9ucyBhbmQgdmFyaWFibGVzLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzb3VyY2UsIHJldml2ZXIpIHtcbiAgICB2YXIgcmVzdWx0O1xuICAgIFxuICAgIHRleHQgPSBzb3VyY2U7XG4gICAgYXQgPSAwO1xuICAgIGNoID0gJyAnO1xuICAgIHJlc3VsdCA9IHZhbHVlKCk7XG4gICAgd2hpdGUoKTtcbiAgICBpZiAoY2gpIHtcbiAgICAgICAgZXJyb3IoXCJTeW50YXggZXJyb3JcIik7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgaXMgYSByZXZpdmVyIGZ1bmN0aW9uLCB3ZSByZWN1cnNpdmVseSB3YWxrIHRoZSBuZXcgc3RydWN0dXJlLFxuICAgIC8vIHBhc3NpbmcgZWFjaCBuYW1lL3ZhbHVlIHBhaXIgdG8gdGhlIHJldml2ZXIgZnVuY3Rpb24gZm9yIHBvc3NpYmxlXG4gICAgLy8gdHJhbnNmb3JtYXRpb24sIHN0YXJ0aW5nIHdpdGggYSB0ZW1wb3Jhcnkgcm9vdCBvYmplY3QgdGhhdCBob2xkcyB0aGUgcmVzdWx0XG4gICAgLy8gaW4gYW4gZW1wdHkga2V5LiBJZiB0aGVyZSBpcyBub3QgYSByZXZpdmVyIGZ1bmN0aW9uLCB3ZSBzaW1wbHkgcmV0dXJuIHRoZVxuICAgIC8vIHJlc3VsdC5cblxuICAgIHJldHVybiB0eXBlb2YgcmV2aXZlciA9PT0gJ2Z1bmN0aW9uJyA/IChmdW5jdGlvbiB3YWxrKGhvbGRlciwga2V5KSB7XG4gICAgICAgIHZhciBrLCB2LCB2YWx1ZSA9IGhvbGRlcltrZXldO1xuICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZm9yIChrIGluIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgaykpIHtcbiAgICAgICAgICAgICAgICAgICAgdiA9IHdhbGsodmFsdWUsIGspO1xuICAgICAgICAgICAgICAgICAgICBpZiAodiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVtrXSA9IHY7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdmFsdWVba107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldml2ZXIuY2FsbChob2xkZXIsIGtleSwgdmFsdWUpO1xuICAgIH0oeycnOiByZXN1bHR9LCAnJykpIDogcmVzdWx0O1xufTtcbiIsInZhciBjeCA9IC9bXFx1MDAwMFxcdTAwYWRcXHUwNjAwLVxcdTA2MDRcXHUwNzBmXFx1MTdiNFxcdTE3YjVcXHUyMDBjLVxcdTIwMGZcXHUyMDI4LVxcdTIwMmZcXHUyMDYwLVxcdTIwNmZcXHVmZWZmXFx1ZmZmMC1cXHVmZmZmXS9nLFxuICAgIGVzY2FwYWJsZSA9IC9bXFxcXFxcXCJcXHgwMC1cXHgxZlxceDdmLVxceDlmXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2csXG4gICAgZ2FwLFxuICAgIGluZGVudCxcbiAgICBtZXRhID0geyAgICAvLyB0YWJsZSBvZiBjaGFyYWN0ZXIgc3Vic3RpdHV0aW9uc1xuICAgICAgICAnXFxiJzogJ1xcXFxiJyxcbiAgICAgICAgJ1xcdCc6ICdcXFxcdCcsXG4gICAgICAgICdcXG4nOiAnXFxcXG4nLFxuICAgICAgICAnXFxmJzogJ1xcXFxmJyxcbiAgICAgICAgJ1xccic6ICdcXFxccicsXG4gICAgICAgICdcIicgOiAnXFxcXFwiJyxcbiAgICAgICAgJ1xcXFwnOiAnXFxcXFxcXFwnXG4gICAgfSxcbiAgICByZXA7XG5cbmZ1bmN0aW9uIHF1b3RlKHN0cmluZykge1xuICAgIC8vIElmIHRoZSBzdHJpbmcgY29udGFpbnMgbm8gY29udHJvbCBjaGFyYWN0ZXJzLCBubyBxdW90ZSBjaGFyYWN0ZXJzLCBhbmQgbm9cbiAgICAvLyBiYWNrc2xhc2ggY2hhcmFjdGVycywgdGhlbiB3ZSBjYW4gc2FmZWx5IHNsYXAgc29tZSBxdW90ZXMgYXJvdW5kIGl0LlxuICAgIC8vIE90aGVyd2lzZSB3ZSBtdXN0IGFsc28gcmVwbGFjZSB0aGUgb2ZmZW5kaW5nIGNoYXJhY3RlcnMgd2l0aCBzYWZlIGVzY2FwZVxuICAgIC8vIHNlcXVlbmNlcy5cbiAgICBcbiAgICBlc2NhcGFibGUubGFzdEluZGV4ID0gMDtcbiAgICByZXR1cm4gZXNjYXBhYmxlLnRlc3Qoc3RyaW5nKSA/ICdcIicgKyBzdHJpbmcucmVwbGFjZShlc2NhcGFibGUsIGZ1bmN0aW9uIChhKSB7XG4gICAgICAgIHZhciBjID0gbWV0YVthXTtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBjID09PSAnc3RyaW5nJyA/IGMgOlxuICAgICAgICAgICAgJ1xcXFx1JyArICgnMDAwMCcgKyBhLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zbGljZSgtNCk7XG4gICAgfSkgKyAnXCInIDogJ1wiJyArIHN0cmluZyArICdcIic7XG59XG5cbmZ1bmN0aW9uIHN0cihrZXksIGhvbGRlcikge1xuICAgIC8vIFByb2R1Y2UgYSBzdHJpbmcgZnJvbSBob2xkZXJba2V5XS5cbiAgICB2YXIgaSwgICAgICAgICAgLy8gVGhlIGxvb3AgY291bnRlci5cbiAgICAgICAgaywgICAgICAgICAgLy8gVGhlIG1lbWJlciBrZXkuXG4gICAgICAgIHYsICAgICAgICAgIC8vIFRoZSBtZW1iZXIgdmFsdWUuXG4gICAgICAgIGxlbmd0aCxcbiAgICAgICAgbWluZCA9IGdhcCxcbiAgICAgICAgcGFydGlhbCxcbiAgICAgICAgdmFsdWUgPSBob2xkZXJba2V5XTtcbiAgICBcbiAgICAvLyBJZiB0aGUgdmFsdWUgaGFzIGEgdG9KU09OIG1ldGhvZCwgY2FsbCBpdCB0byBvYnRhaW4gYSByZXBsYWNlbWVudCB2YWx1ZS5cbiAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJlxuICAgICAgICAgICAgdHlwZW9mIHZhbHVlLnRvSlNPTiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvSlNPTihrZXkpO1xuICAgIH1cbiAgICBcbiAgICAvLyBJZiB3ZSB3ZXJlIGNhbGxlZCB3aXRoIGEgcmVwbGFjZXIgZnVuY3Rpb24sIHRoZW4gY2FsbCB0aGUgcmVwbGFjZXIgdG9cbiAgICAvLyBvYnRhaW4gYSByZXBsYWNlbWVudCB2YWx1ZS5cbiAgICBpZiAodHlwZW9mIHJlcCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWx1ZSA9IHJlcC5jYWxsKGhvbGRlciwga2V5LCB2YWx1ZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIFdoYXQgaGFwcGVucyBuZXh0IGRlcGVuZHMgb24gdGhlIHZhbHVlJ3MgdHlwZS5cbiAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgcmV0dXJuIHF1b3RlKHZhbHVlKTtcbiAgICAgICAgXG4gICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAvLyBKU09OIG51bWJlcnMgbXVzdCBiZSBmaW5pdGUuIEVuY29kZSBub24tZmluaXRlIG51bWJlcnMgYXMgbnVsbC5cbiAgICAgICAgICAgIHJldHVybiBpc0Zpbml0ZSh2YWx1ZSkgPyBTdHJpbmcodmFsdWUpIDogJ251bGwnO1xuICAgICAgICBcbiAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgIGNhc2UgJ251bGwnOlxuICAgICAgICAgICAgLy8gSWYgdGhlIHZhbHVlIGlzIGEgYm9vbGVhbiBvciBudWxsLCBjb252ZXJ0IGl0IHRvIGEgc3RyaW5nLiBOb3RlOlxuICAgICAgICAgICAgLy8gdHlwZW9mIG51bGwgZG9lcyBub3QgcHJvZHVjZSAnbnVsbCcuIFRoZSBjYXNlIGlzIGluY2x1ZGVkIGhlcmUgaW5cbiAgICAgICAgICAgIC8vIHRoZSByZW1vdGUgY2hhbmNlIHRoYXQgdGhpcyBnZXRzIGZpeGVkIHNvbWVkYXkuXG4gICAgICAgICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgICAgIFxuICAgICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuICdudWxsJztcbiAgICAgICAgICAgIGdhcCArPSBpbmRlbnQ7XG4gICAgICAgICAgICBwYXJ0aWFsID0gW107XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEFycmF5LmlzQXJyYXlcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KHZhbHVlKSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgICAgIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFydGlhbFtpXSA9IHN0cihpLCB2YWx1ZSkgfHwgJ251bGwnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBKb2luIGFsbCBvZiB0aGUgZWxlbWVudHMgdG9nZXRoZXIsIHNlcGFyYXRlZCB3aXRoIGNvbW1hcywgYW5kXG4gICAgICAgICAgICAgICAgLy8gd3JhcCB0aGVtIGluIGJyYWNrZXRzLlxuICAgICAgICAgICAgICAgIHYgPSBwYXJ0aWFsLmxlbmd0aCA9PT0gMCA/ICdbXScgOiBnYXAgP1xuICAgICAgICAgICAgICAgICAgICAnW1xcbicgKyBnYXAgKyBwYXJ0aWFsLmpvaW4oJyxcXG4nICsgZ2FwKSArICdcXG4nICsgbWluZCArICddJyA6XG4gICAgICAgICAgICAgICAgICAgICdbJyArIHBhcnRpYWwuam9pbignLCcpICsgJ10nO1xuICAgICAgICAgICAgICAgIGdhcCA9IG1pbmQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIElmIHRoZSByZXBsYWNlciBpcyBhbiBhcnJheSwgdXNlIGl0IHRvIHNlbGVjdCB0aGUgbWVtYmVycyB0byBiZVxuICAgICAgICAgICAgLy8gc3RyaW5naWZpZWQuXG4gICAgICAgICAgICBpZiAocmVwICYmIHR5cGVvZiByZXAgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gcmVwLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgayA9IHJlcFtpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBrID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdiA9IHN0cihrLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRpYWwucHVzaChxdW90ZShrKSArIChnYXAgPyAnOiAnIDogJzonKSArIHYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCBpdGVyYXRlIHRocm91Z2ggYWxsIG9mIHRoZSBrZXlzIGluIHRoZSBvYmplY3QuXG4gICAgICAgICAgICAgICAgZm9yIChrIGluIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIGspKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2ID0gc3RyKGssIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFydGlhbC5wdXNoKHF1b3RlKGspICsgKGdhcCA/ICc6ICcgOiAnOicpICsgdik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgLy8gSm9pbiBhbGwgb2YgdGhlIG1lbWJlciB0ZXh0cyB0b2dldGhlciwgc2VwYXJhdGVkIHdpdGggY29tbWFzLFxuICAgICAgICAvLyBhbmQgd3JhcCB0aGVtIGluIGJyYWNlcy5cblxuICAgICAgICB2ID0gcGFydGlhbC5sZW5ndGggPT09IDAgPyAne30nIDogZ2FwID9cbiAgICAgICAgICAgICd7XFxuJyArIGdhcCArIHBhcnRpYWwuam9pbignLFxcbicgKyBnYXApICsgJ1xcbicgKyBtaW5kICsgJ30nIDpcbiAgICAgICAgICAgICd7JyArIHBhcnRpYWwuam9pbignLCcpICsgJ30nO1xuICAgICAgICBnYXAgPSBtaW5kO1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlLCByZXBsYWNlciwgc3BhY2UpIHtcbiAgICB2YXIgaTtcbiAgICBnYXAgPSAnJztcbiAgICBpbmRlbnQgPSAnJztcbiAgICBcbiAgICAvLyBJZiB0aGUgc3BhY2UgcGFyYW1ldGVyIGlzIGEgbnVtYmVyLCBtYWtlIGFuIGluZGVudCBzdHJpbmcgY29udGFpbmluZyB0aGF0XG4gICAgLy8gbWFueSBzcGFjZXMuXG4gICAgaWYgKHR5cGVvZiBzcGFjZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHNwYWNlOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGluZGVudCArPSAnICc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gSWYgdGhlIHNwYWNlIHBhcmFtZXRlciBpcyBhIHN0cmluZywgaXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBpbmRlbnQgc3RyaW5nLlxuICAgIGVsc2UgaWYgKHR5cGVvZiBzcGFjZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaW5kZW50ID0gc3BhY2U7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgaXMgYSByZXBsYWNlciwgaXQgbXVzdCBiZSBhIGZ1bmN0aW9uIG9yIGFuIGFycmF5LlxuICAgIC8vIE90aGVyd2lzZSwgdGhyb3cgYW4gZXJyb3IuXG4gICAgcmVwID0gcmVwbGFjZXI7XG4gICAgaWYgKHJlcGxhY2VyICYmIHR5cGVvZiByZXBsYWNlciAhPT0gJ2Z1bmN0aW9uJ1xuICAgICYmICh0eXBlb2YgcmVwbGFjZXIgIT09ICdvYmplY3QnIHx8IHR5cGVvZiByZXBsYWNlci5sZW5ndGggIT09ICdudW1iZXInKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0pTT04uc3RyaW5naWZ5Jyk7XG4gICAgfVxuICAgIFxuICAgIC8vIE1ha2UgYSBmYWtlIHJvb3Qgb2JqZWN0IGNvbnRhaW5pbmcgb3VyIHZhbHVlIHVuZGVyIHRoZSBrZXkgb2YgJycuXG4gICAgLy8gUmV0dXJuIHRoZSByZXN1bHQgb2Ygc3RyaW5naWZ5aW5nIHRoZSB2YWx1ZS5cbiAgICByZXR1cm4gc3RyKCcnLCB7Jyc6IHZhbHVlfSk7XG59O1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjYuM1xudmFyIEJhc2UsIEV2ZW50RW1pdHRlciwgYWRkciwgYWRkcnMsIGd1aWQsIGlwcywgbmFtZSwgb3MsIF8sIF9pLCBfbGVuLCBfcmVmLFxuICBfX2hhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eSxcbiAgX19leHRlbmRzID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChfX2hhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH07XG5cbkV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcblxuXyA9IHJlcXVpcmUoJy4uL3ZlbmRvci9sb2Rhc2gnKTtcblxub3MgPSByZXF1aXJlKFwib3NcIik7XG5cbmd1aWQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIChNYXRoLnJhbmRvbSgpICogTWF0aC5wb3coMiwgMzIpKS50b1N0cmluZygxNik7XG59O1xuXG5pcHMgPSBbXTtcblxuX3JlZiA9IHR5cGVvZiBvcy5uZXR3b3JrSW50ZXJmYWNlcyA9PT0gXCJmdW5jdGlvblwiID8gb3MubmV0d29ya0ludGVyZmFjZXMoKSA6IHZvaWQgMDtcbmZvciAobmFtZSBpbiBfcmVmKSB7XG4gIGFkZHJzID0gX3JlZltuYW1lXTtcbiAgZm9yIChfaSA9IDAsIF9sZW4gPSBhZGRycy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgIGFkZHIgPSBhZGRyc1tfaV07XG4gICAgaWYgKGFkZHIuZmFtaWx5ID09PSAnSVB2NCcpIHtcbiAgICAgIGlwcy5wdXNoKGFkZHIuYWRkcmVzcyk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQmFzZSA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgX19leHRlbmRzKEJhc2UsIF9zdXBlcik7XG5cbiAgQmFzZS5wcm90b3R5cGUubmFtZSA9ICdCYXNlJztcblxuICBmdW5jdGlvbiBCYXNlKG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSBvcHRzICE9IG51bGwgPyBvcHRzIDoge307XG4gICAgaWYgKF8uaXNTdHJpbmcodGhpcy5vcHRzKSkge1xuICAgICAgdGhpcy5vcHRzID0ge1xuICAgICAgICBpZDogdGhpcy5vcHRzXG4gICAgICB9O1xuICAgIH1cbiAgICBfLmRlZmF1bHRzKHRoaXMub3B0cywgdGhpcy5kZWZhdWx0cyk7XG4gICAgdGhpcy5ndWlkID0gZ3VpZCgpO1xuICAgIHRoaXMuaWQgPSB0aGlzLm9wdHMuaWQgfHwgdGhpcy5ndWlkO1xuICAgIF8uYmluZEFsbCh0aGlzKTtcbiAgICB0aGlzLmV4cG9zZWQgPSB7XG4gICAgICBfbXVsdGk6IHtcbiAgICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICAgIGd1aWQ6IHRoaXMuZ3VpZCxcbiAgICAgICAgaXBzOiBpcHMsXG4gICAgICAgIHBpbmc6IGZ1bmN0aW9uKGNiKSB7XG4gICAgICAgICAgcmV0dXJuIGNiKHRydWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIEJhc2UucHJvdG90eXBlLmV4cG9zZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfLm1lcmdlKHRoaXMuZXhwb3NlZCwgb2JqKTtcbiAgfTtcblxuICBCYXNlLnByb3RvdHlwZS5pcHMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gaXBzO1xuICB9O1xuXG4gIEJhc2UucHJvdG90eXBlLmxvZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLm9wdHMuZGVidWcpIHtcbiAgICAgIHJldHVybiBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBbdGhpcy50b1N0cmluZygpXS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgfVxuICB9O1xuXG4gIEJhc2UucHJvdG90eXBlLmVyciA9IGZ1bmN0aW9uKHN0cikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlwiICsgdGhpcyArIFwiIFwiICsgc3RyKTtcbiAgfTtcblxuICBCYXNlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBcIlwiICsgdGhpcy5uYW1lICsgXCI6IFwiICsgdGhpcy5pZCArIFwiOlwiO1xuICB9O1xuXG4gIHJldHVybiBCYXNlO1xuXG59KShFdmVudEVtaXR0ZXIpO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjYuM1xudmFyIEJhc2UsIENsaWVudCwgZG5vZGUsIGhlbHBlciwgdHJhbnNwb3J0cywgXyxcbiAgX19oYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHksXG4gIF9fZXh0ZW5kcyA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoX19oYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9O1xuXG5fID0gcmVxdWlyZSgnLi4vdmVuZG9yL2xvZGFzaCcpO1xuXG5kbm9kZSA9IHJlcXVpcmUoJ2Rub2RlJyk7XG5cbkJhc2UgPSByZXF1aXJlKCcuL2Jhc2UnKTtcblxuaGVscGVyID0gcmVxdWlyZSgnLi9oZWxwZXInKTtcblxudHJhbnNwb3J0cyA9IHJlcXVpcmUoJy4vdHJhbnNwb3J0cycpO1xuXG5DbGllbnQgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gIF9fZXh0ZW5kcyhDbGllbnQsIF9zdXBlcik7XG5cbiAgQ2xpZW50LnByb3RvdHlwZS5uYW1lID0gJ0NsaWVudCc7XG5cbiAgQ2xpZW50LnByb3RvdHlwZS5kZWZhdWx0cyA9IHtcbiAgICBkZWJ1ZzogdHJ1ZSxcbiAgICBtYXhSZXRyaWVzOiA1LFxuICAgIHRpbWVvdXQ6IDUwMDAsXG4gICAgaW50ZXJ2YWw6IDEwMDAsXG4gICAgcG9ydDogNzMzN1xuICB9O1xuXG4gIGZ1bmN0aW9uIENsaWVudCgpIHtcbiAgICBDbGllbnQuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgdGhpcy5jb3VudCA9IHtcbiAgICAgIHBpbmc6IDAsXG4gICAgICBwb25nOiAwLFxuICAgICAgYXR0ZW1wdDogMFxuICAgIH07XG4gICAgdGhpcy5jb25uZWN0aW5nID0gZmFsc2U7XG4gICAgdGhpcy5zdGF0dXMgPSAnZG93bic7XG4gICAgdGhpcy5yZWNvbm5lY3QgPSBfLnRocm90dGxlKHRoaXMucmVjb25uZWN0LCB0aGlzLm9wdHMuaW50ZXJ2YWwsIHtcbiAgICAgIGxlYWRpbmc6IHRydWVcbiAgICB9KTtcbiAgICB0aGlzLnBpbmcgPSBfLnRocm90dGxlKHRoaXMucGluZywgdGhpcy5vcHRzLmludGVydmFsKTtcbiAgICBfLmV4dGVuZCh0aGlzLmdldCwgdGhpcyk7XG4gICAgcmV0dXJuIHRoaXMuZ2V0O1xuICB9XG5cbiAgQ2xpZW50LnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jb3VudC5hdHRlbXB0ID0gMDtcbiAgICByZXR1cm4gdHJhbnNwb3J0cy5iaW5kKHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgQ2xpZW50LnByb3RvdHlwZS51bmJpbmQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNvdW50LmF0dGVtcHQgPSAwO1xuICAgIHJldHVybiB0aGlzLnJlc2V0KCk7XG4gIH07XG5cbiAgQ2xpZW50LnByb3RvdHlwZS5jcmVhdGVDb25uZWN0aW9uID0gZnVuY3Rpb24oZm4pIHtcbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLmVycihcIm11c3QgYmUgYSBmdW5jdGlvblwiKTtcbiAgICB9XG4gICAgaWYgKCEoZm4ubGVuZ3RoID09PSAxIHx8IGZuLmxlbmd0aCA9PT0gMikpIHtcbiAgICAgIHRoaXMuZXJyKFwibXVzdCBoYXZlIGFyaXR5IDEgb3IgMlwiKTtcbiAgICB9XG4gICAgdGhpcy5nZXRDb25uZWN0aW9uRm4gPSBmbjtcbiAgICByZXR1cm4gdGhpcy5yZWNvbm5lY3QoKTtcbiAgfTtcblxuICBDbGllbnQucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgaWYgKCF0aGlzLmdldENvbm5lY3Rpb25Gbikge1xuICAgICAgcmV0dXJuIHRoaXMuZXJyKFwibm8gY3JlYXRlIGNvbm5lY3Rpb24gbWV0aG9kIGRlZmluZWRcIik7XG4gICAgfVxuICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gJ3VwJykge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMucmVtb3RlKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdHVzID09PSAnZG93bicgJiYgIXRoaXMuY29ubmVjdGluZykge1xuICAgICAgdGhpcy5jb3VudC5hdHRlbXB0ID0gMDtcbiAgICAgIHRoaXMucmVjb25uZWN0KCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm9uY2UoJ3JlbW90ZScsIGNhbGxiYWNrKTtcbiAgfTtcblxuICBDbGllbnQucHJvdG90eXBlLnVuZ2V0ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICByZXR1cm4gdGhpcy5yZW1vdmVMaXN0ZW5lcigncmVtb3RlJywgY2FsbGJhY2spO1xuICB9O1xuXG4gIENsaWVudC5wcm90b3R5cGUucmVjb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICBpZiAodGhpcy5zdGF0dXMgPT09ICd1cCcgfHwgdGhpcy5jb25uZWN0aW5nIHx8IHRoaXMuY291bnQuYXR0ZW1wdCA+PSB0aGlzLm9wdHMubWF4UmV0cmllcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmNvdW50LmF0dGVtcHQrKztcbiAgICB0aGlzLmNvbm5lY3RpbmcgPSB0cnVlO1xuICAgIHRoaXMucmVzZXQoKTtcbiAgICB0aGlzLmQgPSBkbm9kZSh0aGlzLmV4cG9zZWQpO1xuICAgIHRoaXMuZC5vbmNlKCdyZW1vdGUnLCB0aGlzLm9uUmVtb3RlKTtcbiAgICB0aGlzLmQub25jZSgnZW5kJywgdGhpcy5vbkVuZCk7XG4gICAgdGhpcy5kLm9uY2UoJ2Vycm9yJywgdGhpcy5vbkVycm9yKTtcbiAgICB0aGlzLmQub25jZSgnZmFpbCcsIHRoaXMub25TdHJlYW1FcnJvcik7XG4gICAgdGhpcy50aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMucmVzZXQoKTtcbiAgICAgIHJldHVybiBfdGhpcy5yZWNvbm5lY3QoKTtcbiAgICB9KTtcbiAgICB0aGlzLmVtaXQoJ2Nvbm5lY3RpbmcnKTtcbiAgICBzd2l0Y2ggKHRoaXMuZ2V0Q29ubmVjdGlvbkZuLmxlbmd0aCkge1xuICAgICAgY2FzZSAxOlxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb25uZWN0aW9uRm4oZnVuY3Rpb24oc3RyZWFtKSB7XG4gICAgICAgICAgaWYgKCFoZWxwZXIuaXNSZWFkYWJsZShzdHJlYW0pKSB7XG4gICAgICAgICAgICBfdGhpcy5lcnIoXCJJbnZhbGlkIGR1cGxleCBzdHJlYW0gKG5vdCByZWFkYWJsZSlcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghaGVscGVyLmlzV3JpdGFibGUoc3RyZWFtKSkge1xuICAgICAgICAgICAgX3RoaXMuZXJyKFwiSW52YWxpZCBkdXBsZXggc3RyZWFtIChub3Qgd3JpdGFibGUpXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzdHJlYW0ub24oJ2Vycm9yJywgX3RoaXMub25TdHJlYW1FcnJvcik7XG4gICAgICAgICAgcmV0dXJuIHN0cmVhbS5waXBlKF90aGlzLmQpLnBpcGUoc3RyZWFtKTtcbiAgICAgICAgfSk7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIHJldHVybiB0aGlzLmdldENvbm5lY3Rpb25GbihmdW5jdGlvbihyZWFkKSB7XG4gICAgICAgICAgaWYgKCFoZWxwZXIuaXNSZWFkYWJsZShyZWFkKSkge1xuICAgICAgICAgICAgX3RoaXMuZXJyKFwiSW52YWxpZCByZWFkIHN0cmVhbVwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVhZC5vbignZXJyb3InLCBfdGhpcy5vblN0cmVhbUVycm9yKTtcbiAgICAgICAgICByZXR1cm4gcmVhZC5waXBlKF90aGlzLmQpO1xuICAgICAgICB9LCBmdW5jdGlvbih3cml0ZSkge1xuICAgICAgICAgIGlmICghaGVscGVyLmlzV3JpdGFibGUod3JpdGUpKSB7XG4gICAgICAgICAgICBfdGhpcy5lcnIoXCJJbnZhbGlkIHdyaXRlIHN0cmVhbVwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgd3JpdGUub24oJ2Vycm9yJywgX3RoaXMub25TdHJlYW1FcnJvcik7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLmQucGlwZSh3cml0ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBDbGllbnQucHJvdG90eXBlLm9uU3RyZWFtRXJyb3IgPSBmdW5jdGlvbihlcnIpIHtcbiAgICB0aGlzLnNldFN0YXR1cygnZG93bicpO1xuICAgIHJldHVybiB0aGlzLnJlY29ubmVjdCgpO1xuICB9O1xuXG4gIENsaWVudC5wcm90b3R5cGUub25FcnJvciA9IGZ1bmN0aW9uKGVycikge1xuICAgIHRoaXMubG9nKFwiZXJyb3I6IFwiICsgZXJyKTtcbiAgICByZXR1cm4gdGhpcy5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcbiAgfTtcblxuICBDbGllbnQucHJvdG90eXBlLm9uUmVtb3RlID0gZnVuY3Rpb24ocmVtb3RlKSB7XG4gICAgdmFyIF9yZWY7XG4gICAgdGhpcy50aW1lb3V0KGZhbHNlKTtcbiAgICBpZiAoISgoX3JlZiA9IHJlbW90ZS5fbXVsdGkpICE9IG51bGwgPyBfcmVmLnBpbmcgOiB2b2lkIDApKSB7XG4gICAgICByZXR1cm4gdGhpcy5lcnIoXCJJbnZhbGlkIHBub2RlIGhvc3RcIik7XG4gICAgfVxuICAgIHRoaXMucmVtb3RlID0gcmVtb3RlO1xuICAgIHRoaXMuZW1pdCgncmVtb3RlJywgdGhpcy5yZW1vdGUpO1xuICAgIHRoaXMuc2V0U3RhdHVzKCd1cCcpO1xuICAgIHJldHVybiB0aGlzLnBpbmcoKTtcbiAgfTtcblxuICBDbGllbnQucHJvdG90eXBlLnBpbmcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gJ2Rvd24nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuY291bnQucGluZysrO1xuICAgIHRoaXMudGltZW91dCh0cnVlKTtcbiAgICByZXR1cm4gdGhpcy5yZW1vdGUuX211bHRpLnBpbmcoZnVuY3Rpb24ob2spIHtcbiAgICAgIGlmIChvayA9PT0gdHJ1ZSkge1xuICAgICAgICBfdGhpcy5jb3VudC5wb25nKys7XG4gICAgICB9XG4gICAgICBfdGhpcy50aW1lb3V0KGZhbHNlKTtcbiAgICAgIHJldHVybiBfdGhpcy5waW5nKCk7XG4gICAgfSk7XG4gIH07XG5cbiAgQ2xpZW50LnByb3RvdHlwZS50aW1lb3V0ID0gZnVuY3Rpb24oY2IpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQudCk7XG4gICAgaWYgKGNiID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy50aW1lb3V0LnQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMuc2V0U3RhdHVzKCdkb3duJyk7XG4gICAgICBpZiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBjYigpO1xuICAgICAgfVxuICAgIH0sIHRoaXMub3B0cy50aW1lb3V0KTtcbiAgfTtcblxuICBDbGllbnQucHJvdG90eXBlLm9uRW5kID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5sb2coXCJzZXJ2ZXIgY2xvc2VkIGNvbm5lY3Rpb25cIik7XG4gICAgdGhpcy5zZXRTdGF0dXMoJ2Rvd24nKTtcbiAgICByZXR1cm4gdGhpcy5yZWNvbm5lY3QoKTtcbiAgfTtcblxuICBDbGllbnQucHJvdG90eXBlLnNldFN0YXR1cyA9IGZ1bmN0aW9uKHMpIHtcbiAgICB0aGlzLmNvbm5lY3RpbmcgPSBmYWxzZTtcbiAgICBpZiAoISgocyA9PT0gJ3VwJyB8fCBzID09PSAnZG93bicpICYmIHMgIT09IHRoaXMuc3RhdHVzKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmxvZyhzKTtcbiAgICB0aGlzLnN0YXR1cyA9IHM7XG4gICAgcmV0dXJuIHRoaXMuZW1pdChzKTtcbiAgfTtcblxuICBDbGllbnQucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZXRTdGF0dXMoJ2Rvd24nKTtcbiAgICBpZiAodGhpcy5kKSB7XG4gICAgICByZXR1cm4gdGhpcy5kLnJlbW92ZUFsbExpc3RlbmVycygpLmVuZCgpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gQ2xpZW50O1xuXG59KShCYXNlKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRzKSB7XG4gIHJldHVybiBuZXcgQ2xpZW50KG9wdHMpO1xufTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS42LjNcbmV4cG9ydHMuaXNSZWFkYWJsZSA9IGZ1bmN0aW9uKHN0cmVhbSkge1xuICByZXR1cm4gc3RyZWFtLnJlYWRhYmxlID09PSB0cnVlIHx8IHR5cGVvZiBzdHJlYW0ucmVhZCA9PT0gJ2Z1bmN0aW9uJztcbn07XG5cbmV4cG9ydHMuaXNXcml0YWJsZSA9IGZ1bmN0aW9uKHN0cmVhbSkge1xuICByZXR1cm4gc3RyZWFtLndyaXRhYmxlID09PSB0cnVlIHx8IHR5cGVvZiBzdHJlYW0ud3JpdGUgPT09ICdmdW5jdGlvbic7XG59O1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjYuM1xuZXhwb3J0cy5hZGRUcmFuc3BvcnQgPSByZXF1aXJlKCcuL3RyYW5zcG9ydHMnKS5hZGQ7XG5cbmV4cG9ydHMuY2xpZW50ID0gcmVxdWlyZSgnLi9jbGllbnQnKTtcblxuZXhwb3J0cy5zZXJ2ZXIgPSByZXF1aXJlKCcuL3NlcnZlcicpO1xuXG5leHBvcnRzLnBlZXIgPSByZXF1aXJlKCcuL3BlZXInKTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS42LjNcbnZhciBCYXNlLCBMb2NhbFBlZXIsIFJlbW90ZVBlZXIsIGxvY2FscywgcG5vZGUsIF8sXG4gIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5LFxuICBfX2V4dGVuZHMgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKF9faGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfTtcblxuXyA9IHJlcXVpcmUoJy4uL3ZlbmRvci9sb2Rhc2gnKTtcblxucG5vZGUgPSByZXF1aXJlKCcuL2luZGV4Jyk7XG5cbkJhc2UgPSByZXF1aXJlKCcuL2Jhc2UnKTtcblxubG9jYWxzID0gW107XG5cblJlbW90ZVBlZXIgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gIF9fZXh0ZW5kcyhSZW1vdGVQZWVyLCBfc3VwZXIpO1xuXG4gIFJlbW90ZVBlZXIucHJvdG90eXBlLm5hbWUgPSAnUmVtb3RlUGVlcic7XG5cbiAgUmVtb3RlUGVlci5wcm90b3R5cGUuZGVmYXVsdHMgPSB7XG4gICAgaGVsbG86IDQyXG4gIH07XG5cbiAgZnVuY3Rpb24gUmVtb3RlUGVlcihsb2NhbCwgcmVtb3RlKSB7XG4gICAgdGhpcy5sb2NhbCA9IGxvY2FsO1xuICAgIHRoaXMucmVtb3RlID0gcmVtb3RlO1xuICB9XG5cbiAgUmVtb3RlUGVlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5sb2coJ3RvSlNPTicsIHRoaXMucmVtb3RlKTtcbiAgICByZXR1cm4gdGhpcy5yZW1vdGUuX211bHRpLmlwcztcbiAgfTtcblxuICBSZW1vdGVQZWVyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5sb2coJ2FkZCEnKTtcbiAgfTtcblxuICByZXR1cm4gUmVtb3RlUGVlcjtcblxufSkoQmFzZSk7XG5cbkxvY2FsUGVlciA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgX19leHRlbmRzKExvY2FsUGVlciwgX3N1cGVyKTtcblxuICBMb2NhbFBlZXIucHJvdG90eXBlLm5hbWUgPSAnTG9jYWxQZWVyJztcblxuICBMb2NhbFBlZXIucHJvdG90eXBlLmRlZmF1bHRzID0ge1xuICAgIGRlYnVnOiB0cnVlLFxuICAgIGhlbGxvOiA0MlxuICB9O1xuXG4gIGZ1bmN0aW9uIExvY2FsUGVlcigpIHtcbiAgICBMb2NhbFBlZXIuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgdGhpcy5wZWVycyA9IHt9O1xuICAgIHRoaXMuZXhwb3NlKHtcbiAgICAgIF9tdWx0aToge1xuICAgICAgICBndWlkOiB0aGlzLmd1aWQsXG4gICAgICAgIHBlZXJzOiBmdW5jdGlvbihjYikge1xuICAgICAgICAgIHJldHVybiBjYih0aGlzLnBlZXJzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIF8uZXh0ZW5kKHRoaXMub25lLCB0aGlzKTtcbiAgICByZXR1cm4gdGhpcy5vbmU7XG4gIH1cblxuICBMb2NhbFBlZXIucHJvdG90eXBlLmJpbmRPbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZXJ2ZXI7XG4gICAgc2VydmVyID0gcG5vZGUuc2VydmVyKHRoaXMub3B0cyk7XG4gICAgc2VydmVyLmV4cG9zZSh0aGlzLmV4cG9zZWQpO1xuICAgIHNlcnZlci5iaW5kLmFwcGx5KHNlcnZlciwgYXJndW1lbnRzKTtcbiAgICByZXR1cm4gc2VydmVyLm9uKCdyZW1vdGUnLCB0aGlzLm9uUGVlcik7XG4gIH07XG5cbiAgTG9jYWxQZWVyLnByb3RvdHlwZS5iaW5kVG8gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2xpZW50O1xuICAgIGNsaWVudCA9IHBub2RlLmNsaWVudCh0aGlzLm9wdHMpO1xuICAgIGNsaWVudC5leHBvc2UodGhpcy5leHBvc2VkKTtcbiAgICByZXR1cm4gY2xpZW50LmJpbmQuYXBwbHkoY2xpZW50LCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIExvY2FsUGVlci5wcm90b3R5cGUub25QZWVyID0gZnVuY3Rpb24ocmVtb3RlKSB7XG4gICAgdmFyIGd1aWQsIF9yZWYsXG4gICAgICBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy5sb2coJ25ldyBwZWVyISAnLCByZW1vdGUuX211bHRpLmd1aWQpO1xuICAgIHJlbW90ZS5fbXVsdGkucGVlcnMoZnVuY3Rpb24ocCkge1xuICAgICAgcmV0dXJuIF90aGlzLmxvZyhwKTtcbiAgICB9KTtcbiAgICBndWlkID0gcmVtb3RlICE9IG51bGwgPyAoX3JlZiA9IHJlbW90ZS5fbXVsdGkpICE9IG51bGwgPyBfcmVmLmd1aWQgOiB2b2lkIDAgOiB2b2lkIDA7XG4gICAgaWYgKCFndWlkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLnBlZXJzW2d1aWRdKSB7XG4gICAgICByZXR1cm4gdGhpcy5wZWVyc1tndWlkXS5hZGQocmVtb3RlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucGVlcnNbZ3VpZF0gPSBuZXcgUmVtb3RlUGVlcih0aGlzLCByZW1vdGUpO1xuICAgIH1cbiAgfTtcblxuICBMb2NhbFBlZXIucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmxvZygnYWxsIScpO1xuICB9O1xuXG4gIExvY2FsUGVlci5wcm90b3R5cGUub25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMubG9nKCdvbmUhJyk7XG4gIH07XG5cbiAgcmV0dXJuIExvY2FsUGVlcjtcblxufSkoQmFzZSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0cykge1xuICB2YXIgcGVlcjtcbiAgcGVlciA9IG5ldyBMb2NhbFBlZXIob3B0cyk7XG4gIGxvY2Fscy5wdXNoKHBlZXIpO1xuICByZXR1cm4gcGVlcjtcbn07XG4iLCJ2YXIgcHJvY2Vzcz1yZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIik7Ly8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjYuM1xudmFyIEJhc2UsIFNlcnZlciwgZG5vZGUsIGhlbHBlciwgc2VydmVycywgdHJhbnNwb3J0cyxcbiAgX19oYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHksXG4gIF9fZXh0ZW5kcyA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoX19oYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9O1xuXG5kbm9kZSA9IHJlcXVpcmUoJ2Rub2RlJyk7XG5cbkJhc2UgPSByZXF1aXJlKCcuL2Jhc2UnKTtcblxudHJhbnNwb3J0cyA9IHJlcXVpcmUoJy4vdHJhbnNwb3J0cycpO1xuXG5oZWxwZXIgPSByZXF1aXJlKCcuL2hlbHBlcicpO1xuXG5zZXJ2ZXJzID0gW107XG5cblNlcnZlciA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgX19leHRlbmRzKFNlcnZlciwgX3N1cGVyKTtcblxuICBTZXJ2ZXIucHJvdG90eXBlLm5hbWUgPSAnU2VydmVyJztcblxuICBTZXJ2ZXIucHJvdG90eXBlLmRlZmF1bHRzID0ge1xuICAgIGRlYnVnOiB0cnVlLFxuICAgIHdhaXQ6IDUwMDBcbiAgfTtcblxuICBmdW5jdGlvbiBTZXJ2ZXIoKSB7XG4gICAgU2VydmVyLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIHRoaXMuY2xpZW50cyA9IHt9O1xuICB9XG5cbiAgU2VydmVyLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2kgPSB0cmFuc3BvcnRzLmJpbmQodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcblxuICBTZXJ2ZXIucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjbGllbnQsIGUsIGlkLCBfcmVmLCBfcmVmMTtcbiAgICBfcmVmID0gdGhpcy5jbGllbnRzO1xuICAgIGZvciAoaWQgaW4gX3JlZikge1xuICAgICAgY2xpZW50ID0gX3JlZltpZF07XG4gICAgICBjbGllbnQuZC5lbmQoKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0eXBlb2YgKChfcmVmMSA9IHRoaXMuc2kpICE9IG51bGwgPyBfcmVmMS51bmJpbmQgOiB2b2lkIDApID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNpLnVuYmluZCgpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgZSA9IF9lcnJvcjtcbiAgICB9XG4gIH07XG5cbiAgU2VydmVyLnByb3RvdHlwZS5oYW5kbGUgPSBmdW5jdGlvbihyZWFkLCB3cml0ZSkge1xuICAgIHZhciBkLFxuICAgICAgX3RoaXMgPSB0aGlzO1xuICAgIGlmIChyZWFkLndyaXRlICYmICEod3JpdGUgIT0gbnVsbCA/IHdyaXRlLndyaXRlIDogdm9pZCAwKSkge1xuICAgICAgd3JpdGUgPSByZWFkO1xuICAgIH1cbiAgICBpZiAoIWhlbHBlci5pc1JlYWRhYmxlKHJlYWQpKSB7XG4gICAgICB0aGlzLmVycihcIkludmFsaWQgcmVhZCBzdHJlYW1cIik7XG4gICAgfVxuICAgIGlmICghaGVscGVyLmlzV3JpdGFibGUod3JpdGUpKSB7XG4gICAgICB0aGlzLmVycihcIkludmFsaWQgd3JpdGUgc3RyZWFtXCIpO1xuICAgIH1cbiAgICBkID0gZG5vZGUodGhpcy5leHBvc2VkKTtcbiAgICBkLm9uY2UoJ3JlbW90ZScsIHRoaXMub25SZW1vdGUpO1xuICAgIGQub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKSB7XG4gICAgICByZXR1cm4gX3RoaXMubG9nKCdoYW5kbGUgZXJyb3InLCBlcnIpO1xuICAgIH0pO1xuICAgIGQub24oJ2ZhaWwnLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgIHJldHVybiBfdGhpcy5sb2coJ2hhbmRsZSBmYWlsJywgZXJyKTtcbiAgICB9KTtcbiAgICByZWFkLm9uY2UoJ2Nsb3NlJywgZC5lbmQpO1xuICAgIHJldHVybiByZWFkLnBpcGUoZCkucGlwZSh3cml0ZSk7XG4gIH07XG5cbiAgU2VydmVyLnByb3RvdHlwZS5vblJlbW90ZSA9IGZ1bmN0aW9uKHJlbW90ZSwgZCkge1xuICAgIHZhciBtZXRhLFxuICAgICAgX3RoaXMgPSB0aGlzO1xuICAgIG1ldGEgPSByZW1vdGUuX211bHRpO1xuICAgIGlmICghbWV0YSkge1xuICAgICAgdGhpcy5sb2coXCJjbG9zaW5nIGNvbm5lY3Rpb24sIG5vdCBhIHBub2RlIGNsaWVudFwiKTtcbiAgICAgIGQuZW5kKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuY2xpZW50c1ttZXRhLmlkXSA9IHtcbiAgICAgIHJlbW90ZTogcmVtb3RlLFxuICAgICAgZDogZFxuICAgIH07XG4gICAgdGhpcy5sb2coJ2Nvbm5lY3RlZCB0byBjbGllbnQnLCBtZXRhLmlkKTtcbiAgICB0aGlzLmVtaXQoJ3JlbW90ZScsIHJlbW90ZSk7XG4gICAgcmV0dXJuIGQub25jZSgnZW5kJywgZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5sb2coJ2Rpc2Nvbm5lY3RlZCBmcm9tIGNsaWVudCcsIG1ldGEuaWQpO1xuICAgICAgcmV0dXJuIGRlbGV0ZSBfdGhpcy5jbGllbnRzW21ldGEuaWRdO1xuICAgIH0pO1xuICB9O1xuXG4gIFNlcnZlci5wcm90b3R5cGUuY2xpZW50ID0gZnVuY3Rpb24oaWQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGNiLCByZW0sIHQsXG4gICAgICBfdGhpcyA9IHRoaXM7XG4gICAgcmVtID0gdGhpcy5jbGllbnRTeW5jKGlkKTtcbiAgICBpZiAocmVtKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2socmVtKTtcbiAgICB9XG4gICAgdCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gX3RoaXMucmVtb3ZlTGlzdGVuZXIoJ3JlbW90ZScsIGNiKTtcbiAgICB9LCB0aGlzLm9wdHMud2FpdCk7XG4gICAgY2IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJlbSA9IF90aGlzLmNsaWVudFN5bmMoaWQpO1xuICAgICAgaWYgKCFyZW0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY2xlYXJUaW1lb3V0KHQpO1xuICAgICAgX3RoaXMucmVtb3ZlTGlzdGVuZXIoJ3JlbW90ZScsIGNiKTtcbiAgICAgIHJldHVybiBjYWxsYmFjayhyZW0pO1xuICAgIH07XG4gICAgcmV0dXJuIHRoaXMub24oJ3JlbW90ZScsIGNiKTtcbiAgfTtcblxuICBTZXJ2ZXIucHJvdG90eXBlLmNsaWVudFN5bmMgPSBmdW5jdGlvbihpZCkge1xuICAgIHZhciBjbGllbnQsIGksIF9yZWYsIF9yZWYxO1xuICAgIGlmICh0eXBlb2YgaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gKF9yZWYgPSB0aGlzLmNsaWVudHNbaWRdKSAhPSBudWxsID8gX3JlZi5yZW1vdGUgOiB2b2lkIDA7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgaWQgPT09ICdudW1iZXInKSB7XG4gICAgICBpID0gaWQ7XG4gICAgICBfcmVmMSA9IHRoaXMuY2xpZW50cztcbiAgICAgIGZvciAoaWQgaW4gX3JlZjEpIHtcbiAgICAgICAgY2xpZW50ID0gX3JlZjFbaWRdO1xuICAgICAgICBpZiAoaS0tID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIGNsaWVudC5yZW1vdGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5lcnIoXCJpbnZhbGlkIGFyZ3VtZW50c1wiKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIFNlcnZlcjtcblxufSkoQmFzZSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0cykge1xuICB2YXIgc2VydmVyO1xuICBzZXJ2ZXIgPSBuZXcgU2VydmVyKG9wdHMpO1xuICBzZXJ2ZXJzLnB1c2goc2VydmVyKTtcbiAgcmV0dXJuIHNlcnZlcjtcbn07XG5cbmlmICh0eXBlb2YgcHJvY2Vzcy5vbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gIHByb2Nlc3Mub24oJ2V4aXQnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VydmVyLCBfaSwgX2xlbiwgX3Jlc3VsdHM7XG4gICAgX3Jlc3VsdHMgPSBbXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHNlcnZlcnMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIHNlcnZlciA9IHNlcnZlcnNbX2ldO1xuICAgICAgX3Jlc3VsdHMucHVzaChzZXJ2ZXIudW5iaW5kKCkpO1xuICAgIH1cbiAgICByZXR1cm4gX3Jlc3VsdHM7XG4gIH0pO1xufVxuXG5pZiAodHlwZW9mIHByb2Nlc3Mub24gPT09IFwiZnVuY3Rpb25cIikge1xuICBwcm9jZXNzLm9uKCdTSUdJTlQnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gcHJvY2Vzcy5leGl0KCk7XG4gIH0pO1xufVxuIiwidmFyIF9fZGlybmFtZT1cIi8uLi8uLi9vdXQvdHJhbnNwb3J0c1wiOy8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS42LjNcbnZhciBmcywgaGVscGVyLCBwYXRoLCByZSwgdHJhbnNwb3J0cztcblxuZnMgPSByZXF1aXJlKCdmcycpO1xuXG5wYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuXG5oZWxwZXIgPSByZXF1aXJlKCcuLi9oZWxwZXInKTtcblxucmUgPSAvXihbYS16XSspOlxcL1xcLy87XG5cbnRyYW5zcG9ydHMgPSB7fTtcblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uKHN0cikge1xuICB2YXIgYXJncywgaG9zdG5hbWUsIHBvcnQ7XG4gIGFyZ3MgPSBbXTtcbiAgaWYgKHR5cGVvZiBzdHIgPT09ICdzdHJpbmcnICYmIC9eKC4rPykoOihcXGQrKSk/JC8udGVzdChzdHIpKSB7XG4gICAgaG9zdG5hbWUgPSBSZWdFeHAuJDE7XG4gICAgcG9ydCA9IHBhcnNlSW50KFJlZ0V4cC4kMywgMTApO1xuICAgIGlmIChwb3J0KSB7XG4gICAgICBhcmdzLnB1c2gocG9ydCk7XG4gICAgfVxuICAgIGFyZ3MucHVzaChob3N0bmFtZSk7XG4gIH1cbiAgcmV0dXJuIGFyZ3M7XG59O1xuXG5leHBvcnRzLmJpbmQgPSBmdW5jdGlvbihjb250ZXh0LCBhcmdzKSB7XG4gIHZhciBmbiwgbmFtZSwgb2JqLCBwYXJzZUZuLCB0cmFuc3BvcnQsIHVyaTtcbiAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3MpO1xuICB0cmFuc3BvcnQgPSBhcmdzLnNoaWZ0KCk7XG4gIGlmICghdHJhbnNwb3J0KSB7XG4gICAgY29udGV4dC5lcnIoXCJUcmFuc3BvcnQgYXJndW1lbnQgbWlzc2luZ1wiKTtcbiAgfVxuICBpZiAocmUudGVzdCh0cmFuc3BvcnQpKSB7XG4gICAgbmFtZSA9IFJlZ0V4cC4kMTtcbiAgICBvYmogPSBleHBvcnRzLmdldChuYW1lKTtcbiAgICB1cmkgPSB0cmFuc3BvcnQucmVwbGFjZShyZSwgJycpO1xuICB9IGVsc2Uge1xuICAgIG5hbWUgPSB0cmFuc3BvcnQ7XG4gICAgb2JqID0gZXhwb3J0cy5nZXQobmFtZSk7XG4gIH1cbiAgaWYgKCFvYmopIHtcbiAgICBjb250ZXh0LmVycihcIlRyYW5zcG9ydDogJ1wiICsgdHJhbnNwb3J0ICsgXCInIG5vdCBmb3VuZFwiKTtcbiAgfVxuICBwYXJzZUZuID0gb2JqLnBhcnNlIHx8IGV4cG9ydHMucGFyc2U7XG4gIGFyZ3MgPSBwYXJzZUZuKHVyaSkuY29uY2F0KGFyZ3MpO1xuICBjb250ZXh0LmxvZyhhcmdzKTtcbiAgZm4gPSBvYmpbXCJiaW5kXCIgKyBjb250ZXh0Lm5hbWVdO1xuICByZXR1cm4gZm4uYXBwbHkoY29udGV4dCwgYXJncyk7XG59O1xuXG5leHBvcnRzLmFkZCA9IGZ1bmN0aW9uKG5hbWUsIG9iaikge1xuICBpZiAodHlwZW9mIG9iai5iaW5kU2VydmVyICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBvYmouYmluZENsaWVudCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IFwiVHJhbnNwb3J0ICdcIiArIG5hbWUgKyBcIicgY2Fubm90IGJlIGFkZGVkLCBiaW5kIG1ldGhvZHMgYXJlIG1pc3NpbmdcIjtcbiAgfVxuICBpZiAoL1teYS16XS8udGVzdChuYW1lKSkge1xuICAgIHRocm93IFwiVHJhbnNwb3J0IG5hbWUgbXVzdCBiZSBsb3dlcmNhc2UgbGV0dGVycyBvbmx5XCI7XG4gIH1cbiAgaWYgKGV4cG9ydHMuZ2V0KG5hbWUpKSB7XG4gICAgdGhyb3cgXCJUcmFuc3BvcnQgJ1wiICsgbmFtZSArIFwiJyBhbHJlYWR5IGV4aXN0c1wiO1xuICB9XG4gIHRyYW5zcG9ydHNbbmFtZV0gPSBvYmo7XG4gIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0cy5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiB0cmFuc3BvcnRzW25hbWVdO1xufTtcblxuaWYgKHR5cGVvZiBmcy5yZWFkZGlyU3luYyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gIGZzLnJlYWRkaXJTeW5jKF9fZGlybmFtZSkuZm9yRWFjaChmdW5jdGlvbihmaWxlKSB7XG4gICAgaWYgKGZpbGUgIT09ICdpbmRleC5qcycpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmFkZChmaWxlLnJlcGxhY2UoJy5qcycsICcnKSwgcmVxdWlyZShcIi4vXCIgKyBmaWxlKSk7XG4gICAgfVxuICB9KTtcbn1cbiIsInZhciBnbG9iYWw9c2VsZjsvKipcbiAqIEBsaWNlbnNlXG4gKiBMby1EYXNoIDEuMy4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2Rlcm4gaW5jbHVkZT1cIm1lcmdlLHRocm90dGxlLGRlZmF1bHRzLGV4dGVuZCxiaW5kQWxsXCIgLW8gaW5kZXguanNgXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjQuNCA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgSW5jLlxuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG47KGZ1bmN0aW9uKHdpbmRvdykge1xuXG4gIC8qKiBVc2VkIGFzIGEgc2FmZSByZWZlcmVuY2UgZm9yIGB1bmRlZmluZWRgIGluIHByZSBFUzUgZW52aXJvbm1lbnRzICovXG4gIHZhciB1bmRlZmluZWQ7XG5cbiAgLyoqIFVzZWQgdG8gcG9vbCBhcnJheXMgYW5kIG9iamVjdHMgdXNlZCBpbnRlcm5hbGx5ICovXG4gIHZhciBhcnJheVBvb2wgPSBbXSxcbiAgICAgIG9iamVjdFBvb2wgPSBbXTtcblxuICAvKiogVXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgSURzICovXG4gIHZhciBpZENvdW50ZXIgPSAwO1xuXG4gIC8qKiBVc2VkIGludGVybmFsbHkgdG8gaW5kaWNhdGUgdmFyaW91cyB0aGluZ3MgKi9cbiAgdmFyIGluZGljYXRvck9iamVjdCA9IHt9O1xuXG4gIC8qKiBVc2VkIHRvIHByZWZpeCBrZXlzIHRvIGF2b2lkIGlzc3VlcyB3aXRoIGBfX3Byb3RvX19gIGFuZCBwcm9wZXJ0aWVzIG9uIGBPYmplY3QucHJvdG90eXBlYCAqL1xuICB2YXIga2V5UHJlZml4ID0gK25ldyBEYXRlICsgJyc7XG5cbiAgLyoqIFVzZWQgYXMgdGhlIHNpemUgd2hlbiBvcHRpbWl6YXRpb25zIGFyZSBlbmFibGVkIGZvciBsYXJnZSBhcnJheXMgKi9cbiAgdmFyIGxhcmdlQXJyYXlTaXplID0gNzU7XG5cbiAgLyoqIFVzZWQgYXMgdGhlIG1heCBzaXplIG9mIHRoZSBgYXJyYXlQb29sYCBhbmQgYG9iamVjdFBvb2xgICovXG4gIHZhciBtYXhQb29sU2l6ZSA9IDQwO1xuXG4gIC8qKiBVc2VkIHRvIG1hdGNoIGVtcHR5IHN0cmluZyBsaXRlcmFscyBpbiBjb21waWxlZCB0ZW1wbGF0ZSBzb3VyY2UgKi9cbiAgdmFyIHJlRW1wdHlTdHJpbmdMZWFkaW5nID0gL1xcYl9fcCBcXCs9ICcnOy9nLFxuICAgICAgcmVFbXB0eVN0cmluZ01pZGRsZSA9IC9cXGIoX19wIFxcKz0pICcnIFxcKy9nLFxuICAgICAgcmVFbXB0eVN0cmluZ1RyYWlsaW5nID0gLyhfX2VcXCguKj9cXCl8XFxiX190XFwpKSBcXCtcXG4nJzsvZztcblxuICAvKiogVXNlZCB0byBtYXRjaCBIVE1MIGVudGl0aWVzICovXG4gIHZhciByZUVzY2FwZWRIdG1sID0gLyYoPzphbXB8bHR8Z3R8cXVvdHwjMzkpOy9nO1xuXG4gIC8qKlxuICAgKiBVc2VkIHRvIG1hdGNoIEVTNiB0ZW1wbGF0ZSBkZWxpbWl0ZXJzXG4gICAqIGh0dHA6Ly9wZW9wbGUubW96aWxsYS5vcmcvfmpvcmVuZG9yZmYvZXM2LWRyYWZ0Lmh0bWwjc2VjLTcuOC42XG4gICAqL1xuICB2YXIgcmVFc1RlbXBsYXRlID0gL1xcJFxceyhbXlxcXFx9XSooPzpcXFxcLlteXFxcXH1dKikqKVxcfS9nO1xuXG4gIC8qKiBVc2VkIHRvIG1hdGNoIHJlZ2V4cCBmbGFncyBmcm9tIHRoZWlyIGNvZXJjZWQgc3RyaW5nIHZhbHVlcyAqL1xuICB2YXIgcmVGbGFncyA9IC9cXHcqJC87XG5cbiAgLyoqIFVzZWQgdG8gbWF0Y2ggXCJpbnRlcnBvbGF0ZVwiIHRlbXBsYXRlIGRlbGltaXRlcnMgKi9cbiAgdmFyIHJlSW50ZXJwb2xhdGUgPSAvPCU9KFtcXHNcXFNdKz8pJT4vZztcblxuICAvKiogVXNlZCB0byBkZXRlY3QgZnVuY3Rpb25zIGNvbnRhaW5pbmcgYSBgdGhpc2AgcmVmZXJlbmNlICovXG4gIHZhciByZVRoaXMgPSAocmVUaGlzID0gL1xcYnRoaXNcXGIvKSAmJiByZVRoaXMudGVzdChmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pICYmIHJlVGhpcztcblxuICAvKiogVXNlZCB0byBlbnN1cmUgY2FwdHVyaW5nIG9yZGVyIG9mIHRlbXBsYXRlIGRlbGltaXRlcnMgKi9cbiAgdmFyIHJlTm9NYXRjaCA9IC8oJF4pLztcblxuICAvKiogVXNlZCB0byBtYXRjaCBIVE1MIGNoYXJhY3RlcnMgKi9cbiAgdmFyIHJlVW5lc2NhcGVkSHRtbCA9IC9bJjw+XCInXS9nO1xuXG4gIC8qKiBVc2VkIHRvIG1hdGNoIHVuZXNjYXBlZCBjaGFyYWN0ZXJzIGluIGNvbXBpbGVkIHN0cmluZyBsaXRlcmFscyAqL1xuICB2YXIgcmVVbmVzY2FwZWRTdHJpbmcgPSAvWydcXG5cXHJcXHRcXHUyMDI4XFx1MjAyOVxcXFxdL2c7XG5cbiAgLyoqIFVzZWQgdG8gbWFrZSB0ZW1wbGF0ZSBzb3VyY2VVUkxzIGVhc2llciB0byBpZGVudGlmeSAqL1xuICB2YXIgdGVtcGxhdGVDb3VudGVyID0gMDtcblxuICAvKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHNob3J0Y3V0cyAqL1xuICB2YXIgYXJnc0NsYXNzID0gJ1tvYmplY3QgQXJndW1lbnRzXScsXG4gICAgICBhcnJheUNsYXNzID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICAgIGJvb2xDbGFzcyA9ICdbb2JqZWN0IEJvb2xlYW5dJyxcbiAgICAgIGRhdGVDbGFzcyA9ICdbb2JqZWN0IERhdGVdJyxcbiAgICAgIGVycm9yQ2xhc3MgPSAnW29iamVjdCBFcnJvcl0nLFxuICAgICAgZnVuY0NsYXNzID0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcbiAgICAgIG51bWJlckNsYXNzID0gJ1tvYmplY3QgTnVtYmVyXScsXG4gICAgICBvYmplY3RDbGFzcyA9ICdbb2JqZWN0IE9iamVjdF0nLFxuICAgICAgcmVnZXhwQ2xhc3MgPSAnW29iamVjdCBSZWdFeHBdJyxcbiAgICAgIHN0cmluZ0NsYXNzID0gJ1tvYmplY3QgU3RyaW5nXSc7XG5cbiAgLyoqIFVzZWQgdG8gZGV0ZXJtaW5lIGlmIHZhbHVlcyBhcmUgb2YgdGhlIGxhbmd1YWdlIHR5cGUgT2JqZWN0ICovXG4gIHZhciBvYmplY3RUeXBlcyA9IHtcbiAgICAnYm9vbGVhbic6IGZhbHNlLFxuICAgICdmdW5jdGlvbic6IHRydWUsXG4gICAgJ29iamVjdCc6IHRydWUsXG4gICAgJ251bWJlcic6IGZhbHNlLFxuICAgICdzdHJpbmcnOiBmYWxzZSxcbiAgICAndW5kZWZpbmVkJzogZmFsc2VcbiAgfTtcblxuICAvKiogVXNlZCB0byBlc2NhcGUgY2hhcmFjdGVycyBmb3IgaW5jbHVzaW9uIGluIGNvbXBpbGVkIHN0cmluZyBsaXRlcmFscyAqL1xuICB2YXIgc3RyaW5nRXNjYXBlcyA9IHtcbiAgICAnXFxcXCc6ICdcXFxcJyxcbiAgICBcIidcIjogXCInXCIsXG4gICAgJ1xcbic6ICduJyxcbiAgICAnXFxyJzogJ3InLFxuICAgICdcXHQnOiAndCcsXG4gICAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAgICdcXHUyMDI5JzogJ3UyMDI5J1xuICB9O1xuXG4gIC8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZXhwb3J0c2AgKi9cbiAgdmFyIGZyZWVFeHBvcnRzID0gb2JqZWN0VHlwZXNbdHlwZW9mIGV4cG9ydHNdICYmIGV4cG9ydHM7XG5cbiAgLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBtb2R1bGVgICovXG4gIHZhciBmcmVlTW9kdWxlID0gb2JqZWN0VHlwZXNbdHlwZW9mIG1vZHVsZV0gJiYgbW9kdWxlICYmIG1vZHVsZS5leHBvcnRzID09IGZyZWVFeHBvcnRzICYmIG1vZHVsZTtcblxuICAvKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYGdsb2JhbGAsIGZyb20gTm9kZS5qcyBvciBCcm93c2VyaWZpZWQgY29kZSwgYW5kIHVzZSBpdCBhcyBgd2luZG93YCAqL1xuICB2YXIgZnJlZUdsb2JhbCA9IG9iamVjdFR5cGVzW3R5cGVvZiBnbG9iYWxdICYmIGdsb2JhbDtcbiAgaWYgKGZyZWVHbG9iYWwgJiYgKGZyZWVHbG9iYWwuZ2xvYmFsID09PSBmcmVlR2xvYmFsIHx8IGZyZWVHbG9iYWwud2luZG93ID09PSBmcmVlR2xvYmFsKSkge1xuICAgIHdpbmRvdyA9IGZyZWVHbG9iYWw7XG4gIH1cblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogR2V0cyBhbiBhcnJheSBmcm9tIHRoZSBhcnJheSBwb29sIG9yIGNyZWF0ZXMgYSBuZXcgb25lIGlmIHRoZSBwb29sIGlzIGVtcHR5LlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcmV0dXJucyB7QXJyYXl9IFRoZSBhcnJheSBmcm9tIHRoZSBwb29sLlxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0QXJyYXkoKSB7XG4gICAgcmV0dXJuIGFycmF5UG9vbC5wb3AoKSB8fCBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFuIG9iamVjdCBmcm9tIHRoZSBvYmplY3QgcG9vbCBvciBjcmVhdGVzIGEgbmV3IG9uZSBpZiB0aGUgcG9vbCBpcyBlbXB0eS5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHJldHVybnMge09iamVjdH0gVGhlIG9iamVjdCBmcm9tIHRoZSBwb29sLlxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0T2JqZWN0KCkge1xuICAgIHJldHVybiBvYmplY3RQb29sLnBvcCgpIHx8IHtcbiAgICAgICdhcnJheSc6IG51bGwsXG4gICAgICAnY2FjaGUnOiBudWxsLFxuICAgICAgJ2ZhbHNlJzogZmFsc2UsXG4gICAgICAnbGVhZGluZyc6IGZhbHNlLFxuICAgICAgJ21heFdhaXQnOiAwLFxuICAgICAgJ251bGwnOiBmYWxzZSxcbiAgICAgICdudW1iZXInOiBudWxsLFxuICAgICAgJ29iamVjdCc6IG51bGwsXG4gICAgICAncHVzaCc6IG51bGwsXG4gICAgICAnc3RyaW5nJzogbnVsbCxcbiAgICAgICd0cmFpbGluZyc6IGZhbHNlLFxuICAgICAgJ3RydWUnOiBmYWxzZSxcbiAgICAgICd1bmRlZmluZWQnOiBmYWxzZVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQSBuby1vcGVyYXRpb24gZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBub29wKCkge1xuICAgIC8vIG5vIG9wZXJhdGlvbiBwZXJmb3JtZWRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWxlYXNlcyB0aGUgZ2l2ZW4gYGFycmF5YCBiYWNrIHRvIHRoZSBhcnJheSBwb29sLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0FycmF5fSBbYXJyYXldIFRoZSBhcnJheSB0byByZWxlYXNlLlxuICAgKi9cbiAgZnVuY3Rpb24gcmVsZWFzZUFycmF5KGFycmF5KSB7XG4gICAgYXJyYXkubGVuZ3RoID0gMDtcbiAgICBpZiAoYXJyYXlQb29sLmxlbmd0aCA8IG1heFBvb2xTaXplKSB7XG4gICAgICBhcnJheVBvb2wucHVzaChhcnJheSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbGVhc2VzIHRoZSBnaXZlbiBgb2JqZWN0YCBiYWNrIHRvIHRoZSBvYmplY3QgcG9vbC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvYmplY3RdIFRoZSBvYmplY3QgdG8gcmVsZWFzZS5cbiAgICovXG4gIGZ1bmN0aW9uIHJlbGVhc2VPYmplY3Qob2JqZWN0KSB7XG4gICAgdmFyIGNhY2hlID0gb2JqZWN0LmNhY2hlO1xuICAgIGlmIChjYWNoZSkge1xuICAgICAgcmVsZWFzZU9iamVjdChjYWNoZSk7XG4gICAgfVxuICAgIG9iamVjdC5hcnJheSA9IG9iamVjdC5jYWNoZSA9b2JqZWN0Lm9iamVjdCA9IG9iamVjdC5udW1iZXIgPSBvYmplY3Quc3RyaW5nID1udWxsO1xuICAgIGlmIChvYmplY3RQb29sLmxlbmd0aCA8IG1heFBvb2xTaXplKSB7XG4gICAgICBvYmplY3RQb29sLnB1c2gob2JqZWN0KTtcbiAgICB9XG4gIH1cblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogVXNlZCBmb3IgYEFycmF5YCBtZXRob2QgcmVmZXJlbmNlcy5cbiAgICpcbiAgICogTm9ybWFsbHkgYEFycmF5LnByb3RvdHlwZWAgd291bGQgc3VmZmljZSwgaG93ZXZlciwgdXNpbmcgYW4gYXJyYXkgbGl0ZXJhbFxuICAgKiBhdm9pZHMgaXNzdWVzIGluIE5hcndoYWwuXG4gICAqL1xuICB2YXIgYXJyYXlSZWYgPSBbXTtcblxuICAvKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzICovXG4gIHZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGUsXG4gICAgICBzdHJpbmdQcm90byA9IFN0cmluZy5wcm90b3R5cGU7XG5cbiAgLyoqIFVzZWQgdG8gcmVzdG9yZSB0aGUgb3JpZ2luYWwgYF9gIHJlZmVyZW5jZSBpbiBgbm9Db25mbGljdGAgKi9cbiAgdmFyIG9sZERhc2ggPSB3aW5kb3cuXztcblxuICAvKiogVXNlZCB0byBkZXRlY3QgaWYgYSBtZXRob2QgaXMgbmF0aXZlICovXG4gIHZhciByZU5hdGl2ZSA9IFJlZ0V4cCgnXicgK1xuICAgIFN0cmluZyhvYmplY3RQcm90by52YWx1ZU9mKVxuICAgICAgLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCAnXFxcXCQmJylcbiAgICAgIC5yZXBsYWNlKC92YWx1ZU9mfGZvciBbXlxcXV0rL2csICcuKz8nKSArICckJ1xuICApO1xuXG4gIC8qKiBOYXRpdmUgbWV0aG9kIHNob3J0Y3V0cyAqL1xuICB2YXIgY2VpbCA9IE1hdGguY2VpbCxcbiAgICAgIGNsZWFyVGltZW91dCA9IHdpbmRvdy5jbGVhclRpbWVvdXQsXG4gICAgICBjb25jYXQgPSBhcnJheVJlZi5jb25jYXQsXG4gICAgICBmbG9vciA9IE1hdGguZmxvb3IsXG4gICAgICBmblRvU3RyaW5nID0gRnVuY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nLFxuICAgICAgZ2V0UHJvdG90eXBlT2YgPSByZU5hdGl2ZS50ZXN0KGdldFByb3RvdHlwZU9mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKSAmJiBnZXRQcm90b3R5cGVPZixcbiAgICAgIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHksXG4gICAgICBwdXNoID0gYXJyYXlSZWYucHVzaCxcbiAgICAgIHByb3BlcnR5SXNFbnVtZXJhYmxlID0gb2JqZWN0UHJvdG8ucHJvcGVydHlJc0VudW1lcmFibGUsXG4gICAgICBzZXRUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQsXG4gICAgICB0b1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4gIC8qIE5hdGl2ZSBtZXRob2Qgc2hvcnRjdXRzIGZvciBtZXRob2RzIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzICovXG4gIHZhciBuYXRpdmVCaW5kID0gcmVOYXRpdmUudGVzdChuYXRpdmVCaW5kID0gdG9TdHJpbmcuYmluZCkgJiYgbmF0aXZlQmluZCxcbiAgICAgIG5hdGl2ZUNyZWF0ZSA9IHJlTmF0aXZlLnRlc3QobmF0aXZlQ3JlYXRlID0gIE9iamVjdC5jcmVhdGUpICYmIG5hdGl2ZUNyZWF0ZSxcbiAgICAgIG5hdGl2ZUlzQXJyYXkgPSByZU5hdGl2ZS50ZXN0KG5hdGl2ZUlzQXJyYXkgPSBBcnJheS5pc0FycmF5KSAmJiBuYXRpdmVJc0FycmF5LFxuICAgICAgbmF0aXZlSXNGaW5pdGUgPSB3aW5kb3cuaXNGaW5pdGUsXG4gICAgICBuYXRpdmVJc05hTiA9IHdpbmRvdy5pc05hTixcbiAgICAgIG5hdGl2ZUtleXMgPSByZU5hdGl2ZS50ZXN0KG5hdGl2ZUtleXMgPSBPYmplY3Qua2V5cykgJiYgbmF0aXZlS2V5cyxcbiAgICAgIG5hdGl2ZU1heCA9IE1hdGgubWF4LFxuICAgICAgbmF0aXZlTWluID0gTWF0aC5taW4sXG4gICAgICBuYXRpdmVSYW5kb20gPSBNYXRoLnJhbmRvbSxcbiAgICAgIG5hdGl2ZVNsaWNlID0gYXJyYXlSZWYuc2xpY2U7XG5cbiAgLyoqIERldGVjdCB2YXJpb3VzIGVudmlyb25tZW50cyAqL1xuICB2YXIgaXNJZU9wZXJhID0gcmVOYXRpdmUudGVzdCh3aW5kb3cuYXR0YWNoRXZlbnQpLFxuICAgICAgaXNWOCA9IG5hdGl2ZUJpbmQgJiYgIS9cXG58dHJ1ZS8udGVzdChuYXRpdmVCaW5kICsgaXNJZU9wZXJhKTtcblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGBsb2Rhc2hgIG9iamVjdCwgd2hpY2ggd3JhcHMgdGhlIGdpdmVuIGB2YWx1ZWAsIHRvIGVuYWJsZSBtZXRob2RcbiAgICogY2hhaW5pbmcuXG4gICAqXG4gICAqIEluIGFkZGl0aW9uIHRvIExvLURhc2ggbWV0aG9kcywgd3JhcHBlcnMgYWxzbyBoYXZlIHRoZSBmb2xsb3dpbmcgYEFycmF5YCBtZXRob2RzOlxuICAgKiBgY29uY2F0YCwgYGpvaW5gLCBgcG9wYCwgYHB1c2hgLCBgcmV2ZXJzZWAsIGBzaGlmdGAsIGBzbGljZWAsIGBzb3J0YCwgYHNwbGljZWAsXG4gICAqIGFuZCBgdW5zaGlmdGBcbiAgICpcbiAgICogQ2hhaW5pbmcgaXMgc3VwcG9ydGVkIGluIGN1c3RvbSBidWlsZHMgYXMgbG9uZyBhcyB0aGUgYHZhbHVlYCBtZXRob2QgaXNcbiAgICogaW1wbGljaXRseSBvciBleHBsaWNpdGx5IGluY2x1ZGVkIGluIHRoZSBidWlsZC5cbiAgICpcbiAgICogVGhlIGNoYWluYWJsZSB3cmFwcGVyIGZ1bmN0aW9ucyBhcmU6XG4gICAqIGBhZnRlcmAsIGBhc3NpZ25gLCBgYmluZGAsIGBiaW5kQWxsYCwgYGJpbmRLZXlgLCBgY2hhaW5gLCBgY29tcGFjdGAsXG4gICAqIGBjb21wb3NlYCwgYGNvbmNhdGAsIGBjb3VudEJ5YCwgYGNyZWF0ZUNhbGxiYWNrYCwgYGRlYm91bmNlYCwgYGRlZmF1bHRzYCxcbiAgICogYGRlZmVyYCwgYGRlbGF5YCwgYGRpZmZlcmVuY2VgLCBgZmlsdGVyYCwgYGZsYXR0ZW5gLCBgZm9yRWFjaGAsIGBmb3JJbmAsXG4gICAqIGBmb3JPd25gLCBgZnVuY3Rpb25zYCwgYGdyb3VwQnlgLCBgaW5pdGlhbGAsIGBpbnRlcnNlY3Rpb25gLCBgaW52ZXJ0YCxcbiAgICogYGludm9rZWAsIGBrZXlzYCwgYG1hcGAsIGBtYXhgLCBgbWVtb2l6ZWAsIGBtZXJnZWAsIGBtaW5gLCBgb2JqZWN0YCwgYG9taXRgLFxuICAgKiBgb25jZWAsIGBwYWlyc2AsIGBwYXJ0aWFsYCwgYHBhcnRpYWxSaWdodGAsIGBwaWNrYCwgYHBsdWNrYCwgYHB1c2hgLCBgcmFuZ2VgLFxuICAgKiBgcmVqZWN0YCwgYHJlc3RgLCBgcmV2ZXJzZWAsIGBzaHVmZmxlYCwgYHNsaWNlYCwgYHNvcnRgLCBgc29ydEJ5YCwgYHNwbGljZWAsXG4gICAqIGB0YXBgLCBgdGhyb3R0bGVgLCBgdGltZXNgLCBgdG9BcnJheWAsIGB0cmFuc2Zvcm1gLCBgdW5pb25gLCBgdW5pcWAsIGB1bnNoaWZ0YCxcbiAgICogYHVuemlwYCwgYHZhbHVlc2AsIGB3aGVyZWAsIGB3aXRob3V0YCwgYHdyYXBgLCBhbmQgYHppcGBcbiAgICpcbiAgICogVGhlIG5vbi1jaGFpbmFibGUgd3JhcHBlciBmdW5jdGlvbnMgYXJlOlxuICAgKiBgY2xvbmVgLCBgY2xvbmVEZWVwYCwgYGNvbnRhaW5zYCwgYGVzY2FwZWAsIGBldmVyeWAsIGBmaW5kYCwgYGhhc2AsXG4gICAqIGBpZGVudGl0eWAsIGBpbmRleE9mYCwgYGlzQXJndW1lbnRzYCwgYGlzQXJyYXlgLCBgaXNCb29sZWFuYCwgYGlzRGF0ZWAsXG4gICAqIGBpc0VsZW1lbnRgLCBgaXNFbXB0eWAsIGBpc0VxdWFsYCwgYGlzRmluaXRlYCwgYGlzRnVuY3Rpb25gLCBgaXNOYU5gLFxuICAgKiBgaXNOdWxsYCwgYGlzTnVtYmVyYCwgYGlzT2JqZWN0YCwgYGlzUGxhaW5PYmplY3RgLCBgaXNSZWdFeHBgLCBgaXNTdHJpbmdgLFxuICAgKiBgaXNVbmRlZmluZWRgLCBgam9pbmAsIGBsYXN0SW5kZXhPZmAsIGBtaXhpbmAsIGBub0NvbmZsaWN0YCwgYHBhcnNlSW50YCxcbiAgICogYHBvcGAsIGByYW5kb21gLCBgcmVkdWNlYCwgYHJlZHVjZVJpZ2h0YCwgYHJlc3VsdGAsIGBzaGlmdGAsIGBzaXplYCwgYHNvbWVgLFxuICAgKiBgc29ydGVkSW5kZXhgLCBgcnVuSW5Db250ZXh0YCwgYHRlbXBsYXRlYCwgYHVuZXNjYXBlYCwgYHVuaXF1ZUlkYCwgYW5kIGB2YWx1ZWBcbiAgICpcbiAgICogVGhlIHdyYXBwZXIgZnVuY3Rpb25zIGBmaXJzdGAgYW5kIGBsYXN0YCByZXR1cm4gd3JhcHBlZCB2YWx1ZXMgd2hlbiBgbmAgaXNcbiAgICogcGFzc2VkLCBvdGhlcndpc2UgdGhleSByZXR1cm4gdW53cmFwcGVkIHZhbHVlcy5cbiAgICpcbiAgICogQG5hbWUgX1xuICAgKiBAY29uc3RydWN0b3JcbiAgICogQGFsaWFzIGNoYWluXG4gICAqIEBjYXRlZ29yeSBDaGFpbmluZ1xuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZSBUaGUgdmFsdWUgdG8gd3JhcCBpbiBhIGBsb2Rhc2hgIGluc3RhbmNlLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGEgYGxvZGFzaGAgaW5zdGFuY2UuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHZhciB3cmFwcGVkID0gXyhbMSwgMiwgM10pO1xuICAgKlxuICAgKiAvLyByZXR1cm5zIGFuIHVud3JhcHBlZCB2YWx1ZVxuICAgKiB3cmFwcGVkLnJlZHVjZShmdW5jdGlvbihzdW0sIG51bSkge1xuICAgKiAgIHJldHVybiBzdW0gKyBudW07XG4gICAqIH0pO1xuICAgKiAvLyA9PiA2XG4gICAqXG4gICAqIC8vIHJldHVybnMgYSB3cmFwcGVkIHZhbHVlXG4gICAqIHZhciBzcXVhcmVzID0gd3JhcHBlZC5tYXAoZnVuY3Rpb24obnVtKSB7XG4gICAqICAgcmV0dXJuIG51bSAqIG51bTtcbiAgICogfSk7XG4gICAqXG4gICAqIF8uaXNBcnJheShzcXVhcmVzKTtcbiAgICogLy8gPT4gZmFsc2VcbiAgICpcbiAgICogXy5pc0FycmF5KHNxdWFyZXMudmFsdWUoKSk7XG4gICAqIC8vID0+IHRydWVcbiAgICovXG4gIGZ1bmN0aW9uIGxvZGFzaCgpIHtcbiAgICAvLyBubyBvcGVyYXRpb24gcGVyZm9ybWVkXG4gIH1cblxuICAvKipcbiAgICogQW4gb2JqZWN0IHVzZWQgdG8gZmxhZyBlbnZpcm9ubWVudHMgZmVhdHVyZXMuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQHR5cGUgT2JqZWN0XG4gICAqL1xuICB2YXIgc3VwcG9ydCA9IGxvZGFzaC5zdXBwb3J0ID0ge307XG5cbiAgLyoqXG4gICAqIERldGVjdCBpZiBgRnVuY3Rpb24jYmluZGAgZXhpc3RzIGFuZCBpcyBpbmZlcnJlZCB0byBiZSBmYXN0IChhbGwgYnV0IFY4KS5cbiAgICpcbiAgICogQG1lbWJlck9mIF8uc3VwcG9ydFxuICAgKiBAdHlwZSBCb29sZWFuXG4gICAqL1xuICBzdXBwb3J0LmZhc3RCaW5kID0gbmF0aXZlQmluZCAmJiAhaXNWODtcblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQsIHdoZW4gY2FsbGVkLCBpbnZva2VzIGBmdW5jYCB3aXRoIHRoZSBgdGhpc2AgYmluZGluZ1xuICAgKiBvZiBgdGhpc0FyZ2AgYW5kIHByZXBlbmRzIGFueSBgcGFydGlhbEFyZ3NgIHRvIHRoZSBhcmd1bWVudHMgcGFzc2VkIHRvIHRoZVxuICAgKiBib3VuZCBmdW5jdGlvbi5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtGdW5jdGlvbnxTdHJpbmd9IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGJpbmQgb3IgdGhlIG1ldGhvZCBuYW1lLlxuICAgKiBAcGFyYW0ge01peGVkfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBmdW5jYC5cbiAgICogQHBhcmFtIHtBcnJheX0gcGFydGlhbEFyZ3MgQW4gYXJyYXkgb2YgYXJndW1lbnRzIHRvIGJlIHBhcnRpYWxseSBhcHBsaWVkLlxuICAgKiBAcGFyYW0ge09iamVjdH0gW2lkaWNhdG9yXSBVc2VkIHRvIGluZGljYXRlIGJpbmRpbmcgYnkga2V5IG9yIHBhcnRpYWxseVxuICAgKiAgYXBwbHlpbmcgYXJndW1lbnRzIGZyb20gdGhlIHJpZ2h0LlxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBib3VuZCBmdW5jdGlvbi5cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZUJvdW5kKGZ1bmMsIHRoaXNBcmcsIHBhcnRpYWxBcmdzLCBpbmRpY2F0b3IpIHtcbiAgICB2YXIgaXNGdW5jID0gaXNGdW5jdGlvbihmdW5jKSxcbiAgICAgICAgaXNQYXJ0aWFsID0gIXBhcnRpYWxBcmdzLFxuICAgICAgICBrZXkgPSB0aGlzQXJnO1xuXG4gICAgLy8ganVnZ2xlIGFyZ3VtZW50c1xuICAgIGlmIChpc1BhcnRpYWwpIHtcbiAgICAgIHZhciByaWdodEluZGljYXRvciA9IGluZGljYXRvcjtcbiAgICAgIHBhcnRpYWxBcmdzID0gdGhpc0FyZztcbiAgICB9XG4gICAgZWxzZSBpZiAoIWlzRnVuYykge1xuICAgICAgaWYgKCFpbmRpY2F0b3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICAgIH1cbiAgICAgIHRoaXNBcmcgPSBmdW5jO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJvdW5kKCkge1xuICAgICAgLy8gYEZ1bmN0aW9uI2JpbmRgIHNwZWNcbiAgICAgIC8vIGh0dHA6Ly9lczUuZ2l0aHViLmNvbS8jeDE1LjMuNC41XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgICB0aGlzQmluZGluZyA9IGlzUGFydGlhbCA/IHRoaXMgOiB0aGlzQXJnO1xuXG4gICAgICBpZiAoIWlzRnVuYykge1xuICAgICAgICBmdW5jID0gdGhpc0FyZ1trZXldO1xuICAgICAgfVxuICAgICAgaWYgKHBhcnRpYWxBcmdzLmxlbmd0aCkge1xuICAgICAgICBhcmdzID0gYXJncy5sZW5ndGhcbiAgICAgICAgICA/IChhcmdzID0gbmF0aXZlU2xpY2UuY2FsbChhcmdzKSwgcmlnaHRJbmRpY2F0b3IgPyBhcmdzLmNvbmNhdChwYXJ0aWFsQXJncykgOiBwYXJ0aWFsQXJncy5jb25jYXQoYXJncykpXG4gICAgICAgICAgOiBwYXJ0aWFsQXJncztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzIGluc3RhbmNlb2YgYm91bmQpIHtcbiAgICAgICAgLy8gZW5zdXJlIGBuZXcgYm91bmRgIGlzIGFuIGluc3RhbmNlIG9mIGBmdW5jYFxuICAgICAgICB0aGlzQmluZGluZyA9IGNyZWF0ZU9iamVjdChmdW5jLnByb3RvdHlwZSk7XG5cbiAgICAgICAgLy8gbWltaWMgdGhlIGNvbnN0cnVjdG9yJ3MgYHJldHVybmAgYmVoYXZpb3JcbiAgICAgICAgLy8gaHR0cDovL2VzNS5naXRodWIuY29tLyN4MTMuMi4yXG4gICAgICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNCaW5kaW5nLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIGlzT2JqZWN0KHJlc3VsdCkgPyByZXN1bHQgOiB0aGlzQmluZGluZztcbiAgICAgIH1cbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXNCaW5kaW5nLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIGJvdW5kO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgb2JqZWN0IHdpdGggdGhlIHNwZWNpZmllZCBgcHJvdG90eXBlYC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IHByb3RvdHlwZSBUaGUgcHJvdG90eXBlIG9iamVjdC5cbiAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbmV3IG9iamVjdC5cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZU9iamVjdChwcm90b3R5cGUpIHtcbiAgICByZXR1cm4gaXNPYmplY3QocHJvdG90eXBlKSA/IG5hdGl2ZUNyZWF0ZShwcm90b3R5cGUpIDoge307XG4gIH1cblxuICAvKipcbiAgICogQSBmYWxsYmFjayBpbXBsZW1lbnRhdGlvbiBvZiBgaXNQbGFpbk9iamVjdGAgd2hpY2ggY2hlY2tzIGlmIGEgZ2l2ZW4gYHZhbHVlYFxuICAgKiBpcyBhbiBvYmplY3QgY3JlYXRlZCBieSB0aGUgYE9iamVjdGAgY29uc3RydWN0b3IsIGFzc3VtaW5nIG9iamVjdHMgY3JlYXRlZFxuICAgKiBieSB0aGUgYE9iamVjdGAgY29uc3RydWN0b3IgaGF2ZSBubyBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGFuZCB0aGF0XG4gICAqIHRoZXJlIGFyZSBubyBgT2JqZWN0LnByb3RvdHlwZWAgZXh0ZW5zaW9ucy5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAsIGlmIGB2YWx1ZWAgaXMgYSBwbGFpbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAgICovXG4gIGZ1bmN0aW9uIHNoaW1Jc1BsYWluT2JqZWN0KHZhbHVlKSB7XG4gICAgdmFyIGN0b3IsXG4gICAgICAgIHJlc3VsdDtcblxuICAgIC8vIGF2b2lkIG5vbiBPYmplY3Qgb2JqZWN0cywgYGFyZ3VtZW50c2Agb2JqZWN0cywgYW5kIERPTSBlbGVtZW50c1xuICAgIGlmICghKHZhbHVlICYmIHRvU3RyaW5nLmNhbGwodmFsdWUpID09IG9iamVjdENsYXNzKSB8fFxuICAgICAgICAoY3RvciA9IHZhbHVlLmNvbnN0cnVjdG9yLCBpc0Z1bmN0aW9uKGN0b3IpICYmICEoY3RvciBpbnN0YW5jZW9mIGN0b3IpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBJbiBtb3N0IGVudmlyb25tZW50cyBhbiBvYmplY3QncyBvd24gcHJvcGVydGllcyBhcmUgaXRlcmF0ZWQgYmVmb3JlXG4gICAgLy8gaXRzIGluaGVyaXRlZCBwcm9wZXJ0aWVzLiBJZiB0aGUgbGFzdCBpdGVyYXRlZCBwcm9wZXJ0eSBpcyBhbiBvYmplY3Qnc1xuICAgIC8vIG93biBwcm9wZXJ0eSB0aGVuIHRoZXJlIGFyZSBubyBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzLlxuICAgIGZvckluKHZhbHVlLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICByZXN1bHQgPSBrZXk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdCA9PT0gdW5kZWZpbmVkIHx8IGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIHJlc3VsdCk7XG4gIH1cblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYW4gYGFyZ3VtZW50c2Agb2JqZWN0LlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge0Jvb2xlYW59IFJldHVybnMgYHRydWVgLCBpZiB0aGUgYHZhbHVlYCBpcyBhbiBgYXJndW1lbnRzYCBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogKGZ1bmN0aW9uKCkgeyByZXR1cm4gXy5pc0FyZ3VtZW50cyhhcmd1bWVudHMpOyB9KSgxLCAyLCAzKTtcbiAgICogLy8gPT4gdHJ1ZVxuICAgKlxuICAgKiBfLmlzQXJndW1lbnRzKFsxLCAyLCAzXSk7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqL1xuICBmdW5jdGlvbiBpc0FyZ3VtZW50cyh2YWx1ZSkge1xuICAgIHJldHVybiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PSBhcmdzQ2xhc3M7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYW4gYXJyYXkuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAsIGlmIHRoZSBgdmFsdWVgIGlzIGFuIGFycmF5LCBlbHNlIGBmYWxzZWAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIChmdW5jdGlvbigpIHsgcmV0dXJuIF8uaXNBcnJheShhcmd1bWVudHMpOyB9KSgpO1xuICAgKiAvLyA9PiBmYWxzZVxuICAgKlxuICAgKiBfLmlzQXJyYXkoWzEsIDIsIDNdKTtcbiAgICogLy8gPT4gdHJ1ZVxuICAgKi9cbiAgdmFyIGlzQXJyYXkgPSBuYXRpdmVJc0FycmF5O1xuXG4gIC8qKlxuICAgKiBBIGZhbGxiYWNrIGltcGxlbWVudGF0aW9uIG9mIGBPYmplY3Qua2V5c2Agd2hpY2ggcHJvZHVjZXMgYW4gYXJyYXkgb2YgdGhlXG4gICAqIGdpdmVuIG9iamVjdCdzIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAdHlwZSBGdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICAgKi9cbiAgdmFyIHNoaW1LZXlzID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHZhciBpbmRleCwgaXRlcmFibGUgPSBvYmplY3QsIHJlc3VsdCA9IFtdO1xuICAgIGlmICghaXRlcmFibGUpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKCEob2JqZWN0VHlwZXNbdHlwZW9mIG9iamVjdF0pKSByZXR1cm4gcmVzdWx0OyAgICBcbiAgICAgIGZvciAoaW5kZXggaW4gaXRlcmFibGUpIHtcbiAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoaXRlcmFibGUsIGluZGV4KSkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKGluZGV4KTsgICAgXG4gICAgICAgIH1cbiAgICAgIH0gICAgXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFycmF5IGNvbXBvc2VkIG9mIHRoZSBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBvZiBgb2JqZWN0YC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiBfLmtleXMoeyAnb25lJzogMSwgJ3R3byc6IDIsICd0aHJlZSc6IDMgfSk7XG4gICAqIC8vID0+IFsnb25lJywgJ3R3bycsICd0aHJlZSddIChvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAgICovXG4gIHZhciBrZXlzID0gIW5hdGl2ZUtleXMgPyBzaGltS2V5cyA6IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIGlmICghaXNPYmplY3Qob2JqZWN0KSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICByZXR1cm4gbmF0aXZlS2V5cyhvYmplY3QpO1xuICB9O1xuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8qKlxuICAgKiBBc3NpZ25zIG93biBlbnVtZXJhYmxlIHByb3BlcnRpZXMgb2Ygc291cmNlIG9iamVjdChzKSB0byB0aGUgZGVzdGluYXRpb25cbiAgICogb2JqZWN0LiBTdWJzZXF1ZW50IHNvdXJjZXMgd2lsbCBvdmVyd3JpdGUgcHJvcGVydHkgYXNzaWdubWVudHMgb2YgcHJldmlvdXNcbiAgICogc291cmNlcy4gSWYgYSBgY2FsbGJhY2tgIGZ1bmN0aW9uIGlzIHBhc3NlZCwgaXQgd2lsbCBiZSBleGVjdXRlZCB0byBwcm9kdWNlXG4gICAqIHRoZSBhc3NpZ25lZCB2YWx1ZXMuIFRoZSBgY2FsbGJhY2tgIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoXG4gICAqIHR3byBhcmd1bWVudHM7IChvYmplY3RWYWx1ZSwgc291cmNlVmFsdWUpLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEB0eXBlIEZ1bmN0aW9uXG4gICAqIEBhbGlhcyBleHRlbmRcbiAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICAgKiBAcGFyYW0ge09iamVjdH0gW3NvdXJjZTEsIHNvdXJjZTIsIC4uLl0gVGhlIHNvdXJjZSBvYmplY3RzLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgYXNzaWduaW5nIHZhbHVlcy5cbiAgICogQHBhcmFtIHtNaXhlZH0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIF8uYXNzaWduKHsgJ25hbWUnOiAnbW9lJyB9LCB7ICdhZ2UnOiA0MCB9KTtcbiAgICogLy8gPT4geyAnbmFtZSc6ICdtb2UnLCAnYWdlJzogNDAgfVxuICAgKlxuICAgKiB2YXIgZGVmYXVsdHMgPSBfLnBhcnRpYWxSaWdodChfLmFzc2lnbiwgZnVuY3Rpb24oYSwgYikge1xuICAgKiAgIHJldHVybiB0eXBlb2YgYSA9PSAndW5kZWZpbmVkJyA/IGIgOiBhO1xuICAgKiB9KTtcbiAgICpcbiAgICogdmFyIGZvb2QgPSB7ICduYW1lJzogJ2FwcGxlJyB9O1xuICAgKiBkZWZhdWx0cyhmb29kLCB7ICduYW1lJzogJ2JhbmFuYScsICd0eXBlJzogJ2ZydWl0JyB9KTtcbiAgICogLy8gPT4geyAnbmFtZSc6ICdhcHBsZScsICd0eXBlJzogJ2ZydWl0JyB9XG4gICAqL1xuICB2YXIgYXNzaWduID0gZnVuY3Rpb24gKG9iamVjdCwgc291cmNlLCBndWFyZCkge1xuICAgIHZhciBpbmRleCwgaXRlcmFibGUgPSBvYmplY3QsIHJlc3VsdCA9IGl0ZXJhYmxlO1xuICAgIGlmICghaXRlcmFibGUpIHJldHVybiByZXN1bHQ7XG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgIGFyZ3NJbmRleCA9IDAsXG4gICAgICAgIGFyZ3NMZW5ndGggPSB0eXBlb2YgZ3VhcmQgPT0gJ251bWJlcicgPyAyIDogYXJncy5sZW5ndGg7XG4gICAgaWYgKGFyZ3NMZW5ndGggPiAzICYmIHR5cGVvZiBhcmdzW2FyZ3NMZW5ndGggLSAyXSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YXIgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soYXJnc1stLWFyZ3NMZW5ndGggLSAxXSwgYXJnc1thcmdzTGVuZ3RoLS1dLCAyKTtcbiAgICB9IGVsc2UgaWYgKGFyZ3NMZW5ndGggPiAyICYmIHR5cGVvZiBhcmdzW2FyZ3NMZW5ndGggLSAxXSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IGFyZ3NbLS1hcmdzTGVuZ3RoXTtcbiAgICB9XG4gICAgd2hpbGUgKCsrYXJnc0luZGV4IDwgYXJnc0xlbmd0aCkge1xuICAgICAgaXRlcmFibGUgPSBhcmdzW2FyZ3NJbmRleF07XG4gICAgICBpZiAoaXRlcmFibGUgJiYgb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSkgeyAgICBcbiAgICAgIHZhciBvd25JbmRleCA9IC0xLFxuICAgICAgICAgIG93blByb3BzID0gb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSAmJiBrZXlzKGl0ZXJhYmxlKSxcbiAgICAgICAgICBsZW5ndGggPSBvd25Qcm9wcyA/IG93blByb3BzLmxlbmd0aCA6IDA7XG5cbiAgICAgIHdoaWxlICgrK293bkluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIGluZGV4ID0gb3duUHJvcHNbb3duSW5kZXhdO1xuICAgICAgICByZXN1bHRbaW5kZXhdID0gY2FsbGJhY2sgPyBjYWxsYmFjayhyZXN1bHRbaW5kZXhdLCBpdGVyYWJsZVtpbmRleF0pIDogaXRlcmFibGVbaW5kZXhdOyAgICBcbiAgICAgIH0gICAgXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfTtcblxuICAvKipcbiAgICogQXNzaWducyBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIHNvdXJjZSBvYmplY3QocykgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAqIG9iamVjdCBmb3IgYWxsIGRlc3RpbmF0aW9uIHByb3BlcnRpZXMgdGhhdCByZXNvbHZlIHRvIGB1bmRlZmluZWRgLiBPbmNlIGFcbiAgICogcHJvcGVydHkgaXMgc2V0LCBhZGRpdGlvbmFsIGRlZmF1bHRzIG9mIHRoZSBzYW1lIHByb3BlcnR5IHdpbGwgYmUgaWdub3JlZC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAdHlwZSBGdW5jdGlvblxuICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbc291cmNlMSwgc291cmNlMiwgLi4uXSBUaGUgc291cmNlIG9iamVjdHMuXG4gICAqIEBwYXJhbS0ge09iamVjdH0gW2d1YXJkXSBBbGxvd3Mgd29ya2luZyB3aXRoIGBfLnJlZHVjZWAgd2l0aG91dCB1c2luZyBpdHNcbiAgICogIGNhbGxiYWNrJ3MgYGtleWAgYW5kIGBvYmplY3RgIGFyZ3VtZW50cyBhcyBzb3VyY2VzLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHZhciBmb29kID0geyAnbmFtZSc6ICdhcHBsZScgfTtcbiAgICogXy5kZWZhdWx0cyhmb29kLCB7ICduYW1lJzogJ2JhbmFuYScsICd0eXBlJzogJ2ZydWl0JyB9KTtcbiAgICogLy8gPT4geyAnbmFtZSc6ICdhcHBsZScsICd0eXBlJzogJ2ZydWl0JyB9XG4gICAqL1xuICB2YXIgZGVmYXVsdHMgPSBmdW5jdGlvbiAob2JqZWN0LCBzb3VyY2UsIGd1YXJkKSB7XG4gICAgdmFyIGluZGV4LCBpdGVyYWJsZSA9IG9iamVjdCwgcmVzdWx0ID0gaXRlcmFibGU7XG4gICAgaWYgKCFpdGVyYWJsZSkgcmV0dXJuIHJlc3VsdDtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgYXJnc0luZGV4ID0gMCxcbiAgICAgICAgYXJnc0xlbmd0aCA9IHR5cGVvZiBndWFyZCA9PSAnbnVtYmVyJyA/IDIgOiBhcmdzLmxlbmd0aDtcbiAgICB3aGlsZSAoKythcmdzSW5kZXggPCBhcmdzTGVuZ3RoKSB7XG4gICAgICBpdGVyYWJsZSA9IGFyZ3NbYXJnc0luZGV4XTtcbiAgICAgIGlmIChpdGVyYWJsZSAmJiBvYmplY3RUeXBlc1t0eXBlb2YgaXRlcmFibGVdKSB7ICAgIFxuICAgICAgdmFyIG93bkluZGV4ID0gLTEsXG4gICAgICAgICAgb3duUHJvcHMgPSBvYmplY3RUeXBlc1t0eXBlb2YgaXRlcmFibGVdICYmIGtleXMoaXRlcmFibGUpLFxuICAgICAgICAgIGxlbmd0aCA9IG93blByb3BzID8gb3duUHJvcHMubGVuZ3RoIDogMDtcblxuICAgICAgd2hpbGUgKCsrb3duSW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgaW5kZXggPSBvd25Qcm9wc1tvd25JbmRleF07XG4gICAgICAgIGlmICh0eXBlb2YgcmVzdWx0W2luZGV4XSA9PSAndW5kZWZpbmVkJykgcmVzdWx0W2luZGV4XSA9IGl0ZXJhYmxlW2luZGV4XTsgICAgXG4gICAgICB9ICAgIFxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH07XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGVzIG92ZXIgYG9iamVjdGAncyBvd24gYW5kIGluaGVyaXRlZCBlbnVtZXJhYmxlIHByb3BlcnRpZXMsIGV4ZWN1dGluZ1xuICAgKiB0aGUgYGNhbGxiYWNrYCBmb3IgZWFjaCBwcm9wZXJ0eS4gVGhlIGBjYWxsYmFja2AgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZFxuICAgKiBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzOyAodmFsdWUsIGtleSwgb2JqZWN0KS4gQ2FsbGJhY2tzIG1heSBleGl0IGl0ZXJhdGlvblxuICAgKiBlYXJseSBieSBleHBsaWNpdGx5IHJldHVybmluZyBgZmFsc2VgLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEB0eXBlIEZ1bmN0aW9uXG4gICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgKiBAcGFyYW0ge01peGVkfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIGZ1bmN0aW9uIERvZyhuYW1lKSB7XG4gICAqICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICogfVxuICAgKlxuICAgKiBEb2cucHJvdG90eXBlLmJhcmsgPSBmdW5jdGlvbigpIHtcbiAgICogICBhbGVydCgnV29vZiwgd29vZiEnKTtcbiAgICogfTtcbiAgICpcbiAgICogXy5mb3JJbihuZXcgRG9nKCdEYWdueScpLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAqICAgYWxlcnQoa2V5KTtcbiAgICogfSk7XG4gICAqIC8vID0+IGFsZXJ0cyAnbmFtZScgYW5kICdiYXJrJyAob3JkZXIgaXMgbm90IGd1YXJhbnRlZWQpXG4gICAqL1xuICB2YXIgZm9ySW4gPSBmdW5jdGlvbiAoY29sbGVjdGlvbiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICB2YXIgaW5kZXgsIGl0ZXJhYmxlID0gY29sbGVjdGlvbiwgcmVzdWx0ID0gaXRlcmFibGU7XG4gICAgaWYgKCFpdGVyYWJsZSkgcmV0dXJuIHJlc3VsdDtcbiAgICBpZiAoIW9iamVjdFR5cGVzW3R5cGVvZiBpdGVyYWJsZV0pIHJldHVybiByZXN1bHQ7XG4gICAgY2FsbGJhY2sgPSBjYWxsYmFjayAmJiB0eXBlb2YgdGhpc0FyZyA9PSAndW5kZWZpbmVkJyA/IGNhbGxiYWNrIDogbG9kYXNoLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnKTsgICAgXG4gICAgICBmb3IgKGluZGV4IGluIGl0ZXJhYmxlKSB7XG4gICAgICAgIGlmIChjYWxsYmFjayhpdGVyYWJsZVtpbmRleF0sIGluZGV4LCBjb2xsZWN0aW9uKSA9PT0gZmFsc2UpIHJldHVybiByZXN1bHQ7ICAgIFxuICAgICAgfSAgICBcbiAgICByZXR1cm4gcmVzdWx0XG4gIH07XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGVzIG92ZXIgYW4gb2JqZWN0J3Mgb3duIGVudW1lcmFibGUgcHJvcGVydGllcywgZXhlY3V0aW5nIHRoZSBgY2FsbGJhY2tgXG4gICAqIGZvciBlYWNoIHByb3BlcnR5LiBUaGUgYGNhbGxiYWNrYCBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZVxuICAgKiBhcmd1bWVudHM7ICh2YWx1ZSwga2V5LCBvYmplY3QpLiBDYWxsYmFja3MgbWF5IGV4aXQgaXRlcmF0aW9uIGVhcmx5IGJ5IGV4cGxpY2l0bHlcbiAgICogcmV0dXJuaW5nIGBmYWxzZWAuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQHR5cGUgRnVuY3Rpb25cbiAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAqIEBwYXJhbSB7TWl4ZWR9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogXy5mb3JPd24oeyAnMCc6ICd6ZXJvJywgJzEnOiAnb25lJywgJ2xlbmd0aCc6IDIgfSwgZnVuY3Rpb24obnVtLCBrZXkpIHtcbiAgICogICBhbGVydChrZXkpO1xuICAgKiB9KTtcbiAgICogLy8gPT4gYWxlcnRzICcwJywgJzEnLCBhbmQgJ2xlbmd0aCcgKG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICAgKi9cbiAgdmFyIGZvck93biA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIHZhciBpbmRleCwgaXRlcmFibGUgPSBjb2xsZWN0aW9uLCByZXN1bHQgPSBpdGVyYWJsZTtcbiAgICBpZiAoIWl0ZXJhYmxlKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmICghb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSkgcmV0dXJuIHJlc3VsdDtcbiAgICBjYWxsYmFjayA9IGNhbGxiYWNrICYmIHR5cGVvZiB0aGlzQXJnID09ICd1bmRlZmluZWQnID8gY2FsbGJhY2sgOiBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcpOyAgICBcbiAgICAgIHZhciBvd25JbmRleCA9IC0xLFxuICAgICAgICAgIG93blByb3BzID0gb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSAmJiBrZXlzKGl0ZXJhYmxlKSxcbiAgICAgICAgICBsZW5ndGggPSBvd25Qcm9wcyA/IG93blByb3BzLmxlbmd0aCA6IDA7XG5cbiAgICAgIHdoaWxlICgrK293bkluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIGluZGV4ID0gb3duUHJvcHNbb3duSW5kZXhdO1xuICAgICAgICBpZiAoY2FsbGJhY2soaXRlcmFibGVbaW5kZXhdLCBpbmRleCwgY29sbGVjdGlvbikgPT09IGZhbHNlKSByZXR1cm4gcmVzdWx0OyAgICBcbiAgICAgIH0gICAgXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc29ydGVkIGFycmF5IG9mIGFsbCBlbnVtZXJhYmxlIHByb3BlcnRpZXMsIG93biBhbmQgaW5oZXJpdGVkLFxuICAgKiBvZiBgb2JqZWN0YCB0aGF0IGhhdmUgZnVuY3Rpb24gdmFsdWVzLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBhbGlhcyBtZXRob2RzXG4gICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpbnNwZWN0LlxuICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBuZXcgYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMgdGhhdCBoYXZlIGZ1bmN0aW9uIHZhbHVlcy5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogXy5mdW5jdGlvbnMoXyk7XG4gICAqIC8vID0+IFsnYWxsJywgJ2FueScsICdiaW5kJywgJ2JpbmRBbGwnLCAnY2xvbmUnLCAnY29tcGFjdCcsICdjb21wb3NlJywgLi4uXVxuICAgKi9cbiAgZnVuY3Rpb24gZnVuY3Rpb25zKG9iamVjdCkge1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICBmb3JJbihvYmplY3QsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICByZXN1bHQucHVzaChrZXkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQuc29ydCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGEgZGVlcCBjb21wYXJpc29uIGJldHdlZW4gdHdvIHZhbHVlcyB0byBkZXRlcm1pbmUgaWYgdGhleSBhcmVcbiAgICogZXF1aXZhbGVudCB0byBlYWNoIG90aGVyLiBJZiBgY2FsbGJhY2tgIGlzIHBhc3NlZCwgaXQgd2lsbCBiZSBleGVjdXRlZCB0b1xuICAgKiBjb21wYXJlIHZhbHVlcy4gSWYgYGNhbGxiYWNrYCByZXR1cm5zIGB1bmRlZmluZWRgLCBjb21wYXJpc29ucyB3aWxsIGJlIGhhbmRsZWRcbiAgICogYnkgdGhlIG1ldGhvZCBpbnN0ZWFkLiBUaGUgYGNhbGxiYWNrYCBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aFxuICAgKiB0d28gYXJndW1lbnRzOyAoYSwgYikuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICogQHBhcmFtIHtNaXhlZH0gYSBUaGUgdmFsdWUgdG8gY29tcGFyZS5cbiAgICogQHBhcmFtIHtNaXhlZH0gYiBUaGUgb3RoZXIgdmFsdWUgdG8gY29tcGFyZS5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGNvbXBhcmluZyB2YWx1ZXMuXG4gICAqIEBwYXJhbSB7TWl4ZWR9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICogQHBhcmFtLSB7QXJyYXl9IFtzdGFja0E9W11dIFRyYWNrcyB0cmF2ZXJzZWQgYGFgIG9iamVjdHMuXG4gICAqIEBwYXJhbS0ge0FycmF5fSBbc3RhY2tCPVtdXSBUcmFja3MgdHJhdmVyc2VkIGBiYCBvYmplY3RzLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAsIGlmIHRoZSB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogdmFyIG1vZSA9IHsgJ25hbWUnOiAnbW9lJywgJ2FnZSc6IDQwIH07XG4gICAqIHZhciBjb3B5ID0geyAnbmFtZSc6ICdtb2UnLCAnYWdlJzogNDAgfTtcbiAgICpcbiAgICogbW9lID09IGNvcHk7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqXG4gICAqIF8uaXNFcXVhbChtb2UsIGNvcHkpO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqXG4gICAqIHZhciB3b3JkcyA9IFsnaGVsbG8nLCAnZ29vZGJ5ZSddO1xuICAgKiB2YXIgb3RoZXJXb3JkcyA9IFsnaGknLCAnZ29vZGJ5ZSddO1xuICAgKlxuICAgKiBfLmlzRXF1YWwod29yZHMsIG90aGVyV29yZHMsIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICogICB2YXIgcmVHcmVldCA9IC9eKD86aGVsbG98aGkpJC9pLFxuICAgKiAgICAgICBhR3JlZXQgPSBfLmlzU3RyaW5nKGEpICYmIHJlR3JlZXQudGVzdChhKSxcbiAgICogICAgICAgYkdyZWV0ID0gXy5pc1N0cmluZyhiKSAmJiByZUdyZWV0LnRlc3QoYik7XG4gICAqXG4gICAqICAgcmV0dXJuIChhR3JlZXQgfHwgYkdyZWV0KSA/IChhR3JlZXQgPT0gYkdyZWV0KSA6IHVuZGVmaW5lZDtcbiAgICogfSk7XG4gICAqIC8vID0+IHRydWVcbiAgICovXG4gIGZ1bmN0aW9uIGlzRXF1YWwoYSwgYiwgY2FsbGJhY2ssIHRoaXNBcmcsIHN0YWNrQSwgc3RhY2tCKSB7XG4gICAgLy8gdXNlZCB0byBpbmRpY2F0ZSB0aGF0IHdoZW4gY29tcGFyaW5nIG9iamVjdHMsIGBhYCBoYXMgYXQgbGVhc3QgdGhlIHByb3BlcnRpZXMgb2YgYGJgXG4gICAgdmFyIHdoZXJlSW5kaWNhdG9yID0gY2FsbGJhY2sgPT09IGluZGljYXRvck9iamVjdDtcbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicgJiYgIXdoZXJlSW5kaWNhdG9yKSB7XG4gICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMik7XG4gICAgICB2YXIgcmVzdWx0ID0gY2FsbGJhY2soYSwgYik7XG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gISFyZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGV4aXQgZWFybHkgZm9yIGlkZW50aWNhbCB2YWx1ZXNcbiAgICBpZiAoYSA9PT0gYikge1xuICAgICAgLy8gdHJlYXQgYCswYCB2cy4gYC0wYCBhcyBub3QgZXF1YWxcbiAgICAgIHJldHVybiBhICE9PSAwIHx8ICgxIC8gYSA9PSAxIC8gYik7XG4gICAgfVxuICAgIHZhciB0eXBlID0gdHlwZW9mIGEsXG4gICAgICAgIG90aGVyVHlwZSA9IHR5cGVvZiBiO1xuXG4gICAgLy8gZXhpdCBlYXJseSBmb3IgdW5saWtlIHByaW1pdGl2ZSB2YWx1ZXNcbiAgICBpZiAoYSA9PT0gYSAmJlxuICAgICAgICAoIWEgfHwgKHR5cGUgIT0gJ2Z1bmN0aW9uJyAmJiB0eXBlICE9ICdvYmplY3QnKSkgJiZcbiAgICAgICAgKCFiIHx8IChvdGhlclR5cGUgIT0gJ2Z1bmN0aW9uJyAmJiBvdGhlclR5cGUgIT0gJ29iamVjdCcpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBleGl0IGVhcmx5IGZvciBgbnVsbGAgYW5kIGB1bmRlZmluZWRgLCBhdm9pZGluZyBFUzMncyBGdW5jdGlvbiNjYWxsIGJlaGF2aW9yXG4gICAgLy8gaHR0cDovL2VzNS5naXRodWIuY29tLyN4MTUuMy40LjRcbiAgICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGEgPT09IGI7XG4gICAgfVxuICAgIC8vIGNvbXBhcmUgW1tDbGFzc11dIG5hbWVzXG4gICAgdmFyIGNsYXNzTmFtZSA9IHRvU3RyaW5nLmNhbGwoYSksXG4gICAgICAgIG90aGVyQ2xhc3MgPSB0b1N0cmluZy5jYWxsKGIpO1xuXG4gICAgaWYgKGNsYXNzTmFtZSA9PSBhcmdzQ2xhc3MpIHtcbiAgICAgIGNsYXNzTmFtZSA9IG9iamVjdENsYXNzO1xuICAgIH1cbiAgICBpZiAob3RoZXJDbGFzcyA9PSBhcmdzQ2xhc3MpIHtcbiAgICAgIG90aGVyQ2xhc3MgPSBvYmplY3RDbGFzcztcbiAgICB9XG4gICAgaWYgKGNsYXNzTmFtZSAhPSBvdGhlckNsYXNzKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHN3aXRjaCAoY2xhc3NOYW1lKSB7XG4gICAgICBjYXNlIGJvb2xDbGFzczpcbiAgICAgIGNhc2UgZGF0ZUNsYXNzOlxuICAgICAgICAvLyBjb2VyY2UgZGF0ZXMgYW5kIGJvb2xlYW5zIHRvIG51bWJlcnMsIGRhdGVzIHRvIG1pbGxpc2Vjb25kcyBhbmQgYm9vbGVhbnNcbiAgICAgICAgLy8gdG8gYDFgIG9yIGAwYCwgdHJlYXRpbmcgaW52YWxpZCBkYXRlcyBjb2VyY2VkIHRvIGBOYU5gIGFzIG5vdCBlcXVhbFxuICAgICAgICByZXR1cm4gK2EgPT0gK2I7XG5cbiAgICAgIGNhc2UgbnVtYmVyQ2xhc3M6XG4gICAgICAgIC8vIHRyZWF0IGBOYU5gIHZzLiBgTmFOYCBhcyBlcXVhbFxuICAgICAgICByZXR1cm4gKGEgIT0gK2EpXG4gICAgICAgICAgPyBiICE9ICtiXG4gICAgICAgICAgLy8gYnV0IHRyZWF0IGArMGAgdnMuIGAtMGAgYXMgbm90IGVxdWFsXG4gICAgICAgICAgOiAoYSA9PSAwID8gKDEgLyBhID09IDEgLyBiKSA6IGEgPT0gK2IpO1xuXG4gICAgICBjYXNlIHJlZ2V4cENsYXNzOlxuICAgICAgY2FzZSBzdHJpbmdDbGFzczpcbiAgICAgICAgLy8gY29lcmNlIHJlZ2V4ZXMgdG8gc3RyaW5ncyAoaHR0cDovL2VzNS5naXRodWIuY29tLyN4MTUuMTAuNi40KVxuICAgICAgICAvLyB0cmVhdCBzdHJpbmcgcHJpbWl0aXZlcyBhbmQgdGhlaXIgY29ycmVzcG9uZGluZyBvYmplY3QgaW5zdGFuY2VzIGFzIGVxdWFsXG4gICAgICAgIHJldHVybiBhID09IFN0cmluZyhiKTtcbiAgICB9XG4gICAgdmFyIGlzQXJyID0gY2xhc3NOYW1lID09IGFycmF5Q2xhc3M7XG4gICAgaWYgKCFpc0Fycikge1xuICAgICAgLy8gdW53cmFwIGFueSBgbG9kYXNoYCB3cmFwcGVkIHZhbHVlc1xuICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoYSwgJ19fd3JhcHBlZF9fICcpIHx8IGhhc093blByb3BlcnR5LmNhbGwoYiwgJ19fd3JhcHBlZF9fJykpIHtcbiAgICAgICAgcmV0dXJuIGlzRXF1YWwoYS5fX3dyYXBwZWRfXyB8fCBhLCBiLl9fd3JhcHBlZF9fIHx8IGIsIGNhbGxiYWNrLCB0aGlzQXJnLCBzdGFja0EsIHN0YWNrQik7XG4gICAgICB9XG4gICAgICAvLyBleGl0IGZvciBmdW5jdGlvbnMgYW5kIERPTSBub2Rlc1xuICAgICAgaWYgKGNsYXNzTmFtZSAhPSBvYmplY3RDbGFzcykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyBpbiBvbGRlciB2ZXJzaW9ucyBvZiBPcGVyYSwgYGFyZ3VtZW50c2Agb2JqZWN0cyBoYXZlIGBBcnJheWAgY29uc3RydWN0b3JzXG4gICAgICB2YXIgY3RvckEgPSBhLmNvbnN0cnVjdG9yLFxuICAgICAgICAgIGN0b3JCID0gYi5jb25zdHJ1Y3RvcjtcblxuICAgICAgLy8gbm9uIGBPYmplY3RgIG9iamVjdCBpbnN0YW5jZXMgd2l0aCBkaWZmZXJlbnQgY29uc3RydWN0b3JzIGFyZSBub3QgZXF1YWxcbiAgICAgIGlmIChjdG9yQSAhPSBjdG9yQiAmJiAhKFxuICAgICAgICAgICAgaXNGdW5jdGlvbihjdG9yQSkgJiYgY3RvckEgaW5zdGFuY2VvZiBjdG9yQSAmJlxuICAgICAgICAgICAgaXNGdW5jdGlvbihjdG9yQikgJiYgY3RvckIgaW5zdGFuY2VvZiBjdG9yQlxuICAgICAgICAgICkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBhc3N1bWUgY3ljbGljIHN0cnVjdHVyZXMgYXJlIGVxdWFsXG4gICAgLy8gdGhlIGFsZ29yaXRobSBmb3IgZGV0ZWN0aW5nIGN5Y2xpYyBzdHJ1Y3R1cmVzIGlzIGFkYXB0ZWQgZnJvbSBFUyA1LjFcbiAgICAvLyBzZWN0aW9uIDE1LjEyLjMsIGFic3RyYWN0IG9wZXJhdGlvbiBgSk9gIChodHRwOi8vZXM1LmdpdGh1Yi5jb20vI3gxNS4xMi4zKVxuICAgIHZhciBpbml0ZWRTdGFjayA9ICFzdGFja0E7XG4gICAgc3RhY2tBIHx8IChzdGFja0EgPSBnZXRBcnJheSgpKTtcbiAgICBzdGFja0IgfHwgKHN0YWNrQiA9IGdldEFycmF5KCkpO1xuXG4gICAgdmFyIGxlbmd0aCA9IHN0YWNrQS5sZW5ndGg7XG4gICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICBpZiAoc3RhY2tBW2xlbmd0aF0gPT0gYSkge1xuICAgICAgICByZXR1cm4gc3RhY2tCW2xlbmd0aF0gPT0gYjtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIHNpemUgPSAwO1xuICAgIHJlc3VsdCA9IHRydWU7XG5cbiAgICAvLyBhZGQgYGFgIGFuZCBgYmAgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzXG4gICAgc3RhY2tBLnB1c2goYSk7XG4gICAgc3RhY2tCLnB1c2goYik7XG5cbiAgICAvLyByZWN1cnNpdmVseSBjb21wYXJlIG9iamVjdHMgYW5kIGFycmF5cyAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpXG4gICAgaWYgKGlzQXJyKSB7XG4gICAgICBsZW5ndGggPSBhLmxlbmd0aDtcbiAgICAgIHNpemUgPSBiLmxlbmd0aDtcblxuICAgICAgLy8gY29tcGFyZSBsZW5ndGhzIHRvIGRldGVybWluZSBpZiBhIGRlZXAgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnlcbiAgICAgIHJlc3VsdCA9IHNpemUgPT0gYS5sZW5ndGg7XG4gICAgICBpZiAoIXJlc3VsdCAmJiAhd2hlcmVJbmRpY2F0b3IpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICAgIC8vIGRlZXAgY29tcGFyZSB0aGUgY29udGVudHMsIGlnbm9yaW5nIG5vbi1udW1lcmljIHByb3BlcnRpZXNcbiAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgdmFyIGluZGV4ID0gbGVuZ3RoLFxuICAgICAgICAgICAgdmFsdWUgPSBiW3NpemVdO1xuXG4gICAgICAgIGlmICh3aGVyZUluZGljYXRvcikge1xuICAgICAgICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICAgICAgICBpZiAoKHJlc3VsdCA9IGlzRXF1YWwoYVtpbmRleF0sIHZhbHVlLCBjYWxsYmFjaywgdGhpc0FyZywgc3RhY2tBLCBzdGFja0IpKSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIShyZXN1bHQgPSBpc0VxdWFsKGFbc2l6ZV0sIHZhbHVlLCBjYWxsYmFjaywgdGhpc0FyZywgc3RhY2tBLCBzdGFja0IpKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICAvLyBkZWVwIGNvbXBhcmUgb2JqZWN0cyB1c2luZyBgZm9ySW5gLCBpbnN0ZWFkIG9mIGBmb3JPd25gLCB0byBhdm9pZCBgT2JqZWN0LmtleXNgXG4gICAgLy8gd2hpY2gsIGluIHRoaXMgY2FzZSwgaXMgbW9yZSBjb3N0bHlcbiAgICBmb3JJbihiLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBiKSB7XG4gICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChiLCBrZXkpKSB7XG4gICAgICAgIC8vIGNvdW50IHRoZSBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgICAgc2l6ZSsrO1xuICAgICAgICAvLyBkZWVwIGNvbXBhcmUgZWFjaCBwcm9wZXJ0eSB2YWx1ZS5cbiAgICAgICAgcmV0dXJuIChyZXN1bHQgPSBoYXNPd25Qcm9wZXJ0eS5jYWxsKGEsIGtleSkgJiYgaXNFcXVhbChhW2tleV0sIHZhbHVlLCBjYWxsYmFjaywgdGhpc0FyZywgc3RhY2tBLCBzdGFja0IpKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChyZXN1bHQgJiYgIXdoZXJlSW5kaWNhdG9yKSB7XG4gICAgICAvLyBlbnN1cmUgYm90aCBvYmplY3RzIGhhdmUgdGhlIHNhbWUgbnVtYmVyIG9mIHByb3BlcnRpZXNcbiAgICAgIGZvckluKGEsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIGEpIHtcbiAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoYSwga2V5KSkge1xuICAgICAgICAgIC8vIGBzaXplYCB3aWxsIGJlIGAtMWAgaWYgYGFgIGhhcyBtb3JlIHByb3BlcnRpZXMgdGhhbiBgYmBcbiAgICAgICAgICByZXR1cm4gKHJlc3VsdCA9IC0tc2l6ZSA+IC0xKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChpbml0ZWRTdGFjaykge1xuICAgICAgcmVsZWFzZUFycmF5KHN0YWNrQSk7XG4gICAgICByZWxlYXNlQXJyYXkoc3RhY2tCKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge0Jvb2xlYW59IFJldHVybnMgYHRydWVgLCBpZiB0aGUgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIF8uaXNGdW5jdGlvbihfKTtcbiAgICogLy8gPT4gdHJ1ZVxuICAgKi9cbiAgZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGUgbGFuZ3VhZ2UgdHlwZSBvZiBPYmplY3QuXG4gICAqIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge0Jvb2xlYW59IFJldHVybnMgYHRydWVgLCBpZiB0aGUgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogXy5pc09iamVjdCh7fSk7XG4gICAqIC8vID0+IHRydWVcbiAgICpcbiAgICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqXG4gICAqIF8uaXNPYmplY3QoMSk7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqL1xuICBmdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAgIC8vIGNoZWNrIGlmIHRoZSB2YWx1ZSBpcyB0aGUgRUNNQVNjcmlwdCBsYW5ndWFnZSB0eXBlIG9mIE9iamVjdFxuICAgIC8vIGh0dHA6Ly9lczUuZ2l0aHViLmNvbS8jeDhcbiAgICAvLyBhbmQgYXZvaWQgYSBWOCBidWdcbiAgICAvLyBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0yMjkxXG4gICAgcmV0dXJuICEhKHZhbHVlICYmIG9iamVjdFR5cGVzW3R5cGVvZiB2YWx1ZV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIGdpdmVuIGB2YWx1ZWAgaXMgYW4gb2JqZWN0IGNyZWF0ZWQgYnkgdGhlIGBPYmplY3RgIGNvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge0Jvb2xlYW59IFJldHVybnMgYHRydWVgLCBpZiBgdmFsdWVgIGlzIGEgcGxhaW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIGZ1bmN0aW9uIFN0b29nZShuYW1lLCBhZ2UpIHtcbiAgICogICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgKiAgIHRoaXMuYWdlID0gYWdlO1xuICAgKiB9XG4gICAqXG4gICAqIF8uaXNQbGFpbk9iamVjdChuZXcgU3Rvb2dlKCdtb2UnLCA0MCkpO1xuICAgKiAvLyA9PiBmYWxzZVxuICAgKlxuICAgKiBfLmlzUGxhaW5PYmplY3QoWzEsIDIsIDNdKTtcbiAgICogLy8gPT4gZmFsc2VcbiAgICpcbiAgICogXy5pc1BsYWluT2JqZWN0KHsgJ25hbWUnOiAnbW9lJywgJ2FnZSc6IDQwIH0pO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqL1xuICB2YXIgaXNQbGFpbk9iamVjdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgaWYgKCEodmFsdWUgJiYgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gb2JqZWN0Q2xhc3MpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciB2YWx1ZU9mID0gdmFsdWUudmFsdWVPZixcbiAgICAgICAgb2JqUHJvdG8gPSB0eXBlb2YgdmFsdWVPZiA9PSAnZnVuY3Rpb24nICYmIChvYmpQcm90byA9IGdldFByb3RvdHlwZU9mKHZhbHVlT2YpKSAmJiBnZXRQcm90b3R5cGVPZihvYmpQcm90byk7XG5cbiAgICByZXR1cm4gb2JqUHJvdG9cbiAgICAgID8gKHZhbHVlID09IG9ialByb3RvIHx8IGdldFByb3RvdHlwZU9mKHZhbHVlKSA9PSBvYmpQcm90bylcbiAgICAgIDogc2hpbUlzUGxhaW5PYmplY3QodmFsdWUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHN0cmluZy5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBSZXR1cm5zIGB0cnVlYCwgaWYgdGhlIGB2YWx1ZWAgaXMgYSBzdHJpbmcsIGVsc2UgYGZhbHNlYC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogXy5pc1N0cmluZygnbW9lJyk7XG4gICAqIC8vID0+IHRydWVcbiAgICovXG4gIGZ1bmN0aW9uIGlzU3RyaW5nKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJyB8fCB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PSBzdHJpbmdDbGFzcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWN1cnNpdmVseSBtZXJnZXMgb3duIGVudW1lcmFibGUgcHJvcGVydGllcyBvZiB0aGUgc291cmNlIG9iamVjdChzKSwgdGhhdFxuICAgKiBkb24ndCByZXNvbHZlIHRvIGB1bmRlZmluZWRgLCBpbnRvIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuIFN1YnNlcXVlbnQgc291cmNlc1xuICAgKiB3aWxsIG92ZXJ3cml0ZSBwcm9wZXJ0eSBhc3NpZ25tZW50cyBvZiBwcmV2aW91cyBzb3VyY2VzLiBJZiBhIGBjYWxsYmFja2AgZnVuY3Rpb25cbiAgICogaXMgcGFzc2VkLCBpdCB3aWxsIGJlIGV4ZWN1dGVkIHRvIHByb2R1Y2UgdGhlIG1lcmdlZCB2YWx1ZXMgb2YgdGhlIGRlc3RpbmF0aW9uXG4gICAqIGFuZCBzb3VyY2UgcHJvcGVydGllcy4gSWYgYGNhbGxiYWNrYCByZXR1cm5zIGB1bmRlZmluZWRgLCBtZXJnaW5nIHdpbGwgYmVcbiAgICogaGFuZGxlZCBieSB0aGUgbWV0aG9kIGluc3RlYWQuIFRoZSBgY2FsbGJhY2tgIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmRcbiAgICogaW52b2tlZCB3aXRoIHR3byBhcmd1bWVudHM7IChvYmplY3RWYWx1ZSwgc291cmNlVmFsdWUpLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAgICogQHBhcmFtIHtPYmplY3R9IFtzb3VyY2UxLCBzb3VyY2UyLCAuLi5dIFRoZSBzb3VyY2Ugb2JqZWN0cy5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIG1lcmdpbmcgcHJvcGVydGllcy5cbiAgICogQHBhcmFtIHtNaXhlZH0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgKiBAcGFyYW0tIHtPYmplY3R9IFtkZWVwSW5kaWNhdG9yXSBJbmRpY2F0ZXMgdGhhdCBgc3RhY2tBYCBhbmQgYHN0YWNrQmAgYXJlXG4gICAqICBhcnJheXMgb2YgdHJhdmVyc2VkIG9iamVjdHMsIGluc3RlYWQgb2Ygc291cmNlIG9iamVjdHMuXG4gICAqIEBwYXJhbS0ge0FycmF5fSBbc3RhY2tBPVtdXSBUcmFja3MgdHJhdmVyc2VkIHNvdXJjZSBvYmplY3RzLlxuICAgKiBAcGFyYW0tIHtBcnJheX0gW3N0YWNrQj1bXV0gQXNzb2NpYXRlcyB2YWx1ZXMgd2l0aCBzb3VyY2UgY291bnRlcnBhcnRzLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHZhciBuYW1lcyA9IHtcbiAgICogICAnc3Rvb2dlcyc6IFtcbiAgICogICAgIHsgJ25hbWUnOiAnbW9lJyB9LFxuICAgKiAgICAgeyAnbmFtZSc6ICdsYXJyeScgfVxuICAgKiAgIF1cbiAgICogfTtcbiAgICpcbiAgICogdmFyIGFnZXMgPSB7XG4gICAqICAgJ3N0b29nZXMnOiBbXG4gICAqICAgICB7ICdhZ2UnOiA0MCB9LFxuICAgKiAgICAgeyAnYWdlJzogNTAgfVxuICAgKiAgIF1cbiAgICogfTtcbiAgICpcbiAgICogXy5tZXJnZShuYW1lcywgYWdlcyk7XG4gICAqIC8vID0+IHsgJ3N0b29nZXMnOiBbeyAnbmFtZSc6ICdtb2UnLCAnYWdlJzogNDAgfSwgeyAnbmFtZSc6ICdsYXJyeScsICdhZ2UnOiA1MCB9XSB9XG4gICAqXG4gICAqIHZhciBmb29kID0ge1xuICAgKiAgICdmcnVpdHMnOiBbJ2FwcGxlJ10sXG4gICAqICAgJ3ZlZ2V0YWJsZXMnOiBbJ2JlZXQnXVxuICAgKiB9O1xuICAgKlxuICAgKiB2YXIgb3RoZXJGb29kID0ge1xuICAgKiAgICdmcnVpdHMnOiBbJ2JhbmFuYSddLFxuICAgKiAgICd2ZWdldGFibGVzJzogWydjYXJyb3QnXVxuICAgKiB9O1xuICAgKlxuICAgKiBfLm1lcmdlKGZvb2QsIG90aGVyRm9vZCwgZnVuY3Rpb24oYSwgYikge1xuICAgKiAgIHJldHVybiBfLmlzQXJyYXkoYSkgPyBhLmNvbmNhdChiKSA6IHVuZGVmaW5lZDtcbiAgICogfSk7XG4gICAqIC8vID0+IHsgJ2ZydWl0cyc6IFsnYXBwbGUnLCAnYmFuYW5hJ10sICd2ZWdldGFibGVzJzogWydiZWV0JywgJ2NhcnJvdF0gfVxuICAgKi9cbiAgZnVuY3Rpb24gbWVyZ2Uob2JqZWN0LCBzb3VyY2UsIGRlZXBJbmRpY2F0b3IpIHtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgaW5kZXggPSAwLFxuICAgICAgICBsZW5ndGggPSAyO1xuXG4gICAgaWYgKCFpc09iamVjdChvYmplY3QpKSB7XG4gICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH1cbiAgICBpZiAoZGVlcEluZGljYXRvciA9PT0gaW5kaWNhdG9yT2JqZWN0KSB7XG4gICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzWzNdLFxuICAgICAgICAgIHN0YWNrQSA9IGFyZ3NbNF0sXG4gICAgICAgICAgc3RhY2tCID0gYXJnc1s1XTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGluaXRlZFN0YWNrID0gdHJ1ZTtcbiAgICAgIHN0YWNrQSA9IGdldEFycmF5KCk7XG4gICAgICBzdGFja0IgPSBnZXRBcnJheSgpO1xuXG4gICAgICAvLyBhbGxvd3Mgd29ya2luZyB3aXRoIGBfLnJlZHVjZWAgYW5kIGBfLnJlZHVjZVJpZ2h0YCB3aXRob3V0XG4gICAgICAvLyB1c2luZyB0aGVpciBgY2FsbGJhY2tgIGFyZ3VtZW50cywgYGluZGV4fGtleWAgYW5kIGBjb2xsZWN0aW9uYFxuICAgICAgaWYgKHR5cGVvZiBkZWVwSW5kaWNhdG9yICE9ICdudW1iZXInKSB7XG4gICAgICAgIGxlbmd0aCA9IGFyZ3MubGVuZ3RoO1xuICAgICAgfVxuICAgICAgaWYgKGxlbmd0aCA+IDMgJiYgdHlwZW9mIGFyZ3NbbGVuZ3RoIC0gMl0gPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhhcmdzWy0tbGVuZ3RoIC0gMV0sIGFyZ3NbbGVuZ3RoLS1dLCAyKTtcbiAgICAgIH0gZWxzZSBpZiAobGVuZ3RoID4gMiAmJiB0eXBlb2YgYXJnc1tsZW5ndGggLSAxXSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNhbGxiYWNrID0gYXJnc1stLWxlbmd0aF07XG4gICAgICB9XG4gICAgfVxuICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAoaXNBcnJheShhcmdzW2luZGV4XSkgPyBmb3JFYWNoIDogZm9yT3duKShhcmdzW2luZGV4XSwgZnVuY3Rpb24oc291cmNlLCBrZXkpIHtcbiAgICAgICAgdmFyIGZvdW5kLFxuICAgICAgICAgICAgaXNBcnIsXG4gICAgICAgICAgICByZXN1bHQgPSBzb3VyY2UsXG4gICAgICAgICAgICB2YWx1ZSA9IG9iamVjdFtrZXldO1xuXG4gICAgICAgIGlmIChzb3VyY2UgJiYgKChpc0FyciA9IGlzQXJyYXkoc291cmNlKSkgfHwgaXNQbGFpbk9iamVjdChzb3VyY2UpKSkge1xuICAgICAgICAgIC8vIGF2b2lkIG1lcmdpbmcgcHJldmlvdXNseSBtZXJnZWQgY3ljbGljIHNvdXJjZXNcbiAgICAgICAgICB2YXIgc3RhY2tMZW5ndGggPSBzdGFja0EubGVuZ3RoO1xuICAgICAgICAgIHdoaWxlIChzdGFja0xlbmd0aC0tKSB7XG4gICAgICAgICAgICBpZiAoKGZvdW5kID0gc3RhY2tBW3N0YWNrTGVuZ3RoXSA9PSBzb3VyY2UpKSB7XG4gICAgICAgICAgICAgIHZhbHVlID0gc3RhY2tCW3N0YWNrTGVuZ3RoXTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgIHZhciBpc1NoYWxsb3c7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2sodmFsdWUsIHNvdXJjZSk7XG4gICAgICAgICAgICAgIGlmICgoaXNTaGFsbG93ID0gdHlwZW9mIHJlc3VsdCAhPSAndW5kZWZpbmVkJykpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHJlc3VsdDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFpc1NoYWxsb3cpIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSBpc0FyclxuICAgICAgICAgICAgICAgID8gKGlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiBbXSlcbiAgICAgICAgICAgICAgICA6IChpc1BsYWluT2JqZWN0KHZhbHVlKSA/IHZhbHVlIDoge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gYWRkIGBzb3VyY2VgIGFuZCBhc3NvY2lhdGVkIGB2YWx1ZWAgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzXG4gICAgICAgICAgICBzdGFja0EucHVzaChzb3VyY2UpO1xuICAgICAgICAgICAgc3RhY2tCLnB1c2godmFsdWUpO1xuXG4gICAgICAgICAgICAvLyByZWN1cnNpdmVseSBtZXJnZSBvYmplY3RzIGFuZCBhcnJheXMgKHN1c2NlcHRpYmxlIHRvIGNhbGwgc3RhY2sgbGltaXRzKVxuICAgICAgICAgICAgaWYgKCFpc1NoYWxsb3cpIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSBtZXJnZSh2YWx1ZSwgc291cmNlLCBpbmRpY2F0b3JPYmplY3QsIGNhbGxiYWNrLCBzdGFja0EsIHN0YWNrQik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2sodmFsdWUsIHNvdXJjZSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICByZXN1bHQgPSBzb3VyY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHJlc3VsdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgb2JqZWN0W2tleV0gPSB2YWx1ZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChpbml0ZWRTdGFjaykge1xuICAgICAgcmVsZWFzZUFycmF5KHN0YWNrQSk7XG4gICAgICByZWxlYXNlQXJyYXkoc3RhY2tCKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8qKlxuICAgKiBJdGVyYXRlcyBvdmVyIGEgYGNvbGxlY3Rpb25gLCBleGVjdXRpbmcgdGhlIGBjYWxsYmFja2AgZm9yIGVhY2ggZWxlbWVudCBpblxuICAgKiB0aGUgYGNvbGxlY3Rpb25gLiBUaGUgYGNhbGxiYWNrYCBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZVxuICAgKiBhcmd1bWVudHM7ICh2YWx1ZSwgaW5kZXh8a2V5LCBjb2xsZWN0aW9uKS4gQ2FsbGJhY2tzIG1heSBleGl0IGl0ZXJhdGlvbiBlYXJseVxuICAgKiBieSBleHBsaWNpdGx5IHJldHVybmluZyBgZmFsc2VgLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBhbGlhcyBlYWNoXG4gICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxTdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICogQHBhcmFtIHtNaXhlZH0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgKiBAcmV0dXJucyB7QXJyYXl8T2JqZWN0fFN0cmluZ30gUmV0dXJucyBgY29sbGVjdGlvbmAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIF8oWzEsIDIsIDNdKS5mb3JFYWNoKGFsZXJ0KS5qb2luKCcsJyk7XG4gICAqIC8vID0+IGFsZXJ0cyBlYWNoIG51bWJlciBhbmQgcmV0dXJucyAnMSwyLDMnXG4gICAqXG4gICAqIF8uZm9yRWFjaCh7ICdvbmUnOiAxLCAndHdvJzogMiwgJ3RocmVlJzogMyB9LCBhbGVydCk7XG4gICAqIC8vID0+IGFsZXJ0cyBlYWNoIG51bWJlciB2YWx1ZSAob3JkZXIgaXMgbm90IGd1YXJhbnRlZWQpXG4gICAqL1xuICBmdW5jdGlvbiBmb3JFYWNoKGNvbGxlY3Rpb24sIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24gPyBjb2xsZWN0aW9uLmxlbmd0aCA6IDA7XG5cbiAgICBjYWxsYmFjayA9IGNhbGxiYWNrICYmIHR5cGVvZiB0aGlzQXJnID09ICd1bmRlZmluZWQnID8gY2FsbGJhY2sgOiBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcpO1xuICAgIGlmICh0eXBlb2YgbGVuZ3RoID09ICdudW1iZXInKSB7XG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICBpZiAoY2FsbGJhY2soY29sbGVjdGlvbltpbmRleF0sIGluZGV4LCBjb2xsZWN0aW9uKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3JPd24oY29sbGVjdGlvbiwgY2FsbGJhY2spO1xuICAgIH1cbiAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgfVxuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBjYWxsZWQsIGludm9rZXMgYGZ1bmNgIHdpdGggdGhlIGB0aGlzYFxuICAgKiBiaW5kaW5nIG9mIGB0aGlzQXJnYCBhbmQgcHJlcGVuZHMgYW55IGFkZGl0aW9uYWwgYGJpbmRgIGFyZ3VtZW50cyB0byB0aG9zZVxuICAgKiBwYXNzZWQgdG8gdGhlIGJvdW5kIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gYmluZC5cbiAgICogQHBhcmFtIHtNaXhlZH0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgZnVuY2AuXG4gICAqIEBwYXJhbSB7TWl4ZWR9IFthcmcxLCBhcmcyLCAuLi5dIEFyZ3VtZW50cyB0byBiZSBwYXJ0aWFsbHkgYXBwbGllZC5cbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYm91bmQgZnVuY3Rpb24uXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHZhciBmdW5jID0gZnVuY3Rpb24oZ3JlZXRpbmcpIHtcbiAgICogICByZXR1cm4gZ3JlZXRpbmcgKyAnICcgKyB0aGlzLm5hbWU7XG4gICAqIH07XG4gICAqXG4gICAqIGZ1bmMgPSBfLmJpbmQoZnVuYywgeyAnbmFtZSc6ICdtb2UnIH0sICdoaScpO1xuICAgKiBmdW5jKCk7XG4gICAqIC8vID0+ICdoaSBtb2UnXG4gICAqL1xuICBmdW5jdGlvbiBiaW5kKGZ1bmMsIHRoaXNBcmcpIHtcbiAgICAvLyB1c2UgYEZ1bmN0aW9uI2JpbmRgIGlmIGl0IGV4aXN0cyBhbmQgaXMgZmFzdFxuICAgIC8vIChpbiBWOCBgRnVuY3Rpb24jYmluZGAgaXMgc2xvd2VyIGV4Y2VwdCB3aGVuIHBhcnRpYWxseSBhcHBsaWVkKVxuICAgIHJldHVybiBzdXBwb3J0LmZhc3RCaW5kIHx8IChuYXRpdmVCaW5kICYmIGFyZ3VtZW50cy5sZW5ndGggPiAyKVxuICAgICAgPyBuYXRpdmVCaW5kLmNhbGwuYXBwbHkobmF0aXZlQmluZCwgYXJndW1lbnRzKVxuICAgICAgOiBjcmVhdGVCb3VuZChmdW5jLCB0aGlzQXJnLCBuYXRpdmVTbGljZS5jYWxsKGFyZ3VtZW50cywgMikpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJpbmRzIG1ldGhvZHMgb24gYG9iamVjdGAgdG8gYG9iamVjdGAsIG92ZXJ3cml0aW5nIHRoZSBleGlzdGluZyBtZXRob2QuXG4gICAqIE1ldGhvZCBuYW1lcyBtYXkgYmUgc3BlY2lmaWVkIGFzIGluZGl2aWR1YWwgYXJndW1lbnRzIG9yIGFzIGFycmF5cyBvZiBtZXRob2RcbiAgICogbmFtZXMuIElmIG5vIG1ldGhvZCBuYW1lcyBhcmUgcHJvdmlkZWQsIGFsbCB0aGUgZnVuY3Rpb24gcHJvcGVydGllcyBvZiBgb2JqZWN0YFxuICAgKiB3aWxsIGJlIGJvdW5kLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGJpbmQgYW5kIGFzc2lnbiB0aGUgYm91bmQgbWV0aG9kcyB0by5cbiAgICogQHBhcmFtIHtTdHJpbmd9IFttZXRob2ROYW1lMSwgbWV0aG9kTmFtZTIsIC4uLl0gTWV0aG9kIG5hbWVzIG9uIHRoZSBvYmplY3QgdG8gYmluZC5cbiAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogdmFyIHZpZXcgPSB7XG4gICAqICAnbGFiZWwnOiAnZG9jcycsXG4gICAqICAnb25DbGljayc6IGZ1bmN0aW9uKCkgeyBhbGVydCgnY2xpY2tlZCAnICsgdGhpcy5sYWJlbCk7IH1cbiAgICogfTtcbiAgICpcbiAgICogXy5iaW5kQWxsKHZpZXcpO1xuICAgKiBqUXVlcnkoJyNkb2NzJykub24oJ2NsaWNrJywgdmlldy5vbkNsaWNrKTtcbiAgICogLy8gPT4gYWxlcnRzICdjbGlja2VkIGRvY3MnLCB3aGVuIHRoZSBidXR0b24gaXMgY2xpY2tlZFxuICAgKi9cbiAgZnVuY3Rpb24gYmluZEFsbChvYmplY3QpIHtcbiAgICB2YXIgZnVuY3MgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGNvbmNhdC5hcHBseShhcnJheVJlZiwgbmF0aXZlU2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKSA6IGZ1bmN0aW9ucyhvYmplY3QpLFxuICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICBsZW5ndGggPSBmdW5jcy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgdmFyIGtleSA9IGZ1bmNzW2luZGV4XTtcbiAgICAgIG9iamVjdFtrZXldID0gYmluZChvYmplY3Rba2V5XSwgb2JqZWN0KTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9kdWNlcyBhIGNhbGxiYWNrIGJvdW5kIHRvIGFuIG9wdGlvbmFsIGB0aGlzQXJnYC4gSWYgYGZ1bmNgIGlzIGEgcHJvcGVydHlcbiAgICogbmFtZSwgdGhlIGNyZWF0ZWQgY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIGZvciBhIGdpdmVuIGVsZW1lbnQuXG4gICAqIElmIGBmdW5jYCBpcyBhbiBvYmplY3QsIHRoZSBjcmVhdGVkIGNhbGxiYWNrIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHNcbiAgICogdGhhdCBjb250YWluIHRoZSBlcXVpdmFsZW50IG9iamVjdCBwcm9wZXJ0aWVzLCBvdGhlcndpc2UgaXQgd2lsbCByZXR1cm4gYGZhbHNlYC5cbiAgICpcbiAgICogTm90ZTogQWxsIExvLURhc2ggbWV0aG9kcywgdGhhdCBhY2NlcHQgYSBgY2FsbGJhY2tgIGFyZ3VtZW50LCB1c2UgYF8uY3JlYXRlQ2FsbGJhY2tgLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICogQHBhcmFtIHtNaXhlZH0gW2Z1bmM9aWRlbnRpdHldIFRoZSB2YWx1ZSB0byBjb252ZXJ0IHRvIGEgY2FsbGJhY2suXG4gICAqIEBwYXJhbSB7TWl4ZWR9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgdGhlIGNyZWF0ZWQgY2FsbGJhY2suXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBbYXJnQ291bnQ9M10gVGhlIG51bWJlciBvZiBhcmd1bWVudHMgdGhlIGNhbGxiYWNrIGFjY2VwdHMuXG4gICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyBhIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiB2YXIgc3Rvb2dlcyA9IFtcbiAgICogICB7ICduYW1lJzogJ21vZScsICdhZ2UnOiA0MCB9LFxuICAgKiAgIHsgJ25hbWUnOiAnbGFycnknLCAnYWdlJzogNTAgfVxuICAgKiBdO1xuICAgKlxuICAgKiAvLyB3cmFwIHRvIGNyZWF0ZSBjdXN0b20gY2FsbGJhY2sgc2hvcnRoYW5kc1xuICAgKiBfLmNyZWF0ZUNhbGxiYWNrID0gXy53cmFwKF8uY3JlYXRlQ2FsbGJhY2ssIGZ1bmN0aW9uKGZ1bmMsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAqICAgdmFyIG1hdGNoID0gL14oLis/KV9fKFtnbF10KSguKykkLy5leGVjKGNhbGxiYWNrKTtcbiAgICogICByZXR1cm4gIW1hdGNoID8gZnVuYyhjYWxsYmFjaywgdGhpc0FyZykgOiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICogICAgIHJldHVybiBtYXRjaFsyXSA9PSAnZ3QnID8gb2JqZWN0W21hdGNoWzFdXSA+IG1hdGNoWzNdIDogb2JqZWN0W21hdGNoWzFdXSA8IG1hdGNoWzNdO1xuICAgKiAgIH07XG4gICAqIH0pO1xuICAgKlxuICAgKiBfLmZpbHRlcihzdG9vZ2VzLCAnYWdlX19ndDQ1Jyk7XG4gICAqIC8vID0+IFt7ICduYW1lJzogJ2xhcnJ5JywgJ2FnZSc6IDUwIH1dXG4gICAqXG4gICAqIC8vIGNyZWF0ZSBtaXhpbnMgd2l0aCBzdXBwb3J0IGZvciBcIl8ucGx1Y2tcIiBhbmQgXCJfLndoZXJlXCIgY2FsbGJhY2sgc2hvcnRoYW5kc1xuICAgKiBfLm1peGluKHtcbiAgICogICAndG9Mb29rdXAnOiBmdW5jdGlvbihjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgKiAgICAgY2FsbGJhY2sgPSBfLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnKTtcbiAgICogICAgIHJldHVybiBfLnJlZHVjZShjb2xsZWN0aW9uLCBmdW5jdGlvbihyZXN1bHQsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgKiAgICAgICByZXR1cm4gKHJlc3VsdFtjYWxsYmFjayh2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pXSA9IHZhbHVlLCByZXN1bHQpO1xuICAgKiAgICAgfSwge30pO1xuICAgKiAgIH1cbiAgICogfSk7XG4gICAqXG4gICAqIF8udG9Mb29rdXAoc3Rvb2dlcywgJ25hbWUnKTtcbiAgICogLy8gPT4geyAnbW9lJzogeyAnbmFtZSc6ICdtb2UnLCAnYWdlJzogNDAgfSwgJ2xhcnJ5JzogeyAnbmFtZSc6ICdsYXJyeScsICdhZ2UnOiA1MCB9IH1cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZUNhbGxiYWNrKGZ1bmMsIHRoaXNBcmcsIGFyZ0NvdW50KSB7XG4gICAgaWYgKGZ1bmMgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGlkZW50aXR5O1xuICAgIH1cbiAgICB2YXIgdHlwZSA9IHR5cGVvZiBmdW5jO1xuICAgIGlmICh0eXBlICE9ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmICh0eXBlICE9ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgICByZXR1cm4gb2JqZWN0W2Z1bmNdO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgdmFyIHByb3BzID0ga2V5cyhmdW5jKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgdmFyIGxlbmd0aCA9IHByb3BzLmxlbmd0aCxcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgICBpZiAoIShyZXN1bHQgPSBpc0VxdWFsKG9iamVjdFtwcm9wc1tsZW5ndGhdXSwgZnVuY1twcm9wc1tsZW5ndGhdXSwgaW5kaWNhdG9yT2JqZWN0KSkpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB0aGlzQXJnID09ICd1bmRlZmluZWQnIHx8IChyZVRoaXMgJiYgIXJlVGhpcy50ZXN0KGZuVG9TdHJpbmcuY2FsbChmdW5jKSkpKSB7XG4gICAgICByZXR1cm4gZnVuYztcbiAgICB9XG4gICAgaWYgKGFyZ0NvdW50ID09PSAxKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCB2YWx1ZSk7XG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoYXJnQ291bnQgPT09IDIpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYSwgYik7XG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoYXJnQ291bnQgPT09IDQpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGRlbGF5IHRoZSBleGVjdXRpb24gb2YgYGZ1bmNgIHVudGlsIGFmdGVyXG4gICAqIGB3YWl0YCBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgaXQgd2FzIGludm9rZWQuIFBhc3NcbiAgICogYW4gYG9wdGlvbnNgIG9iamVjdCB0byBpbmRpY2F0ZSB0aGF0IGBmdW5jYCBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGUgbGVhZGluZ1xuICAgKiBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuIFN1YnNlcXVlbnQgY2FsbHMgdG8gdGhlIGRlYm91bmNlZFxuICAgKiBmdW5jdGlvbiB3aWxsIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGBmdW5jYCBjYWxsLlxuICAgKlxuICAgKiBOb3RlOiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgLCBgZnVuY2Agd2lsbCBiZSBjYWxsZWRcbiAgICogb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiBpc1xuICAgKiBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQGNhdGVnb3J5IEZ1bmN0aW9uc1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBkZWJvdW5jZS5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IHdhaXQgVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFRoZSBvcHRpb25zIG9iamVjdC5cbiAgICogIFtsZWFkaW5nPWZhbHNlXSBBIGJvb2xlYW4gdG8gc3BlY2lmeSBleGVjdXRpb24gb24gdGhlIGxlYWRpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAgICogIFttYXhXYWl0XSBUaGUgbWF4aW11bSB0aW1lIGBmdW5jYCBpcyBhbGxvd2VkIHRvIGJlIGRlbGF5ZWQgYmVmb3JlIGl0J3MgY2FsbGVkLlxuICAgKiAgW3RyYWlsaW5nPXRydWVdIEEgYm9vbGVhbiB0byBzcGVjaWZ5IGV4ZWN1dGlvbiBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZGVib3VuY2VkIGZ1bmN0aW9uLlxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiB2YXIgbGF6eUxheW91dCA9IF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAzMDApO1xuICAgKiBqUXVlcnkod2luZG93KS5vbigncmVzaXplJywgbGF6eUxheW91dCk7XG4gICAqXG4gICAqIGpRdWVyeSgnI3Bvc3Rib3gnKS5vbignY2xpY2snLCBfLmRlYm91bmNlKHNlbmRNYWlsLCAyMDAsIHtcbiAgICogICAnbGVhZGluZyc6IHRydWUsXG4gICAqICAgJ3RyYWlsaW5nJzogZmFsc2VcbiAgICogfSk7XG4gICAqL1xuICBmdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gICAgdmFyIGFyZ3MsXG4gICAgICAgIHJlc3VsdCxcbiAgICAgICAgdGhpc0FyZyxcbiAgICAgICAgY2FsbENvdW50ID0gMCxcbiAgICAgICAgbGFzdENhbGxlZCA9IDAsXG4gICAgICAgIG1heFdhaXQgPSBmYWxzZSxcbiAgICAgICAgbWF4VGltZW91dElkID0gbnVsbCxcbiAgICAgICAgdGltZW91dElkID0gbnVsbCxcbiAgICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gICAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgICBjbGVhclRpbWVvdXQobWF4VGltZW91dElkKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgY2FsbENvdW50ID0gMDtcbiAgICAgIG1heFRpbWVvdXRJZCA9IHRpbWVvdXRJZCA9IG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVsYXllZCgpIHtcbiAgICAgIHZhciBpc0NhbGxlZCA9IHRyYWlsaW5nICYmICghbGVhZGluZyB8fCBjYWxsQ291bnQgPiAxKTtcbiAgICAgIGNsZWFyKCk7XG4gICAgICBpZiAoaXNDYWxsZWQpIHtcbiAgICAgICAgaWYgKG1heFdhaXQgIT09IGZhbHNlKSB7XG4gICAgICAgICAgbGFzdENhbGxlZCA9IG5ldyBEYXRlO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF4RGVsYXllZCgpIHtcbiAgICAgIGNsZWFyKCk7XG4gICAgICBpZiAodHJhaWxpbmcgfHwgKG1heFdhaXQgIT09IHdhaXQpKSB7XG4gICAgICAgIGxhc3RDYWxsZWQgPSBuZXcgRGF0ZTtcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB3YWl0ID0gbmF0aXZlTWF4KDAsIHdhaXQgfHwgMCk7XG4gICAgaWYgKG9wdGlvbnMgPT09IHRydWUpIHtcbiAgICAgIHZhciBsZWFkaW5nID0gdHJ1ZTtcbiAgICAgIHRyYWlsaW5nID0gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgICAgbGVhZGluZyA9IG9wdGlvbnMubGVhZGluZztcbiAgICAgIG1heFdhaXQgPSAnbWF4V2FpdCcgaW4gb3B0aW9ucyAmJiBuYXRpdmVNYXgod2FpdCwgb3B0aW9ucy5tYXhXYWl0IHx8IDApO1xuICAgICAgdHJhaWxpbmcgPSAndHJhaWxpbmcnIGluIG9wdGlvbnMgPyBvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB0aGlzQXJnID0gdGhpcztcbiAgICAgIGNhbGxDb3VudCsrO1xuXG4gICAgICAvLyBhdm9pZCBpc3N1ZXMgd2l0aCBUaXRhbml1bSBhbmQgYHVuZGVmaW5lZGAgdGltZW91dCBpZHNcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hcHBjZWxlcmF0b3IvdGl0YW5pdW1fbW9iaWxlL2Jsb2IvM18xXzBfR0EvYW5kcm9pZC90aXRhbml1bS9zcmMvamF2YS90aS9tb2R1bGVzL3RpdGFuaXVtL1RpdGFuaXVtTW9kdWxlLmphdmEjTDE4NS1MMTkyXG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcblxuICAgICAgaWYgKG1heFdhaXQgPT09IGZhbHNlKSB7XG4gICAgICAgIGlmIChsZWFkaW5nICYmIGNhbGxDb3VudCA8IDIpIHtcbiAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbm93ID0gbmV3IERhdGU7XG4gICAgICAgIGlmICghbWF4VGltZW91dElkICYmICFsZWFkaW5nKSB7XG4gICAgICAgICAgbGFzdENhbGxlZCA9IG5vdztcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVtYWluaW5nID0gbWF4V2FpdCAtIChub3cgLSBsYXN0Q2FsbGVkKTtcbiAgICAgICAgaWYgKHJlbWFpbmluZyA8PSAwKSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KG1heFRpbWVvdXRJZCk7XG4gICAgICAgICAgbWF4VGltZW91dElkID0gbnVsbDtcbiAgICAgICAgICBsYXN0Q2FsbGVkID0gbm93O1xuICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIW1heFRpbWVvdXRJZCkge1xuICAgICAgICAgIG1heFRpbWVvdXRJZCA9IHNldFRpbWVvdXQobWF4RGVsYXllZCwgcmVtYWluaW5nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHdhaXQgIT09IG1heFdhaXQpIHtcbiAgICAgICAgdGltZW91dElkID0gc2V0VGltZW91dChkZWxheWVkLCB3YWl0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBleGVjdXRlZCwgd2lsbCBvbmx5IGNhbGwgdGhlIGBmdW5jYCBmdW5jdGlvblxuICAgKiBhdCBtb3N0IG9uY2UgcGVyIGV2ZXJ5IGB3YWl0YCBtaWxsaXNlY29uZHMuIFBhc3MgYW4gYG9wdGlvbnNgIG9iamVjdCB0b1xuICAgKiBpbmRpY2F0ZSB0aGF0IGBmdW5jYCBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZVxuICAgKiBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuIFN1YnNlcXVlbnQgY2FsbHMgdG8gdGhlIHRocm90dGxlZCBmdW5jdGlvbiB3aWxsXG4gICAqIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGBmdW5jYCBjYWxsLlxuICAgKlxuICAgKiBOb3RlOiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgLCBgZnVuY2Agd2lsbCBiZSBjYWxsZWRcbiAgICogb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgdGhlIHRocm90dGxlZCBmdW5jdGlvbiBpc1xuICAgKiBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQGNhdGVnb3J5IEZ1bmN0aW9uc1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byB0aHJvdHRsZS5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IHdhaXQgVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gdGhyb3R0bGUgZXhlY3V0aW9ucyB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgVGhlIG9wdGlvbnMgb2JqZWN0LlxuICAgKiAgW2xlYWRpbmc9dHJ1ZV0gQSBib29sZWFuIHRvIHNwZWNpZnkgZXhlY3V0aW9uIG9uIHRoZSBsZWFkaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gICAqICBbdHJhaWxpbmc9dHJ1ZV0gQSBib29sZWFuIHRvIHNwZWNpZnkgZXhlY3V0aW9uIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyB0aHJvdHRsZWQgZnVuY3Rpb24uXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHZhciB0aHJvdHRsZWQgPSBfLnRocm90dGxlKHVwZGF0ZVBvc2l0aW9uLCAxMDApO1xuICAgKiBqUXVlcnkod2luZG93KS5vbignc2Nyb2xsJywgdGhyb3R0bGVkKTtcbiAgICpcbiAgICogalF1ZXJ5KCcuaW50ZXJhY3RpdmUnKS5vbignY2xpY2snLCBfLnRocm90dGxlKHJlbmV3VG9rZW4sIDMwMDAwMCwge1xuICAgKiAgICd0cmFpbGluZyc6IGZhbHNlXG4gICAqIH0pKTtcbiAgICovXG4gIGZ1bmN0aW9uIHRocm90dGxlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgICB2YXIgbGVhZGluZyA9IHRydWUsXG4gICAgICAgIHRyYWlsaW5nID0gdHJ1ZTtcblxuICAgIGlmIChvcHRpb25zID09PSBmYWxzZSkge1xuICAgICAgbGVhZGluZyA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICAgIGxlYWRpbmcgPSAnbGVhZGluZycgaW4gb3B0aW9ucyA/IG9wdGlvbnMubGVhZGluZyA6IGxlYWRpbmc7XG4gICAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/IG9wdGlvbnMudHJhaWxpbmcgOiB0cmFpbGluZztcbiAgICB9XG4gICAgb3B0aW9ucyA9IGdldE9iamVjdCgpO1xuICAgIG9wdGlvbnMubGVhZGluZyA9IGxlYWRpbmc7XG4gICAgb3B0aW9ucy5tYXhXYWl0ID0gd2FpdDtcbiAgICBvcHRpb25zLnRyYWlsaW5nID0gdHJhaWxpbmc7XG5cbiAgICB2YXIgcmVzdWx0ID0gZGVib3VuY2UoZnVuYywgd2FpdCwgb3B0aW9ucyk7XG4gICAgcmVsZWFzZU9iamVjdChvcHRpb25zKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIHJldHVybnMgdGhlIGZpcnN0IGFyZ3VtZW50IHBhc3NlZCB0byBpdC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIEFueSB2YWx1ZS5cbiAgICogQHJldHVybnMge01peGVkfSBSZXR1cm5zIGB2YWx1ZWAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHZhciBtb2UgPSB7ICduYW1lJzogJ21vZScgfTtcbiAgICogbW9lID09PSBfLmlkZW50aXR5KG1vZSk7XG4gICAqIC8vID0+IHRydWVcbiAgICovXG4gIGZ1bmN0aW9uIGlkZW50aXR5KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgbG9kYXNoLmFzc2lnbiA9IGFzc2lnbjtcbiAgbG9kYXNoLmJpbmQgPSBiaW5kO1xuICBsb2Rhc2guYmluZEFsbCA9IGJpbmRBbGw7XG4gIGxvZGFzaC5jcmVhdGVDYWxsYmFjayA9IGNyZWF0ZUNhbGxiYWNrO1xuICBsb2Rhc2guZGVib3VuY2UgPSBkZWJvdW5jZTtcbiAgbG9kYXNoLmRlZmF1bHRzID0gZGVmYXVsdHM7XG4gIGxvZGFzaC5mb3JFYWNoID0gZm9yRWFjaDtcbiAgbG9kYXNoLmZvckluID0gZm9ySW47XG4gIGxvZGFzaC5mb3JPd24gPSBmb3JPd247XG4gIGxvZGFzaC5mdW5jdGlvbnMgPSBmdW5jdGlvbnM7XG4gIGxvZGFzaC5rZXlzID0ga2V5cztcbiAgbG9kYXNoLm1lcmdlID0gbWVyZ2U7XG4gIGxvZGFzaC50aHJvdHRsZSA9IHRocm90dGxlO1xuXG4gIGxvZGFzaC5lYWNoID0gZm9yRWFjaDtcbiAgbG9kYXNoLmV4dGVuZCA9IGFzc2lnbjtcbiAgbG9kYXNoLm1ldGhvZHMgPSBmdW5jdGlvbnM7XG5cbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgbG9kYXNoLmlkZW50aXR5ID0gaWRlbnRpdHk7XG4gIGxvZGFzaC5pc0FyZ3VtZW50cyA9IGlzQXJndW1lbnRzO1xuICBsb2Rhc2guaXNBcnJheSA9IGlzQXJyYXk7XG4gIGxvZGFzaC5pc0VxdWFsID0gaXNFcXVhbDtcbiAgbG9kYXNoLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuICBsb2Rhc2guaXNPYmplY3QgPSBpc09iamVjdDtcbiAgbG9kYXNoLmlzUGxhaW5PYmplY3QgPSBpc1BsYWluT2JqZWN0O1xuICBsb2Rhc2guaXNTdHJpbmcgPSBpc1N0cmluZztcblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogVGhlIHNlbWFudGljIHZlcnNpb24gbnVtYmVyLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEB0eXBlIFN0cmluZ1xuICAgKi9cbiAgbG9kYXNoLlZFUlNJT04gPSAnMS4zLjEnO1xuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8vIGV4cG9zZSBMby1EYXNoXG4gIC8vIHNvbWUgQU1EIGJ1aWxkIG9wdGltaXplcnMsIGxpa2Ugci5qcywgY2hlY2sgZm9yIHNwZWNpZmljIGNvbmRpdGlvbiBwYXR0ZXJucyBsaWtlIHRoZSBmb2xsb3dpbmc6XG4gIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEV4cG9zZSBMby1EYXNoIHRvIHRoZSBnbG9iYWwgb2JqZWN0IGV2ZW4gd2hlbiBhbiBBTUQgbG9hZGVyIGlzIHByZXNlbnQgaW5cbiAgICAvLyBjYXNlIExvLURhc2ggd2FzIGluamVjdGVkIGJ5IGEgdGhpcmQtcGFydHkgc2NyaXB0IGFuZCBub3QgaW50ZW5kZWQgdG8gYmVcbiAgICAvLyBsb2FkZWQgYXMgYSBtb2R1bGUuIFRoZSBnbG9iYWwgYXNzaWdubWVudCBjYW4gYmUgcmV2ZXJ0ZWQgaW4gdGhlIExvLURhc2hcbiAgICAvLyBtb2R1bGUgdmlhIGl0cyBgbm9Db25mbGljdCgpYCBtZXRob2QuXG4gICAgd2luZG93Ll8gPSBsb2Rhc2g7XG5cbiAgICAvLyBkZWZpbmUgYXMgYW4gYW5vbnltb3VzIG1vZHVsZSBzbywgdGhyb3VnaCBwYXRoIG1hcHBpbmcsIGl0IGNhbiBiZVxuICAgIC8vIHJlZmVyZW5jZWQgYXMgdGhlIFwidW5kZXJzY29yZVwiIG1vZHVsZVxuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBsb2Rhc2g7XG4gICAgfSk7XG4gIH1cbiAgLy8gY2hlY2sgZm9yIGBleHBvcnRzYCBhZnRlciBgZGVmaW5lYCBpbiBjYXNlIGEgYnVpbGQgb3B0aW1pemVyIGFkZHMgYW4gYGV4cG9ydHNgIG9iamVjdFxuICBlbHNlIGlmIChmcmVlRXhwb3J0cyAmJiAhZnJlZUV4cG9ydHMubm9kZVR5cGUpIHtcbiAgICAvLyBpbiBOb2RlLmpzIG9yIFJpbmdvSlMgdjAuOC4wK1xuICAgIGlmIChmcmVlTW9kdWxlKSB7XG4gICAgICAoZnJlZU1vZHVsZS5leHBvcnRzID0gbG9kYXNoKS5fID0gbG9kYXNoO1xuICAgIH1cbiAgICAvLyBpbiBOYXJ3aGFsIG9yIFJpbmdvSlMgdjAuNy4wLVxuICAgIGVsc2Uge1xuICAgICAgZnJlZUV4cG9ydHMuXyA9IGxvZGFzaDtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gaW4gYSBicm93c2VyIG9yIFJoaW5vXG4gICAgd2luZG93Ll8gPSBsb2Rhc2g7XG4gIH1cbn0odGhpcykpO1xuIl19
;