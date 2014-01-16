;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// UTILITY
var util = require('util');
var Buffer = require("buffer").Buffer;
var pSlice = Array.prototype.slice;

function objectKeys(object) {
  if (Object.keys) return Object.keys(object);
  var result = [];
  for (var name in object) {
    if (Object.prototype.hasOwnProperty.call(object, name)) {
      result.push(name);
    }
  }
  return result;
}

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.message = options.message;
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (value === undefined) {
    return '' + value;
  }
  if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (typeof value === 'function' || value instanceof RegExp) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (typeof s == 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

assert.AssertionError.prototype.toString = function() {
  if (this.message) {
    return [this.name + ':', this.message].join(' ');
  } else {
    return [
      this.name + ':',
      truncate(JSON.stringify(this.actual, replacer), 128),
      this.operator,
      truncate(JSON.stringify(this.expected, replacer), 128)
    ].join(' ');
  }
};

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!!!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (typeof actual != 'object' && typeof expected != 'object') {
    return actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (expected instanceof RegExp) {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail('Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail('Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

},{"buffer":11,"util":9}],2:[function(require,module,exports){
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

},{"__browserify_process":20}],3:[function(require,module,exports){
// nothing to see here... no file methods for the browser

},{}],4:[function(require,module,exports){
// todo

},{}],5:[function(require,module,exports){
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

},{"__browserify_process":20}],6:[function(require,module,exports){

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

},{}],7:[function(require,module,exports){
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

},{"events":2,"util":9}],8:[function(require,module,exports){
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

},{"querystring":6}],9:[function(require,module,exports){
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

},{"events":2}],10:[function(require,module,exports){
exports.readIEEE754 = function(buffer, offset, isBE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isBE ? 0 : (nBytes - 1),
      d = isBE ? 1 : -1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.writeIEEE754 = function(buffer, value, offset, isBE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isBE ? (nBytes - 1) : 0,
      d = isBE ? -1 : 1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],11:[function(require,module,exports){
var assert = require('assert');
exports.Buffer = Buffer;
exports.SlowBuffer = Buffer;
Buffer.poolSize = 8192;
exports.INSPECT_MAX_BYTES = 50;

function Buffer(subject, encoding, offset) {
  if (!(this instanceof Buffer)) {
    return new Buffer(subject, encoding, offset);
  }
  this.parent = this;
  this.offset = 0;

  var type;

  // Are we slicing?
  if (typeof offset === 'number') {
    this.length = coerce(encoding);
    this.offset = offset;
  } else {
    // Find the length
    switch (type = typeof subject) {
      case 'number':
        this.length = coerce(subject);
        break;

      case 'string':
        this.length = Buffer.byteLength(subject, encoding);
        break;

      case 'object': // Assume object is an array
        this.length = coerce(subject.length);
        break;

      default:
        throw new Error('First argument needs to be a number, ' +
                        'array or string.');
    }

    // Treat array-ish objects as a byte array.
    if (isArrayIsh(subject)) {
      for (var i = 0; i < this.length; i++) {
        if (subject instanceof Buffer) {
          this[i] = subject.readUInt8(i);
        }
        else {
          this[i] = subject[i];
        }
      }
    } else if (type == 'string') {
      // We are a string
      this.length = this.write(subject, 0, encoding);
    } else if (type === 'number') {
      for (var i = 0; i < this.length; i++) {
        this[i] = 0;
      }
    }
  }
}

Buffer.prototype.get = function get(i) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this[i];
};

Buffer.prototype.set = function set(i, v) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this[i] = v;
};

Buffer.byteLength = function (str, encoding) {
  switch (encoding || "utf8") {
    case 'hex':
      return str.length / 2;

    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(str).length;

    case 'ascii':
    case 'binary':
      return str.length;

    case 'base64':
      return base64ToBytes(str).length;

    default:
      throw new Error('Unknown encoding');
  }
};

Buffer.prototype.utf8Write = function (string, offset, length) {
  var bytes, pos;
  return Buffer._charsWritten =  blitBuffer(utf8ToBytes(string), this, offset, length);
};

Buffer.prototype.asciiWrite = function (string, offset, length) {
  var bytes, pos;
  return Buffer._charsWritten =  blitBuffer(asciiToBytes(string), this, offset, length);
};

Buffer.prototype.binaryWrite = Buffer.prototype.asciiWrite;

Buffer.prototype.base64Write = function (string, offset, length) {
  var bytes, pos;
  return Buffer._charsWritten = blitBuffer(base64ToBytes(string), this, offset, length);
};

Buffer.prototype.base64Slice = function (start, end) {
  var bytes = Array.prototype.slice.apply(this, arguments)
  return require("base64-js").fromByteArray(bytes);
};

Buffer.prototype.utf8Slice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var res = "";
  var tmp = "";
  var i = 0;
  while (i < bytes.length) {
    if (bytes[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(bytes[i]);
      tmp = "";
    } else
      tmp += "%" + bytes[i].toString(16);

    i++;
  }

  return res + decodeUtf8Char(tmp);
}

Buffer.prototype.asciiSlice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var ret = "";
  for (var i = 0; i < bytes.length; i++)
    ret += String.fromCharCode(bytes[i]);
  return ret;
}

Buffer.prototype.binarySlice = Buffer.prototype.asciiSlice;

Buffer.prototype.inspect = function() {
  var out = [],
      len = this.length;
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }
  return '<Buffer ' + out.join(' ') + '>';
};


Buffer.prototype.hexSlice = function(start, end) {
  var len = this.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; i++) {
    out += toHex(this[i]);
  }
  return out;
};


Buffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();
  start = +start || 0;
  if (typeof end == 'undefined') end = this.length;

  // Fastpath empty strings
  if (+end == start) {
    return '';
  }

  switch (encoding) {
    case 'hex':
      return this.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.utf8Slice(start, end);

    case 'ascii':
      return this.asciiSlice(start, end);

    case 'binary':
      return this.binarySlice(start, end);

    case 'base64':
      return this.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


Buffer.prototype.hexWrite = function(string, offset, length) {
  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2) {
    throw new Error('Invalid hex string');
  }
  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(byte)) throw new Error('Invalid hex string');
    this[offset + i] = byte;
  }
  Buffer._charsWritten = i * 2;
  return i;
};


Buffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  switch (encoding) {
    case 'hex':
      return this.hexWrite(string, offset, length);

    case 'utf8':
    case 'utf-8':
      return this.utf8Write(string, offset, length);

    case 'ascii':
      return this.asciiWrite(string, offset, length);

    case 'binary':
      return this.binaryWrite(string, offset, length);

    case 'base64':
      return this.base64Write(string, offset, length);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Write(string, offset, length);

    default:
      throw new Error('Unknown encoding');
  }
};


// slice(start, end)
Buffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;

  if (end > this.length) {
    throw new Error('oob');
  }
  if (start > end) {
    throw new Error('oob');
  }

  return new Buffer(this, end - start, +start);
};

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function(target, target_start, start, end) {
  var source = this;
  start || (start = 0);
  if (end === undefined || isNaN(end)) {
    end = this.length;
  }
  target_start || (target_start = 0);

  if (end < start) throw new Error('sourceEnd < sourceStart');

  // Copy 0 bytes; we're done
  if (end === start) return 0;
  if (target.length == 0 || source.length == 0) return 0;

  if (target_start < 0 || target_start >= target.length) {
    throw new Error('targetStart out of bounds');
  }

  if (start < 0 || start >= source.length) {
    throw new Error('sourceStart out of bounds');
  }

  if (end < 0 || end > source.length) {
    throw new Error('sourceEnd out of bounds');
  }

  // Are we oob?
  if (end > this.length) {
    end = this.length;
  }

  if (target.length - target_start < end - start) {
    end = target.length - target_start + start;
  }

  var temp = [];
  for (var i=start; i<end; i++) {
    assert.ok(typeof this[i] !== 'undefined', "copying undefined buffer bytes!");
    temp.push(this[i]);
  }

  for (var i=target_start; i<target_start+temp.length; i++) {
    target[i] = temp[i-target_start];
  }
};

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill(value, start, end) {
  value || (value = 0);
  start || (start = 0);
  end || (end = this.length);

  if (typeof value === 'string') {
    value = value.charCodeAt(0);
  }
  if (!(typeof value === 'number') || isNaN(value)) {
    throw new Error('value is not a number');
  }

  if (end < start) throw new Error('end < start');

  // Fill 0 bytes; we're done
  if (end === start) return 0;
  if (this.length == 0) return 0;

  if (start < 0 || start >= this.length) {
    throw new Error('start out of bounds');
  }

  if (end < 0 || end > this.length) {
    throw new Error('end out of bounds');
  }

  for (var i = start; i < end; i++) {
    this[i] = value;
  }
}

// Static methods
Buffer.isBuffer = function isBuffer(b) {
  return b instanceof Buffer || b instanceof Buffer;
};

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) {
    throw new Error("Usage: Buffer.concat(list, [totalLength])\n \
      list should be an Array.");
  }

  if (list.length === 0) {
    return new Buffer(0);
  } else if (list.length === 1) {
    return list[0];
  }

  if (typeof totalLength !== 'number') {
    totalLength = 0;
    for (var i = 0; i < list.length; i++) {
      var buf = list[i];
      totalLength += buf.length;
    }
  }

  var buffer = new Buffer(totalLength);
  var pos = 0;
  for (var i = 0; i < list.length; i++) {
    var buf = list[i];
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};

// helpers

function coerce(length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length);
  return length < 0 ? 0 : length;
}

function isArray(subject) {
  return (Array.isArray ||
    function(subject){
      return {}.toString.apply(subject) == '[object Array]'
    })
    (subject)
}

function isArrayIsh(subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
         subject && typeof subject === 'object' &&
         typeof subject.length === 'number';
}

function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}

function utf8ToBytes(str) {
  var byteArray = [];
  for (var i = 0; i < str.length; i++)
    if (str.charCodeAt(i) <= 0x7F)
      byteArray.push(str.charCodeAt(i));
    else {
      var h = encodeURIComponent(str.charAt(i)).substr(1).split('%');
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16));
    }

  return byteArray;
}

function asciiToBytes(str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++ )
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push( str.charCodeAt(i) & 0xFF );

  return byteArray;
}

function base64ToBytes(str) {
  return require("base64-js").toByteArray(str);
}

function blitBuffer(src, dst, offset, length) {
  var pos, i = 0;
  while (i < length) {
    if ((i+offset >= dst.length) || (i >= src.length))
      break;

    dst[i + offset] = src[i];
    i++;
  }
  return i;
}

function decodeUtf8Char(str) {
  try {
    return decodeURIComponent(str);
  } catch (err) {
    return String.fromCharCode(0xFFFD); // UTF 8 invalid char
  }
}

// read/write bit-twiddling

Buffer.prototype.readUInt8 = function(offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return;

  return buffer[offset];
};

function readUInt16(buffer, offset, isBigEndian, noAssert) {
  var val = 0;


  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return 0;

  if (isBigEndian) {
    val = buffer[offset] << 8;
    if (offset + 1 < buffer.length) {
      val |= buffer[offset + 1];
    }
  } else {
    val = buffer[offset];
    if (offset + 1 < buffer.length) {
      val |= buffer[offset + 1] << 8;
    }
  }

  return val;
}

Buffer.prototype.readUInt16LE = function(offset, noAssert) {
  return readUInt16(this, offset, false, noAssert);
};

Buffer.prototype.readUInt16BE = function(offset, noAssert) {
  return readUInt16(this, offset, true, noAssert);
};

function readUInt32(buffer, offset, isBigEndian, noAssert) {
  var val = 0;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return 0;

  if (isBigEndian) {
    if (offset + 1 < buffer.length)
      val = buffer[offset + 1] << 16;
    if (offset + 2 < buffer.length)
      val |= buffer[offset + 2] << 8;
    if (offset + 3 < buffer.length)
      val |= buffer[offset + 3];
    val = val + (buffer[offset] << 24 >>> 0);
  } else {
    if (offset + 2 < buffer.length)
      val = buffer[offset + 2] << 16;
    if (offset + 1 < buffer.length)
      val |= buffer[offset + 1] << 8;
    val |= buffer[offset];
    if (offset + 3 < buffer.length)
      val = val + (buffer[offset + 3] << 24 >>> 0);
  }

  return val;
}

Buffer.prototype.readUInt32LE = function(offset, noAssert) {
  return readUInt32(this, offset, false, noAssert);
};

Buffer.prototype.readUInt32BE = function(offset, noAssert) {
  return readUInt32(this, offset, true, noAssert);
};


/*
 * Signed integer types, yay team! A reminder on how two's complement actually
 * works. The first bit is the signed bit, i.e. tells us whether or not the
 * number should be positive or negative. If the two's complement value is
 * positive, then we're done, as it's equivalent to the unsigned representation.
 *
 * Now if the number is positive, you're pretty much done, you can just leverage
 * the unsigned translations and return those. Unfortunately, negative numbers
 * aren't quite that straightforward.
 *
 * At first glance, one might be inclined to use the traditional formula to
 * translate binary numbers between the positive and negative values in two's
 * complement. (Though it doesn't quite work for the most negative value)
 * Mainly:
 *  - invert all the bits
 *  - add one to the result
 *
 * Of course, this doesn't quite work in Javascript. Take for example the value
 * of -128. This could be represented in 16 bits (big-endian) as 0xff80. But of
 * course, Javascript will do the following:
 *
 * > ~0xff80
 * -65409
 *
 * Whoh there, Javascript, that's not quite right. But wait, according to
 * Javascript that's perfectly correct. When Javascript ends up seeing the
 * constant 0xff80, it has no notion that it is actually a signed number. It
 * assumes that we've input the unsigned value 0xff80. Thus, when it does the
 * binary negation, it casts it into a signed value, (positive 0xff80). Then
 * when you perform binary negation on that, it turns it into a negative number.
 *
 * Instead, we're going to have to use the following general formula, that works
 * in a rather Javascript friendly way. I'm glad we don't support this kind of
 * weird numbering scheme in the kernel.
 *
 * (BIT-MAX - (unsigned)val + 1) * -1
 *
 * The astute observer, may think that this doesn't make sense for 8-bit numbers
 * (really it isn't necessary for them). However, when you get 16-bit numbers,
 * you do. Let's go back to our prior example and see how this will look:
 *
 * (0xffff - 0xff80 + 1) * -1
 * (0x007f + 1) * -1
 * (0x0080) * -1
 */
Buffer.prototype.readInt8 = function(offset, noAssert) {
  var buffer = this;
  var neg;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return;

  neg = buffer[offset] & 0x80;
  if (!neg) {
    return (buffer[offset]);
  }

  return ((0xff - buffer[offset] + 1) * -1);
};

function readInt16(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt16(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x8000;
  if (!neg) {
    return val;
  }

  return (0xffff - val + 1) * -1;
}

Buffer.prototype.readInt16LE = function(offset, noAssert) {
  return readInt16(this, offset, false, noAssert);
};

Buffer.prototype.readInt16BE = function(offset, noAssert) {
  return readInt16(this, offset, true, noAssert);
};

function readInt32(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt32(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x80000000;
  if (!neg) {
    return (val);
  }

  return (0xffffffff - val + 1) * -1;
}

Buffer.prototype.readInt32LE = function(offset, noAssert) {
  return readInt32(this, offset, false, noAssert);
};

Buffer.prototype.readInt32BE = function(offset, noAssert) {
  return readInt32(this, offset, true, noAssert);
};

function readFloat(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.readFloatLE = function(offset, noAssert) {
  return readFloat(this, offset, false, noAssert);
};

Buffer.prototype.readFloatBE = function(offset, noAssert) {
  return readFloat(this, offset, true, noAssert);
};

function readDouble(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 7 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.readDoubleLE = function(offset, noAssert) {
  return readDouble(this, offset, false, noAssert);
};

Buffer.prototype.readDoubleBE = function(offset, noAssert) {
  return readDouble(this, offset, true, noAssert);
};


/*
 * We have to make sure that the value is a valid integer. This means that it is
 * non-negative. It has no fractional component and that it does not exceed the
 * maximum allowed value.
 *
 *      value           The number to check for validity
 *
 *      max             The maximum value
 */
function verifuint(value, max) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value >= 0,
      'specified a negative value for writing an unsigned value');

  assert.ok(value <= max, 'value is larger than maximum value for type');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xff);
  }

  if (offset < buffer.length) {
    buffer[offset] = value;
  }
};

function writeUInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffff);
  }

  for (var i = 0; i < Math.min(buffer.length - offset, 2); i++) {
    buffer[offset + i] =
        (value & (0xff << (8 * (isBigEndian ? 1 - i : i)))) >>>
            (isBigEndian ? 1 - i : i) * 8;
  }

}

Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, true, noAssert);
};

function writeUInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffffffff);
  }

  for (var i = 0; i < Math.min(buffer.length - offset, 4); i++) {
    buffer[offset + i] =
        (value >>> (isBigEndian ? 3 - i : i) * 8) & 0xff;
  }
}

Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, true, noAssert);
};


/*
 * We now move onto our friends in the signed number category. Unlike unsigned
 * numbers, we're going to have to worry a bit more about how we put values into
 * arrays. Since we are only worrying about signed 32-bit values, we're in
 * slightly better shape. Unfortunately, we really can't do our favorite binary
 * & in this system. It really seems to do the wrong thing. For example:
 *
 * > -32 & 0xff
 * 224
 *
 * What's happening above is really: 0xe0 & 0xff = 0xe0. However, the results of
 * this aren't treated as a signed number. Ultimately a bad thing.
 *
 * What we're going to want to do is basically create the unsigned equivalent of
 * our representation and pass that off to the wuint* functions. To do that
 * we're going to do the following:
 *
 *  - if the value is positive
 *      we can pass it directly off to the equivalent wuint
 *  - if the value is negative
 *      we do the following computation:
 *         mb + val + 1, where
 *         mb   is the maximum unsigned value in that byte size
 *         val  is the Javascript negative integer
 *
 *
 * As a concrete value, take -128. In signed 16 bits this would be 0xff80. If
 * you do out the computations:
 *
 * 0xffff - 128 + 1
 * 0xffff - 127
 * 0xff80
 *
 * You can then encode this value as the signed version. This is really rather
 * hacky, but it should work and get the job done which is our goal here.
 */

/*
 * A series of checks to make sure we actually have a signed 32-bit number
 */
function verifsint(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

function verifIEEE754(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');
}

Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7f, -0x80);
  }

  if (value >= 0) {
    buffer.writeUInt8(value, offset, noAssert);
  } else {
    buffer.writeUInt8(0xff + value + 1, offset, noAssert);
  }
};

function writeInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fff, -0x8000);
  }

  if (value >= 0) {
    writeUInt16(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt16(buffer, 0xffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, true, noAssert);
};

function writeInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fffffff, -0x80000000);
  }

  if (value >= 0) {
    writeUInt32(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt32(buffer, 0xffffffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, true, noAssert);
};

function writeFloat(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, false, noAssert);
};

Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, true, noAssert);
};

function writeDouble(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 7 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, false, noAssert);
};

Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, true, noAssert);
};

},{"./buffer_ieee754":10,"assert":1,"base64-js":12}],12:[function(require,module,exports){
(function (exports) {
	'use strict';

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	function b64ToByteArray(b64) {
		var i, j, l, tmp, placeHolders, arr;
	
		if (b64.length % 4 > 0) {
			throw 'Invalid string. Length must be a multiple of 4';
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		placeHolders = b64.indexOf('=');
		placeHolders = placeHolders > 0 ? b64.length - placeHolders : 0;

		// base64 is 4/3 + up to two characters of the original data
		arr = [];//new Uint8Array(b64.length * 3 / 4 - placeHolders);

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length;

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (lookup.indexOf(b64[i]) << 18) | (lookup.indexOf(b64[i + 1]) << 12) | (lookup.indexOf(b64[i + 2]) << 6) | lookup.indexOf(b64[i + 3]);
			arr.push((tmp & 0xFF0000) >> 16);
			arr.push((tmp & 0xFF00) >> 8);
			arr.push(tmp & 0xFF);
		}

		if (placeHolders === 2) {
			tmp = (lookup.indexOf(b64[i]) << 2) | (lookup.indexOf(b64[i + 1]) >> 4);
			arr.push(tmp & 0xFF);
		} else if (placeHolders === 1) {
			tmp = (lookup.indexOf(b64[i]) << 10) | (lookup.indexOf(b64[i + 1]) << 4) | (lookup.indexOf(b64[i + 2]) >> 2);
			arr.push((tmp >> 8) & 0xFF);
			arr.push(tmp & 0xFF);
		}

		return arr;
	}

	function uint8ToBase64(uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length;

		function tripletToBase64 (num) {
			return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
		};

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
			output += tripletToBase64(temp);
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1];
				output += lookup[temp >> 2];
				output += lookup[(temp << 4) & 0x3F];
				output += '==';
				break;
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
				output += lookup[temp >> 10];
				output += lookup[(temp >> 4) & 0x3F];
				output += lookup[(temp << 2) & 0x3F];
				output += '=';
				break;
		}

		return output;
	}

	module.exports.toByteArray = b64ToByteArray;
	module.exports.fromByteArray = uint8ToBase64;
}());

},{}],13:[function(require,module,exports){
var Buffer = require('buffer').Buffer;
var intSize = 4;
var zeroBuffer = new Buffer(intSize); zeroBuffer.fill(0);
var chrsz = 8;

function toArray(buf, bigEndian) {
  if ((buf.length % intSize) !== 0) {
    var len = buf.length + (intSize - (buf.length % intSize));
    buf = Buffer.concat([buf, zeroBuffer], len);
  }

  var arr = [];
  var fn = bigEndian ? buf.readInt32BE : buf.readInt32LE;
  for (var i = 0; i < buf.length; i += intSize) {
    arr.push(fn.call(buf, i));
  }
  return arr;
}

function toBuffer(arr, size, bigEndian) {
  var buf = new Buffer(size);
  var fn = bigEndian ? buf.writeInt32BE : buf.writeInt32LE;
  for (var i = 0; i < arr.length; i++) {
    fn.call(buf, arr[i], i * 4, true);
  }
  return buf;
}

function hash(buf, fn, hashSize, bigEndian) {
  if (!Buffer.isBuffer(buf)) buf = new Buffer(buf);
  var arr = fn(toArray(buf, bigEndian), buf.length * chrsz);
  return toBuffer(arr, hashSize, bigEndian);
}

module.exports = { hash: hash };

},{"buffer":11}],14:[function(require,module,exports){
var Buffer = require('buffer').Buffer
var sha = require('./sha')
var sha256 = require('./sha256')
var rng = require('./rng')
var md5 = require('./md5')

var algorithms = {
  sha1: sha,
  sha256: sha256,
  md5: md5
}

var blocksize = 64
var zeroBuffer = new Buffer(blocksize); zeroBuffer.fill(0)
function hmac(fn, key, data) {
  if(!Buffer.isBuffer(key)) key = new Buffer(key)
  if(!Buffer.isBuffer(data)) data = new Buffer(data)

  if(key.length > blocksize) {
    key = fn(key)
  } else if(key.length < blocksize) {
    key = Buffer.concat([key, zeroBuffer], blocksize)
  }

  var ipad = new Buffer(blocksize), opad = new Buffer(blocksize)
  for(var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }

  var hash = fn(Buffer.concat([ipad, data]))
  return fn(Buffer.concat([opad, hash]))
}

function hash(alg, key) {
  alg = alg || 'sha1'
  var fn = algorithms[alg]
  var bufs = []
  var length = 0
  if(!fn) error('algorithm:', alg, 'is not yet supported')
  return {
    update: function (data) {
      if(!Buffer.isBuffer(data)) data = new Buffer(data)
        
      bufs.push(data)
      length += data.length
      return this
    },
    digest: function (enc) {
      var buf = Buffer.concat(bufs)
      var r = key ? hmac(fn, key, buf) : fn(buf)
      bufs = null
      return enc ? r.toString(enc) : r
    }
  }
}

function error () {
  var m = [].slice.call(arguments).join(' ')
  throw new Error([
    m,
    'we accept pull requests',
    'http://github.com/dominictarr/crypto-browserify'
    ].join('\n'))
}

exports.createHash = function (alg) { return hash(alg) }
exports.createHmac = function (alg, key) { return hash(alg, key) }
exports.randomBytes = function(size, callback) {
  if (callback && callback.call) {
    try {
      callback.call(this, undefined, new Buffer(rng(size)))
    } catch (err) { callback(err) }
  } else {
    return new Buffer(rng(size))
  }
}

function each(a, f) {
  for(var i in a)
    f(a[i], i)
}

// the least I can do is make error messages for the rest of the node.js/crypto api.
each(['createCredentials'
, 'createCipher'
, 'createCipheriv'
, 'createDecipher'
, 'createDecipheriv'
, 'createSign'
, 'createVerify'
, 'createDiffieHellman'
, 'pbkdf2'], function (name) {
  exports[name] = function () {
    error('sorry,', name, 'is not implemented yet')
  }
})

},{"./md5":15,"./rng":16,"./sha":17,"./sha256":18,"buffer":11}],15:[function(require,module,exports){
/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

var helpers = require('./helpers');

/*
 * Perform a simple self-test to see if the VM is working
 */
function md5_vm_test()
{
  return hex_md5("abc") == "900150983cd24fb0d6963f7d28e17f72";
}

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length
 */
function core_md5(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);

}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}
function md5_ff(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function md5(buf) {
  return helpers.hash(buf, core_md5, 16);
};

},{"./helpers":13}],16:[function(require,module,exports){
// Original code adapted from Robert Kieffer.
// details at https://github.com/broofa/node-uuid
(function() {
  var _global = this;

  var mathRNG, whatwgRNG;

  // NOTE: Math.random() does not guarantee "cryptographic quality"
  mathRNG = function(size) {
    var bytes = new Array(size);
    var r;

    for (var i = 0, r; i < size; i++) {
      if ((i & 0x03) == 0) r = Math.random() * 0x100000000;
      bytes[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return bytes;
  }

  if (_global.crypto && crypto.getRandomValues) {
    whatwgRNG = function(size) {
      var bytes = new Uint8Array(size);
      crypto.getRandomValues(bytes);
      return bytes;
    }
  }

  module.exports = whatwgRNG || mathRNG;

}())

},{}],17:[function(require,module,exports){
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

var helpers = require('./helpers');

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function sha1(buf) {
  return helpers.hash(buf, core_sha1, 20, true);
};

},{"./helpers":13}],18:[function(require,module,exports){

/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var helpers = require('./helpers');

var safe_add = function(x, y) {
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
};

var S = function(X, n) {
  return (X >>> n) | (X << (32 - n));
};

var R = function(X, n) {
  return (X >>> n);
};

var Ch = function(x, y, z) {
  return ((x & y) ^ ((~x) & z));
};

var Maj = function(x, y, z) {
  return ((x & y) ^ (x & z) ^ (y & z));
};

var Sigma0256 = function(x) {
  return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
};

var Sigma1256 = function(x) {
  return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
};

var Gamma0256 = function(x) {
  return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
};

var Gamma1256 = function(x) {
  return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
};

var core_sha256 = function(m, l) {
  var K = new Array(0x428A2F98,0x71374491,0xB5C0FBCF,0xE9B5DBA5,0x3956C25B,0x59F111F1,0x923F82A4,0xAB1C5ED5,0xD807AA98,0x12835B01,0x243185BE,0x550C7DC3,0x72BE5D74,0x80DEB1FE,0x9BDC06A7,0xC19BF174,0xE49B69C1,0xEFBE4786,0xFC19DC6,0x240CA1CC,0x2DE92C6F,0x4A7484AA,0x5CB0A9DC,0x76F988DA,0x983E5152,0xA831C66D,0xB00327C8,0xBF597FC7,0xC6E00BF3,0xD5A79147,0x6CA6351,0x14292967,0x27B70A85,0x2E1B2138,0x4D2C6DFC,0x53380D13,0x650A7354,0x766A0ABB,0x81C2C92E,0x92722C85,0xA2BFE8A1,0xA81A664B,0xC24B8B70,0xC76C51A3,0xD192E819,0xD6990624,0xF40E3585,0x106AA070,0x19A4C116,0x1E376C08,0x2748774C,0x34B0BCB5,0x391C0CB3,0x4ED8AA4A,0x5B9CCA4F,0x682E6FF3,0x748F82EE,0x78A5636F,0x84C87814,0x8CC70208,0x90BEFFFA,0xA4506CEB,0xBEF9A3F7,0xC67178F2);
  var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
    var W = new Array(64);
    var a, b, c, d, e, f, g, h, i, j;
    var T1, T2;
  /* append padding */
  m[l >> 5] |= 0x80 << (24 - l % 32);
  m[((l + 64 >> 9) << 4) + 15] = l;
  for (var i = 0; i < m.length; i += 16) {
    a = HASH[0]; b = HASH[1]; c = HASH[2]; d = HASH[3]; e = HASH[4]; f = HASH[5]; g = HASH[6]; h = HASH[7];
    for (var j = 0; j < 64; j++) {
      if (j < 16) {
        W[j] = m[j + i];
      } else {
        W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
      }
      T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
      T2 = safe_add(Sigma0256(a), Maj(a, b, c));
      h = g; g = f; f = e; e = safe_add(d, T1); d = c; c = b; b = a; a = safe_add(T1, T2);
    }
    HASH[0] = safe_add(a, HASH[0]); HASH[1] = safe_add(b, HASH[1]); HASH[2] = safe_add(c, HASH[2]); HASH[3] = safe_add(d, HASH[3]);
    HASH[4] = safe_add(e, HASH[4]); HASH[5] = safe_add(f, HASH[5]); HASH[6] = safe_add(g, HASH[6]); HASH[7] = safe_add(h, HASH[7]);
  }
  return HASH;
};

module.exports = function sha256(buf) {
  return helpers.hash(buf, core_sha256, 32, true);
};

},{"./helpers":13}],19:[function(require,module,exports){

},{}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
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

},{"sockjs-client":22,"stream":7,"url":8}],22:[function(require,module,exports){
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


},{}],23:[function(require,module,exports){
var pnode = require("../../");

pnode.addTransport("ws", require("./transports/ws"));

if(typeof module === 'object' &&
   typeof exports === 'object' &&
   exports === module.exports)
  module.exports = pnode;

window.pnode = pnode;

},{"../../":42,"./transports/ws":24}],24:[function(require,module,exports){
var shoe = require('shoe');

exports.parse = function(str) {
  if (typeof str === 'string' && /^.+\/.+$/.test(str))
    str = "http://" + str;
  return [str];
};

exports.bindServer = function() {
  throw "bind ws server not supported in the browser";
};

exports.bindClient = function() {

  var args = Array.prototype.slice.call(arguments);
  var emitter = args.shift();
  var stream = shoe.apply(null, args);

  emitter.emit('stream', stream);

  stream.once('connect', function() {
    emitter.emit('bound');
  });

  emitter.once('unbind', function() {
    stream.end();
  });

  stream.once('end', function() {
    emitter.emit('unbound');
  });
};

},{"shoe":21}],25:[function(require,module,exports){
var dnode = require('./lib/dnode');

module.exports = function (cons, opts) {
    return new dnode(cons, opts);
};

},{"./lib/dnode":26}],26:[function(require,module,exports){
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

},{"__browserify_process":20,"dnode-protocol":27,"jsonify":33,"stream":7}],27:[function(require,module,exports){
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

},{"./lib/foreach":28,"./lib/is_enum":29,"./lib/keys":30,"./lib/scrub":31,"events":2}],28:[function(require,module,exports){
module.exports = function forEach (xs, f) {
    if (xs.forEach) return xs.forEach(f)
    for (var i = 0; i < xs.length; i++) {
        f.call(xs, xs[i], i);
    }
}

},{}],29:[function(require,module,exports){
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

},{"./keys":30}],30:[function(require,module,exports){
module.exports = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};

},{}],31:[function(require,module,exports){
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

},{"./foreach":28,"./keys":30,"traverse":32}],32:[function(require,module,exports){
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
        if (!node || !hasOwnProperty.call(node, key)) {
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
        if (!node || !hasOwnProperty.call(node, key)) {
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
        if (!hasOwnProperty.call(node, key)) node[key] = {};
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
                if (immutable && hasOwnProperty.call(state.node, key)) {
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
            dst = new Date(src.getTime ? src.getTime() : src);
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

var hasOwnProperty = Object.hasOwnProperty || function (obj, key) {
    return key in obj;
};

},{}],33:[function(require,module,exports){
exports.parse = require('./lib/parse');
exports.stringify = require('./lib/stringify');

},{"./lib/parse":34,"./lib/stringify":35}],34:[function(require,module,exports){
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

},{}],35:[function(require,module,exports){
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

},{}],36:[function(require,module,exports){
var process=require("__browserify_process");;!function(exports, undefined) {

  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };
  var defaultMaxListeners = 10;

  function init() {
    this._events = {};
    if (this._conf) {
      configure.call(this, this._conf);
    }
  }

  function configure(conf) {
    if (conf) {

      this._conf = conf;

      conf.delimiter && (this.delimiter = conf.delimiter);
      conf.maxListeners && (this._events.maxListeners = conf.maxListeners);
      conf.wildcard && (this.wildcard = conf.wildcard);
      conf.newListener && (this.newListener = conf.newListener);

      if (this.wildcard) {
        this.listenerTree = {};
      }
    }
  }

  function EventEmitter(conf) {
    this._events = {};
    this.newListener = false;
    configure.call(this, conf);
  }

  //
  // Attention, function return type now is array, always !
  // It has zero elements if no any matches found and one or more
  // elements (leafs) if there are matches
  //
  function searchListenerTree(handlers, type, tree, i) {
    if (!tree) {
      return [];
    }
    var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
        typeLength = type.length, currentType = type[i], nextType = type[i+1];
    if (i === typeLength && tree._listeners) {
      //
      // If at the end of the event(s) list and the tree has listeners
      // invoke those listeners.
      //
      if (typeof tree._listeners === 'function') {
        handlers && handlers.push(tree._listeners);
        return [tree];
      } else {
        for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
          handlers && handlers.push(tree._listeners[leaf]);
        }
        return [tree];
      }
    }

    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
      //
      // If the event emitted is '*' at this part
      // or there is a concrete match at this patch
      //
      if (currentType === '*') {
        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
          }
        }
        return listeners;
      } else if(currentType === '**') {
        endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
        if(endReached && tree._listeners) {
          // The next element has a _listeners, add it to the handlers.
          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
        }

        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            if(branch === '*' || branch === '**') {
              if(tree[branch]._listeners && !endReached) {
                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
              }
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            } else if(branch === nextType) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
            } else {
              // No match on this one, shift into the tree but not in the type array.
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            }
          }
        }
        return listeners;
      }

      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
    }

    xTree = tree['*'];
    if (xTree) {
      //
      // If the listener tree will allow any match for this part,
      // then recursively explore all branches of the tree
      //
      searchListenerTree(handlers, type, xTree, i+1);
    }

    xxTree = tree['**'];
    if(xxTree) {
      if(i < typeLength) {
        if(xxTree._listeners) {
          // If we have a listener on a '**', it will catch all, so add its handler.
          searchListenerTree(handlers, type, xxTree, typeLength);
        }

        // Build arrays of matching next branches and others.
        for(branch in xxTree) {
          if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
            if(branch === nextType) {
              // We know the next element will match, so jump twice.
              searchListenerTree(handlers, type, xxTree[branch], i+2);
            } else if(branch === currentType) {
              // Current node matches, move into the tree.
              searchListenerTree(handlers, type, xxTree[branch], i+1);
            } else {
              isolatedBranch = {};
              isolatedBranch[branch] = xxTree[branch];
              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
            }
          }
        }
      } else if(xxTree._listeners) {
        // We have reached the end and still on a '**'
        searchListenerTree(handlers, type, xxTree, typeLength);
      } else if(xxTree['*'] && xxTree['*']._listeners) {
        searchListenerTree(handlers, type, xxTree['*'], typeLength);
      }
    }

    return listeners;
  }

  function growListenerTree(type, listener) {

    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

    //
    // Looks for two consecutive '**', if so, don't add the event at all.
    //
    for(var i = 0, len = type.length; i+1 < len; i++) {
      if(type[i] === '**' && type[i+1] === '**') {
        return;
      }
    }

    var tree = this.listenerTree;
    var name = type.shift();

    while (name) {

      if (!tree[name]) {
        tree[name] = {};
      }

      tree = tree[name];

      if (type.length === 0) {

        if (!tree._listeners) {
          tree._listeners = listener;
        }
        else if(typeof tree._listeners === 'function') {
          tree._listeners = [tree._listeners, listener];
        }
        else if (isArray(tree._listeners)) {

          tree._listeners.push(listener);

          if (!tree._listeners.warned) {

            var m = defaultMaxListeners;

            if (typeof this._events.maxListeners !== 'undefined') {
              m = this._events.maxListeners;
            }

            if (m > 0 && tree._listeners.length > m) {

              tree._listeners.warned = true;
              console.error('(node) warning: possible EventEmitter memory ' +
                            'leak detected. %d listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit.',
                            tree._listeners.length);
              console.trace();
            }
          }
        }
        return true;
      }
      name = type.shift();
    }
    return true;
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.

  EventEmitter.prototype.delimiter = '.';

  EventEmitter.prototype.setMaxListeners = function(n) {
    this._events || init.call(this);
    this._events.maxListeners = n;
    if (!this._conf) this._conf = {};
    this._conf.maxListeners = n;
  };

  EventEmitter.prototype.event = '';

  EventEmitter.prototype.once = function(event, fn) {
    this.many(event, 1, fn);
    return this;
  };

  EventEmitter.prototype.many = function(event, ttl, fn) {
    var self = this;

    if (typeof fn !== 'function') {
      throw new Error('many only accepts instances of Function');
    }

    function listener() {
      if (--ttl === 0) {
        self.off(event, listener);
      }
      fn.apply(this, arguments);
    }

    listener._origin = fn;

    this.on(event, listener);

    return self;
  };

  EventEmitter.prototype.emit = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this.newListener) {
      if (!this._events.newListener) { return false; }
    }

    // Loop through the *_all* functions and invoke them.
    if (this._all) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
      for (i = 0, l = this._all.length; i < l; i++) {
        this.event = type;
        this._all[i].apply(this, args);
      }
    }

    // If there is no 'error' event listener then throw.
    if (type === 'error') {

      if (!this._all &&
        !this._events.error &&
        !(this.wildcard && this.listenerTree.error)) {

        if (arguments[1] instanceof Error) {
          throw arguments[1]; // Unhandled 'error' event
        } else {
          throw new Error("Uncaught, unspecified 'error' event.");
        }
        return false;
      }
    }

    var handler;

    if(this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    }
    else {
      handler = this._events[type];
    }

    if (typeof handler === 'function') {
      this.event = type;
      if (arguments.length === 1) {
        handler.call(this);
      }
      else if (arguments.length > 1)
        switch (arguments.length) {
          case 2:
            handler.call(this, arguments[1]);
            break;
          case 3:
            handler.call(this, arguments[1], arguments[2]);
            break;
          // slower
          default:
            var l = arguments.length;
            var args = new Array(l - 1);
            for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
            handler.apply(this, args);
        }
      return true;
    }
    else if (handler) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

      var listeners = handler.slice();
      for (var i = 0, l = listeners.length; i < l; i++) {
        this.event = type;
        listeners[i].apply(this, args);
      }
      return (listeners.length > 0) || this._all;
    }
    else {
      return this._all;
    }

  };

  EventEmitter.prototype.on = function(type, listener) {

    if (typeof type === 'function') {
      this.onAny(type);
      return this;
    }

    if (typeof listener !== 'function') {
      throw new Error('on only accepts instances of Function');
    }
    this._events || init.call(this);

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, listener);

    if(this.wildcard) {
      growListenerTree.call(this, type, listener);
      return this;
    }

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    }
    else if(typeof this._events[type] === 'function') {
      // Adding the second element, need to change to array.
      this._events[type] = [this._events[type], listener];
    }
    else if (isArray(this._events[type])) {
      // If we've already got an array, just append.
      this._events[type].push(listener);

      // Check for listener leak
      if (!this._events[type].warned) {

        var m = defaultMaxListeners;

        if (typeof this._events.maxListeners !== 'undefined') {
          m = this._events.maxListeners;
        }

        if (m > 0 && this._events[type].length > m) {

          this._events[type].warned = true;
          console.error('(node) warning: possible EventEmitter memory ' +
                        'leak detected. %d listeners added. ' +
                        'Use emitter.setMaxListeners() to increase limit.',
                        this._events[type].length);
          console.trace();
        }
      }
    }
    return this;
  };

  EventEmitter.prototype.onAny = function(fn) {

    if(!this._all) {
      this._all = [];
    }

    if (typeof fn !== 'function') {
      throw new Error('onAny only accepts instances of Function');
    }

    // Add the function to the event listener collection.
    this._all.push(fn);
    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  EventEmitter.prototype.off = function(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function');
    }

    var handlers,leafs=[];

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
    }
    else {
      // does not use listeners(), so no side effect of creating _events[type]
      if (!this._events[type]) return this;
      handlers = this._events[type];
      leafs.push({_listeners:handlers});
    }

    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
      var leaf = leafs[iLeaf];
      handlers = leaf._listeners;
      if (isArray(handlers)) {

        var position = -1;

        for (var i = 0, length = handlers.length; i < length; i++) {
          if (handlers[i] === listener ||
            (handlers[i].listener && handlers[i].listener === listener) ||
            (handlers[i]._origin && handlers[i]._origin === listener)) {
            position = i;
            break;
          }
        }

        if (position < 0) {
          continue;
        }

        if(this.wildcard) {
          leaf._listeners.splice(position, 1);
        }
        else {
          this._events[type].splice(position, 1);
        }

        if (handlers.length === 0) {
          if(this.wildcard) {
            delete leaf._listeners;
          }
          else {
            delete this._events[type];
          }
        }
        return this;
      }
      else if (handlers === listener ||
        (handlers.listener && handlers.listener === listener) ||
        (handlers._origin && handlers._origin === listener)) {
        if(this.wildcard) {
          delete leaf._listeners;
        }
        else {
          delete this._events[type];
        }
      }
    }

    return this;
  };

  EventEmitter.prototype.offAny = function(fn) {
    var i = 0, l = 0, fns;
    if (fn && this._all && this._all.length > 0) {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++) {
        if(fn === fns[i]) {
          fns.splice(i, 1);
          return this;
        }
      }
    } else {
      this._all = [];
    }
    return this;
  };

  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (arguments.length === 0) {
      !this._events || init.call(this);
      return this;
    }

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

      for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
        var leaf = leafs[iLeaf];
        leaf._listeners = null;
      }
    }
    else {
      if (!this._events[type]) return this;
      this._events[type] = null;
    }
    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if(this.wildcard) {
      var handlers = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
      return handlers;
    }

    this._events || init.call(this);

    if (!this._events[type]) this._events[type] = [];
    if (!isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };

  EventEmitter.prototype.listenersAny = function() {

    if(this._all) {
      return this._all;
    }
    else {
      return [];
    }

  };

  if (typeof define === 'function' && define.amd) {
    define(function() {
      return EventEmitter;
    });
  } else {
    exports.EventEmitter2 = EventEmitter;
  }

}(typeof process !== 'undefined' && typeof process.title !== 'undefined' && typeof exports !== 'undefined' ? exports : window);

},{"__browserify_process":20}],37:[function(require,module,exports){

function Store(keys) {
  if(!keys.length)
    throw "You must provide some keys to index";
  Array.call(this);
  this.indices = {};
  for(var i = 0; i < keys.length; i++)
    this.indices[keys[i]] = {};
}
Store.prototype = [];
Store.prototype.get = function(key) {
  return this.getBy(null, key);
};
Store.prototype.getBy = function(index, key) {
  switch(typeof key) {
    case "number": return this[key];
    case "string":
      if(index)
        return this.indices[index] ? this.indices[index][key] || null : null;
      for(index in this.indices)
        if(key in this.indices[index])
          return this.indices[index][key];
  }
  return null;
};

Store.prototype.add = function(obj) {
  this.push(obj);
  for(var k in this.indices)
    if(k in obj)
      this.indices[k][obj[k]] = obj;
};

Store.prototype.remove = function(obj) {
  if(typeof obj !== "object")
    obj = this.get(obj);
  if(obj === null) return null;
  var i = this.indexOf(obj);
  if(i === -1) return null;
  this.splice(i, 1);
  for(var k in this.indices)
    if(k in obj)
      delete this.indices[k][obj[k]];
  return obj;
};

module.exports = function() {
  return new Store(arguments);
};
},{}],38:[function(require,module,exports){
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
          self.pubsub.emit.apply(self.pubsub, args);
          if (cb) {
            return cb(true);
          }
        },
        ping: function(cb) {
          return cb(true);
        },
        events: this.exposeDynamic(function() {
          var evts;
          evts = Object.keys(self.pubsub._events);
          self.log("exposing events: %j", evts);
          return evts;
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
    var args, err, events, self, trans;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
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
    self = this;
    this.tEmitter.onAny(function() {
      var args, e, _j, _len1, _ref1;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      self.log('T-EVENT', this.event);
      if (_ref1 = this.event, __indexOf.call(events, _ref1) >= 0) {
        for (_j = 0, _len1 = events.length; _j < _len1; _j++) {
          e = events[_j];
          self[e] = e === this.event;
        }
      }
      self.emit.apply(null, [this.event].concat(args));
    });
    try {
      trans = transportMgr.get(args);
      args.unshift(this.tEmitter);
      this.tEmitter.emit('binding');
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
    this.tEmitter.emit('unbinding');
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

},{"../vendor/lodash":48,"./context":40,"./transport-mgr":47,"crypto":14,"eventemitter2":36,"os":19,"util":9}],39:[function(require,module,exports){
var process=require("__browserify_process");// Generated by CoffeeScript 1.6.3
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
    var onRead, onWrite,
      _this = this;
    Client.__super__.constructor.apply(this, arguments);
    this.count = {
      ping: 0,
      pong: 0,
      attempt: 0
    };
    this.connect = _.throttle(this.connect, this.opts.retryInterval, {
      leading: true
    });
    this.ping = _.throttle(this.ping, this.opts.pingInterval);
    this.on(['timeout', 'ping'], function() {
      return _this.log("ping TIMEOUT!");
    });
    this.bindTo = this.bind;
    this.on('unbound', function() {
      _this.reconnect();
    });
    this.on('uri', function(uri) {
      _this.uri = uri;
    });
    onRead = function(read) {
      _this.read = read;
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
    onWrite = function(write) {
      _this.write = write;
      if (_this.d.splicedWrite) {
        _this.err(new Error("Already spliced write stream"));
      }
      if (!helper.isWritable(write)) {
        _this.err(new Error("Invalid write stream"));
      }
      write.on('error', _this.onStreamError);
      _this.d.splicedWrite = true;
      return _this.d.pipe(write);
    };
    this.on('read', function(read) {
      return onRead(read);
    });
    this.on('write', function(write) {
      return onWrite(write);
    });
    this.on('stream', function(stream) {
      onRead(stream);
      return onWrite(stream);
    });
  }

  Client.prototype.bind = function() {
    this.count.attempt = 0;
    this.bindArgs = arguments;
    return process.nextTick(this.reconnect);
  };

  Client.prototype.unbind = function() {
    this.log("CLIENT UNBIND");
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
      if (this.d) {
        this.d.removeAllListeners().end();
        this.d = null;
      }
      this.emit('down');
      return;
    }
    return this.connect();
  };

  Client.prototype.connect = function() {
    var _this = this;
    if (!this.bindArgs) {
      return;
    }
    this.log("connecting....");
    this.count.attempt++;
    this.ctx = new RemoteContext;
    this.d = dnode(this.wrapObject(this.exposed, this.ctx));
    this.d.splicedRead = false;
    this.d.splicedWrite = false;
    this.d.once('remote', this.onRemote);
    this.d.once('end', this.onEnd);
    this.d.once('error', this.onError);
    this.d.once('fail', this.onStreamError);
    this.connect.t = setTimeout(this.onConnectTimeout, this.opts.timeout);
    this.d.once('remote', function() {
      return clearTimeout(_this.connect.t);
    });
    this.log("connection attempt " + this.count.attempt + "...");
    Base.prototype.bind.apply(this, this.bindArgs);
  };

  Client.prototype.onConnectTimeout = function() {
    var _this = this;
    this.emit('timeout.connect');
    return this.unbind(function() {
      return _this.reconnect();
    });
  };

  Client.prototype.onStreamError = function(err) {
    this.warn("stream error: " + err.message);
    if (this.unbound || this.unbinding) {
      return;
    }
    this.log("stream error: " + err.message);
    this.reconnect();
  };

  Client.prototype.onError = function(err) {
    var msg;
    this.warn("===== " + (err.stack || err));
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
    this.emit('up');
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
    this.log("server closed reconnection");
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
    if (fn) {
      this.pubsub.on(event, fn);
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

},{"../../vendor/lodash":48,"../base":38,"../context":40,"../helper":41,"__browserify_process":20,"dnode":25}],40:[function(require,module,exports){
var process=require("__browserify_process");// Generated by CoffeeScript 1.6.3
var RemoteContext, Socket, _;

_ = require('../vendor/lodash');

Socket = require("net").Socket;

module.exports = RemoteContext = (function() {
  function RemoteContext() {
    this.id = '...';
    this.guid = '...';
    this.data = {};
    this.events = {};
  }

  RemoteContext.prototype.get = function(k) {
    return this.data[k];
  };

  RemoteContext.prototype.set = function(k, v) {
    return this.data[k] = v;
  };

  RemoteContext.prototype.combine = function(ctx) {
    if (ctx.id !== this.id || ctx.guid !== this.guid) {
      return;
    }
    this.data = ctx.data = _.merge(this.data, ctx.data);
    return this.events = ctx.events = _.merge(this.events, ctx.events);
  };

  RemoteContext.prototype.getAddr = function(stream) {
    var sock;
    if (process.browser) {
      return;
    }
    if (stream instanceof Socket) {
      sock = stream;
    } else if (stream.connection instanceof Socket) {
      sock = stream.connection;
    }
    if (sock) {
      this.ip = sock.remoteAddress;
      return this.port = sock.remotePort;
    }
  };

  RemoteContext.prototype.getMeta = function(meta) {
    var e, _i, _len, _ref, _results;
    this.id = meta.id, this.guid = meta.guid;
    _ref = meta.events;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      e = _ref[_i];
      _results.push(this.events[e] = 1);
    }
    return _results;
  };

  return RemoteContext;

})();

/*
//@ sourceMappingURL=context.map
*/

},{"../vendor/lodash":48,"__browserify_process":20,"net":4}],41:[function(require,module,exports){
// Generated by CoffeeScript 1.6.3
var setFns;

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

},{}],42:[function(require,module,exports){
// Generated by CoffeeScript 1.6.3
var Base, Client, LocalPeer, Server;

Base = require('./base');

Server = require('./server/server');

Client = require('./client/client');

LocalPeer = require('./peer/local-peer');

try {
  require('source-map-support').install();
} catch (_error) {}

exports.addTransport = require('./transport-mgr').add;

exports.client = function(opts) {
  return new Client(opts);
};

exports.server = function(opts) {
  return new Server(opts);
};

exports.peer = function(opts) {
  return new LocalPeer(opts);
};

exports.install = function(plugin) {
  var err;
  err = function(msg) {
    return console.warn("pnode: Cannot install plugin: " + msg);
  };
  if (typeof plugin !== 'object') {
    return err("must be an object");
  }
  if (typeof plugin.name !== 'string') {
    return err("must have a string 'name' property");
  }
  if (typeof plugin.fn !== 'function') {
    return err("must have a function 'fn' property");
  }
  if (Base.prototype[plugin.name] !== void 0) {
    return err("property '" + plugin.name + "' already exists on the prototype");
  }
  Base.prototype[plugin.name] = plugin.fn;
  return true;
};

exports.helper = require('./helper');

/*
//@ sourceMappingURL=index.map
*/

},{"./base":38,"./client/client":39,"./helper":41,"./peer/local-peer":43,"./server/server":46,"./transport-mgr":47,"source-map-support":19}],43:[function(require,module,exports){
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
    this.peers = helper.set();
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

  LocalPeer.prototype.bind = function() {
    return this.error("bind() is ambiguous, please use bindOn() and bindTo()");
  };

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
    peer = this.peers.findBy('guid', guid);
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
      peers: helper.serialize(this.peers)
    };
  };

  LocalPeer.prototype.all = function(callback) {
    var peer, rems, _i, _len, _ref;
    rems = [];
    _ref = this.peers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      peer = _ref[_i];
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
      peer = _this.peers.findBy('id', id) || _this.peers.findBy('guid', id);
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
      this.log("CHECK PEER: " + id);
      if (!get()) {
        return;
      }
      this.off('peer', check);
      return clearTimeout(t);
    };
    t = setTimeout(function() {
      _this.off('peer', check);
      return _this.emit('waitout', id);
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

},{"../../vendor/lodash":48,"../base":38,"../client/client":39,"../helper":41,"../server/connection":45,"../server/server":46,"./remote-peer":44,"object-index":37}],44:[function(require,module,exports){
// Generated by CoffeeScript 1.6.3
var Base, RemoteContext, RemotePeer, helper,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Base = require('../base');

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
      _this.log("LOST CONNECTION (" + _this.uri + ")");
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

})(Base.Logger);

/*
//@ sourceMappingURL=remote-peer.map
*/

},{"../base":38,"../context":40,"../helper":41}],45:[function(require,module,exports){
// Generated by CoffeeScript 1.6.3
var Base, Connection, ObjectIndex, RemoteContext, dnode, helper, servers,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

dnode = require('dnode');

Base = require('../base');

helper = require('../helper');

RemoteContext = require('../context');

ObjectIndex = require('object-index');

servers = [];

module.exports = Connection = (function(_super) {
  __extends(Connection, _super);

  Connection.prototype.name = 'Connection';

  function Connection(server, read, write) {
    var _this = this;
    this.server = server;
    this.opts = this.server.opts;
    Object.defineProperty(this, 'uri', {
      get: function() {
        return _this.server.uri;
      }
    });
    this.accepted = false;
    this.id = this.guid = "...";
    this.subs = {};
    this.ctx = new RemoteContext;
    this.ctx.getAddr(read);
    this.d = dnode(this.server.wrapObject(this.server.exposed, this.ctx));
    this.d.on('error', this.onError.bind(this));
    this.d.on('fail', this.onFail.bind(this));
    this.d.once('remote', this.onRemote.bind(this));
    read.once('close', this.d.end);
    read.once('end', this.d.end);
    if (read !== write) {
      write.once('close', this.d.end);
      write.once('end', this.d.end);
    }
    this.d.once('end', function() {
      return _this.emit('down');
    });
    read.pipe(this.d).pipe(write);
  }

  Connection.prototype.unbind = function(cb) {
    if (cb) {
      this.d.once('end', cb);
    }
    this.d.end();
    return this.removeAllListeners();
  };

  Connection.prototype.onRemote = function(remote) {
    var meta;
    remote = this.server.wrapObject(remote);
    meta = remote._pnode;
    if (!meta) {
      this.warn("Invalid pnode connection");
      d.end();
      return;
    }
    this.id = meta.id, this.guid = meta.guid;
    this.ctx.getMeta(meta);
    this.remote = remote;
    this.emit('remote', remote);
    this.emit('up');
  };

  Connection.prototype.onError = function(err) {
    this.warn("dnode error: " + err);
    return this.emit('error', err);
  };

  Connection.prototype.onFail = function(err) {
    this.warn("dnode fail: " + err);
    return this.emit('fail', err);
  };

  Connection.prototype.publish = function() {
    var args;
    args = arguments;
    if (!this.ctx.events[args[0]]) {
      this.log("not subscribed to event: " + args[0]);
      return;
    }
    return this.remote._pnode.publish.apply(null, args);
  };

  Connection.prototype.subscribe = function(event, fn) {
    return this.remote._pnode.subscribe(event);
  };

  Connection.prototype.toString = function() {
    return "" + this.name + ": " + this.server.id + " -> " + this.id + ":";
  };

  return Connection;

})(Base.Logger);

/*
//@ sourceMappingURL=connection.map
*/

},{"../base":38,"../context":40,"../helper":41,"dnode":25,"object-index":37}],46:[function(require,module,exports){
var process=require("__browserify_process");// Generated by CoffeeScript 1.6.3
var Base, Connection, ObjectIndex, Server, dnode, helper, servers,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

dnode = require('dnode');

Base = require('../base');

helper = require('../helper');

ObjectIndex = require('object-index');

Connection = require('./connection');

servers = [];

module.exports = Server = (function(_super) {
  __extends(Server, _super);

  Server.prototype.name = 'Server';

  Server.prototype.defaults = {
    debug: false,
    wait: 5000,
    timeout: 5000
  };

  function Server() {
    var _this = this;
    servers.push(this);
    Server.__super__.constructor.apply(this, arguments);
    this.connections = helper.set();
    this.bindOn = this.bind;
    this.on('unbinding', function() {
      var conn, _i, _len, _ref;
      _ref = _this.connections.copy();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        conn = _ref[_i];
        conn.unbind();
      }
    });
    this.on('uri', function(uri) {
      _this.uri = uri;
    });
    this.on('stream', this.handle);
    return;
  }

  Server.prototype.handle = function(read, write) {
    var conn,
      _this = this;
    if (read.write && !(write != null ? write.write : void 0)) {
      write = read;
    }
    if (!helper.isReadable(read)) {
      this.err(new Error("Invalid read stream"));
    }
    if (!helper.isWritable(write)) {
      this.err(new Error("Invalid write stream"));
    }
    conn = new Connection(this, read, write);
    conn.on('error', this.onError);
    conn.on('fail', this.onFail);
    conn.once('up', function() {
      _this.log("CONN UP " + conn.id);
      if (_this.connections.findAllBy('id', conn.id).length >= 2 || _this.connections.findAllBy('guid', conn.guid).length >= 2) {
        _this.warn("rejected duplicate conn with id " + conn.id + " (" + conn.guid + ")");
        conn.unbind();
        return;
      }
      conn.accepted = true;
      _this.emit('remote', conn.remote);
    });
    conn.once('down', function() {
      _this.log("CONN DOWN " + conn.id);
      if (_this.connections.remove(conn)) {
        _this.emit('disconnection', conn);
      }
    });
    this.connections.add(conn);
    this.emit('connection', conn, this);
  };

  Server.prototype.onError = function(err) {
    return this.emit('error', err);
  };

  Server.prototype.onFail = function(err) {
    return this.emit('fail', err);
  };

  Server.prototype.client = function(id, callback) {
    var check, get, t,
      _this = this;
    get = function() {
      var conn;
      conn = _this.connections.findBy('id', id) || _this.connections.findBy('guid', id);
      if (!conn) {
        return false;
      }
      callback(conn.remote);
      return true;
    };
    if (get()) {
      return;
    }
    check = function() {
      if (!get()) {
        return;
      }
      this.off('remote', check);
      return clearTimeout(t);
    };
    t = setTimeout(function() {
      _this.off('remote', check);
      return _this.emit('waitout', id);
    }, this.opts.wait);
    this.on('remote', check);
  };

  Server.prototype.all = function(callback) {
    var conn, rems, _i, _len, _ref;
    rems = [];
    _ref = this.connections;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      conn = _ref[_i];
      rems.push(conn.remote);
    }
    return callback(rems);
  };

  Server.prototype.publish = function() {
    var args, conn, _i, _len, _ref;
    args = arguments;
    _ref = this.connections;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      conn = _ref[_i];
      conn.publish.apply(conn, args);
    }
  };

  Server.prototype.subscribe = function(event, fn) {
    var conn, _i, _len, _ref;
    this.pubsub.on(event, fn);
    if (this.pubsub.listeners(event).length === 1) {
      _ref = this.connections;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        conn = _ref[_i];
        conn.subscribe(event);
      }
    }
  };

  Server.prototype.serialize = function() {
    return this.uri;
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

},{"../base":38,"../helper":41,"./connection":45,"__browserify_process":20,"dnode":25,"object-index":37}],47:[function(require,module,exports){
var process=require("__browserify_process"),__dirname="/../../out/transport-mgr";// Generated by CoffeeScript 1.6.3
var files, fs, helper, parse, path, re, transports;

fs = require('fs');

path = require('path');

helper = require('../helper');

re = /^([a-z]+):\/\//;

transports = {};

parse = function(str) {
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

exports.get = function(args) {
  var name, parseFn, parsed, trans, transport, uri;
  transport = args.shift();
  if (typeof transport !== 'string') {
    throw new Error("invalid transport name");
  }
  if (re.test(transport)) {
    name = RegExp.$1;
    trans = transports[name];
    uri = transport.replace(re, '');
  } else {
    name = transport;
    trans = transports[name];
  }
  if (!trans) {
    throw new Error("'" + name + "' not found");
  }
  parseFn = trans.parse || parse;
  parsed = parseFn(uri);
  while (parsed && parsed.length) {
    args.unshift(parsed.pop());
  }
  return trans;
};

exports.add = function(name, obj) {
  if (typeof obj.bindServer !== 'function' || typeof obj.bindClient !== 'function') {
    throw "Transport '" + name + "' cannot be added, bind methods are missing";
  }
  if (/[^a-z]/.test(name)) {
    throw "Transport name must be lowercase letters only";
  }
  if (transports[name]) {
    throw "Transport '" + name + "' already exists";
  }
  transports[name] = obj;
  return true;
};

if (!process.browser) {
  files = fs.readdirSync(path.join(__dirname, "transports"));
  files.filter(function(f) {
    return /\.js$/.test(f);
  }).forEach(function(f) {
    return exports.add(f.replace('.js', ''), require("./transports/" + f));
  });
}

/*
//@ sourceMappingURL=index.map
*/

},{"../helper":41,"__browserify_process":20,"fs":3,"path":5}],48:[function(require,module,exports){
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

},{}]},{},[23])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL2Jyb3dzZXIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi9hc3NlcnQuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL2Jyb3dzZXIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi9ldmVudHMuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL2Jyb3dzZXIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi9mcy5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvYnJvd3Nlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9idWlsdGluL25ldC5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvYnJvd3Nlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9idWlsdGluL3BhdGguanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL2Jyb3dzZXIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi9xdWVyeXN0cmluZy5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvYnJvd3Nlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9idWlsdGluL3N0cmVhbS5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvYnJvd3Nlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9idWlsdGluL3VybC5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvYnJvd3Nlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9idWlsdGluL3V0aWwuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL2Jyb3dzZXIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvbm9kZV9tb2R1bGVzL2J1ZmZlci1icm93c2VyaWZ5L2J1ZmZlcl9pZWVlNzU0LmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTHVtYS9wbm9kZS9icm93c2VyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL25vZGVfbW9kdWxlcy9idWZmZXItYnJvd3NlcmlmeS9pbmRleC5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvYnJvd3Nlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9ub2RlX21vZHVsZXMvYnVmZmVyLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9saWIvYjY0LmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTHVtYS9wbm9kZS9icm93c2VyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL25vZGVfbW9kdWxlcy9jcnlwdG8tYnJvd3NlcmlmeS9oZWxwZXJzLmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTHVtYS9wbm9kZS9icm93c2VyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL25vZGVfbW9kdWxlcy9jcnlwdG8tYnJvd3NlcmlmeS9pbmRleC5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvYnJvd3Nlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9ub2RlX21vZHVsZXMvY3J5cHRvLWJyb3dzZXJpZnkvbWQ1LmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTHVtYS9wbm9kZS9icm93c2VyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL25vZGVfbW9kdWxlcy9jcnlwdG8tYnJvd3NlcmlmeS9ybmcuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL2Jyb3dzZXIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvbm9kZV9tb2R1bGVzL2NyeXB0by1icm93c2VyaWZ5L3NoYS5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvYnJvd3Nlci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9ub2RlX21vZHVsZXMvY3J5cHRvLWJyb3dzZXJpZnkvc2hhMjU2LmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTHVtYS9wbm9kZS9icm93c2VyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXJlc29sdmUvZW1wdHkuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL2Jyb3dzZXIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luc2VydC1tb2R1bGUtZ2xvYmFscy9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTHVtYS9wbm9kZS9icm93c2VyL25vZGVfbW9kdWxlcy9zaG9lL2Jyb3dzZXIuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL2Jyb3dzZXIvbm9kZV9tb2R1bGVzL3Nob2Uvbm9kZV9tb2R1bGVzL3NvY2tqcy1jbGllbnQvc29ja2pzLmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTHVtYS9wbm9kZS9icm93c2VyL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvYnJvd3Nlci9zcmMvdHJhbnNwb3J0cy93cy5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvbm9kZV9tb2R1bGVzL2Rub2RlL2Jyb3dzZXIuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL25vZGVfbW9kdWxlcy9kbm9kZS9saWIvZG5vZGUuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL25vZGVfbW9kdWxlcy9kbm9kZS9ub2RlX21vZHVsZXMvZG5vZGUtcHJvdG9jb2wvaW5kZXguanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL25vZGVfbW9kdWxlcy9kbm9kZS9ub2RlX21vZHVsZXMvZG5vZGUtcHJvdG9jb2wvbGliL2ZvcmVhY2guanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL25vZGVfbW9kdWxlcy9kbm9kZS9ub2RlX21vZHVsZXMvZG5vZGUtcHJvdG9jb2wvbGliL2lzX2VudW0uanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL25vZGVfbW9kdWxlcy9kbm9kZS9ub2RlX21vZHVsZXMvZG5vZGUtcHJvdG9jb2wvbGliL2tleXMuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL25vZGVfbW9kdWxlcy9kbm9kZS9ub2RlX21vZHVsZXMvZG5vZGUtcHJvdG9jb2wvbGliL3NjcnViLmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTHVtYS9wbm9kZS9ub2RlX21vZHVsZXMvZG5vZGUvbm9kZV9tb2R1bGVzL2Rub2RlLXByb3RvY29sL25vZGVfbW9kdWxlcy90cmF2ZXJzZS9pbmRleC5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvbm9kZV9tb2R1bGVzL2Rub2RlL25vZGVfbW9kdWxlcy9qc29uaWZ5L2luZGV4LmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTHVtYS9wbm9kZS9ub2RlX21vZHVsZXMvZG5vZGUvbm9kZV9tb2R1bGVzL2pzb25pZnkvbGliL3BhcnNlLmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTHVtYS9wbm9kZS9ub2RlX21vZHVsZXMvZG5vZGUvbm9kZV9tb2R1bGVzL2pzb25pZnkvbGliL3N0cmluZ2lmeS5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvbm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjIvbGliL2V2ZW50ZW1pdHRlcjIuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL25vZGVfbW9kdWxlcy9vYmplY3QtaW5kZXgvaW5kZXguanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL291dC9iYXNlLmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTHVtYS9wbm9kZS9vdXQvY2xpZW50L2NsaWVudC5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvb3V0L2NvbnRleHQuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL291dC9oZWxwZXIuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL291dC9pbmRleC5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvb3V0L3BlZXIvbG9jYWwtcGVlci5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvb3V0L3BlZXIvcmVtb3RlLXBlZXIuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL291dC9zZXJ2ZXIvY29ubmVjdGlvbi5qcyIsIi9Vc2Vycy9qcGlsbG9yYS9Db2RlL0x1bWEvcG5vZGUvb3V0L3NlcnZlci9zZXJ2ZXIuanMiLCIvVXNlcnMvanBpbGxvcmEvQ29kZS9MdW1hL3Bub2RlL291dC90cmFuc3BvcnQtbWdyL2luZGV4LmpzIiwiL1VzZXJzL2pwaWxsb3JhL0NvZGUvTHVtYS9wbm9kZS92ZW5kb3IvbG9kYXNoL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xNQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbnhFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFUQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIi8vIFVUSUxJVFlcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIEJ1ZmZlciA9IHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyO1xudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuZnVuY3Rpb24gb2JqZWN0S2V5cyhvYmplY3QpIHtcbiAgaWYgKE9iamVjdC5rZXlzKSByZXR1cm4gT2JqZWN0LmtleXMob2JqZWN0KTtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICBmb3IgKHZhciBuYW1lIGluIG9iamVjdCkge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBuYW1lKSkge1xuICAgICAgcmVzdWx0LnB1c2gobmFtZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIDEuIFRoZSBhc3NlcnQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IHRocm93XG4vLyBBc3NlcnRpb25FcnJvcidzIHdoZW4gcGFydGljdWxhciBjb25kaXRpb25zIGFyZSBub3QgbWV0LiBUaGVcbi8vIGFzc2VydCBtb2R1bGUgbXVzdCBjb25mb3JtIHRvIHRoZSBmb2xsb3dpbmcgaW50ZXJmYWNlLlxuXG52YXIgYXNzZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSBvaztcblxuLy8gMi4gVGhlIEFzc2VydGlvbkVycm9yIGlzIGRlZmluZWQgaW4gYXNzZXJ0LlxuLy8gbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IG1lc3NhZ2UsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkIH0pXG5cbmFzc2VydC5Bc3NlcnRpb25FcnJvciA9IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gJ0Fzc2VydGlvbkVycm9yJztcbiAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuXG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiByZXBsYWNlcihrZXksIHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuICcnICsgdmFsdWU7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgKGlzTmFOKHZhbHVlKSB8fCAhaXNGaW5pdGUodmFsdWUpKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgfHwgdmFsdWUgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHR5cGVvZiBzID09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5cbmFzc2VydC5Bc3NlcnRpb25FcnJvci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMubWVzc2FnZSkge1xuICAgIHJldHVybiBbdGhpcy5uYW1lICsgJzonLCB0aGlzLm1lc3NhZ2VdLmpvaW4oJyAnKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gW1xuICAgICAgdGhpcy5uYW1lICsgJzonLFxuICAgICAgdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkodGhpcy5hY3R1YWwsIHJlcGxhY2VyKSwgMTI4KSxcbiAgICAgIHRoaXMub3BlcmF0b3IsXG4gICAgICB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeSh0aGlzLmV4cGVjdGVkLCByZXBsYWNlciksIDEyOClcbiAgICBdLmpvaW4oJyAnKTtcbiAgfVxufTtcblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsIGd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoISEhdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwRXF1YWwnLCBhc3NlcnQuZGVlcEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAoQnVmZmVyLmlzQnVmZmVyKGFjdHVhbCkgJiYgQnVmZmVyLmlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIGlmIChhY3R1YWwubGVuZ3RoICE9IGV4cGVjdGVkLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3R1YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhY3R1YWxbaV0gIT09IGV4cGVjdGVkW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIERhdGUgJiYgZXhwZWN0ZWQgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAodHlwZW9mIGFjdHVhbCAhPSAnb2JqZWN0JyAmJiB0eXBlb2YgZXhwZWN0ZWQgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNC4gRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2Uge1xuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZE9yTnVsbCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYikge1xuICBpZiAoaXNVbmRlZmluZWRPck51bGwoYSkgfHwgaXNVbmRlZmluZWRPck51bGwoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuXG4gIGlmIChhLnByb3RvdHlwZSAhPT0gYi5wcm90b3R5cGUpIHJldHVybiBmYWxzZTtcbiAgLy9+fn5JJ3ZlIG1hbmFnZWQgdG8gYnJlYWsgT2JqZWN0LmtleXMgdGhyb3VnaCBzY3Jld3kgYXJndW1lbnRzIHBhc3NpbmcuXG4gIC8vICAgQ29udmVydGluZyB0byBhcnJheSBzb2x2ZXMgdGhlIHByb2JsZW0uXG4gIGlmIChpc0FyZ3VtZW50cyhhKSkge1xuICAgIGlmICghaXNBcmd1bWVudHMoYikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiKTtcbiAgfVxuICB0cnkge1xuICAgIHZhciBrYSA9IG9iamVjdEtleXMoYSksXG4gICAgICAgIGtiID0gb2JqZWN0S2V5cyhiKSxcbiAgICAgICAga2V5LCBpO1xuICB9IGNhdGNoIChlKSB7Ly9oYXBwZW5zIHdoZW4gb25lIGlzIGEgc3RyaW5nIGxpdGVyYWwgYW5kIHRoZSBvdGhlciBpc24ndFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldKSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKGV4cGVjdGVkIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHR5cGVvZiBleHBlY3RlZCA9PT0gJ3N0cmluZycpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgYWN0dWFsID0gZTtcbiAgfVxuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKCFzaG91bGRUaHJvdyAmJiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFtmYWxzZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHt0aHJvdyBlcnI7fX07XG4iLCJ2YXIgcHJvY2Vzcz1yZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIik7aWYgKCFwcm9jZXNzLkV2ZW50RW1pdHRlcikgcHJvY2Vzcy5FdmVudEVtaXR0ZXIgPSBmdW5jdGlvbiAoKSB7fTtcblxudmFyIEV2ZW50RW1pdHRlciA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gcHJvY2Vzcy5FdmVudEVtaXR0ZXI7XG52YXIgaXNBcnJheSA9IHR5cGVvZiBBcnJheS5pc0FycmF5ID09PSAnZnVuY3Rpb24nXG4gICAgPyBBcnJheS5pc0FycmF5XG4gICAgOiBmdW5jdGlvbiAoeHMpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSdcbiAgICB9XG47XG5mdW5jdGlvbiBpbmRleE9mICh4cywgeCkge1xuICAgIGlmICh4cy5pbmRleE9mKSByZXR1cm4geHMuaW5kZXhPZih4KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh4ID09PSB4c1tpXSkgcmV0dXJuIGk7XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhblxuLy8gMTAgbGlzdGVuZXJzIGFyZSBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoXG4vLyBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbi8vXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxudmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgPSBuO1xufTtcblxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc0FycmF5KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKVxuICAgIHtcbiAgICAgIGlmIChhcmd1bWVudHNbMV0gaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBhcmd1bWVudHNbMV07IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmNhdWdodCwgdW5zcGVjaWZpZWQgJ2Vycm9yJyBldmVudC5cIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiBmYWxzZTtcbiAgdmFyIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGlmICghaGFuZGxlcikgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgaGFuZGxlciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmIChpc0FycmF5KGhhbmRsZXIpKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgdmFyIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbi8vIEV2ZW50RW1pdHRlciBpcyBkZWZpbmVkIGluIHNyYy9ub2RlX2V2ZW50cy5jY1xuLy8gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0KCkgaXMgYWxzbyBkZWZpbmVkIHRoZXJlLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgbGlzdGVuZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2FkZExpc3RlbmVyIG9ubHkgdGFrZXMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PSBcIm5ld0xpc3RlbmVyc1wiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lcnNcIi5cbiAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuXG4gICAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICAgIHZhciBtO1xuICAgICAgaWYgKHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBtID0gdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG0gPSBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgICAgfVxuXG4gICAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICB9IGVsc2Uge1xuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5vbih0eXBlLCBmdW5jdGlvbiBnKCkge1xuICAgIHNlbGYucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG4gICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBsaXN0ZW5lcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncmVtb3ZlTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKSByZXR1cm4gdGhpcztcblxuICB2YXIgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNBcnJheShsaXN0KSkge1xuICAgIHZhciBpID0gaW5kZXhPZihsaXN0LCBsaXN0ZW5lcik7XG4gICAgaWYgKGkgPCAwKSByZXR1cm4gdGhpcztcbiAgICBsaXN0LnNwbGljZShpLCAxKTtcbiAgICBpZiAobGlzdC5sZW5ndGggPT0gMClcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH0gZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdID09PSBsaXN0ZW5lcikge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG4gIGlmICh0eXBlICYmIHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IG51bGw7XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFtdO1xuICBpZiAoIWlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICB9XG4gIHJldHVybiB0aGlzLl9ldmVudHNbdHlwZV07XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmICh0eXBlb2YgZW1pdHRlci5fZXZlbnRzW3R5cGVdID09PSAnZnVuY3Rpb24nKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcbiIsIi8vIG5vdGhpbmcgdG8gc2VlIGhlcmUuLi4gbm8gZmlsZSBtZXRob2RzIGZvciB0aGUgYnJvd3NlclxuIiwiLy8gdG9kb1xuIiwidmFyIHByb2Nlc3M9cmVxdWlyZShcIl9fYnJvd3NlcmlmeV9wcm9jZXNzXCIpO2Z1bmN0aW9uIGZpbHRlciAoeHMsIGZuKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGZuKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gcmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIGFycmF5IHdpdGggZGlyZWN0b3J5IG5hbWVzIHRoZXJlXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMsIGVtcHR5IGVsZW1lbnRzLCBvciBkZXZpY2UgbmFtZXMgKGM6XFwpIGluIHRoZSBhcnJheVxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShwYXJ0cywgYWxsb3dBYm92ZVJvb3QpIHtcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aDsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09ICcuJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cC0tO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSBwYXRoIGlzIGFsbG93ZWQgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIHJlc3RvcmUgbGVhZGluZyAuLnNcbiAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgZm9yICg7IHVwLS07IHVwKSB7XG4gICAgICBwYXJ0cy51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cztcbn1cblxuLy8gUmVnZXggdG8gc3BsaXQgYSBmaWxlbmFtZSBpbnRvIFsqLCBkaXIsIGJhc2VuYW1lLCBleHRdXG4vLyBwb3NpeCB2ZXJzaW9uXG52YXIgc3BsaXRQYXRoUmUgPSAvXiguK1xcLyg/ISQpfFxcLyk/KCg/Oi4rPyk/KFxcLlteLl0qKT8pJC87XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xudmFyIHJlc29sdmVkUGF0aCA9ICcnLFxuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICB2YXIgcGF0aCA9IChpID49IDApXG4gICAgICA/IGFyZ3VtZW50c1tpXVxuICAgICAgOiBwcm9jZXNzLmN3ZCgpO1xuXG4gIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xuICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnIHx8ICFwYXRoKSB7XG4gICAgY29udGludWU7XG4gIH1cblxuICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn1cblxuLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbi8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxucmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xudmFyIGlzQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nLFxuICAgIHRyYWlsaW5nU2xhc2ggPSBwYXRoLnNsaWNlKC0xKSA9PT0gJy8nO1xuXG4vLyBOb3JtYWxpemUgdGhlIHBhdGhcbnBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cbiAgXG4gIHJldHVybiAoaXNBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHBhdGg7XG59O1xuXG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIHJldHVybiBwICYmIHR5cGVvZiBwID09PSAnc3RyaW5nJztcbiAgfSkuam9pbignLycpKTtcbn07XG5cblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgZGlyID0gc3BsaXRQYXRoUmUuZXhlYyhwYXRoKVsxXSB8fCAnJztcbiAgdmFyIGlzV2luZG93cyA9IGZhbHNlO1xuICBpZiAoIWRpcikge1xuICAgIC8vIE5vIGRpcm5hbWVcbiAgICByZXR1cm4gJy4nO1xuICB9IGVsc2UgaWYgKGRpci5sZW5ndGggPT09IDEgfHxcbiAgICAgIChpc1dpbmRvd3MgJiYgZGlyLmxlbmd0aCA8PSAzICYmIGRpci5jaGFyQXQoMSkgPT09ICc6JykpIHtcbiAgICAvLyBJdCBpcyBqdXN0IGEgc2xhc2ggb3IgYSBkcml2ZSBsZXR0ZXIgd2l0aCBhIHNsYXNoXG4gICAgcmV0dXJuIGRpcjtcbiAgfSBlbHNlIHtcbiAgICAvLyBJdCBpcyBhIGZ1bGwgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcbiAgICByZXR1cm4gZGlyLnN1YnN0cmluZygwLCBkaXIubGVuZ3RoIC0gMSk7XG4gIH1cbn07XG5cblxuZXhwb3J0cy5iYXNlbmFtZSA9IGZ1bmN0aW9uKHBhdGgsIGV4dCkge1xuICB2YXIgZiA9IHNwbGl0UGF0aFJlLmV4ZWMocGF0aClbMl0gfHwgJyc7XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cblxuZXhwb3J0cy5leHRuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhwYXRoKVszXSB8fCAnJztcbn07XG5cbmV4cG9ydHMucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICBmcm9tID0gZXhwb3J0cy5yZXNvbHZlKGZyb20pLnN1YnN0cigxKTtcbiAgdG8gPSBleHBvcnRzLnJlc29sdmUodG8pLnN1YnN0cigxKTtcblxuICBmdW5jdGlvbiB0cmltKGFycikge1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgZm9yICg7IHN0YXJ0IDwgYXJyLmxlbmd0aDsgc3RhcnQrKykge1xuICAgICAgaWYgKGFycltzdGFydF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgZm9yICg7IGVuZCA+PSAwOyBlbmQtLSkge1xuICAgICAgaWYgKGFycltlbmRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kIC0gc3RhcnQgKyAxKTtcbiAgfVxuXG4gIHZhciBmcm9tUGFydHMgPSB0cmltKGZyb20uc3BsaXQoJy8nKSk7XG4gIHZhciB0b1BhcnRzID0gdHJpbSh0by5zcGxpdCgnLycpKTtcblxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oZnJvbVBhcnRzLmxlbmd0aCwgdG9QYXJ0cy5sZW5ndGgpO1xuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZyb21QYXJ0c1tpXSAhPT0gdG9QYXJ0c1tpXSkge1xuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvdXRwdXRQYXJ0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcbiAgfVxuXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XG5cbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbmV4cG9ydHMuc2VwID0gJy8nO1xuIiwiXG4vKipcbiAqIE9iamVjdCN0b1N0cmluZygpIHJlZiBmb3Igc3RyaW5naWZ5KCkuXG4gKi9cblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuLyoqXG4gKiBBcnJheSNpbmRleE9mIHNoaW0uXG4gKi9cblxudmFyIGluZGV4T2YgPSB0eXBlb2YgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbidcbiAgPyBmdW5jdGlvbihhcnIsIGVsKSB7IHJldHVybiBhcnIuaW5kZXhPZihlbCk7IH1cbiAgOiBmdW5jdGlvbihhcnIsIGVsKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYXJyW2ldID09PSBlbCkgcmV0dXJuIGk7XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfTtcblxuLyoqXG4gKiBBcnJheS5pc0FycmF5IHNoaW0uXG4gKi9cblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKGFycikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuXG4vKipcbiAqIE9iamVjdC5rZXlzIHNoaW0uXG4gKi9cblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbihvYmopIHtcbiAgdmFyIHJldCA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSByZXQucHVzaChrZXkpO1xuICByZXR1cm4gcmV0O1xufTtcblxuLyoqXG4gKiBBcnJheSNmb3JFYWNoIHNoaW0uXG4gKi9cblxudmFyIGZvckVhY2ggPSB0eXBlb2YgQXJyYXkucHJvdG90eXBlLmZvckVhY2ggPT09ICdmdW5jdGlvbidcbiAgPyBmdW5jdGlvbihhcnIsIGZuKSB7IHJldHVybiBhcnIuZm9yRWFjaChmbik7IH1cbiAgOiBmdW5jdGlvbihhcnIsIGZuKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgZm4oYXJyW2ldKTtcbiAgICB9O1xuXG4vKipcbiAqIEFycmF5I3JlZHVjZSBzaGltLlxuICovXG5cbnZhciByZWR1Y2UgPSBmdW5jdGlvbihhcnIsIGZuLCBpbml0aWFsKSB7XG4gIGlmICh0eXBlb2YgYXJyLnJlZHVjZSA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGFyci5yZWR1Y2UoZm4sIGluaXRpYWwpO1xuICB2YXIgcmVzID0gaW5pdGlhbDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHJlcyA9IGZuKHJlcywgYXJyW2ldKTtcbiAgcmV0dXJuIHJlcztcbn07XG5cbi8qKlxuICogQ2FjaGUgbm9uLWludGVnZXIgdGVzdCByZWdleHAuXG4gKi9cblxudmFyIGlzaW50ID0gL15bMC05XSskLztcblxuZnVuY3Rpb24gcHJvbW90ZShwYXJlbnQsIGtleSkge1xuICBpZiAocGFyZW50W2tleV0ubGVuZ3RoID09IDApIHJldHVybiBwYXJlbnRba2V5XSA9IHt9O1xuICB2YXIgdCA9IHt9O1xuICBmb3IgKHZhciBpIGluIHBhcmVudFtrZXldKSB0W2ldID0gcGFyZW50W2tleV1baV07XG4gIHBhcmVudFtrZXldID0gdDtcbiAgcmV0dXJuIHQ7XG59XG5cbmZ1bmN0aW9uIHBhcnNlKHBhcnRzLCBwYXJlbnQsIGtleSwgdmFsKSB7XG4gIHZhciBwYXJ0ID0gcGFydHMuc2hpZnQoKTtcbiAgLy8gZW5kXG4gIGlmICghcGFydCkge1xuICAgIGlmIChpc0FycmF5KHBhcmVudFtrZXldKSkge1xuICAgICAgcGFyZW50W2tleV0ucHVzaCh2YWwpO1xuICAgIH0gZWxzZSBpZiAoJ29iamVjdCcgPT0gdHlwZW9mIHBhcmVudFtrZXldKSB7XG4gICAgICBwYXJlbnRba2V5XSA9IHZhbDtcbiAgICB9IGVsc2UgaWYgKCd1bmRlZmluZWQnID09IHR5cGVvZiBwYXJlbnRba2V5XSkge1xuICAgICAgcGFyZW50W2tleV0gPSB2YWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcmVudFtrZXldID0gW3BhcmVudFtrZXldLCB2YWxdO1xuICAgIH1cbiAgICAvLyBhcnJheVxuICB9IGVsc2Uge1xuICAgIHZhciBvYmogPSBwYXJlbnRba2V5XSA9IHBhcmVudFtrZXldIHx8IFtdO1xuICAgIGlmICgnXScgPT0gcGFydCkge1xuICAgICAgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgICAgICBpZiAoJycgIT0gdmFsKSBvYmoucHVzaCh2YWwpO1xuICAgICAgfSBlbHNlIGlmICgnb2JqZWN0JyA9PSB0eXBlb2Ygb2JqKSB7XG4gICAgICAgIG9ialtvYmplY3RLZXlzKG9iaikubGVuZ3RoXSA9IHZhbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9iaiA9IHBhcmVudFtrZXldID0gW3BhcmVudFtrZXldLCB2YWxdO1xuICAgICAgfVxuICAgICAgLy8gcHJvcFxuICAgIH0gZWxzZSBpZiAofmluZGV4T2YocGFydCwgJ10nKSkge1xuICAgICAgcGFydCA9IHBhcnQuc3Vic3RyKDAsIHBhcnQubGVuZ3RoIC0gMSk7XG4gICAgICBpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcbiAgICAgIHBhcnNlKHBhcnRzLCBvYmosIHBhcnQsIHZhbCk7XG4gICAgICAvLyBrZXlcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFpc2ludC50ZXN0KHBhcnQpICYmIGlzQXJyYXkob2JqKSkgb2JqID0gcHJvbW90ZShwYXJlbnQsIGtleSk7XG4gICAgICBwYXJzZShwYXJ0cywgb2JqLCBwYXJ0LCB2YWwpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1lcmdlIHBhcmVudCBrZXkvdmFsIHBhaXIuXG4gKi9cblxuZnVuY3Rpb24gbWVyZ2UocGFyZW50LCBrZXksIHZhbCl7XG4gIGlmICh+aW5kZXhPZihrZXksICddJykpIHtcbiAgICB2YXIgcGFydHMgPSBrZXkuc3BsaXQoJ1snKVxuICAgICAgLCBsZW4gPSBwYXJ0cy5sZW5ndGhcbiAgICAgICwgbGFzdCA9IGxlbiAtIDE7XG4gICAgcGFyc2UocGFydHMsIHBhcmVudCwgJ2Jhc2UnLCB2YWwpO1xuICAgIC8vIG9wdGltaXplXG4gIH0gZWxzZSB7XG4gICAgaWYgKCFpc2ludC50ZXN0KGtleSkgJiYgaXNBcnJheShwYXJlbnQuYmFzZSkpIHtcbiAgICAgIHZhciB0ID0ge307XG4gICAgICBmb3IgKHZhciBrIGluIHBhcmVudC5iYXNlKSB0W2tdID0gcGFyZW50LmJhc2Vba107XG4gICAgICBwYXJlbnQuYmFzZSA9IHQ7XG4gICAgfVxuICAgIHNldChwYXJlbnQuYmFzZSwga2V5LCB2YWwpO1xuICB9XG5cbiAgcmV0dXJuIHBhcmVudDtcbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gb2JqLlxuICovXG5cbmZ1bmN0aW9uIHBhcnNlT2JqZWN0KG9iail7XG4gIHZhciByZXQgPSB7IGJhc2U6IHt9IH07XG4gIGZvckVhY2gob2JqZWN0S2V5cyhvYmopLCBmdW5jdGlvbihuYW1lKXtcbiAgICBtZXJnZShyZXQsIG5hbWUsIG9ialtuYW1lXSk7XG4gIH0pO1xuICByZXR1cm4gcmV0LmJhc2U7XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIHN0ci5cbiAqL1xuXG5mdW5jdGlvbiBwYXJzZVN0cmluZyhzdHIpe1xuICByZXR1cm4gcmVkdWNlKFN0cmluZyhzdHIpLnNwbGl0KCcmJyksIGZ1bmN0aW9uKHJldCwgcGFpcil7XG4gICAgdmFyIGVxbCA9IGluZGV4T2YocGFpciwgJz0nKVxuICAgICAgLCBicmFjZSA9IGxhc3RCcmFjZUluS2V5KHBhaXIpXG4gICAgICAsIGtleSA9IHBhaXIuc3Vic3RyKDAsIGJyYWNlIHx8IGVxbClcbiAgICAgICwgdmFsID0gcGFpci5zdWJzdHIoYnJhY2UgfHwgZXFsLCBwYWlyLmxlbmd0aClcbiAgICAgICwgdmFsID0gdmFsLnN1YnN0cihpbmRleE9mKHZhbCwgJz0nKSArIDEsIHZhbC5sZW5ndGgpO1xuXG4gICAgLy8gP2Zvb1xuICAgIGlmICgnJyA9PSBrZXkpIGtleSA9IHBhaXIsIHZhbCA9ICcnO1xuICAgIGlmICgnJyA9PSBrZXkpIHJldHVybiByZXQ7XG5cbiAgICByZXR1cm4gbWVyZ2UocmV0LCBkZWNvZGUoa2V5KSwgZGVjb2RlKHZhbCkpO1xuICB9LCB7IGJhc2U6IHt9IH0pLmJhc2U7XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIHF1ZXJ5IGBzdHJgIG9yIGBvYmpgLCByZXR1cm5pbmcgYW4gb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgfCB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uKHN0cil7XG4gIGlmIChudWxsID09IHN0ciB8fCAnJyA9PSBzdHIpIHJldHVybiB7fTtcbiAgcmV0dXJuICdvYmplY3QnID09IHR5cGVvZiBzdHJcbiAgICA/IHBhcnNlT2JqZWN0KHN0cilcbiAgICA6IHBhcnNlU3RyaW5nKHN0cik7XG59O1xuXG4vKipcbiAqIFR1cm4gdGhlIGdpdmVuIGBvYmpgIGludG8gYSBxdWVyeSBzdHJpbmdcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnZhciBzdHJpbmdpZnkgPSBleHBvcnRzLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKG9iaiwgcHJlZml4KSB7XG4gIGlmIChpc0FycmF5KG9iaikpIHtcbiAgICByZXR1cm4gc3RyaW5naWZ5QXJyYXkob2JqLCBwcmVmaXgpO1xuICB9IGVsc2UgaWYgKCdbb2JqZWN0IE9iamVjdF0nID09IHRvU3RyaW5nLmNhbGwob2JqKSkge1xuICAgIHJldHVybiBzdHJpbmdpZnlPYmplY3Qob2JqLCBwcmVmaXgpO1xuICB9IGVsc2UgaWYgKCdzdHJpbmcnID09IHR5cGVvZiBvYmopIHtcbiAgICByZXR1cm4gc3RyaW5naWZ5U3RyaW5nKG9iaiwgcHJlZml4KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcHJlZml4ICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KFN0cmluZyhvYmopKTtcbiAgfVxufTtcblxuLyoqXG4gKiBTdHJpbmdpZnkgdGhlIGdpdmVuIGBzdHJgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBwcmVmaXhcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHN0cmluZ2lmeVN0cmluZyhzdHIsIHByZWZpeCkge1xuICBpZiAoIXByZWZpeCkgdGhyb3cgbmV3IFR5cGVFcnJvcignc3RyaW5naWZ5IGV4cGVjdHMgYW4gb2JqZWN0Jyk7XG4gIHJldHVybiBwcmVmaXggKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyKTtcbn1cblxuLyoqXG4gKiBTdHJpbmdpZnkgdGhlIGdpdmVuIGBhcnJgLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFyclxuICogQHBhcmFtIHtTdHJpbmd9IHByZWZpeFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc3RyaW5naWZ5QXJyYXkoYXJyLCBwcmVmaXgpIHtcbiAgdmFyIHJldCA9IFtdO1xuICBpZiAoIXByZWZpeCkgdGhyb3cgbmV3IFR5cGVFcnJvcignc3RyaW5naWZ5IGV4cGVjdHMgYW4gb2JqZWN0Jyk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgcmV0LnB1c2goc3RyaW5naWZ5KGFycltpXSwgcHJlZml4ICsgJ1snICsgaSArICddJykpO1xuICB9XG4gIHJldHVybiByZXQuam9pbignJicpO1xufVxuXG4vKipcbiAqIFN0cmluZ2lmeSB0aGUgZ2l2ZW4gYG9iamAuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtTdHJpbmd9IHByZWZpeFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc3RyaW5naWZ5T2JqZWN0KG9iaiwgcHJlZml4KSB7XG4gIHZhciByZXQgPSBbXVxuICAgICwga2V5cyA9IG9iamVjdEtleXMob2JqKVxuICAgICwga2V5O1xuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAga2V5ID0ga2V5c1tpXTtcbiAgICBpZiAobnVsbCA9PSBvYmpba2V5XSkge1xuICAgICAgcmV0LnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyAnPScpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXQucHVzaChzdHJpbmdpZnkob2JqW2tleV0sIHByZWZpeFxuICAgICAgICA/IHByZWZpeCArICdbJyArIGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgJ10nXG4gICAgICAgIDogZW5jb2RlVVJJQ29tcG9uZW50KGtleSkpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV0LmpvaW4oJyYnKTtcbn1cblxuLyoqXG4gKiBTZXQgYG9iamAncyBga2V5YCB0byBgdmFsYCByZXNwZWN0aW5nXG4gKiB0aGUgd2VpcmQgYW5kIHdvbmRlcmZ1bCBzeW50YXggb2YgYSBxcyxcbiAqIHdoZXJlIFwiZm9vPWJhciZmb289YmF6XCIgYmVjb21lcyBhbiBhcnJheS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZXQob2JqLCBrZXksIHZhbCkge1xuICB2YXIgdiA9IG9ialtrZXldO1xuICBpZiAodW5kZWZpbmVkID09PSB2KSB7XG4gICAgb2JqW2tleV0gPSB2YWw7XG4gIH0gZWxzZSBpZiAoaXNBcnJheSh2KSkge1xuICAgIHYucHVzaCh2YWwpO1xuICB9IGVsc2Uge1xuICAgIG9ialtrZXldID0gW3YsIHZhbF07XG4gIH1cbn1cblxuLyoqXG4gKiBMb2NhdGUgbGFzdCBicmFjZSBpbiBgc3RyYCB3aXRoaW4gdGhlIGtleS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsYXN0QnJhY2VJbktleShzdHIpIHtcbiAgdmFyIGxlbiA9IHN0ci5sZW5ndGhcbiAgICAsIGJyYWNlXG4gICAgLCBjO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgYyA9IHN0cltpXTtcbiAgICBpZiAoJ10nID09IGMpIGJyYWNlID0gZmFsc2U7XG4gICAgaWYgKCdbJyA9PSBjKSBicmFjZSA9IHRydWU7XG4gICAgaWYgKCc9JyA9PSBjICYmICFicmFjZSkgcmV0dXJuIGk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWNvZGUgYHN0cmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZGVjb2RlKHN0cikge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc3RyLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbmZ1bmN0aW9uIFN0cmVhbSgpIHtcbiAgZXZlbnRzLkV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xufVxudXRpbC5pbmhlcml0cyhTdHJlYW0sIGV2ZW50cy5FdmVudEVtaXR0ZXIpO1xubW9kdWxlLmV4cG9ydHMgPSBTdHJlYW07XG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjQueFxuU3RyZWFtLlN0cmVhbSA9IFN0cmVhbTtcblxuU3RyZWFtLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24oZGVzdCwgb3B0aW9ucykge1xuICB2YXIgc291cmNlID0gdGhpcztcblxuICBmdW5jdGlvbiBvbmRhdGEoY2h1bmspIHtcbiAgICBpZiAoZGVzdC53cml0YWJsZSkge1xuICAgICAgaWYgKGZhbHNlID09PSBkZXN0LndyaXRlKGNodW5rKSAmJiBzb3VyY2UucGF1c2UpIHtcbiAgICAgICAgc291cmNlLnBhdXNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc291cmNlLm9uKCdkYXRhJywgb25kYXRhKTtcblxuICBmdW5jdGlvbiBvbmRyYWluKCkge1xuICAgIGlmIChzb3VyY2UucmVhZGFibGUgJiYgc291cmNlLnJlc3VtZSkge1xuICAgICAgc291cmNlLnJlc3VtZSgpO1xuICAgIH1cbiAgfVxuXG4gIGRlc3Qub24oJ2RyYWluJywgb25kcmFpbik7XG5cbiAgLy8gSWYgdGhlICdlbmQnIG9wdGlvbiBpcyBub3Qgc3VwcGxpZWQsIGRlc3QuZW5kKCkgd2lsbCBiZSBjYWxsZWQgd2hlblxuICAvLyBzb3VyY2UgZ2V0cyB0aGUgJ2VuZCcgb3IgJ2Nsb3NlJyBldmVudHMuICBPbmx5IGRlc3QuZW5kKCkgb25jZSwgYW5kXG4gIC8vIG9ubHkgd2hlbiBhbGwgc291cmNlcyBoYXZlIGVuZGVkLlxuICBpZiAoIWRlc3QuX2lzU3RkaW8gJiYgKCFvcHRpb25zIHx8IG9wdGlvbnMuZW5kICE9PSBmYWxzZSkpIHtcbiAgICBkZXN0Ll9waXBlQ291bnQgPSBkZXN0Ll9waXBlQ291bnQgfHwgMDtcbiAgICBkZXN0Ll9waXBlQ291bnQrKztcblxuICAgIHNvdXJjZS5vbignZW5kJywgb25lbmQpO1xuICAgIHNvdXJjZS5vbignY2xvc2UnLCBvbmNsb3NlKTtcbiAgfVxuXG4gIHZhciBkaWRPbkVuZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBvbmVuZCgpIHtcbiAgICBpZiAoZGlkT25FbmQpIHJldHVybjtcbiAgICBkaWRPbkVuZCA9IHRydWU7XG5cbiAgICBkZXN0Ll9waXBlQ291bnQtLTtcblxuICAgIC8vIHJlbW92ZSB0aGUgbGlzdGVuZXJzXG4gICAgY2xlYW51cCgpO1xuXG4gICAgaWYgKGRlc3QuX3BpcGVDb3VudCA+IDApIHtcbiAgICAgIC8vIHdhaXRpbmcgZm9yIG90aGVyIGluY29taW5nIHN0cmVhbXMgdG8gZW5kLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRlc3QuZW5kKCk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIG9uY2xvc2UoKSB7XG4gICAgaWYgKGRpZE9uRW5kKSByZXR1cm47XG4gICAgZGlkT25FbmQgPSB0cnVlO1xuXG4gICAgZGVzdC5fcGlwZUNvdW50LS07XG5cbiAgICAvLyByZW1vdmUgdGhlIGxpc3RlbmVyc1xuICAgIGNsZWFudXAoKTtcblxuICAgIGlmIChkZXN0Ll9waXBlQ291bnQgPiAwKSB7XG4gICAgICAvLyB3YWl0aW5nIGZvciBvdGhlciBpbmNvbWluZyBzdHJlYW1zIHRvIGVuZC5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBkZXN0LmRlc3Ryb3koKTtcbiAgfVxuXG4gIC8vIGRvbid0IGxlYXZlIGRhbmdsaW5nIHBpcGVzIHdoZW4gdGhlcmUgYXJlIGVycm9ycy5cbiAgZnVuY3Rpb24gb25lcnJvcihlcikge1xuICAgIGNsZWFudXAoKTtcbiAgICBpZiAodGhpcy5saXN0ZW5lcnMoJ2Vycm9yJykubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkIHN0cmVhbSBlcnJvciBpbiBwaXBlLlxuICAgIH1cbiAgfVxuXG4gIHNvdXJjZS5vbignZXJyb3InLCBvbmVycm9yKTtcbiAgZGVzdC5vbignZXJyb3InLCBvbmVycm9yKTtcblxuICAvLyByZW1vdmUgYWxsIHRoZSBldmVudCBsaXN0ZW5lcnMgdGhhdCB3ZXJlIGFkZGVkLlxuICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignZGF0YScsIG9uZGF0YSk7XG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignZHJhaW4nLCBvbmRyYWluKTtcblxuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignZW5kJywgb25lbmQpO1xuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignY2xvc2UnLCBvbmNsb3NlKTtcblxuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBvbmVycm9yKTtcbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG9uZXJyb3IpO1xuXG4gICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKCdlbmQnLCBjbGVhbnVwKTtcbiAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlJywgY2xlYW51cCk7XG5cbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCdlbmQnLCBjbGVhbnVwKTtcbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCdjbG9zZScsIGNsZWFudXApO1xuICB9XG5cbiAgc291cmNlLm9uKCdlbmQnLCBjbGVhbnVwKTtcbiAgc291cmNlLm9uKCdjbG9zZScsIGNsZWFudXApO1xuXG4gIGRlc3Qub24oJ2VuZCcsIGNsZWFudXApO1xuICBkZXN0Lm9uKCdjbG9zZScsIGNsZWFudXApO1xuXG4gIGRlc3QuZW1pdCgncGlwZScsIHNvdXJjZSk7XG5cbiAgLy8gQWxsb3cgZm9yIHVuaXgtbGlrZSB1c2FnZTogQS5waXBlKEIpLnBpcGUoQylcbiAgcmV0dXJuIGRlc3Q7XG59O1xuIiwidmFyIHB1bnljb2RlID0geyBlbmNvZGUgOiBmdW5jdGlvbiAocykgeyByZXR1cm4gcyB9IH07XG5cbmV4cG9ydHMucGFyc2UgPSB1cmxQYXJzZTtcbmV4cG9ydHMucmVzb2x2ZSA9IHVybFJlc29sdmU7XG5leHBvcnRzLnJlc29sdmVPYmplY3QgPSB1cmxSZXNvbHZlT2JqZWN0O1xuZXhwb3J0cy5mb3JtYXQgPSB1cmxGb3JtYXQ7XG5cbmZ1bmN0aW9uIGFycmF5SW5kZXhPZihhcnJheSwgc3ViamVjdCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gYXJyYXkubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG4gICAgICAgIGlmKGFycmF5W2ldID09IHN1YmplY3QpIHJldHVybiBpO1xuICAgIH1cbiAgICByZXR1cm4gLTE7XG59XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gb2JqZWN0S2V5cyhvYmplY3QpIHtcbiAgICBpZiAob2JqZWN0ICE9PSBPYmplY3Qob2JqZWN0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBvYmplY3QnKTtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIGlmIChvYmplY3QuaGFzT3duUHJvcGVydHkoa2V5KSkga2V5c1trZXlzLmxlbmd0aF0gPSBrZXk7XG4gICAgcmV0dXJuIGtleXM7XG59XG5cbi8vIFJlZmVyZW5jZTogUkZDIDM5ODYsIFJGQyAxODA4LCBSRkMgMjM5NlxuXG4vLyBkZWZpbmUgdGhlc2UgaGVyZSBzbyBhdCBsZWFzdCB0aGV5IG9ubHkgaGF2ZSB0byBiZVxuLy8gY29tcGlsZWQgb25jZSBvbiB0aGUgZmlyc3QgbW9kdWxlIGxvYWQuXG52YXIgcHJvdG9jb2xQYXR0ZXJuID0gL14oW2EtejAtOS4rLV0rOikvaSxcbiAgICBwb3J0UGF0dGVybiA9IC86WzAtOV0rJC8sXG4gICAgLy8gUkZDIDIzOTY6IGNoYXJhY3RlcnMgcmVzZXJ2ZWQgZm9yIGRlbGltaXRpbmcgVVJMcy5cbiAgICBkZWxpbXMgPSBbJzwnLCAnPicsICdcIicsICdgJywgJyAnLCAnXFxyJywgJ1xcbicsICdcXHQnXSxcbiAgICAvLyBSRkMgMjM5NjogY2hhcmFjdGVycyBub3QgYWxsb3dlZCBmb3IgdmFyaW91cyByZWFzb25zLlxuICAgIHVud2lzZSA9IFsneycsICd9JywgJ3wnLCAnXFxcXCcsICdeJywgJ34nLCAnWycsICddJywgJ2AnXS5jb25jYXQoZGVsaW1zKSxcbiAgICAvLyBBbGxvd2VkIGJ5IFJGQ3MsIGJ1dCBjYXVzZSBvZiBYU1MgYXR0YWNrcy4gIEFsd2F5cyBlc2NhcGUgdGhlc2UuXG4gICAgYXV0b0VzY2FwZSA9IFsnXFwnJ10sXG4gICAgLy8gQ2hhcmFjdGVycyB0aGF0IGFyZSBuZXZlciBldmVyIGFsbG93ZWQgaW4gYSBob3N0bmFtZS5cbiAgICAvLyBOb3RlIHRoYXQgYW55IGludmFsaWQgY2hhcnMgYXJlIGFsc28gaGFuZGxlZCwgYnV0IHRoZXNlXG4gICAgLy8gYXJlIHRoZSBvbmVzIHRoYXQgYXJlICpleHBlY3RlZCogdG8gYmUgc2Vlbiwgc28gd2UgZmFzdC1wYXRoXG4gICAgLy8gdGhlbS5cbiAgICBub25Ib3N0Q2hhcnMgPSBbJyUnLCAnLycsICc/JywgJzsnLCAnIyddXG4gICAgICAuY29uY2F0KHVud2lzZSkuY29uY2F0KGF1dG9Fc2NhcGUpLFxuICAgIG5vbkF1dGhDaGFycyA9IFsnLycsICdAJywgJz8nLCAnIyddLmNvbmNhdChkZWxpbXMpLFxuICAgIGhvc3RuYW1lTWF4TGVuID0gMjU1LFxuICAgIGhvc3RuYW1lUGFydFBhdHRlcm4gPSAvXlthLXpBLVowLTldW2EtejAtOUEtWl8tXXswLDYyfSQvLFxuICAgIGhvc3RuYW1lUGFydFN0YXJ0ID0gL14oW2EtekEtWjAtOV1bYS16MC05QS1aXy1dezAsNjJ9KSguKikkLyxcbiAgICAvLyBwcm90b2NvbHMgdGhhdCBjYW4gYWxsb3cgXCJ1bnNhZmVcIiBhbmQgXCJ1bndpc2VcIiBjaGFycy5cbiAgICB1bnNhZmVQcm90b2NvbCA9IHtcbiAgICAgICdqYXZhc2NyaXB0JzogdHJ1ZSxcbiAgICAgICdqYXZhc2NyaXB0Oic6IHRydWVcbiAgICB9LFxuICAgIC8vIHByb3RvY29scyB0aGF0IG5ldmVyIGhhdmUgYSBob3N0bmFtZS5cbiAgICBob3N0bGVzc1Byb3RvY29sID0ge1xuICAgICAgJ2phdmFzY3JpcHQnOiB0cnVlLFxuICAgICAgJ2phdmFzY3JpcHQ6JzogdHJ1ZVxuICAgIH0sXG4gICAgLy8gcHJvdG9jb2xzIHRoYXQgYWx3YXlzIGhhdmUgYSBwYXRoIGNvbXBvbmVudC5cbiAgICBwYXRoZWRQcm90b2NvbCA9IHtcbiAgICAgICdodHRwJzogdHJ1ZSxcbiAgICAgICdodHRwcyc6IHRydWUsXG4gICAgICAnZnRwJzogdHJ1ZSxcbiAgICAgICdnb3BoZXInOiB0cnVlLFxuICAgICAgJ2ZpbGUnOiB0cnVlLFxuICAgICAgJ2h0dHA6JzogdHJ1ZSxcbiAgICAgICdmdHA6JzogdHJ1ZSxcbiAgICAgICdnb3BoZXI6JzogdHJ1ZSxcbiAgICAgICdmaWxlOic6IHRydWVcbiAgICB9LFxuICAgIC8vIHByb3RvY29scyB0aGF0IGFsd2F5cyBjb250YWluIGEgLy8gYml0LlxuICAgIHNsYXNoZWRQcm90b2NvbCA9IHtcbiAgICAgICdodHRwJzogdHJ1ZSxcbiAgICAgICdodHRwcyc6IHRydWUsXG4gICAgICAnZnRwJzogdHJ1ZSxcbiAgICAgICdnb3BoZXInOiB0cnVlLFxuICAgICAgJ2ZpbGUnOiB0cnVlLFxuICAgICAgJ2h0dHA6JzogdHJ1ZSxcbiAgICAgICdodHRwczonOiB0cnVlLFxuICAgICAgJ2Z0cDonOiB0cnVlLFxuICAgICAgJ2dvcGhlcjonOiB0cnVlLFxuICAgICAgJ2ZpbGU6JzogdHJ1ZVxuICAgIH0sXG4gICAgcXVlcnlzdHJpbmcgPSByZXF1aXJlKCdxdWVyeXN0cmluZycpO1xuXG5mdW5jdGlvbiB1cmxQYXJzZSh1cmwsIHBhcnNlUXVlcnlTdHJpbmcsIHNsYXNoZXNEZW5vdGVIb3N0KSB7XG4gIGlmICh1cmwgJiYgdHlwZW9mKHVybCkgPT09ICdvYmplY3QnICYmIHVybC5ocmVmKSByZXR1cm4gdXJsO1xuXG4gIGlmICh0eXBlb2YgdXJsICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQYXJhbWV0ZXIgJ3VybCcgbXVzdCBiZSBhIHN0cmluZywgbm90IFwiICsgdHlwZW9mIHVybCk7XG4gIH1cblxuICB2YXIgb3V0ID0ge30sXG4gICAgICByZXN0ID0gdXJsO1xuXG4gIC8vIGN1dCBvZmYgYW55IGRlbGltaXRlcnMuXG4gIC8vIFRoaXMgaXMgdG8gc3VwcG9ydCBwYXJzZSBzdHVmZiBsaWtlIFwiPGh0dHA6Ly9mb28uY29tPlwiXG4gIGZvciAodmFyIGkgPSAwLCBsID0gcmVzdC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBpZiAoYXJyYXlJbmRleE9mKGRlbGltcywgcmVzdC5jaGFyQXQoaSkpID09PSAtMSkgYnJlYWs7XG4gIH1cbiAgaWYgKGkgIT09IDApIHJlc3QgPSByZXN0LnN1YnN0cihpKTtcblxuXG4gIHZhciBwcm90byA9IHByb3RvY29sUGF0dGVybi5leGVjKHJlc3QpO1xuICBpZiAocHJvdG8pIHtcbiAgICBwcm90byA9IHByb3RvWzBdO1xuICAgIHZhciBsb3dlclByb3RvID0gcHJvdG8udG9Mb3dlckNhc2UoKTtcbiAgICBvdXQucHJvdG9jb2wgPSBsb3dlclByb3RvO1xuICAgIHJlc3QgPSByZXN0LnN1YnN0cihwcm90by5sZW5ndGgpO1xuICB9XG5cbiAgLy8gZmlndXJlIG91dCBpZiBpdCdzIGdvdCBhIGhvc3RcbiAgLy8gdXNlckBzZXJ2ZXIgaXMgKmFsd2F5cyogaW50ZXJwcmV0ZWQgYXMgYSBob3N0bmFtZSwgYW5kIHVybFxuICAvLyByZXNvbHV0aW9uIHdpbGwgdHJlYXQgLy9mb28vYmFyIGFzIGhvc3Q9Zm9vLHBhdGg9YmFyIGJlY2F1c2UgdGhhdCdzXG4gIC8vIGhvdyB0aGUgYnJvd3NlciByZXNvbHZlcyByZWxhdGl2ZSBVUkxzLlxuICBpZiAoc2xhc2hlc0Rlbm90ZUhvc3QgfHwgcHJvdG8gfHwgcmVzdC5tYXRjaCgvXlxcL1xcL1teQFxcL10rQFteQFxcL10rLykpIHtcbiAgICB2YXIgc2xhc2hlcyA9IHJlc3Quc3Vic3RyKDAsIDIpID09PSAnLy8nO1xuICAgIGlmIChzbGFzaGVzICYmICEocHJvdG8gJiYgaG9zdGxlc3NQcm90b2NvbFtwcm90b10pKSB7XG4gICAgICByZXN0ID0gcmVzdC5zdWJzdHIoMik7XG4gICAgICBvdXQuc2xhc2hlcyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFob3N0bGVzc1Byb3RvY29sW3Byb3RvXSAmJlxuICAgICAgKHNsYXNoZXMgfHwgKHByb3RvICYmICFzbGFzaGVkUHJvdG9jb2xbcHJvdG9dKSkpIHtcbiAgICAvLyB0aGVyZSdzIGEgaG9zdG5hbWUuXG4gICAgLy8gdGhlIGZpcnN0IGluc3RhbmNlIG9mIC8sID8sIDssIG9yICMgZW5kcyB0aGUgaG9zdC5cbiAgICAvLyBkb24ndCBlbmZvcmNlIGZ1bGwgUkZDIGNvcnJlY3RuZXNzLCBqdXN0IGJlIHVuc3R1cGlkIGFib3V0IGl0LlxuXG4gICAgLy8gSWYgdGhlcmUgaXMgYW4gQCBpbiB0aGUgaG9zdG5hbWUsIHRoZW4gbm9uLWhvc3QgY2hhcnMgKmFyZSogYWxsb3dlZFxuICAgIC8vIHRvIHRoZSBsZWZ0IG9mIHRoZSBmaXJzdCBAIHNpZ24sIHVubGVzcyBzb21lIG5vbi1hdXRoIGNoYXJhY3RlclxuICAgIC8vIGNvbWVzICpiZWZvcmUqIHRoZSBALXNpZ24uXG4gICAgLy8gVVJMcyBhcmUgb2Jub3hpb3VzLlxuICAgIHZhciBhdFNpZ24gPSBhcnJheUluZGV4T2YocmVzdCwgJ0AnKTtcbiAgICBpZiAoYXRTaWduICE9PSAtMSkge1xuICAgICAgLy8gdGhlcmUgKm1heSBiZSogYW4gYXV0aFxuICAgICAgdmFyIGhhc0F1dGggPSB0cnVlO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBub25BdXRoQ2hhcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGFycmF5SW5kZXhPZihyZXN0LCBub25BdXRoQ2hhcnNbaV0pO1xuICAgICAgICBpZiAoaW5kZXggIT09IC0xICYmIGluZGV4IDwgYXRTaWduKSB7XG4gICAgICAgICAgLy8gbm90IGEgdmFsaWQgYXV0aC4gIFNvbWV0aGluZyBsaWtlIGh0dHA6Ly9mb28uY29tL2JhckBiYXovXG4gICAgICAgICAgaGFzQXV0aCA9IGZhbHNlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaGFzQXV0aCkge1xuICAgICAgICAvLyBwbHVjayBvZmYgdGhlIGF1dGggcG9ydGlvbi5cbiAgICAgICAgb3V0LmF1dGggPSByZXN0LnN1YnN0cigwLCBhdFNpZ24pO1xuICAgICAgICByZXN0ID0gcmVzdC5zdWJzdHIoYXRTaWduICsgMSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGZpcnN0Tm9uSG9zdCA9IC0xO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gbm9uSG9zdENoYXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGluZGV4ID0gYXJyYXlJbmRleE9mKHJlc3QsIG5vbkhvc3RDaGFyc1tpXSk7XG4gICAgICBpZiAoaW5kZXggIT09IC0xICYmXG4gICAgICAgICAgKGZpcnN0Tm9uSG9zdCA8IDAgfHwgaW5kZXggPCBmaXJzdE5vbkhvc3QpKSBmaXJzdE5vbkhvc3QgPSBpbmRleDtcbiAgICB9XG5cbiAgICBpZiAoZmlyc3ROb25Ib3N0ICE9PSAtMSkge1xuICAgICAgb3V0Lmhvc3QgPSByZXN0LnN1YnN0cigwLCBmaXJzdE5vbkhvc3QpO1xuICAgICAgcmVzdCA9IHJlc3Quc3Vic3RyKGZpcnN0Tm9uSG9zdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dC5ob3N0ID0gcmVzdDtcbiAgICAgIHJlc3QgPSAnJztcbiAgICB9XG5cbiAgICAvLyBwdWxsIG91dCBwb3J0LlxuICAgIHZhciBwID0gcGFyc2VIb3N0KG91dC5ob3N0KTtcbiAgICB2YXIga2V5cyA9IG9iamVjdEtleXMocCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBrZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICBvdXRba2V5XSA9IHBba2V5XTtcbiAgICB9XG5cbiAgICAvLyB3ZSd2ZSBpbmRpY2F0ZWQgdGhhdCB0aGVyZSBpcyBhIGhvc3RuYW1lLFxuICAgIC8vIHNvIGV2ZW4gaWYgaXQncyBlbXB0eSwgaXQgaGFzIHRvIGJlIHByZXNlbnQuXG4gICAgb3V0Lmhvc3RuYW1lID0gb3V0Lmhvc3RuYW1lIHx8ICcnO1xuXG4gICAgLy8gdmFsaWRhdGUgYSBsaXR0bGUuXG4gICAgaWYgKG91dC5ob3N0bmFtZS5sZW5ndGggPiBob3N0bmFtZU1heExlbikge1xuICAgICAgb3V0Lmhvc3RuYW1lID0gJyc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBob3N0cGFydHMgPSBvdXQuaG9zdG5hbWUuc3BsaXQoL1xcLi8pO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBob3N0cGFydHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBwYXJ0ID0gaG9zdHBhcnRzW2ldO1xuICAgICAgICBpZiAoIXBhcnQpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoIXBhcnQubWF0Y2goaG9zdG5hbWVQYXJ0UGF0dGVybikpIHtcbiAgICAgICAgICB2YXIgbmV3cGFydCA9ICcnO1xuICAgICAgICAgIGZvciAodmFyIGogPSAwLCBrID0gcGFydC5sZW5ndGg7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChwYXJ0LmNoYXJDb2RlQXQoaikgPiAxMjcpIHtcbiAgICAgICAgICAgICAgLy8gd2UgcmVwbGFjZSBub24tQVNDSUkgY2hhciB3aXRoIGEgdGVtcG9yYXJ5IHBsYWNlaG9sZGVyXG4gICAgICAgICAgICAgIC8vIHdlIG5lZWQgdGhpcyB0byBtYWtlIHN1cmUgc2l6ZSBvZiBob3N0bmFtZSBpcyBub3RcbiAgICAgICAgICAgICAgLy8gYnJva2VuIGJ5IHJlcGxhY2luZyBub24tQVNDSUkgYnkgbm90aGluZ1xuICAgICAgICAgICAgICBuZXdwYXJ0ICs9ICd4JztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG5ld3BhcnQgKz0gcGFydFtqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gd2UgdGVzdCBhZ2FpbiB3aXRoIEFTQ0lJIGNoYXIgb25seVxuICAgICAgICAgIGlmICghbmV3cGFydC5tYXRjaChob3N0bmFtZVBhcnRQYXR0ZXJuKSkge1xuICAgICAgICAgICAgdmFyIHZhbGlkUGFydHMgPSBob3N0cGFydHMuc2xpY2UoMCwgaSk7XG4gICAgICAgICAgICB2YXIgbm90SG9zdCA9IGhvc3RwYXJ0cy5zbGljZShpICsgMSk7XG4gICAgICAgICAgICB2YXIgYml0ID0gcGFydC5tYXRjaChob3N0bmFtZVBhcnRTdGFydCk7XG4gICAgICAgICAgICBpZiAoYml0KSB7XG4gICAgICAgICAgICAgIHZhbGlkUGFydHMucHVzaChiaXRbMV0pO1xuICAgICAgICAgICAgICBub3RIb3N0LnVuc2hpZnQoYml0WzJdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub3RIb3N0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXN0ID0gJy8nICsgbm90SG9zdC5qb2luKCcuJykgKyByZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3V0Lmhvc3RuYW1lID0gdmFsaWRQYXJ0cy5qb2luKCcuJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBob3N0bmFtZXMgYXJlIGFsd2F5cyBsb3dlciBjYXNlLlxuICAgIG91dC5ob3N0bmFtZSA9IG91dC5ob3N0bmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgLy8gSUROQSBTdXBwb3J0OiBSZXR1cm5zIGEgcHVueSBjb2RlZCByZXByZXNlbnRhdGlvbiBvZiBcImRvbWFpblwiLlxuICAgIC8vIEl0IG9ubHkgY29udmVydHMgdGhlIHBhcnQgb2YgdGhlIGRvbWFpbiBuYW1lIHRoYXRcbiAgICAvLyBoYXMgbm9uIEFTQ0lJIGNoYXJhY3RlcnMuIEkuZS4gaXQgZG9zZW50IG1hdHRlciBpZlxuICAgIC8vIHlvdSBjYWxsIGl0IHdpdGggYSBkb21haW4gdGhhdCBhbHJlYWR5IGlzIGluIEFTQ0lJLlxuICAgIHZhciBkb21haW5BcnJheSA9IG91dC5ob3N0bmFtZS5zcGxpdCgnLicpO1xuICAgIHZhciBuZXdPdXQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRvbWFpbkFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgcyA9IGRvbWFpbkFycmF5W2ldO1xuICAgICAgbmV3T3V0LnB1c2gocy5tYXRjaCgvW15BLVphLXowLTlfLV0vKSA/XG4gICAgICAgICAgJ3huLS0nICsgcHVueWNvZGUuZW5jb2RlKHMpIDogcyk7XG4gICAgfVxuICAgIG91dC5ob3N0bmFtZSA9IG5ld091dC5qb2luKCcuJyk7XG5cbiAgICBvdXQuaG9zdCA9IChvdXQuaG9zdG5hbWUgfHwgJycpICtcbiAgICAgICAgKChvdXQucG9ydCkgPyAnOicgKyBvdXQucG9ydCA6ICcnKTtcbiAgICBvdXQuaHJlZiArPSBvdXQuaG9zdDtcbiAgfVxuXG4gIC8vIG5vdyByZXN0IGlzIHNldCB0byB0aGUgcG9zdC1ob3N0IHN0dWZmLlxuICAvLyBjaG9wIG9mZiBhbnkgZGVsaW0gY2hhcnMuXG4gIGlmICghdW5zYWZlUHJvdG9jb2xbbG93ZXJQcm90b10pIHtcblxuICAgIC8vIEZpcnN0LCBtYWtlIDEwMCUgc3VyZSB0aGF0IGFueSBcImF1dG9Fc2NhcGVcIiBjaGFycyBnZXRcbiAgICAvLyBlc2NhcGVkLCBldmVuIGlmIGVuY29kZVVSSUNvbXBvbmVudCBkb2Vzbid0IHRoaW5rIHRoZXlcbiAgICAvLyBuZWVkIHRvIGJlLlxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gYXV0b0VzY2FwZS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBhZSA9IGF1dG9Fc2NhcGVbaV07XG4gICAgICB2YXIgZXNjID0gZW5jb2RlVVJJQ29tcG9uZW50KGFlKTtcbiAgICAgIGlmIChlc2MgPT09IGFlKSB7XG4gICAgICAgIGVzYyA9IGVzY2FwZShhZSk7XG4gICAgICB9XG4gICAgICByZXN0ID0gcmVzdC5zcGxpdChhZSkuam9pbihlc2MpO1xuICAgIH1cblxuICAgIC8vIE5vdyBtYWtlIHN1cmUgdGhhdCBkZWxpbXMgbmV2ZXIgYXBwZWFyIGluIGEgdXJsLlxuICAgIHZhciBjaG9wID0gcmVzdC5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBkZWxpbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgYyA9IGFycmF5SW5kZXhPZihyZXN0LCBkZWxpbXNbaV0pO1xuICAgICAgaWYgKGMgIT09IC0xKSB7XG4gICAgICAgIGNob3AgPSBNYXRoLm1pbihjLCBjaG9wKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmVzdCA9IHJlc3Quc3Vic3RyKDAsIGNob3ApO1xuICB9XG5cblxuICAvLyBjaG9wIG9mZiBmcm9tIHRoZSB0YWlsIGZpcnN0LlxuICB2YXIgaGFzaCA9IGFycmF5SW5kZXhPZihyZXN0LCAnIycpO1xuICBpZiAoaGFzaCAhPT0gLTEpIHtcbiAgICAvLyBnb3QgYSBmcmFnbWVudCBzdHJpbmcuXG4gICAgb3V0Lmhhc2ggPSByZXN0LnN1YnN0cihoYXNoKTtcbiAgICByZXN0ID0gcmVzdC5zbGljZSgwLCBoYXNoKTtcbiAgfVxuICB2YXIgcW0gPSBhcnJheUluZGV4T2YocmVzdCwgJz8nKTtcbiAgaWYgKHFtICE9PSAtMSkge1xuICAgIG91dC5zZWFyY2ggPSByZXN0LnN1YnN0cihxbSk7XG4gICAgb3V0LnF1ZXJ5ID0gcmVzdC5zdWJzdHIocW0gKyAxKTtcbiAgICBpZiAocGFyc2VRdWVyeVN0cmluZykge1xuICAgICAgb3V0LnF1ZXJ5ID0gcXVlcnlzdHJpbmcucGFyc2Uob3V0LnF1ZXJ5KTtcbiAgICB9XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoMCwgcW0pO1xuICB9IGVsc2UgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAvLyBubyBxdWVyeSBzdHJpbmcsIGJ1dCBwYXJzZVF1ZXJ5U3RyaW5nIHN0aWxsIHJlcXVlc3RlZFxuICAgIG91dC5zZWFyY2ggPSAnJztcbiAgICBvdXQucXVlcnkgPSB7fTtcbiAgfVxuICBpZiAocmVzdCkgb3V0LnBhdGhuYW1lID0gcmVzdDtcbiAgaWYgKHNsYXNoZWRQcm90b2NvbFtwcm90b10gJiZcbiAgICAgIG91dC5ob3N0bmFtZSAmJiAhb3V0LnBhdGhuYW1lKSB7XG4gICAgb3V0LnBhdGhuYW1lID0gJy8nO1xuICB9XG5cbiAgLy90byBzdXBwb3J0IGh0dHAucmVxdWVzdFxuICBpZiAob3V0LnBhdGhuYW1lIHx8IG91dC5zZWFyY2gpIHtcbiAgICBvdXQucGF0aCA9IChvdXQucGF0aG5hbWUgPyBvdXQucGF0aG5hbWUgOiAnJykgK1xuICAgICAgICAgICAgICAgKG91dC5zZWFyY2ggPyBvdXQuc2VhcmNoIDogJycpO1xuICB9XG5cbiAgLy8gZmluYWxseSwgcmVjb25zdHJ1Y3QgdGhlIGhyZWYgYmFzZWQgb24gd2hhdCBoYXMgYmVlbiB2YWxpZGF0ZWQuXG4gIG91dC5ocmVmID0gdXJsRm9ybWF0KG91dCk7XG4gIHJldHVybiBvdXQ7XG59XG5cbi8vIGZvcm1hdCBhIHBhcnNlZCBvYmplY3QgaW50byBhIHVybCBzdHJpbmdcbmZ1bmN0aW9uIHVybEZvcm1hdChvYmopIHtcbiAgLy8gZW5zdXJlIGl0J3MgYW4gb2JqZWN0LCBhbmQgbm90IGEgc3RyaW5nIHVybC5cbiAgLy8gSWYgaXQncyBhbiBvYmosIHRoaXMgaXMgYSBuby1vcC5cbiAgLy8gdGhpcyB3YXksIHlvdSBjYW4gY2FsbCB1cmxfZm9ybWF0KCkgb24gc3RyaW5nc1xuICAvLyB0byBjbGVhbiB1cCBwb3RlbnRpYWxseSB3b25reSB1cmxzLlxuICBpZiAodHlwZW9mKG9iaikgPT09ICdzdHJpbmcnKSBvYmogPSB1cmxQYXJzZShvYmopO1xuXG4gIHZhciBhdXRoID0gb2JqLmF1dGggfHwgJyc7XG4gIGlmIChhdXRoKSB7XG4gICAgYXV0aCA9IGF1dGguc3BsaXQoJ0AnKS5qb2luKCclNDAnKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5vbkF1dGhDaGFycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBuQUMgPSBub25BdXRoQ2hhcnNbaV07XG4gICAgICBhdXRoID0gYXV0aC5zcGxpdChuQUMpLmpvaW4oZW5jb2RlVVJJQ29tcG9uZW50KG5BQykpO1xuICAgIH1cbiAgICBhdXRoICs9ICdAJztcbiAgfVxuXG4gIHZhciBwcm90b2NvbCA9IG9iai5wcm90b2NvbCB8fCAnJyxcbiAgICAgIGhvc3QgPSAob2JqLmhvc3QgIT09IHVuZGVmaW5lZCkgPyBhdXRoICsgb2JqLmhvc3QgOlxuICAgICAgICAgIG9iai5ob3N0bmFtZSAhPT0gdW5kZWZpbmVkID8gKFxuICAgICAgICAgICAgICBhdXRoICsgb2JqLmhvc3RuYW1lICtcbiAgICAgICAgICAgICAgKG9iai5wb3J0ID8gJzonICsgb2JqLnBvcnQgOiAnJylcbiAgICAgICAgICApIDpcbiAgICAgICAgICBmYWxzZSxcbiAgICAgIHBhdGhuYW1lID0gb2JqLnBhdGhuYW1lIHx8ICcnLFxuICAgICAgcXVlcnkgPSBvYmoucXVlcnkgJiZcbiAgICAgICAgICAgICAgKCh0eXBlb2Ygb2JqLnF1ZXJ5ID09PSAnb2JqZWN0JyAmJlxuICAgICAgICAgICAgICAgIG9iamVjdEtleXMob2JqLnF1ZXJ5KS5sZW5ndGgpID9cbiAgICAgICAgICAgICAgICAgcXVlcnlzdHJpbmcuc3RyaW5naWZ5KG9iai5xdWVyeSkgOlxuICAgICAgICAgICAgICAgICAnJykgfHwgJycsXG4gICAgICBzZWFyY2ggPSBvYmouc2VhcmNoIHx8IChxdWVyeSAmJiAoJz8nICsgcXVlcnkpKSB8fCAnJyxcbiAgICAgIGhhc2ggPSBvYmouaGFzaCB8fCAnJztcblxuICBpZiAocHJvdG9jb2wgJiYgcHJvdG9jb2wuc3Vic3RyKC0xKSAhPT0gJzonKSBwcm90b2NvbCArPSAnOic7XG5cbiAgLy8gb25seSB0aGUgc2xhc2hlZFByb3RvY29scyBnZXQgdGhlIC8vLiAgTm90IG1haWx0bzosIHhtcHA6LCBldGMuXG4gIC8vIHVubGVzcyB0aGV5IGhhZCB0aGVtIHRvIGJlZ2luIHdpdGguXG4gIGlmIChvYmouc2xhc2hlcyB8fFxuICAgICAgKCFwcm90b2NvbCB8fCBzbGFzaGVkUHJvdG9jb2xbcHJvdG9jb2xdKSAmJiBob3N0ICE9PSBmYWxzZSkge1xuICAgIGhvc3QgPSAnLy8nICsgKGhvc3QgfHwgJycpO1xuICAgIGlmIChwYXRobmFtZSAmJiBwYXRobmFtZS5jaGFyQXQoMCkgIT09ICcvJykgcGF0aG5hbWUgPSAnLycgKyBwYXRobmFtZTtcbiAgfSBlbHNlIGlmICghaG9zdCkge1xuICAgIGhvc3QgPSAnJztcbiAgfVxuXG4gIGlmIChoYXNoICYmIGhhc2guY2hhckF0KDApICE9PSAnIycpIGhhc2ggPSAnIycgKyBoYXNoO1xuICBpZiAoc2VhcmNoICYmIHNlYXJjaC5jaGFyQXQoMCkgIT09ICc/Jykgc2VhcmNoID0gJz8nICsgc2VhcmNoO1xuXG4gIHJldHVybiBwcm90b2NvbCArIGhvc3QgKyBwYXRobmFtZSArIHNlYXJjaCArIGhhc2g7XG59XG5cbmZ1bmN0aW9uIHVybFJlc29sdmUoc291cmNlLCByZWxhdGl2ZSkge1xuICByZXR1cm4gdXJsRm9ybWF0KHVybFJlc29sdmVPYmplY3Qoc291cmNlLCByZWxhdGl2ZSkpO1xufVxuXG5mdW5jdGlvbiB1cmxSZXNvbHZlT2JqZWN0KHNvdXJjZSwgcmVsYXRpdmUpIHtcbiAgaWYgKCFzb3VyY2UpIHJldHVybiByZWxhdGl2ZTtcblxuICBzb3VyY2UgPSB1cmxQYXJzZSh1cmxGb3JtYXQoc291cmNlKSwgZmFsc2UsIHRydWUpO1xuICByZWxhdGl2ZSA9IHVybFBhcnNlKHVybEZvcm1hdChyZWxhdGl2ZSksIGZhbHNlLCB0cnVlKTtcblxuICAvLyBoYXNoIGlzIGFsd2F5cyBvdmVycmlkZGVuLCBubyBtYXR0ZXIgd2hhdC5cbiAgc291cmNlLmhhc2ggPSByZWxhdGl2ZS5oYXNoO1xuXG4gIGlmIChyZWxhdGl2ZS5ocmVmID09PSAnJykge1xuICAgIHNvdXJjZS5ocmVmID0gdXJsRm9ybWF0KHNvdXJjZSk7XG4gICAgcmV0dXJuIHNvdXJjZTtcbiAgfVxuXG4gIC8vIGhyZWZzIGxpa2UgLy9mb28vYmFyIGFsd2F5cyBjdXQgdG8gdGhlIHByb3RvY29sLlxuICBpZiAocmVsYXRpdmUuc2xhc2hlcyAmJiAhcmVsYXRpdmUucHJvdG9jb2wpIHtcbiAgICByZWxhdGl2ZS5wcm90b2NvbCA9IHNvdXJjZS5wcm90b2NvbDtcbiAgICAvL3VybFBhcnNlIGFwcGVuZHMgdHJhaWxpbmcgLyB0byB1cmxzIGxpa2UgaHR0cDovL3d3dy5leGFtcGxlLmNvbVxuICAgIGlmIChzbGFzaGVkUHJvdG9jb2xbcmVsYXRpdmUucHJvdG9jb2xdICYmXG4gICAgICAgIHJlbGF0aXZlLmhvc3RuYW1lICYmICFyZWxhdGl2ZS5wYXRobmFtZSkge1xuICAgICAgcmVsYXRpdmUucGF0aCA9IHJlbGF0aXZlLnBhdGhuYW1lID0gJy8nO1xuICAgIH1cbiAgICByZWxhdGl2ZS5ocmVmID0gdXJsRm9ybWF0KHJlbGF0aXZlKTtcbiAgICByZXR1cm4gcmVsYXRpdmU7XG4gIH1cblxuICBpZiAocmVsYXRpdmUucHJvdG9jb2wgJiYgcmVsYXRpdmUucHJvdG9jb2wgIT09IHNvdXJjZS5wcm90b2NvbCkge1xuICAgIC8vIGlmIGl0J3MgYSBrbm93biB1cmwgcHJvdG9jb2wsIHRoZW4gY2hhbmdpbmdcbiAgICAvLyB0aGUgcHJvdG9jb2wgZG9lcyB3ZWlyZCB0aGluZ3NcbiAgICAvLyBmaXJzdCwgaWYgaXQncyBub3QgZmlsZTosIHRoZW4gd2UgTVVTVCBoYXZlIGEgaG9zdCxcbiAgICAvLyBhbmQgaWYgdGhlcmUgd2FzIGEgcGF0aFxuICAgIC8vIHRvIGJlZ2luIHdpdGgsIHRoZW4gd2UgTVVTVCBoYXZlIGEgcGF0aC5cbiAgICAvLyBpZiBpdCBpcyBmaWxlOiwgdGhlbiB0aGUgaG9zdCBpcyBkcm9wcGVkLFxuICAgIC8vIGJlY2F1c2UgdGhhdCdzIGtub3duIHRvIGJlIGhvc3RsZXNzLlxuICAgIC8vIGFueXRoaW5nIGVsc2UgaXMgYXNzdW1lZCB0byBiZSBhYnNvbHV0ZS5cbiAgICBpZiAoIXNsYXNoZWRQcm90b2NvbFtyZWxhdGl2ZS5wcm90b2NvbF0pIHtcbiAgICAgIHJlbGF0aXZlLmhyZWYgPSB1cmxGb3JtYXQocmVsYXRpdmUpO1xuICAgICAgcmV0dXJuIHJlbGF0aXZlO1xuICAgIH1cbiAgICBzb3VyY2UucHJvdG9jb2wgPSByZWxhdGl2ZS5wcm90b2NvbDtcbiAgICBpZiAoIXJlbGF0aXZlLmhvc3QgJiYgIWhvc3RsZXNzUHJvdG9jb2xbcmVsYXRpdmUucHJvdG9jb2xdKSB7XG4gICAgICB2YXIgcmVsUGF0aCA9IChyZWxhdGl2ZS5wYXRobmFtZSB8fCAnJykuc3BsaXQoJy8nKTtcbiAgICAgIHdoaWxlIChyZWxQYXRoLmxlbmd0aCAmJiAhKHJlbGF0aXZlLmhvc3QgPSByZWxQYXRoLnNoaWZ0KCkpKTtcbiAgICAgIGlmICghcmVsYXRpdmUuaG9zdCkgcmVsYXRpdmUuaG9zdCA9ICcnO1xuICAgICAgaWYgKCFyZWxhdGl2ZS5ob3N0bmFtZSkgcmVsYXRpdmUuaG9zdG5hbWUgPSAnJztcbiAgICAgIGlmIChyZWxQYXRoWzBdICE9PSAnJykgcmVsUGF0aC51bnNoaWZ0KCcnKTtcbiAgICAgIGlmIChyZWxQYXRoLmxlbmd0aCA8IDIpIHJlbFBhdGgudW5zaGlmdCgnJyk7XG4gICAgICByZWxhdGl2ZS5wYXRobmFtZSA9IHJlbFBhdGguam9pbignLycpO1xuICAgIH1cbiAgICBzb3VyY2UucGF0aG5hbWUgPSByZWxhdGl2ZS5wYXRobmFtZTtcbiAgICBzb3VyY2Uuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgIHNvdXJjZS5xdWVyeSA9IHJlbGF0aXZlLnF1ZXJ5O1xuICAgIHNvdXJjZS5ob3N0ID0gcmVsYXRpdmUuaG9zdCB8fCAnJztcbiAgICBzb3VyY2UuYXV0aCA9IHJlbGF0aXZlLmF1dGg7XG4gICAgc291cmNlLmhvc3RuYW1lID0gcmVsYXRpdmUuaG9zdG5hbWUgfHwgcmVsYXRpdmUuaG9zdDtcbiAgICBzb3VyY2UucG9ydCA9IHJlbGF0aXZlLnBvcnQ7XG4gICAgLy90byBzdXBwb3J0IGh0dHAucmVxdWVzdFxuICAgIGlmIChzb3VyY2UucGF0aG5hbWUgIT09IHVuZGVmaW5lZCB8fCBzb3VyY2Uuc2VhcmNoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHNvdXJjZS5wYXRoID0gKHNvdXJjZS5wYXRobmFtZSA/IHNvdXJjZS5wYXRobmFtZSA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgIChzb3VyY2Uuc2VhcmNoID8gc291cmNlLnNlYXJjaCA6ICcnKTtcbiAgICB9XG4gICAgc291cmNlLnNsYXNoZXMgPSBzb3VyY2Uuc2xhc2hlcyB8fCByZWxhdGl2ZS5zbGFzaGVzO1xuICAgIHNvdXJjZS5ocmVmID0gdXJsRm9ybWF0KHNvdXJjZSk7XG4gICAgcmV0dXJuIHNvdXJjZTtcbiAgfVxuXG4gIHZhciBpc1NvdXJjZUFicyA9IChzb3VyY2UucGF0aG5hbWUgJiYgc291cmNlLnBhdGhuYW1lLmNoYXJBdCgwKSA9PT0gJy8nKSxcbiAgICAgIGlzUmVsQWJzID0gKFxuICAgICAgICAgIHJlbGF0aXZlLmhvc3QgIT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgIHJlbGF0aXZlLnBhdGhuYW1lICYmIHJlbGF0aXZlLnBhdGhuYW1lLmNoYXJBdCgwKSA9PT0gJy8nXG4gICAgICApLFxuICAgICAgbXVzdEVuZEFicyA9IChpc1JlbEFicyB8fCBpc1NvdXJjZUFicyB8fFxuICAgICAgICAgICAgICAgICAgICAoc291cmNlLmhvc3QgJiYgcmVsYXRpdmUucGF0aG5hbWUpKSxcbiAgICAgIHJlbW92ZUFsbERvdHMgPSBtdXN0RW5kQWJzLFxuICAgICAgc3JjUGF0aCA9IHNvdXJjZS5wYXRobmFtZSAmJiBzb3VyY2UucGF0aG5hbWUuc3BsaXQoJy8nKSB8fCBbXSxcbiAgICAgIHJlbFBhdGggPSByZWxhdGl2ZS5wYXRobmFtZSAmJiByZWxhdGl2ZS5wYXRobmFtZS5zcGxpdCgnLycpIHx8IFtdLFxuICAgICAgcHN5Y2hvdGljID0gc291cmNlLnByb3RvY29sICYmXG4gICAgICAgICAgIXNsYXNoZWRQcm90b2NvbFtzb3VyY2UucHJvdG9jb2xdO1xuXG4gIC8vIGlmIHRoZSB1cmwgaXMgYSBub24tc2xhc2hlZCB1cmwsIHRoZW4gcmVsYXRpdmVcbiAgLy8gbGlua3MgbGlrZSAuLi8uLiBzaG91bGQgYmUgYWJsZVxuICAvLyB0byBjcmF3bCB1cCB0byB0aGUgaG9zdG5hbWUsIGFzIHdlbGwuICBUaGlzIGlzIHN0cmFuZ2UuXG4gIC8vIHNvdXJjZS5wcm90b2NvbCBoYXMgYWxyZWFkeSBiZWVuIHNldCBieSBub3cuXG4gIC8vIExhdGVyIG9uLCBwdXQgdGhlIGZpcnN0IHBhdGggcGFydCBpbnRvIHRoZSBob3N0IGZpZWxkLlxuICBpZiAocHN5Y2hvdGljKSB7XG5cbiAgICBkZWxldGUgc291cmNlLmhvc3RuYW1lO1xuICAgIGRlbGV0ZSBzb3VyY2UucG9ydDtcbiAgICBpZiAoc291cmNlLmhvc3QpIHtcbiAgICAgIGlmIChzcmNQYXRoWzBdID09PSAnJykgc3JjUGF0aFswXSA9IHNvdXJjZS5ob3N0O1xuICAgICAgZWxzZSBzcmNQYXRoLnVuc2hpZnQoc291cmNlLmhvc3QpO1xuICAgIH1cbiAgICBkZWxldGUgc291cmNlLmhvc3Q7XG4gICAgaWYgKHJlbGF0aXZlLnByb3RvY29sKSB7XG4gICAgICBkZWxldGUgcmVsYXRpdmUuaG9zdG5hbWU7XG4gICAgICBkZWxldGUgcmVsYXRpdmUucG9ydDtcbiAgICAgIGlmIChyZWxhdGl2ZS5ob3N0KSB7XG4gICAgICAgIGlmIChyZWxQYXRoWzBdID09PSAnJykgcmVsUGF0aFswXSA9IHJlbGF0aXZlLmhvc3Q7XG4gICAgICAgIGVsc2UgcmVsUGF0aC51bnNoaWZ0KHJlbGF0aXZlLmhvc3QpO1xuICAgICAgfVxuICAgICAgZGVsZXRlIHJlbGF0aXZlLmhvc3Q7XG4gICAgfVxuICAgIG11c3RFbmRBYnMgPSBtdXN0RW5kQWJzICYmIChyZWxQYXRoWzBdID09PSAnJyB8fCBzcmNQYXRoWzBdID09PSAnJyk7XG4gIH1cblxuICBpZiAoaXNSZWxBYnMpIHtcbiAgICAvLyBpdCdzIGFic29sdXRlLlxuICAgIHNvdXJjZS5ob3N0ID0gKHJlbGF0aXZlLmhvc3QgfHwgcmVsYXRpdmUuaG9zdCA9PT0gJycpID9cbiAgICAgICAgICAgICAgICAgICAgICByZWxhdGl2ZS5ob3N0IDogc291cmNlLmhvc3Q7XG4gICAgc291cmNlLmhvc3RuYW1lID0gKHJlbGF0aXZlLmhvc3RuYW1lIHx8IHJlbGF0aXZlLmhvc3RuYW1lID09PSAnJykgP1xuICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aXZlLmhvc3RuYW1lIDogc291cmNlLmhvc3RuYW1lO1xuICAgIHNvdXJjZS5zZWFyY2ggPSByZWxhdGl2ZS5zZWFyY2g7XG4gICAgc291cmNlLnF1ZXJ5ID0gcmVsYXRpdmUucXVlcnk7XG4gICAgc3JjUGF0aCA9IHJlbFBhdGg7XG4gICAgLy8gZmFsbCB0aHJvdWdoIHRvIHRoZSBkb3QtaGFuZGxpbmcgYmVsb3cuXG4gIH0gZWxzZSBpZiAocmVsUGF0aC5sZW5ndGgpIHtcbiAgICAvLyBpdCdzIHJlbGF0aXZlXG4gICAgLy8gdGhyb3cgYXdheSB0aGUgZXhpc3RpbmcgZmlsZSwgYW5kIHRha2UgdGhlIG5ldyBwYXRoIGluc3RlYWQuXG4gICAgaWYgKCFzcmNQYXRoKSBzcmNQYXRoID0gW107XG4gICAgc3JjUGF0aC5wb3AoKTtcbiAgICBzcmNQYXRoID0gc3JjUGF0aC5jb25jYXQocmVsUGF0aCk7XG4gICAgc291cmNlLnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICBzb3VyY2UucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgfSBlbHNlIGlmICgnc2VhcmNoJyBpbiByZWxhdGl2ZSkge1xuICAgIC8vIGp1c3QgcHVsbCBvdXQgdGhlIHNlYXJjaC5cbiAgICAvLyBsaWtlIGhyZWY9Jz9mb28nLlxuICAgIC8vIFB1dCB0aGlzIGFmdGVyIHRoZSBvdGhlciB0d28gY2FzZXMgYmVjYXVzZSBpdCBzaW1wbGlmaWVzIHRoZSBib29sZWFuc1xuICAgIGlmIChwc3ljaG90aWMpIHtcbiAgICAgIHNvdXJjZS5ob3N0bmFtZSA9IHNvdXJjZS5ob3N0ID0gc3JjUGF0aC5zaGlmdCgpO1xuICAgICAgLy9vY2NhdGlvbmFseSB0aGUgYXV0aCBjYW4gZ2V0IHN0dWNrIG9ubHkgaW4gaG9zdFxuICAgICAgLy90aGlzIGVzcGVjaWFseSBoYXBwZW5zIGluIGNhc2VzIGxpa2VcbiAgICAgIC8vdXJsLnJlc29sdmVPYmplY3QoJ21haWx0bzpsb2NhbDFAZG9tYWluMScsICdsb2NhbDJAZG9tYWluMicpXG4gICAgICB2YXIgYXV0aEluSG9zdCA9IHNvdXJjZS5ob3N0ICYmIGFycmF5SW5kZXhPZihzb3VyY2UuaG9zdCwgJ0AnKSA+IDAgP1xuICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UuaG9zdC5zcGxpdCgnQCcpIDogZmFsc2U7XG4gICAgICBpZiAoYXV0aEluSG9zdCkge1xuICAgICAgICBzb3VyY2UuYXV0aCA9IGF1dGhJbkhvc3Quc2hpZnQoKTtcbiAgICAgICAgc291cmNlLmhvc3QgPSBzb3VyY2UuaG9zdG5hbWUgPSBhdXRoSW5Ib3N0LnNoaWZ0KCk7XG4gICAgICB9XG4gICAgfVxuICAgIHNvdXJjZS5zZWFyY2ggPSByZWxhdGl2ZS5zZWFyY2g7XG4gICAgc291cmNlLnF1ZXJ5ID0gcmVsYXRpdmUucXVlcnk7XG4gICAgLy90byBzdXBwb3J0IGh0dHAucmVxdWVzdFxuICAgIGlmIChzb3VyY2UucGF0aG5hbWUgIT09IHVuZGVmaW5lZCB8fCBzb3VyY2Uuc2VhcmNoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHNvdXJjZS5wYXRoID0gKHNvdXJjZS5wYXRobmFtZSA/IHNvdXJjZS5wYXRobmFtZSA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgIChzb3VyY2Uuc2VhcmNoID8gc291cmNlLnNlYXJjaCA6ICcnKTtcbiAgICB9XG4gICAgc291cmNlLmhyZWYgPSB1cmxGb3JtYXQoc291cmNlKTtcbiAgICByZXR1cm4gc291cmNlO1xuICB9XG4gIGlmICghc3JjUGF0aC5sZW5ndGgpIHtcbiAgICAvLyBubyBwYXRoIGF0IGFsbC4gIGVhc3kuXG4gICAgLy8gd2UndmUgYWxyZWFkeSBoYW5kbGVkIHRoZSBvdGhlciBzdHVmZiBhYm92ZS5cbiAgICBkZWxldGUgc291cmNlLnBhdGhuYW1lO1xuICAgIC8vdG8gc3VwcG9ydCBodHRwLnJlcXVlc3RcbiAgICBpZiAoIXNvdXJjZS5zZWFyY2gpIHtcbiAgICAgIHNvdXJjZS5wYXRoID0gJy8nICsgc291cmNlLnNlYXJjaDtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIHNvdXJjZS5wYXRoO1xuICAgIH1cbiAgICBzb3VyY2UuaHJlZiA9IHVybEZvcm1hdChzb3VyY2UpO1xuICAgIHJldHVybiBzb3VyY2U7XG4gIH1cbiAgLy8gaWYgYSB1cmwgRU5EcyBpbiAuIG9yIC4uLCB0aGVuIGl0IG11c3QgZ2V0IGEgdHJhaWxpbmcgc2xhc2guXG4gIC8vIGhvd2V2ZXIsIGlmIGl0IGVuZHMgaW4gYW55dGhpbmcgZWxzZSBub24tc2xhc2h5LFxuICAvLyB0aGVuIGl0IG11c3QgTk9UIGdldCBhIHRyYWlsaW5nIHNsYXNoLlxuICB2YXIgbGFzdCA9IHNyY1BhdGguc2xpY2UoLTEpWzBdO1xuICB2YXIgaGFzVHJhaWxpbmdTbGFzaCA9IChcbiAgICAgIChzb3VyY2UuaG9zdCB8fCByZWxhdGl2ZS5ob3N0KSAmJiAobGFzdCA9PT0gJy4nIHx8IGxhc3QgPT09ICcuLicpIHx8XG4gICAgICBsYXN0ID09PSAnJyk7XG5cbiAgLy8gc3RyaXAgc2luZ2xlIGRvdHMsIHJlc29sdmUgZG91YmxlIGRvdHMgdG8gcGFyZW50IGRpclxuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gc3JjUGF0aC5sZW5ndGg7IGkgPj0gMDsgaS0tKSB7XG4gICAgbGFzdCA9IHNyY1BhdGhbaV07XG4gICAgaWYgKGxhc3QgPT0gJy4nKSB7XG4gICAgICBzcmNQYXRoLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHNyY1BhdGguc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBzcmNQYXRoLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoIW11c3RFbmRBYnMgJiYgIXJlbW92ZUFsbERvdHMpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHNyY1BhdGgudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICBpZiAobXVzdEVuZEFicyAmJiBzcmNQYXRoWzBdICE9PSAnJyAmJlxuICAgICAgKCFzcmNQYXRoWzBdIHx8IHNyY1BhdGhbMF0uY2hhckF0KDApICE9PSAnLycpKSB7XG4gICAgc3JjUGF0aC51bnNoaWZ0KCcnKTtcbiAgfVxuXG4gIGlmIChoYXNUcmFpbGluZ1NsYXNoICYmIChzcmNQYXRoLmpvaW4oJy8nKS5zdWJzdHIoLTEpICE9PSAnLycpKSB7XG4gICAgc3JjUGF0aC5wdXNoKCcnKTtcbiAgfVxuXG4gIHZhciBpc0Fic29sdXRlID0gc3JjUGF0aFswXSA9PT0gJycgfHxcbiAgICAgIChzcmNQYXRoWzBdICYmIHNyY1BhdGhbMF0uY2hhckF0KDApID09PSAnLycpO1xuXG4gIC8vIHB1dCB0aGUgaG9zdCBiYWNrXG4gIGlmIChwc3ljaG90aWMpIHtcbiAgICBzb3VyY2UuaG9zdG5hbWUgPSBzb3VyY2UuaG9zdCA9IGlzQWJzb2x1dGUgPyAnJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNQYXRoLmxlbmd0aCA/IHNyY1BhdGguc2hpZnQoKSA6ICcnO1xuICAgIC8vb2NjYXRpb25hbHkgdGhlIGF1dGggY2FuIGdldCBzdHVjayBvbmx5IGluIGhvc3RcbiAgICAvL3RoaXMgZXNwZWNpYWx5IGhhcHBlbnMgaW4gY2FzZXMgbGlrZVxuICAgIC8vdXJsLnJlc29sdmVPYmplY3QoJ21haWx0bzpsb2NhbDFAZG9tYWluMScsICdsb2NhbDJAZG9tYWluMicpXG4gICAgdmFyIGF1dGhJbkhvc3QgPSBzb3VyY2UuaG9zdCAmJiBhcnJheUluZGV4T2Yoc291cmNlLmhvc3QsICdAJykgPiAwID9cbiAgICAgICAgICAgICAgICAgICAgIHNvdXJjZS5ob3N0LnNwbGl0KCdAJykgOiBmYWxzZTtcbiAgICBpZiAoYXV0aEluSG9zdCkge1xuICAgICAgc291cmNlLmF1dGggPSBhdXRoSW5Ib3N0LnNoaWZ0KCk7XG4gICAgICBzb3VyY2UuaG9zdCA9IHNvdXJjZS5ob3N0bmFtZSA9IGF1dGhJbkhvc3Quc2hpZnQoKTtcbiAgICB9XG4gIH1cblxuICBtdXN0RW5kQWJzID0gbXVzdEVuZEFicyB8fCAoc291cmNlLmhvc3QgJiYgc3JjUGF0aC5sZW5ndGgpO1xuXG4gIGlmIChtdXN0RW5kQWJzICYmICFpc0Fic29sdXRlKSB7XG4gICAgc3JjUGF0aC51bnNoaWZ0KCcnKTtcbiAgfVxuXG4gIHNvdXJjZS5wYXRobmFtZSA9IHNyY1BhdGguam9pbignLycpO1xuICAvL3RvIHN1cHBvcnQgcmVxdWVzdC5odHRwXG4gIGlmIChzb3VyY2UucGF0aG5hbWUgIT09IHVuZGVmaW5lZCB8fCBzb3VyY2Uuc2VhcmNoICE9PSB1bmRlZmluZWQpIHtcbiAgICBzb3VyY2UucGF0aCA9IChzb3VyY2UucGF0aG5hbWUgPyBzb3VyY2UucGF0aG5hbWUgOiAnJykgK1xuICAgICAgICAgICAgICAgICAgKHNvdXJjZS5zZWFyY2ggPyBzb3VyY2Uuc2VhcmNoIDogJycpO1xuICB9XG4gIHNvdXJjZS5hdXRoID0gcmVsYXRpdmUuYXV0aCB8fCBzb3VyY2UuYXV0aDtcbiAgc291cmNlLnNsYXNoZXMgPSBzb3VyY2Uuc2xhc2hlcyB8fCByZWxhdGl2ZS5zbGFzaGVzO1xuICBzb3VyY2UuaHJlZiA9IHVybEZvcm1hdChzb3VyY2UpO1xuICByZXR1cm4gc291cmNlO1xufVxuXG5mdW5jdGlvbiBwYXJzZUhvc3QoaG9zdCkge1xuICB2YXIgb3V0ID0ge307XG4gIHZhciBwb3J0ID0gcG9ydFBhdHRlcm4uZXhlYyhob3N0KTtcbiAgaWYgKHBvcnQpIHtcbiAgICBwb3J0ID0gcG9ydFswXTtcbiAgICBvdXQucG9ydCA9IHBvcnQuc3Vic3RyKDEpO1xuICAgIGhvc3QgPSBob3N0LnN1YnN0cigwLCBob3N0Lmxlbmd0aCAtIHBvcnQubGVuZ3RoKTtcbiAgfVxuICBpZiAoaG9zdCkgb3V0Lmhvc3RuYW1lID0gaG9zdDtcbiAgcmV0dXJuIG91dDtcbn1cbiIsInZhciBldmVudHMgPSByZXF1aXJlKCdldmVudHMnKTtcblxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcbmV4cG9ydHMuaXNEYXRlID0gZnVuY3Rpb24ob2JqKXtyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IERhdGVdJ307XG5leHBvcnRzLmlzUmVnRXhwID0gZnVuY3Rpb24ob2JqKXtyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IFJlZ0V4cF0nfTtcblxuXG5leHBvcnRzLnByaW50ID0gZnVuY3Rpb24gKCkge307XG5leHBvcnRzLnB1dHMgPSBmdW5jdGlvbiAoKSB7fTtcbmV4cG9ydHMuZGVidWcgPSBmdW5jdGlvbigpIHt9O1xuXG5leHBvcnRzLmluc3BlY3QgPSBmdW5jdGlvbihvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMpIHtcbiAgdmFyIHNlZW4gPSBbXTtcblxuICB2YXIgc3R5bGl6ZSA9IGZ1bmN0aW9uKHN0ciwgc3R5bGVUeXBlKSB7XG4gICAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG4gICAgdmFyIHN0eWxlcyA9XG4gICAgICAgIHsgJ2JvbGQnIDogWzEsIDIyXSxcbiAgICAgICAgICAnaXRhbGljJyA6IFszLCAyM10sXG4gICAgICAgICAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAgICAgICAgICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICAgICAgICAgJ3doaXRlJyA6IFszNywgMzldLFxuICAgICAgICAgICdncmV5JyA6IFs5MCwgMzldLFxuICAgICAgICAgICdibGFjaycgOiBbMzAsIDM5XSxcbiAgICAgICAgICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgICAgICAgICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgICAgICAgICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICAgICAgICAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICAgICAgICAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgICAgICAgICAneWVsbG93JyA6IFszMywgMzldIH07XG5cbiAgICB2YXIgc3R5bGUgPVxuICAgICAgICB7ICdzcGVjaWFsJzogJ2N5YW4nLFxuICAgICAgICAgICdudW1iZXInOiAnYmx1ZScsXG4gICAgICAgICAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgICAgICAgICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAgICAgICAgICdudWxsJzogJ2JvbGQnLFxuICAgICAgICAgICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAgICAgICAgICdkYXRlJzogJ21hZ2VudGEnLFxuICAgICAgICAgIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICAgICAgICAgJ3JlZ2V4cCc6ICdyZWQnIH1bc3R5bGVUeXBlXTtcblxuICAgIGlmIChzdHlsZSkge1xuICAgICAgcmV0dXJuICdcXHUwMDFiWycgKyBzdHlsZXNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgICAnXFx1MDAxYlsnICsgc3R5bGVzW3N0eWxlXVsxXSArICdtJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gIH07XG4gIGlmICghIGNvbG9ycykge1xuICAgIHN0eWxpemUgPSBmdW5jdGlvbihzdHIsIHN0eWxlVHlwZSkgeyByZXR1cm4gc3RyOyB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0KHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gICAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZS5pbnNwZWN0ID09PSAnZnVuY3Rpb24nICYmXG4gICAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgICB2YWx1ZSAhPT0gZXhwb3J0cyAmJlxuICAgICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzKTtcbiAgICB9XG5cbiAgICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICAgIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgICBjYXNlICd1bmRlZmluZWQnOlxuICAgICAgICByZXR1cm4gc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuXG4gICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgICAgICByZXR1cm4gc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcblxuICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuXG4gICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgICB9XG4gICAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xuICAgIH1cblxuICAgIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgICB2YXIgdmlzaWJsZV9rZXlzID0gT2JqZWN0X2tleXModmFsdWUpO1xuICAgIHZhciBrZXlzID0gc2hvd0hpZGRlbiA/IE9iamVjdF9nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKSA6IHZpc2libGVfa2V5cztcblxuICAgIC8vIEZ1bmN0aW9ucyB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgJiYga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ3JlZ2V4cCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIERhdGVzIHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWRcbiAgICBpZiAoaXNEYXRlKHZhbHVlKSAmJiBrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHN0eWxpemUodmFsdWUudG9VVENTdHJpbmcoKSwgJ2RhdGUnKTtcbiAgICB9XG5cbiAgICB2YXIgYmFzZSwgdHlwZSwgYnJhY2VzO1xuICAgIC8vIERldGVybWluZSB0aGUgb2JqZWN0IHR5cGVcbiAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHR5cGUgPSAnQXJyYXknO1xuICAgICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHlwZSA9ICdPYmplY3QnO1xuICAgICAgYnJhY2VzID0gWyd7JywgJ30nXTtcbiAgICB9XG5cbiAgICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgYmFzZSA9IChpc1JlZ0V4cCh2YWx1ZSkpID8gJyAnICsgdmFsdWUgOiAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICAgIH0gZWxzZSB7XG4gICAgICBiYXNlID0gJyc7XG4gICAgfVxuXG4gICAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIGJhc2UgPSAnICcgKyB2YWx1ZS50b1VUQ1N0cmluZygpO1xuICAgIH1cblxuICAgIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gICAgfVxuXG4gICAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ3JlZ2V4cCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzZWVuLnB1c2godmFsdWUpO1xuXG4gICAgdmFyIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgdmFyIG5hbWUsIHN0cjtcbiAgICAgIGlmICh2YWx1ZS5fX2xvb2t1cEdldHRlcl9fKSB7XG4gICAgICAgIGlmICh2YWx1ZS5fX2xvb2t1cEdldHRlcl9fKGtleSkpIHtcbiAgICAgICAgICBpZiAodmFsdWUuX19sb29rdXBTZXR0ZXJfXyhrZXkpKSB7XG4gICAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh2YWx1ZS5fX2xvb2t1cFNldHRlcl9fKGtleSkpIHtcbiAgICAgICAgICAgIHN0ciA9IHN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh2aXNpYmxlX2tleXMuaW5kZXhPZihrZXkpIDwgMCkge1xuICAgICAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICAgICAgfVxuICAgICAgaWYgKCFzdHIpIHtcbiAgICAgICAgaWYgKHNlZW4uaW5kZXhPZih2YWx1ZVtrZXldKSA8IDApIHtcbiAgICAgICAgICBpZiAocmVjdXJzZVRpbWVzID09PSBudWxsKSB7XG4gICAgICAgICAgICBzdHIgPSBmb3JtYXQodmFsdWVba2V5XSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0ciA9IGZvcm1hdCh2YWx1ZVtrZXldLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9IHN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICh0eXBlID09PSAnQXJyYXknICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgICAgIG5hbWUgPSBzdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgICAgICBuYW1lID0gc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xuICAgIH0pO1xuXG4gICAgc2Vlbi5wb3AoKTtcblxuICAgIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gICAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgICBudW1MaW5lc0VzdCsrO1xuICAgICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgICAgcmV0dXJuIHByZXYgKyBjdXIubGVuZ3RoICsgMTtcbiAgICB9LCAwKTtcblxuICAgIGlmIChsZW5ndGggPiA1MCkge1xuICAgICAgb3V0cHV0ID0gYnJhY2VzWzBdICtcbiAgICAgICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICAgICAnICcgK1xuICAgICAgICAgICAgICAgYnJhY2VzWzFdO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dCA9IGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG4gIHJldHVybiBmb3JtYXQob2JqLCAodHlwZW9mIGRlcHRoID09PSAndW5kZWZpbmVkJyA/IDIgOiBkZXB0aCkpO1xufTtcblxuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKSB8fFxuICAgICAgICAgKHR5cGVvZiBhciA9PT0gJ29iamVjdCcgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyKSA9PT0gJ1tvYmplY3QgQXJyYXldJyk7XG59XG5cblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgdHlwZW9mIHJlID09PSAnb2JqZWN0JyAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cblxuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gdHlwZW9mIGQgPT09ICdvYmplY3QnICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbiAobXNnKSB7fTtcblxuZXhwb3J0cy5wdW1wID0gbnVsbDtcblxudmFyIE9iamVjdF9rZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSByZXMucHVzaChrZXkpO1xuICAgIHJldHVybiByZXM7XG59O1xuXG52YXIgT2JqZWN0X2dldE93blByb3BlcnR5TmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgcmVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbnZhciBPYmplY3RfY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiAocHJvdG90eXBlLCBwcm9wZXJ0aWVzKSB7XG4gICAgLy8gZnJvbSBlczUtc2hpbVxuICAgIHZhciBvYmplY3Q7XG4gICAgaWYgKHByb3RvdHlwZSA9PT0gbnVsbCkge1xuICAgICAgICBvYmplY3QgPSB7ICdfX3Byb3RvX18nIDogbnVsbCB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm90b3R5cGUgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgICd0eXBlb2YgcHJvdG90eXBlWycgKyAodHlwZW9mIHByb3RvdHlwZSkgKyAnXSAhPSBcXCdvYmplY3RcXCcnXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHZhciBUeXBlID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgIFR5cGUucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgICAgICBvYmplY3QgPSBuZXcgVHlwZSgpO1xuICAgICAgICBvYmplY3QuX19wcm90b19fID0gcHJvdG90eXBlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHByb3BlcnRpZXMgIT09ICd1bmRlZmluZWQnICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKG9iamVjdCwgcHJvcGVydGllcyk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3Q7XG59O1xuXG5leHBvcnRzLmluaGVyaXRzID0gZnVuY3Rpb24oY3Rvciwgc3VwZXJDdG9yKSB7XG4gIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yO1xuICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdF9jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICB2YWx1ZTogY3RvcixcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9XG4gIH0pO1xufTtcblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKHR5cGVvZiBmICE9PSAnc3RyaW5nJykge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChleHBvcnRzLmluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOiByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvcih2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pe1xuICAgIGlmICh4ID09PSBudWxsIHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0Jykge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBleHBvcnRzLmluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuIiwiZXhwb3J0cy5yZWFkSUVFRTc1NCA9IGZ1bmN0aW9uKGJ1ZmZlciwgb2Zmc2V0LCBpc0JFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sXG4gICAgICBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxLFxuICAgICAgZU1heCA9ICgxIDw8IGVMZW4pIC0gMSxcbiAgICAgIGVCaWFzID0gZU1heCA+PiAxLFxuICAgICAgbkJpdHMgPSAtNyxcbiAgICAgIGkgPSBpc0JFID8gMCA6IChuQnl0ZXMgLSAxKSxcbiAgICAgIGQgPSBpc0JFID8gMSA6IC0xLFxuICAgICAgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXTtcblxuICBpICs9IGQ7XG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSk7XG4gIHMgPj49ICgtbkJpdHMpO1xuICBuQml0cyArPSBlTGVuO1xuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gZSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KTtcblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKTtcbiAgZSA+Pj0gKC1uQml0cyk7XG4gIG5CaXRzICs9IG1MZW47XG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSBtICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpO1xuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhcztcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpO1xuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbik7XG4gICAgZSA9IGUgLSBlQmlhcztcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKTtcbn07XG5cbmV4cG9ydHMud3JpdGVJRUVFNzU0ID0gZnVuY3Rpb24oYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0JFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGMsXG4gICAgICBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxLFxuICAgICAgZU1heCA9ICgxIDw8IGVMZW4pIC0gMSxcbiAgICAgIGVCaWFzID0gZU1heCA+PiAxLFxuICAgICAgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApLFxuICAgICAgaSA9IGlzQkUgPyAobkJ5dGVzIC0gMSkgOiAwLFxuICAgICAgZCA9IGlzQkUgPyAtMSA6IDEsXG4gICAgICBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwO1xuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpO1xuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwO1xuICAgIGUgPSBlTWF4O1xuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKTtcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS07XG4gICAgICBjICo9IDI7XG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcyk7XG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrO1xuICAgICAgYyAvPSAyO1xuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDA7XG4gICAgICBlID0gZU1heDtcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKHZhbHVlICogYyAtIDEpICogTWF0aC5wb3coMiwgbUxlbik7XG4gICAgICBlID0gZSArIGVCaWFzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbik7XG4gICAgICBlID0gMDtcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KTtcblxuICBlID0gKGUgPDwgbUxlbikgfCBtO1xuICBlTGVuICs9IG1MZW47XG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCk7XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4O1xufTtcbiIsInZhciBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyO1xuZXhwb3J0cy5TbG93QnVmZmVyID0gQnVmZmVyO1xuQnVmZmVyLnBvb2xTaXplID0gODE5MjtcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MDtcblxuZnVuY3Rpb24gQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nLCBvZmZzZXQpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihzdWJqZWN0LCBlbmNvZGluZywgb2Zmc2V0KTtcbiAgfVxuICB0aGlzLnBhcmVudCA9IHRoaXM7XG4gIHRoaXMub2Zmc2V0ID0gMDtcblxuICB2YXIgdHlwZTtcblxuICAvLyBBcmUgd2Ugc2xpY2luZz9cbiAgaWYgKHR5cGVvZiBvZmZzZXQgPT09ICdudW1iZXInKSB7XG4gICAgdGhpcy5sZW5ndGggPSBjb2VyY2UoZW5jb2RpbmcpO1xuICAgIHRoaXMub2Zmc2V0ID0gb2Zmc2V0O1xuICB9IGVsc2Uge1xuICAgIC8vIEZpbmQgdGhlIGxlbmd0aFxuICAgIHN3aXRjaCAodHlwZSA9IHR5cGVvZiBzdWJqZWN0KSB7XG4gICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICB0aGlzLmxlbmd0aCA9IGNvZXJjZShzdWJqZWN0KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgIHRoaXMubGVuZ3RoID0gQnVmZmVyLmJ5dGVMZW5ndGgoc3ViamVjdCwgZW5jb2RpbmcpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnb2JqZWN0JzogLy8gQXNzdW1lIG9iamVjdCBpcyBhbiBhcnJheVxuICAgICAgICB0aGlzLmxlbmd0aCA9IGNvZXJjZShzdWJqZWN0Lmxlbmd0aCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IG5lZWRzIHRvIGJlIGEgbnVtYmVyLCAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdhcnJheSBvciBzdHJpbmcuJyk7XG4gICAgfVxuXG4gICAgLy8gVHJlYXQgYXJyYXktaXNoIG9iamVjdHMgYXMgYSBieXRlIGFycmF5LlxuICAgIGlmIChpc0FycmF5SXNoKHN1YmplY3QpKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHN1YmplY3QgaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgICAgICB0aGlzW2ldID0gc3ViamVjdC5yZWFkVUludDgoaSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgdGhpc1tpXSA9IHN1YmplY3RbaV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGUgPT0gJ3N0cmluZycpIHtcbiAgICAgIC8vIFdlIGFyZSBhIHN0cmluZ1xuICAgICAgdGhpcy5sZW5ndGggPSB0aGlzLndyaXRlKHN1YmplY3QsIDAsIGVuY29kaW5nKTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpc1tpXSA9IDA7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0KGkpIHtcbiAgaWYgKGkgPCAwIHx8IGkgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcignb29iJyk7XG4gIHJldHVybiB0aGlzW2ldO1xufTtcblxuQnVmZmVyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQoaSwgdikge1xuICBpZiAoaSA8IDAgfHwgaSA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCdvb2InKTtcbiAgcmV0dXJuIHRoaXNbaV0gPSB2O1xufTtcblxuQnVmZmVyLmJ5dGVMZW5ndGggPSBmdW5jdGlvbiAoc3RyLCBlbmNvZGluZykge1xuICBzd2l0Y2ggKGVuY29kaW5nIHx8IFwidXRmOFwiKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldHVybiBzdHIubGVuZ3RoIC8gMjtcblxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldHVybiB1dGY4VG9CeXRlcyhzdHIpLmxlbmd0aDtcblxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0dXJuIHN0ci5sZW5ndGg7XG5cbiAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgcmV0dXJuIGJhc2U2NFRvQnl0ZXMoc3RyKS5sZW5ndGg7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJyk7XG4gIH1cbn07XG5cbkJ1ZmZlci5wcm90b3R5cGUudXRmOFdyaXRlID0gZnVuY3Rpb24gKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGJ5dGVzLCBwb3M7XG4gIHJldHVybiBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9ICBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZyksIHRoaXMsIG9mZnNldCwgbGVuZ3RoKTtcbn07XG5cbkJ1ZmZlci5wcm90b3R5cGUuYXNjaWlXcml0ZSA9IGZ1bmN0aW9uIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBieXRlcywgcG9zO1xuICByZXR1cm4gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPSAgYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgdGhpcywgb2Zmc2V0LCBsZW5ndGgpO1xufTtcblxuQnVmZmVyLnByb3RvdHlwZS5iaW5hcnlXcml0ZSA9IEJ1ZmZlci5wcm90b3R5cGUuYXNjaWlXcml0ZTtcblxuQnVmZmVyLnByb3RvdHlwZS5iYXNlNjRXcml0ZSA9IGZ1bmN0aW9uIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBieXRlcywgcG9zO1xuICByZXR1cm4gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPSBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgdGhpcywgb2Zmc2V0LCBsZW5ndGgpO1xufTtcblxuQnVmZmVyLnByb3RvdHlwZS5iYXNlNjRTbGljZSA9IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gIHJldHVybiByZXF1aXJlKFwiYmFzZTY0LWpzXCIpLmZyb21CeXRlQXJyYXkoYnl0ZXMpO1xufTtcblxuQnVmZmVyLnByb3RvdHlwZS51dGY4U2xpY2UgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBieXRlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB2YXIgcmVzID0gXCJcIjtcbiAgdmFyIHRtcCA9IFwiXCI7XG4gIHZhciBpID0gMDtcbiAgd2hpbGUgKGkgPCBieXRlcy5sZW5ndGgpIHtcbiAgICBpZiAoYnl0ZXNbaV0gPD0gMHg3Rikge1xuICAgICAgcmVzICs9IGRlY29kZVV0ZjhDaGFyKHRtcCkgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldKTtcbiAgICAgIHRtcCA9IFwiXCI7XG4gICAgfSBlbHNlXG4gICAgICB0bXAgKz0gXCIlXCIgKyBieXRlc1tpXS50b1N0cmluZygxNik7XG5cbiAgICBpKys7XG4gIH1cblxuICByZXR1cm4gcmVzICsgZGVjb2RlVXRmOENoYXIodG1wKTtcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5hc2NpaVNsaWNlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYnl0ZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgdmFyIHJldCA9IFwiXCI7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpKyspXG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0pO1xuICByZXR1cm4gcmV0O1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmJpbmFyeVNsaWNlID0gQnVmZmVyLnByb3RvdHlwZS5hc2NpaVNsaWNlO1xuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG91dCA9IFtdLFxuICAgICAgbGVuID0gdGhpcy5sZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBvdXRbaV0gPSB0b0hleCh0aGlzW2ldKTtcbiAgICBpZiAoaSA9PSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTKSB7XG4gICAgICBvdXRbaSArIDFdID0gJy4uLic7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBvdXQuam9pbignICcpICsgJz4nO1xufTtcblxuXG5CdWZmZXIucHJvdG90eXBlLmhleFNsaWNlID0gZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGg7XG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMDtcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlbjtcblxuICB2YXIgb3V0ID0gJyc7XG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgb3V0ICs9IHRvSGV4KHRoaXNbaV0pO1xuICB9XG4gIHJldHVybiBvdXQ7XG59O1xuXG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbihlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICBlbmNvZGluZyA9IFN0cmluZyhlbmNvZGluZyB8fCAndXRmOCcpLnRvTG93ZXJDYXNlKCk7XG4gIHN0YXJ0ID0gK3N0YXJ0IHx8IDA7XG4gIGlmICh0eXBlb2YgZW5kID09ICd1bmRlZmluZWQnKSBlbmQgPSB0aGlzLmxlbmd0aDtcblxuICAvLyBGYXN0cGF0aCBlbXB0eSBzdHJpbmdzXG4gIGlmICgrZW5kID09IHN0YXJ0KSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXR1cm4gdGhpcy5oZXhTbGljZShzdGFydCwgZW5kKTtcblxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldHVybiB0aGlzLnV0ZjhTbGljZShzdGFydCwgZW5kKTtcblxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldHVybiB0aGlzLmFzY2lpU2xpY2Uoc3RhcnQsIGVuZCk7XG5cbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0dXJuIHRoaXMuYmluYXJ5U2xpY2Uoc3RhcnQsIGVuZCk7XG5cbiAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgcmV0dXJuIHRoaXMuYmFzZTY0U2xpY2Uoc3RhcnQsIGVuZCk7XG5cbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgICByZXR1cm4gdGhpcy51Y3MyU2xpY2Uoc3RhcnQsIGVuZCk7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJyk7XG4gIH1cbn07XG5cblxuQnVmZmVyLnByb3RvdHlwZS5oZXhXcml0ZSA9IGZ1bmN0aW9uKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gK29mZnNldCB8fCAwO1xuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXQ7XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nO1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9ICtsZW5ndGg7XG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nO1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoO1xuICBpZiAoc3RyTGVuICUgMikge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyO1xuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYnl0ZSA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNik7XG4gICAgaWYgKGlzTmFOKGJ5dGUpKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpO1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSBieXRlO1xuICB9XG4gIEJ1ZmZlci5fY2hhcnNXcml0dGVuID0gaSAqIDI7XG4gIHJldHVybiBpO1xufTtcblxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24oc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gU3VwcG9ydCBib3RoIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZylcbiAgLy8gYW5kIHRoZSBsZWdhY3kgKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIGlmICghaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGg7XG4gICAgICBsZW5ndGggPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9IGVsc2UgeyAgLy8gbGVnYWN5XG4gICAgdmFyIHN3YXAgPSBlbmNvZGluZztcbiAgICBlbmNvZGluZyA9IG9mZnNldDtcbiAgICBvZmZzZXQgPSBsZW5ndGg7XG4gICAgbGVuZ3RoID0gc3dhcDtcbiAgfVxuXG4gIG9mZnNldCA9ICtvZmZzZXQgfHwgMDtcbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0O1xuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZztcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSArbGVuZ3RoO1xuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZztcbiAgICB9XG4gIH1cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpO1xuXG4gIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgICAgcmV0dXJuIHRoaXMuaGV4V3JpdGUoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCk7XG5cbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXR1cm4gdGhpcy51dGY4V3JpdGUoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCk7XG5cbiAgICBjYXNlICdhc2NpaSc6XG4gICAgICByZXR1cm4gdGhpcy5hc2NpaVdyaXRlKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpO1xuXG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgIHJldHVybiB0aGlzLmJpbmFyeVdyaXRlKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpO1xuXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldHVybiB0aGlzLmJhc2U2NFdyaXRlKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpO1xuXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgICAgcmV0dXJuIHRoaXMudWNzMldyaXRlKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZycpO1xuICB9XG59O1xuXG5cbi8vIHNsaWNlKHN0YXJ0LCBlbmQpXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xuICBpZiAoZW5kID09PSB1bmRlZmluZWQpIGVuZCA9IHRoaXMubGVuZ3RoO1xuXG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcignb29iJyk7XG4gIH1cbiAgaWYgKHN0YXJ0ID4gZW5kKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdvb2InKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgQnVmZmVyKHRoaXMsIGVuZCAtIHN0YXJ0LCArc3RhcnQpO1xufTtcblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24odGFyZ2V0LCB0YXJnZXRfc3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNvdXJjZSA9IHRoaXM7XG4gIHN0YXJ0IHx8IChzdGFydCA9IDApO1xuICBpZiAoZW5kID09PSB1bmRlZmluZWQgfHwgaXNOYU4oZW5kKSkge1xuICAgIGVuZCA9IHRoaXMubGVuZ3RoO1xuICB9XG4gIHRhcmdldF9zdGFydCB8fCAodGFyZ2V0X3N0YXJ0ID0gMCk7XG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSB0aHJvdyBuZXcgRXJyb3IoJ3NvdXJjZUVuZCA8IHNvdXJjZVN0YXJ0Jyk7XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMDtcbiAgaWYgKHRhcmdldC5sZW5ndGggPT0gMCB8fCBzb3VyY2UubGVuZ3RoID09IDApIHJldHVybiAwO1xuXG4gIGlmICh0YXJnZXRfc3RhcnQgPCAwIHx8IHRhcmdldF9zdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJyk7XG4gIH1cblxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHNvdXJjZS5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKTtcbiAgfVxuXG4gIGlmIChlbmQgPCAwIHx8IGVuZCA+IHNvdXJjZS5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJyk7XG4gIH1cblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICBlbmQgPSB0aGlzLmxlbmd0aDtcbiAgfVxuXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0ICsgc3RhcnQ7XG4gIH1cblxuICB2YXIgdGVtcCA9IFtdO1xuICBmb3IgKHZhciBpPXN0YXJ0OyBpPGVuZDsgaSsrKSB7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiB0aGlzW2ldICE9PSAndW5kZWZpbmVkJywgXCJjb3B5aW5nIHVuZGVmaW5lZCBidWZmZXIgYnl0ZXMhXCIpO1xuICAgIHRlbXAucHVzaCh0aGlzW2ldKTtcbiAgfVxuXG4gIGZvciAodmFyIGk9dGFyZ2V0X3N0YXJ0OyBpPHRhcmdldF9zdGFydCt0ZW1wLmxlbmd0aDsgaSsrKSB7XG4gICAgdGFyZ2V0W2ldID0gdGVtcFtpLXRhcmdldF9zdGFydF07XG4gIH1cbn07XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCh2YWx1ZSwgc3RhcnQsIGVuZCkge1xuICB2YWx1ZSB8fCAodmFsdWUgPSAwKTtcbiAgc3RhcnQgfHwgKHN0YXJ0ID0gMCk7XG4gIGVuZCB8fCAoZW5kID0gdGhpcy5sZW5ndGgpO1xuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsdWUgPSB2YWx1ZS5jaGFyQ29kZUF0KDApO1xuICB9XG4gIGlmICghKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHx8IGlzTmFOKHZhbHVlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcigndmFsdWUgaXMgbm90IGEgbnVtYmVyJyk7XG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIHRocm93IG5ldyBFcnJvcignZW5kIDwgc3RhcnQnKTtcblxuICAvLyBGaWxsIDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVybiAwO1xuICBpZiAodGhpcy5sZW5ndGggPT0gMCkgcmV0dXJuIDA7XG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc3RhcnQgb3V0IG9mIGJvdW5kcycpO1xuICB9XG5cbiAgaWYgKGVuZCA8IDAgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2VuZCBvdXQgb2YgYm91bmRzJyk7XG4gIH1cblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHRoaXNbaV0gPSB2YWx1ZTtcbiAgfVxufVxuXG4vLyBTdGF0aWMgbWV0aG9kc1xuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIoYikge1xuICByZXR1cm4gYiBpbnN0YW5jZW9mIEJ1ZmZlciB8fCBiIGluc3RhbmNlb2YgQnVmZmVyO1xufTtcblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIChsaXN0LCB0b3RhbExlbmd0aCkge1xuICBpZiAoIWlzQXJyYXkobGlzdCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJVc2FnZTogQnVmZmVyLmNvbmNhdChsaXN0LCBbdG90YWxMZW5ndGhdKVxcbiBcXFxuICAgICAgbGlzdCBzaG91bGQgYmUgYW4gQXJyYXkuXCIpO1xuICB9XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoMCk7XG4gIH0gZWxzZSBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gbGlzdFswXTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgdG90YWxMZW5ndGggIT09ICdudW1iZXInKSB7XG4gICAgdG90YWxMZW5ndGggPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGJ1ZiA9IGxpc3RbaV07XG4gICAgICB0b3RhbExlbmd0aCArPSBidWYubGVuZ3RoO1xuICAgIH1cbiAgfVxuXG4gIHZhciBidWZmZXIgPSBuZXcgQnVmZmVyKHRvdGFsTGVuZ3RoKTtcbiAgdmFyIHBvcyA9IDA7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBidWYgPSBsaXN0W2ldO1xuICAgIGJ1Zi5jb3B5KGJ1ZmZlciwgcG9zKTtcbiAgICBwb3MgKz0gYnVmLmxlbmd0aDtcbiAgfVxuICByZXR1cm4gYnVmZmVyO1xufTtcblxuLy8gaGVscGVyc1xuXG5mdW5jdGlvbiBjb2VyY2UobGVuZ3RoKSB7XG4gIC8vIENvZXJjZSBsZW5ndGggdG8gYSBudW1iZXIgKHBvc3NpYmx5IE5hTiksIHJvdW5kIHVwXG4gIC8vIGluIGNhc2UgaXQncyBmcmFjdGlvbmFsIChlLmcuIDEyMy40NTYpIHRoZW4gZG8gYVxuICAvLyBkb3VibGUgbmVnYXRlIHRvIGNvZXJjZSBhIE5hTiB0byAwLiBFYXN5LCByaWdodD9cbiAgbGVuZ3RoID0gfn5NYXRoLmNlaWwoK2xlbmd0aCk7XG4gIHJldHVybiBsZW5ndGggPCAwID8gMCA6IGxlbmd0aDtcbn1cblxuZnVuY3Rpb24gaXNBcnJheShzdWJqZWN0KSB7XG4gIHJldHVybiAoQXJyYXkuaXNBcnJheSB8fFxuICAgIGZ1bmN0aW9uKHN1YmplY3Qpe1xuICAgICAgcmV0dXJuIHt9LnRvU3RyaW5nLmFwcGx5KHN1YmplY3QpID09ICdbb2JqZWN0IEFycmF5XSdcbiAgICB9KVxuICAgIChzdWJqZWN0KVxufVxuXG5mdW5jdGlvbiBpc0FycmF5SXNoKHN1YmplY3QpIHtcbiAgcmV0dXJuIGlzQXJyYXkoc3ViamVjdCkgfHwgQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpIHx8XG4gICAgICAgICBzdWJqZWN0ICYmIHR5cGVvZiBzdWJqZWN0ID09PSAnb2JqZWN0JyAmJlxuICAgICAgICAgdHlwZW9mIHN1YmplY3QubGVuZ3RoID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gdG9IZXgobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNik7XG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KTtcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspXG4gICAgaWYgKHN0ci5jaGFyQ29kZUF0KGkpIDw9IDB4N0YpXG4gICAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSk7XG4gICAgZWxzZSB7XG4gICAgICB2YXIgaCA9IGVuY29kZVVSSUNvbXBvbmVudChzdHIuY2hhckF0KGkpKS5zdWJzdHIoMSkuc3BsaXQoJyUnKTtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgaC5sZW5ndGg7IGorKylcbiAgICAgICAgYnl0ZUFycmF5LnB1c2gocGFyc2VJbnQoaFtqXSwgMTYpKTtcbiAgICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheTtcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKysgKVxuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKCBzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYgKTtcblxuICByZXR1cm4gYnl0ZUFycmF5O1xufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzKHN0cikge1xuICByZXR1cm4gcmVxdWlyZShcImJhc2U2NC1qc1wiKS50b0J5dGVBcnJheShzdHIpO1xufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgcG9zLCBpID0gMDtcbiAgd2hpbGUgKGkgPCBsZW5ndGgpIHtcbiAgICBpZiAoKGkrb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKVxuICAgICAgYnJlYWs7XG5cbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV07XG4gICAgaSsrO1xuICB9XG4gIHJldHVybiBpO1xufVxuXG5mdW5jdGlvbiBkZWNvZGVVdGY4Q2hhcihzdHIpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHN0cik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RkZGRCk7IC8vIFVURiA4IGludmFsaWQgY2hhclxuICB9XG59XG5cbi8vIHJlYWQvd3JpdGUgYml0LXR3aWRkbGluZ1xuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFyIGJ1ZmZlciA9IHRoaXM7XG5cbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydC5vayhvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsXG4gICAgICAgICdtaXNzaW5nIG9mZnNldCcpO1xuXG4gICAgYXNzZXJ0Lm9rKG9mZnNldCA8IGJ1ZmZlci5sZW5ndGgsXG4gICAgICAgICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpO1xuICB9XG5cbiAgaWYgKG9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSByZXR1cm47XG5cbiAgcmV0dXJuIGJ1ZmZlcltvZmZzZXRdO1xufTtcblxuZnVuY3Rpb24gcmVhZFVJbnQxNihidWZmZXIsIG9mZnNldCwgaXNCaWdFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhciB2YWwgPSAwO1xuXG5cbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydC5vayh0eXBlb2YgKGlzQmlnRW5kaWFuKSA9PT0gJ2Jvb2xlYW4nLFxuICAgICAgICAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpO1xuXG4gICAgYXNzZXJ0Lm9rKG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCxcbiAgICAgICAgJ21pc3Npbmcgb2Zmc2V0Jyk7XG5cbiAgICBhc3NlcnQub2sob2Zmc2V0ICsgMSA8IGJ1ZmZlci5sZW5ndGgsXG4gICAgICAgICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpO1xuICB9XG5cbiAgaWYgKG9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSByZXR1cm4gMDtcblxuICBpZiAoaXNCaWdFbmRpYW4pIHtcbiAgICB2YWwgPSBidWZmZXJbb2Zmc2V0XSA8PCA4O1xuICAgIGlmIChvZmZzZXQgKyAxIDwgYnVmZmVyLmxlbmd0aCkge1xuICAgICAgdmFsIHw9IGJ1ZmZlcltvZmZzZXQgKyAxXTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFsID0gYnVmZmVyW29mZnNldF07XG4gICAgaWYgKG9mZnNldCArIDEgPCBidWZmZXIubGVuZ3RoKSB7XG4gICAgICB2YWwgfD0gYnVmZmVyW29mZnNldCArIDFdIDw8IDg7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHZhbDtcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbihvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkVUludDE2KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KTtcbn07XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24ob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZFVJbnQxNih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KTtcbn07XG5cbmZ1bmN0aW9uIHJlYWRVSW50MzIoYnVmZmVyLCBvZmZzZXQsIGlzQmlnRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YXIgdmFsID0gMDtcblxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiAoaXNCaWdFbmRpYW4pID09PSAnYm9vbGVhbicsXG4gICAgICAgICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJyk7XG5cbiAgICBhc3NlcnQub2sob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyBvZmZzZXQnKTtcblxuICAgIGFzc2VydC5vayhvZmZzZXQgKyAzIDwgYnVmZmVyLmxlbmd0aCxcbiAgICAgICAgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJyk7XG4gIH1cblxuICBpZiAob2Zmc2V0ID49IGJ1ZmZlci5sZW5ndGgpIHJldHVybiAwO1xuXG4gIGlmIChpc0JpZ0VuZGlhbikge1xuICAgIGlmIChvZmZzZXQgKyAxIDwgYnVmZmVyLmxlbmd0aClcbiAgICAgIHZhbCA9IGJ1ZmZlcltvZmZzZXQgKyAxXSA8PCAxNjtcbiAgICBpZiAob2Zmc2V0ICsgMiA8IGJ1ZmZlci5sZW5ndGgpXG4gICAgICB2YWwgfD0gYnVmZmVyW29mZnNldCArIDJdIDw8IDg7XG4gICAgaWYgKG9mZnNldCArIDMgPCBidWZmZXIubGVuZ3RoKVxuICAgICAgdmFsIHw9IGJ1ZmZlcltvZmZzZXQgKyAzXTtcbiAgICB2YWwgPSB2YWwgKyAoYnVmZmVyW29mZnNldF0gPDwgMjQgPj4+IDApO1xuICB9IGVsc2Uge1xuICAgIGlmIChvZmZzZXQgKyAyIDwgYnVmZmVyLmxlbmd0aClcbiAgICAgIHZhbCA9IGJ1ZmZlcltvZmZzZXQgKyAyXSA8PCAxNjtcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGJ1ZmZlci5sZW5ndGgpXG4gICAgICB2YWwgfD0gYnVmZmVyW29mZnNldCArIDFdIDw8IDg7XG4gICAgdmFsIHw9IGJ1ZmZlcltvZmZzZXRdO1xuICAgIGlmIChvZmZzZXQgKyAzIDwgYnVmZmVyLmxlbmd0aClcbiAgICAgIHZhbCA9IHZhbCArIChidWZmZXJbb2Zmc2V0ICsgM10gPDwgMjQgPj4+IDApO1xuICB9XG5cbiAgcmV0dXJuIHZhbDtcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbihvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkVUludDMyKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KTtcbn07XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24ob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZFVJbnQzMih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KTtcbn07XG5cblxuLypcbiAqIFNpZ25lZCBpbnRlZ2VyIHR5cGVzLCB5YXkgdGVhbSEgQSByZW1pbmRlciBvbiBob3cgdHdvJ3MgY29tcGxlbWVudCBhY3R1YWxseVxuICogd29ya3MuIFRoZSBmaXJzdCBiaXQgaXMgdGhlIHNpZ25lZCBiaXQsIGkuZS4gdGVsbHMgdXMgd2hldGhlciBvciBub3QgdGhlXG4gKiBudW1iZXIgc2hvdWxkIGJlIHBvc2l0aXZlIG9yIG5lZ2F0aXZlLiBJZiB0aGUgdHdvJ3MgY29tcGxlbWVudCB2YWx1ZSBpc1xuICogcG9zaXRpdmUsIHRoZW4gd2UncmUgZG9uZSwgYXMgaXQncyBlcXVpdmFsZW50IHRvIHRoZSB1bnNpZ25lZCByZXByZXNlbnRhdGlvbi5cbiAqXG4gKiBOb3cgaWYgdGhlIG51bWJlciBpcyBwb3NpdGl2ZSwgeW91J3JlIHByZXR0eSBtdWNoIGRvbmUsIHlvdSBjYW4ganVzdCBsZXZlcmFnZVxuICogdGhlIHVuc2lnbmVkIHRyYW5zbGF0aW9ucyBhbmQgcmV0dXJuIHRob3NlLiBVbmZvcnR1bmF0ZWx5LCBuZWdhdGl2ZSBudW1iZXJzXG4gKiBhcmVuJ3QgcXVpdGUgdGhhdCBzdHJhaWdodGZvcndhcmQuXG4gKlxuICogQXQgZmlyc3QgZ2xhbmNlLCBvbmUgbWlnaHQgYmUgaW5jbGluZWQgdG8gdXNlIHRoZSB0cmFkaXRpb25hbCBmb3JtdWxhIHRvXG4gKiB0cmFuc2xhdGUgYmluYXJ5IG51bWJlcnMgYmV0d2VlbiB0aGUgcG9zaXRpdmUgYW5kIG5lZ2F0aXZlIHZhbHVlcyBpbiB0d28nc1xuICogY29tcGxlbWVudC4gKFRob3VnaCBpdCBkb2Vzbid0IHF1aXRlIHdvcmsgZm9yIHRoZSBtb3N0IG5lZ2F0aXZlIHZhbHVlKVxuICogTWFpbmx5OlxuICogIC0gaW52ZXJ0IGFsbCB0aGUgYml0c1xuICogIC0gYWRkIG9uZSB0byB0aGUgcmVzdWx0XG4gKlxuICogT2YgY291cnNlLCB0aGlzIGRvZXNuJ3QgcXVpdGUgd29yayBpbiBKYXZhc2NyaXB0LiBUYWtlIGZvciBleGFtcGxlIHRoZSB2YWx1ZVxuICogb2YgLTEyOC4gVGhpcyBjb3VsZCBiZSByZXByZXNlbnRlZCBpbiAxNiBiaXRzIChiaWctZW5kaWFuKSBhcyAweGZmODAuIEJ1dCBvZlxuICogY291cnNlLCBKYXZhc2NyaXB0IHdpbGwgZG8gdGhlIGZvbGxvd2luZzpcbiAqXG4gKiA+IH4weGZmODBcbiAqIC02NTQwOVxuICpcbiAqIFdob2ggdGhlcmUsIEphdmFzY3JpcHQsIHRoYXQncyBub3QgcXVpdGUgcmlnaHQuIEJ1dCB3YWl0LCBhY2NvcmRpbmcgdG9cbiAqIEphdmFzY3JpcHQgdGhhdCdzIHBlcmZlY3RseSBjb3JyZWN0LiBXaGVuIEphdmFzY3JpcHQgZW5kcyB1cCBzZWVpbmcgdGhlXG4gKiBjb25zdGFudCAweGZmODAsIGl0IGhhcyBubyBub3Rpb24gdGhhdCBpdCBpcyBhY3R1YWxseSBhIHNpZ25lZCBudW1iZXIuIEl0XG4gKiBhc3N1bWVzIHRoYXQgd2UndmUgaW5wdXQgdGhlIHVuc2lnbmVkIHZhbHVlIDB4ZmY4MC4gVGh1cywgd2hlbiBpdCBkb2VzIHRoZVxuICogYmluYXJ5IG5lZ2F0aW9uLCBpdCBjYXN0cyBpdCBpbnRvIGEgc2lnbmVkIHZhbHVlLCAocG9zaXRpdmUgMHhmZjgwKS4gVGhlblxuICogd2hlbiB5b3UgcGVyZm9ybSBiaW5hcnkgbmVnYXRpb24gb24gdGhhdCwgaXQgdHVybnMgaXQgaW50byBhIG5lZ2F0aXZlIG51bWJlci5cbiAqXG4gKiBJbnN0ZWFkLCB3ZSdyZSBnb2luZyB0byBoYXZlIHRvIHVzZSB0aGUgZm9sbG93aW5nIGdlbmVyYWwgZm9ybXVsYSwgdGhhdCB3b3Jrc1xuICogaW4gYSByYXRoZXIgSmF2YXNjcmlwdCBmcmllbmRseSB3YXkuIEknbSBnbGFkIHdlIGRvbid0IHN1cHBvcnQgdGhpcyBraW5kIG9mXG4gKiB3ZWlyZCBudW1iZXJpbmcgc2NoZW1lIGluIHRoZSBrZXJuZWwuXG4gKlxuICogKEJJVC1NQVggLSAodW5zaWduZWQpdmFsICsgMSkgKiAtMVxuICpcbiAqIFRoZSBhc3R1dGUgb2JzZXJ2ZXIsIG1heSB0aGluayB0aGF0IHRoaXMgZG9lc24ndCBtYWtlIHNlbnNlIGZvciA4LWJpdCBudW1iZXJzXG4gKiAocmVhbGx5IGl0IGlzbid0IG5lY2Vzc2FyeSBmb3IgdGhlbSkuIEhvd2V2ZXIsIHdoZW4geW91IGdldCAxNi1iaXQgbnVtYmVycyxcbiAqIHlvdSBkby4gTGV0J3MgZ28gYmFjayB0byBvdXIgcHJpb3IgZXhhbXBsZSBhbmQgc2VlIGhvdyB0aGlzIHdpbGwgbG9vazpcbiAqXG4gKiAoMHhmZmZmIC0gMHhmZjgwICsgMSkgKiAtMVxuICogKDB4MDA3ZiArIDEpICogLTFcbiAqICgweDAwODApICogLTFcbiAqL1xuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFyIGJ1ZmZlciA9IHRoaXM7XG4gIHZhciBuZWc7XG5cbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydC5vayhvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsXG4gICAgICAgICdtaXNzaW5nIG9mZnNldCcpO1xuXG4gICAgYXNzZXJ0Lm9rKG9mZnNldCA8IGJ1ZmZlci5sZW5ndGgsXG4gICAgICAgICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpO1xuICB9XG5cbiAgaWYgKG9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSByZXR1cm47XG5cbiAgbmVnID0gYnVmZmVyW29mZnNldF0gJiAweDgwO1xuICBpZiAoIW5lZykge1xuICAgIHJldHVybiAoYnVmZmVyW29mZnNldF0pO1xuICB9XG5cbiAgcmV0dXJuICgoMHhmZiAtIGJ1ZmZlcltvZmZzZXRdICsgMSkgKiAtMSk7XG59O1xuXG5mdW5jdGlvbiByZWFkSW50MTYoYnVmZmVyLCBvZmZzZXQsIGlzQmlnRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YXIgbmVnLCB2YWw7XG5cbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydC5vayh0eXBlb2YgKGlzQmlnRW5kaWFuKSA9PT0gJ2Jvb2xlYW4nLFxuICAgICAgICAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpO1xuXG4gICAgYXNzZXJ0Lm9rKG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCxcbiAgICAgICAgJ21pc3Npbmcgb2Zmc2V0Jyk7XG5cbiAgICBhc3NlcnQub2sob2Zmc2V0ICsgMSA8IGJ1ZmZlci5sZW5ndGgsXG4gICAgICAgICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpO1xuICB9XG5cbiAgdmFsID0gcmVhZFVJbnQxNihidWZmZXIsIG9mZnNldCwgaXNCaWdFbmRpYW4sIG5vQXNzZXJ0KTtcbiAgbmVnID0gdmFsICYgMHg4MDAwO1xuICBpZiAoIW5lZykge1xuICAgIHJldHVybiB2YWw7XG4gIH1cblxuICByZXR1cm4gKDB4ZmZmZiAtIHZhbCArIDEpICogLTE7XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbihvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkSW50MTYodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpO1xufTtcblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHJlYWRJbnQxNih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KTtcbn07XG5cbmZ1bmN0aW9uIHJlYWRJbnQzMihidWZmZXIsIG9mZnNldCwgaXNCaWdFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhciBuZWcsIHZhbDtcblxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiAoaXNCaWdFbmRpYW4pID09PSAnYm9vbGVhbicsXG4gICAgICAgICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJyk7XG5cbiAgICBhc3NlcnQub2sob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyBvZmZzZXQnKTtcblxuICAgIGFzc2VydC5vayhvZmZzZXQgKyAzIDwgYnVmZmVyLmxlbmd0aCxcbiAgICAgICAgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJyk7XG4gIH1cblxuICB2YWwgPSByZWFkVUludDMyKGJ1ZmZlciwgb2Zmc2V0LCBpc0JpZ0VuZGlhbiwgbm9Bc3NlcnQpO1xuICBuZWcgPSB2YWwgJiAweDgwMDAwMDAwO1xuICBpZiAoIW5lZykge1xuICAgIHJldHVybiAodmFsKTtcbiAgfVxuXG4gIHJldHVybiAoMHhmZmZmZmZmZiAtIHZhbCArIDEpICogLTE7XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbihvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkSW50MzIodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpO1xufTtcblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHJlYWRJbnQzMih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KTtcbn07XG5cbmZ1bmN0aW9uIHJlYWRGbG9hdChidWZmZXIsIG9mZnNldCwgaXNCaWdFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQub2sodHlwZW9mIChpc0JpZ0VuZGlhbikgPT09ICdib29sZWFuJyxcbiAgICAgICAgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKTtcblxuICAgIGFzc2VydC5vayhvZmZzZXQgKyAzIDwgYnVmZmVyLmxlbmd0aCxcbiAgICAgICAgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJyk7XG4gIH1cblxuICByZXR1cm4gcmVxdWlyZSgnLi9idWZmZXJfaWVlZTc1NCcpLnJlYWRJRUVFNzU0KGJ1ZmZlciwgb2Zmc2V0LCBpc0JpZ0VuZGlhbixcbiAgICAgIDIzLCA0KTtcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHJlYWRGbG9hdCh0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydCk7XG59O1xuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24ob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZEZsb2F0KHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpO1xufTtcblxuZnVuY3Rpb24gcmVhZERvdWJsZShidWZmZXIsIG9mZnNldCwgaXNCaWdFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQub2sodHlwZW9mIChpc0JpZ0VuZGlhbikgPT09ICdib29sZWFuJyxcbiAgICAgICAgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKTtcblxuICAgIGFzc2VydC5vayhvZmZzZXQgKyA3IDwgYnVmZmVyLmxlbmd0aCxcbiAgICAgICAgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJyk7XG4gIH1cblxuICByZXR1cm4gcmVxdWlyZSgnLi9idWZmZXJfaWVlZTc1NCcpLnJlYWRJRUVFNzU0KGJ1ZmZlciwgb2Zmc2V0LCBpc0JpZ0VuZGlhbixcbiAgICAgIDUyLCA4KTtcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbihvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiByZWFkRG91YmxlKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KTtcbn07XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24ob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gcmVhZERvdWJsZSh0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KTtcbn07XG5cblxuLypcbiAqIFdlIGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHZhbHVlIGlzIGEgdmFsaWQgaW50ZWdlci4gVGhpcyBtZWFucyB0aGF0IGl0IGlzXG4gKiBub24tbmVnYXRpdmUuIEl0IGhhcyBubyBmcmFjdGlvbmFsIGNvbXBvbmVudCBhbmQgdGhhdCBpdCBkb2VzIG5vdCBleGNlZWQgdGhlXG4gKiBtYXhpbXVtIGFsbG93ZWQgdmFsdWUuXG4gKlxuICogICAgICB2YWx1ZSAgICAgICAgICAgVGhlIG51bWJlciB0byBjaGVjayBmb3IgdmFsaWRpdHlcbiAqXG4gKiAgICAgIG1heCAgICAgICAgICAgICBUaGUgbWF4aW11bSB2YWx1ZVxuICovXG5mdW5jdGlvbiB2ZXJpZnVpbnQodmFsdWUsIG1heCkge1xuICBhc3NlcnQub2sodHlwZW9mICh2YWx1ZSkgPT0gJ251bWJlcicsXG4gICAgICAnY2Fubm90IHdyaXRlIGEgbm9uLW51bWJlciBhcyBhIG51bWJlcicpO1xuXG4gIGFzc2VydC5vayh2YWx1ZSA+PSAwLFxuICAgICAgJ3NwZWNpZmllZCBhIG5lZ2F0aXZlIHZhbHVlIGZvciB3cml0aW5nIGFuIHVuc2lnbmVkIHZhbHVlJyk7XG5cbiAgYXNzZXJ0Lm9rKHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGlzIGxhcmdlciB0aGFuIG1heGltdW0gdmFsdWUgZm9yIHR5cGUnKTtcblxuICBhc3NlcnQub2soTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlLCAndmFsdWUgaGFzIGEgZnJhY3Rpb25hbCBjb21wb25lbnQnKTtcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24odmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFyIGJ1ZmZlciA9IHRoaXM7XG5cbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydC5vayh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyB2YWx1ZScpO1xuXG4gICAgYXNzZXJ0Lm9rKG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCxcbiAgICAgICAgJ21pc3Npbmcgb2Zmc2V0Jyk7XG5cbiAgICBhc3NlcnQub2sob2Zmc2V0IDwgYnVmZmVyLmxlbmd0aCxcbiAgICAgICAgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpO1xuXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmKTtcbiAgfVxuXG4gIGlmIChvZmZzZXQgPCBidWZmZXIubGVuZ3RoKSB7XG4gICAgYnVmZmVyW29mZnNldF0gPSB2YWx1ZTtcbiAgfVxufTtcblxuZnVuY3Rpb24gd3JpdGVVSW50MTYoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0JpZ0VuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydC5vayh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyB2YWx1ZScpO1xuXG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiAoaXNCaWdFbmRpYW4pID09PSAnYm9vbGVhbicsXG4gICAgICAgICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJyk7XG5cbiAgICBhc3NlcnQub2sob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyBvZmZzZXQnKTtcblxuICAgIGFzc2VydC5vayhvZmZzZXQgKyAxIDwgYnVmZmVyLmxlbmd0aCxcbiAgICAgICAgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpO1xuXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmZmYpO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBNYXRoLm1pbihidWZmZXIubGVuZ3RoIC0gb2Zmc2V0LCAyKTsgaSsrKSB7XG4gICAgYnVmZmVyW29mZnNldCArIGldID1cbiAgICAgICAgKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAoaXNCaWdFbmRpYW4gPyAxIC0gaSA6IGkpKSkpID4+PlxuICAgICAgICAgICAgKGlzQmlnRW5kaWFuID8gMSAtIGkgOiBpKSAqIDg7XG4gIH1cblxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbih2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB3cml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpO1xufTtcblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24odmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgd3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpO1xufTtcblxuZnVuY3Rpb24gd3JpdGVVSW50MzIoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0JpZ0VuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydC5vayh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyB2YWx1ZScpO1xuXG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiAoaXNCaWdFbmRpYW4pID09PSAnYm9vbGVhbicsXG4gICAgICAgICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJyk7XG5cbiAgICBhc3NlcnQub2sob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyBvZmZzZXQnKTtcblxuICAgIGFzc2VydC5vayhvZmZzZXQgKyAzIDwgYnVmZmVyLmxlbmd0aCxcbiAgICAgICAgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpO1xuXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmZmZmZmZmKTtcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgTWF0aC5taW4oYnVmZmVyLmxlbmd0aCAtIG9mZnNldCwgNCk7IGkrKykge1xuICAgIGJ1ZmZlcltvZmZzZXQgKyBpXSA9XG4gICAgICAgICh2YWx1ZSA+Pj4gKGlzQmlnRW5kaWFuID8gMyAtIGkgOiBpKSAqIDgpICYgMHhmZjtcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbih2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB3cml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpO1xufTtcblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24odmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgd3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpO1xufTtcblxuXG4vKlxuICogV2Ugbm93IG1vdmUgb250byBvdXIgZnJpZW5kcyBpbiB0aGUgc2lnbmVkIG51bWJlciBjYXRlZ29yeS4gVW5saWtlIHVuc2lnbmVkXG4gKiBudW1iZXJzLCB3ZSdyZSBnb2luZyB0byBoYXZlIHRvIHdvcnJ5IGEgYml0IG1vcmUgYWJvdXQgaG93IHdlIHB1dCB2YWx1ZXMgaW50b1xuICogYXJyYXlzLiBTaW5jZSB3ZSBhcmUgb25seSB3b3JyeWluZyBhYm91dCBzaWduZWQgMzItYml0IHZhbHVlcywgd2UncmUgaW5cbiAqIHNsaWdodGx5IGJldHRlciBzaGFwZS4gVW5mb3J0dW5hdGVseSwgd2UgcmVhbGx5IGNhbid0IGRvIG91ciBmYXZvcml0ZSBiaW5hcnlcbiAqICYgaW4gdGhpcyBzeXN0ZW0uIEl0IHJlYWxseSBzZWVtcyB0byBkbyB0aGUgd3JvbmcgdGhpbmcuIEZvciBleGFtcGxlOlxuICpcbiAqID4gLTMyICYgMHhmZlxuICogMjI0XG4gKlxuICogV2hhdCdzIGhhcHBlbmluZyBhYm92ZSBpcyByZWFsbHk6IDB4ZTAgJiAweGZmID0gMHhlMC4gSG93ZXZlciwgdGhlIHJlc3VsdHMgb2ZcbiAqIHRoaXMgYXJlbid0IHRyZWF0ZWQgYXMgYSBzaWduZWQgbnVtYmVyLiBVbHRpbWF0ZWx5IGEgYmFkIHRoaW5nLlxuICpcbiAqIFdoYXQgd2UncmUgZ29pbmcgdG8gd2FudCB0byBkbyBpcyBiYXNpY2FsbHkgY3JlYXRlIHRoZSB1bnNpZ25lZCBlcXVpdmFsZW50IG9mXG4gKiBvdXIgcmVwcmVzZW50YXRpb24gYW5kIHBhc3MgdGhhdCBvZmYgdG8gdGhlIHd1aW50KiBmdW5jdGlvbnMuIFRvIGRvIHRoYXRcbiAqIHdlJ3JlIGdvaW5nIHRvIGRvIHRoZSBmb2xsb3dpbmc6XG4gKlxuICogIC0gaWYgdGhlIHZhbHVlIGlzIHBvc2l0aXZlXG4gKiAgICAgIHdlIGNhbiBwYXNzIGl0IGRpcmVjdGx5IG9mZiB0byB0aGUgZXF1aXZhbGVudCB3dWludFxuICogIC0gaWYgdGhlIHZhbHVlIGlzIG5lZ2F0aXZlXG4gKiAgICAgIHdlIGRvIHRoZSBmb2xsb3dpbmcgY29tcHV0YXRpb246XG4gKiAgICAgICAgIG1iICsgdmFsICsgMSwgd2hlcmVcbiAqICAgICAgICAgbWIgICBpcyB0aGUgbWF4aW11bSB1bnNpZ25lZCB2YWx1ZSBpbiB0aGF0IGJ5dGUgc2l6ZVxuICogICAgICAgICB2YWwgIGlzIHRoZSBKYXZhc2NyaXB0IG5lZ2F0aXZlIGludGVnZXJcbiAqXG4gKlxuICogQXMgYSBjb25jcmV0ZSB2YWx1ZSwgdGFrZSAtMTI4LiBJbiBzaWduZWQgMTYgYml0cyB0aGlzIHdvdWxkIGJlIDB4ZmY4MC4gSWZcbiAqIHlvdSBkbyBvdXQgdGhlIGNvbXB1dGF0aW9uczpcbiAqXG4gKiAweGZmZmYgLSAxMjggKyAxXG4gKiAweGZmZmYgLSAxMjdcbiAqIDB4ZmY4MFxuICpcbiAqIFlvdSBjYW4gdGhlbiBlbmNvZGUgdGhpcyB2YWx1ZSBhcyB0aGUgc2lnbmVkIHZlcnNpb24uIFRoaXMgaXMgcmVhbGx5IHJhdGhlclxuICogaGFja3ksIGJ1dCBpdCBzaG91bGQgd29yayBhbmQgZ2V0IHRoZSBqb2IgZG9uZSB3aGljaCBpcyBvdXIgZ29hbCBoZXJlLlxuICovXG5cbi8qXG4gKiBBIHNlcmllcyBvZiBjaGVja3MgdG8gbWFrZSBzdXJlIHdlIGFjdHVhbGx5IGhhdmUgYSBzaWduZWQgMzItYml0IG51bWJlclxuICovXG5mdW5jdGlvbiB2ZXJpZnNpbnQodmFsdWUsIG1heCwgbWluKSB7XG4gIGFzc2VydC5vayh0eXBlb2YgKHZhbHVlKSA9PSAnbnVtYmVyJyxcbiAgICAgICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJyk7XG5cbiAgYXNzZXJ0Lm9rKHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGxhcmdlciB0aGFuIG1heGltdW0gYWxsb3dlZCB2YWx1ZScpO1xuXG4gIGFzc2VydC5vayh2YWx1ZSA+PSBtaW4sICd2YWx1ZSBzbWFsbGVyIHRoYW4gbWluaW11bSBhbGxvd2VkIHZhbHVlJyk7XG5cbiAgYXNzZXJ0Lm9rKE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZSwgJ3ZhbHVlIGhhcyBhIGZyYWN0aW9uYWwgY29tcG9uZW50Jyk7XG59XG5cbmZ1bmN0aW9uIHZlcmlmSUVFRTc1NCh2YWx1ZSwgbWF4LCBtaW4pIHtcbiAgYXNzZXJ0Lm9rKHR5cGVvZiAodmFsdWUpID09ICdudW1iZXInLFxuICAgICAgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKTtcblxuICBhc3NlcnQub2sodmFsdWUgPD0gbWF4LCAndmFsdWUgbGFyZ2VyIHRoYW4gbWF4aW11bSBhbGxvd2VkIHZhbHVlJyk7XG5cbiAgYXNzZXJ0Lm9rKHZhbHVlID49IG1pbiwgJ3ZhbHVlIHNtYWxsZXIgdGhhbiBtaW5pbXVtIGFsbG93ZWQgdmFsdWUnKTtcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbih2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YXIgYnVmZmVyID0gdGhpcztcblxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0Lm9rKHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsXG4gICAgICAgICdtaXNzaW5nIHZhbHVlJyk7XG5cbiAgICBhc3NlcnQub2sob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyBvZmZzZXQnKTtcblxuICAgIGFzc2VydC5vayhvZmZzZXQgPCBidWZmZXIubGVuZ3RoLFxuICAgICAgICAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJyk7XG5cbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2YsIC0weDgwKTtcbiAgfVxuXG4gIGlmICh2YWx1ZSA+PSAwKSB7XG4gICAgYnVmZmVyLndyaXRlVUludDgodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpO1xuICB9IGVsc2Uge1xuICAgIGJ1ZmZlci53cml0ZVVJbnQ4KDB4ZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbm9Bc3NlcnQpO1xuICB9XG59O1xuXG5mdW5jdGlvbiB3cml0ZUludDE2KGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNCaWdFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQub2sodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCxcbiAgICAgICAgJ21pc3NpbmcgdmFsdWUnKTtcblxuICAgIGFzc2VydC5vayh0eXBlb2YgKGlzQmlnRW5kaWFuKSA9PT0gJ2Jvb2xlYW4nLFxuICAgICAgICAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpO1xuXG4gICAgYXNzZXJ0Lm9rKG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCxcbiAgICAgICAgJ21pc3Npbmcgb2Zmc2V0Jyk7XG5cbiAgICBhc3NlcnQub2sob2Zmc2V0ICsgMSA8IGJ1ZmZlci5sZW5ndGgsXG4gICAgICAgICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKTtcblxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZmZmLCAtMHg4MDAwKTtcbiAgfVxuXG4gIGlmICh2YWx1ZSA+PSAwKSB7XG4gICAgd3JpdGVVSW50MTYoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0JpZ0VuZGlhbiwgbm9Bc3NlcnQpO1xuICB9IGVsc2Uge1xuICAgIHdyaXRlVUludDE2KGJ1ZmZlciwgMHhmZmZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIGlzQmlnRW5kaWFuLCBub0Fzc2VydCk7XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbih2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB3cml0ZUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydCk7XG59O1xuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHdyaXRlSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpO1xufTtcblxuZnVuY3Rpb24gd3JpdGVJbnQzMihidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzQmlnRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0Lm9rKHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsXG4gICAgICAgICdtaXNzaW5nIHZhbHVlJyk7XG5cbiAgICBhc3NlcnQub2sodHlwZW9mIChpc0JpZ0VuZGlhbikgPT09ICdib29sZWFuJyxcbiAgICAgICAgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKTtcblxuICAgIGFzc2VydC5vayhvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsXG4gICAgICAgICdtaXNzaW5nIG9mZnNldCcpO1xuXG4gICAgYXNzZXJ0Lm9rKG9mZnNldCArIDMgPCBidWZmZXIubGVuZ3RoLFxuICAgICAgICAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJyk7XG5cbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKTtcbiAgfVxuXG4gIGlmICh2YWx1ZSA+PSAwKSB7XG4gICAgd3JpdGVVSW50MzIoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0JpZ0VuZGlhbiwgbm9Bc3NlcnQpO1xuICB9IGVsc2Uge1xuICAgIHdyaXRlVUludDMyKGJ1ZmZlciwgMHhmZmZmZmZmZiArIHZhbHVlICsgMSwgb2Zmc2V0LCBpc0JpZ0VuZGlhbiwgbm9Bc3NlcnQpO1xuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24odmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgd3JpdGVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpO1xufTtcblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbih2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB3cml0ZUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KTtcbn07XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0JpZ0VuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydC5vayh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyB2YWx1ZScpO1xuXG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiAoaXNCaWdFbmRpYW4pID09PSAnYm9vbGVhbicsXG4gICAgICAgICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJyk7XG5cbiAgICBhc3NlcnQub2sob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyBvZmZzZXQnKTtcblxuICAgIGFzc2VydC5vayhvZmZzZXQgKyAzIDwgYnVmZmVyLmxlbmd0aCxcbiAgICAgICAgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpO1xuXG4gICAgdmVyaWZJRUVFNzU0KHZhbHVlLCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOCk7XG4gIH1cblxuICByZXF1aXJlKCcuL2J1ZmZlcl9pZWVlNzU0Jykud3JpdGVJRUVFNzU0KGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNCaWdFbmRpYW4sXG4gICAgICAyMywgNCk7XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdExFID0gZnVuY3Rpb24odmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpO1xufTtcblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbih2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KTtcbn07XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNCaWdFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQub2sodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCxcbiAgICAgICAgJ21pc3NpbmcgdmFsdWUnKTtcblxuICAgIGFzc2VydC5vayh0eXBlb2YgKGlzQmlnRW5kaWFuKSA9PT0gJ2Jvb2xlYW4nLFxuICAgICAgICAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpO1xuXG4gICAgYXNzZXJ0Lm9rKG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCxcbiAgICAgICAgJ21pc3Npbmcgb2Zmc2V0Jyk7XG5cbiAgICBhc3NlcnQub2sob2Zmc2V0ICsgNyA8IGJ1ZmZlci5sZW5ndGgsXG4gICAgICAgICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKTtcblxuICAgIHZlcmlmSUVFRTc1NCh2YWx1ZSwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCk7XG4gIH1cblxuICByZXF1aXJlKCcuL2J1ZmZlcl9pZWVlNzU0Jykud3JpdGVJRUVFNzU0KGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNCaWdFbmRpYW4sXG4gICAgICA1MiwgOCk7XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydCk7XG59O1xuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbih2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydCk7XG59O1xuIiwiKGZ1bmN0aW9uIChleHBvcnRzKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgbG9va3VwID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nO1xuXG5cdGZ1bmN0aW9uIGI2NFRvQnl0ZUFycmF5KGI2NCkge1xuXHRcdHZhciBpLCBqLCBsLCB0bXAsIHBsYWNlSG9sZGVycywgYXJyO1xuXHRcblx0XHRpZiAoYjY0Lmxlbmd0aCAlIDQgPiAwKSB7XG5cdFx0XHR0aHJvdyAnSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCc7XG5cdFx0fVxuXG5cdFx0Ly8gdGhlIG51bWJlciBvZiBlcXVhbCBzaWducyAocGxhY2UgaG9sZGVycylcblx0XHQvLyBpZiB0aGVyZSBhcmUgdHdvIHBsYWNlaG9sZGVycywgdGhhbiB0aGUgdHdvIGNoYXJhY3RlcnMgYmVmb3JlIGl0XG5cdFx0Ly8gcmVwcmVzZW50IG9uZSBieXRlXG5cdFx0Ly8gaWYgdGhlcmUgaXMgb25seSBvbmUsIHRoZW4gdGhlIHRocmVlIGNoYXJhY3RlcnMgYmVmb3JlIGl0IHJlcHJlc2VudCAyIGJ5dGVzXG5cdFx0Ly8gdGhpcyBpcyBqdXN0IGEgY2hlYXAgaGFjayB0byBub3QgZG8gaW5kZXhPZiB0d2ljZVxuXHRcdHBsYWNlSG9sZGVycyA9IGI2NC5pbmRleE9mKCc9Jyk7XG5cdFx0cGxhY2VIb2xkZXJzID0gcGxhY2VIb2xkZXJzID4gMCA/IGI2NC5sZW5ndGggLSBwbGFjZUhvbGRlcnMgOiAwO1xuXG5cdFx0Ly8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5cdFx0YXJyID0gW107Ly9uZXcgVWludDhBcnJheShiNjQubGVuZ3RoICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpO1xuXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuXHRcdGwgPSBwbGFjZUhvbGRlcnMgPiAwID8gYjY0Lmxlbmd0aCAtIDQgOiBiNjQubGVuZ3RoO1xuXG5cdFx0Zm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuXHRcdFx0dG1wID0gKGxvb2t1cC5pbmRleE9mKGI2NFtpXSkgPDwgMTgpIHwgKGxvb2t1cC5pbmRleE9mKGI2NFtpICsgMV0pIDw8IDEyKSB8IChsb29rdXAuaW5kZXhPZihiNjRbaSArIDJdKSA8PCA2KSB8IGxvb2t1cC5pbmRleE9mKGI2NFtpICsgM10pO1xuXHRcdFx0YXJyLnB1c2goKHRtcCAmIDB4RkYwMDAwKSA+PiAxNik7XG5cdFx0XHRhcnIucHVzaCgodG1wICYgMHhGRjAwKSA+PiA4KTtcblx0XHRcdGFyci5wdXNoKHRtcCAmIDB4RkYpO1xuXHRcdH1cblxuXHRcdGlmIChwbGFjZUhvbGRlcnMgPT09IDIpIHtcblx0XHRcdHRtcCA9IChsb29rdXAuaW5kZXhPZihiNjRbaV0pIDw8IDIpIHwgKGxvb2t1cC5pbmRleE9mKGI2NFtpICsgMV0pID4+IDQpO1xuXHRcdFx0YXJyLnB1c2godG1wICYgMHhGRik7XG5cdFx0fSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcblx0XHRcdHRtcCA9IChsb29rdXAuaW5kZXhPZihiNjRbaV0pIDw8IDEwKSB8IChsb29rdXAuaW5kZXhPZihiNjRbaSArIDFdKSA8PCA0KSB8IChsb29rdXAuaW5kZXhPZihiNjRbaSArIDJdKSA+PiAyKTtcblx0XHRcdGFyci5wdXNoKCh0bXAgPj4gOCkgJiAweEZGKTtcblx0XHRcdGFyci5wdXNoKHRtcCAmIDB4RkYpO1xuXHRcdH1cblxuXHRcdHJldHVybiBhcnI7XG5cdH1cblxuXHRmdW5jdGlvbiB1aW50OFRvQmFzZTY0KHVpbnQ4KSB7XG5cdFx0dmFyIGksXG5cdFx0XHRleHRyYUJ5dGVzID0gdWludDgubGVuZ3RoICUgMywgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcblx0XHRcdG91dHB1dCA9IFwiXCIsXG5cdFx0XHR0ZW1wLCBsZW5ndGg7XG5cblx0XHRmdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuXHRcdFx0cmV0dXJuIGxvb2t1cFtudW0gPj4gMTggJiAweDNGXSArIGxvb2t1cFtudW0gPj4gMTIgJiAweDNGXSArIGxvb2t1cFtudW0gPj4gNiAmIDB4M0ZdICsgbG9va3VwW251bSAmIDB4M0ZdO1xuXHRcdH07XG5cblx0XHQvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG5cdFx0Zm9yIChpID0gMCwgbGVuZ3RoID0gdWludDgubGVuZ3RoIC0gZXh0cmFCeXRlczsgaSA8IGxlbmd0aDsgaSArPSAzKSB7XG5cdFx0XHR0ZW1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKTtcblx0XHRcdG91dHB1dCArPSB0cmlwbGV0VG9CYXNlNjQodGVtcCk7XG5cdFx0fVxuXG5cdFx0Ly8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuXHRcdHN3aXRjaCAoZXh0cmFCeXRlcykge1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0ZW1wID0gdWludDhbdWludDgubGVuZ3RoIC0gMV07XG5cdFx0XHRcdG91dHB1dCArPSBsb29rdXBbdGVtcCA+PiAyXTtcblx0XHRcdFx0b3V0cHV0ICs9IGxvb2t1cFsodGVtcCA8PCA0KSAmIDB4M0ZdO1xuXHRcdFx0XHRvdXRwdXQgKz0gJz09Jztcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIDI6XG5cdFx0XHRcdHRlbXAgPSAodWludDhbdWludDgubGVuZ3RoIC0gMl0gPDwgOCkgKyAodWludDhbdWludDgubGVuZ3RoIC0gMV0pO1xuXHRcdFx0XHRvdXRwdXQgKz0gbG9va3VwW3RlbXAgPj4gMTBdO1xuXHRcdFx0XHRvdXRwdXQgKz0gbG9va3VwWyh0ZW1wID4+IDQpICYgMHgzRl07XG5cdFx0XHRcdG91dHB1dCArPSBsb29rdXBbKHRlbXAgPDwgMikgJiAweDNGXTtcblx0XHRcdFx0b3V0cHV0ICs9ICc9Jztcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG91dHB1dDtcblx0fVxuXG5cdG1vZHVsZS5leHBvcnRzLnRvQnl0ZUFycmF5ID0gYjY0VG9CeXRlQXJyYXk7XG5cdG1vZHVsZS5leHBvcnRzLmZyb21CeXRlQXJyYXkgPSB1aW50OFRvQmFzZTY0O1xufSgpKTtcbiIsInZhciBCdWZmZXIgPSByZXF1aXJlKCdidWZmZXInKS5CdWZmZXI7XG52YXIgaW50U2l6ZSA9IDQ7XG52YXIgemVyb0J1ZmZlciA9IG5ldyBCdWZmZXIoaW50U2l6ZSk7IHplcm9CdWZmZXIuZmlsbCgwKTtcbnZhciBjaHJzeiA9IDg7XG5cbmZ1bmN0aW9uIHRvQXJyYXkoYnVmLCBiaWdFbmRpYW4pIHtcbiAgaWYgKChidWYubGVuZ3RoICUgaW50U2l6ZSkgIT09IDApIHtcbiAgICB2YXIgbGVuID0gYnVmLmxlbmd0aCArIChpbnRTaXplIC0gKGJ1Zi5sZW5ndGggJSBpbnRTaXplKSk7XG4gICAgYnVmID0gQnVmZmVyLmNvbmNhdChbYnVmLCB6ZXJvQnVmZmVyXSwgbGVuKTtcbiAgfVxuXG4gIHZhciBhcnIgPSBbXTtcbiAgdmFyIGZuID0gYmlnRW5kaWFuID8gYnVmLnJlYWRJbnQzMkJFIDogYnVmLnJlYWRJbnQzMkxFO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1Zi5sZW5ndGg7IGkgKz0gaW50U2l6ZSkge1xuICAgIGFyci5wdXNoKGZuLmNhbGwoYnVmLCBpKSk7XG4gIH1cbiAgcmV0dXJuIGFycjtcbn1cblxuZnVuY3Rpb24gdG9CdWZmZXIoYXJyLCBzaXplLCBiaWdFbmRpYW4pIHtcbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIoc2l6ZSk7XG4gIHZhciBmbiA9IGJpZ0VuZGlhbiA/IGJ1Zi53cml0ZUludDMyQkUgOiBidWYud3JpdGVJbnQzMkxFO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGZuLmNhbGwoYnVmLCBhcnJbaV0sIGkgKiA0LCB0cnVlKTtcbiAgfVxuICByZXR1cm4gYnVmO1xufVxuXG5mdW5jdGlvbiBoYXNoKGJ1ZiwgZm4sIGhhc2hTaXplLCBiaWdFbmRpYW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgYnVmID0gbmV3IEJ1ZmZlcihidWYpO1xuICB2YXIgYXJyID0gZm4odG9BcnJheShidWYsIGJpZ0VuZGlhbiksIGJ1Zi5sZW5ndGggKiBjaHJzeik7XG4gIHJldHVybiB0b0J1ZmZlcihhcnIsIGhhc2hTaXplLCBiaWdFbmRpYW4pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgaGFzaDogaGFzaCB9O1xuIiwidmFyIEJ1ZmZlciA9IHJlcXVpcmUoJ2J1ZmZlcicpLkJ1ZmZlclxudmFyIHNoYSA9IHJlcXVpcmUoJy4vc2hhJylcbnZhciBzaGEyNTYgPSByZXF1aXJlKCcuL3NoYTI1NicpXG52YXIgcm5nID0gcmVxdWlyZSgnLi9ybmcnKVxudmFyIG1kNSA9IHJlcXVpcmUoJy4vbWQ1JylcblxudmFyIGFsZ29yaXRobXMgPSB7XG4gIHNoYTE6IHNoYSxcbiAgc2hhMjU2OiBzaGEyNTYsXG4gIG1kNTogbWQ1XG59XG5cbnZhciBibG9ja3NpemUgPSA2NFxudmFyIHplcm9CdWZmZXIgPSBuZXcgQnVmZmVyKGJsb2Nrc2l6ZSk7IHplcm9CdWZmZXIuZmlsbCgwKVxuZnVuY3Rpb24gaG1hYyhmbiwga2V5LCBkYXRhKSB7XG4gIGlmKCFCdWZmZXIuaXNCdWZmZXIoa2V5KSkga2V5ID0gbmV3IEJ1ZmZlcihrZXkpXG4gIGlmKCFCdWZmZXIuaXNCdWZmZXIoZGF0YSkpIGRhdGEgPSBuZXcgQnVmZmVyKGRhdGEpXG5cbiAgaWYoa2V5Lmxlbmd0aCA+IGJsb2Nrc2l6ZSkge1xuICAgIGtleSA9IGZuKGtleSlcbiAgfSBlbHNlIGlmKGtleS5sZW5ndGggPCBibG9ja3NpemUpIHtcbiAgICBrZXkgPSBCdWZmZXIuY29uY2F0KFtrZXksIHplcm9CdWZmZXJdLCBibG9ja3NpemUpXG4gIH1cblxuICB2YXIgaXBhZCA9IG5ldyBCdWZmZXIoYmxvY2tzaXplKSwgb3BhZCA9IG5ldyBCdWZmZXIoYmxvY2tzaXplKVxuICBmb3IodmFyIGkgPSAwOyBpIDwgYmxvY2tzaXplOyBpKyspIHtcbiAgICBpcGFkW2ldID0ga2V5W2ldIF4gMHgzNlxuICAgIG9wYWRbaV0gPSBrZXlbaV0gXiAweDVDXG4gIH1cblxuICB2YXIgaGFzaCA9IGZuKEJ1ZmZlci5jb25jYXQoW2lwYWQsIGRhdGFdKSlcbiAgcmV0dXJuIGZuKEJ1ZmZlci5jb25jYXQoW29wYWQsIGhhc2hdKSlcbn1cblxuZnVuY3Rpb24gaGFzaChhbGcsIGtleSkge1xuICBhbGcgPSBhbGcgfHwgJ3NoYTEnXG4gIHZhciBmbiA9IGFsZ29yaXRobXNbYWxnXVxuICB2YXIgYnVmcyA9IFtdXG4gIHZhciBsZW5ndGggPSAwXG4gIGlmKCFmbikgZXJyb3IoJ2FsZ29yaXRobTonLCBhbGcsICdpcyBub3QgeWV0IHN1cHBvcnRlZCcpXG4gIHJldHVybiB7XG4gICAgdXBkYXRlOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgaWYoIUJ1ZmZlci5pc0J1ZmZlcihkYXRhKSkgZGF0YSA9IG5ldyBCdWZmZXIoZGF0YSlcbiAgICAgICAgXG4gICAgICBidWZzLnB1c2goZGF0YSlcbiAgICAgIGxlbmd0aCArPSBkYXRhLmxlbmd0aFxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9LFxuICAgIGRpZ2VzdDogZnVuY3Rpb24gKGVuYykge1xuICAgICAgdmFyIGJ1ZiA9IEJ1ZmZlci5jb25jYXQoYnVmcylcbiAgICAgIHZhciByID0ga2V5ID8gaG1hYyhmbiwga2V5LCBidWYpIDogZm4oYnVmKVxuICAgICAgYnVmcyA9IG51bGxcbiAgICAgIHJldHVybiBlbmMgPyByLnRvU3RyaW5nKGVuYykgOiByXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGVycm9yICgpIHtcbiAgdmFyIG0gPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykuam9pbignICcpXG4gIHRocm93IG5ldyBFcnJvcihbXG4gICAgbSxcbiAgICAnd2UgYWNjZXB0IHB1bGwgcmVxdWVzdHMnLFxuICAgICdodHRwOi8vZ2l0aHViLmNvbS9kb21pbmljdGFyci9jcnlwdG8tYnJvd3NlcmlmeSdcbiAgICBdLmpvaW4oJ1xcbicpKVxufVxuXG5leHBvcnRzLmNyZWF0ZUhhc2ggPSBmdW5jdGlvbiAoYWxnKSB7IHJldHVybiBoYXNoKGFsZykgfVxuZXhwb3J0cy5jcmVhdGVIbWFjID0gZnVuY3Rpb24gKGFsZywga2V5KSB7IHJldHVybiBoYXNoKGFsZywga2V5KSB9XG5leHBvcnRzLnJhbmRvbUJ5dGVzID0gZnVuY3Rpb24oc2l6ZSwgY2FsbGJhY2spIHtcbiAgaWYgKGNhbGxiYWNrICYmIGNhbGxiYWNrLmNhbGwpIHtcbiAgICB0cnkge1xuICAgICAgY2FsbGJhY2suY2FsbCh0aGlzLCB1bmRlZmluZWQsIG5ldyBCdWZmZXIocm5nKHNpemUpKSlcbiAgICB9IGNhdGNoIChlcnIpIHsgY2FsbGJhY2soZXJyKSB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIocm5nKHNpemUpKVxuICB9XG59XG5cbmZ1bmN0aW9uIGVhY2goYSwgZikge1xuICBmb3IodmFyIGkgaW4gYSlcbiAgICBmKGFbaV0sIGkpXG59XG5cbi8vIHRoZSBsZWFzdCBJIGNhbiBkbyBpcyBtYWtlIGVycm9yIG1lc3NhZ2VzIGZvciB0aGUgcmVzdCBvZiB0aGUgbm9kZS5qcy9jcnlwdG8gYXBpLlxuZWFjaChbJ2NyZWF0ZUNyZWRlbnRpYWxzJ1xuLCAnY3JlYXRlQ2lwaGVyJ1xuLCAnY3JlYXRlQ2lwaGVyaXYnXG4sICdjcmVhdGVEZWNpcGhlcidcbiwgJ2NyZWF0ZURlY2lwaGVyaXYnXG4sICdjcmVhdGVTaWduJ1xuLCAnY3JlYXRlVmVyaWZ5J1xuLCAnY3JlYXRlRGlmZmllSGVsbG1hbidcbiwgJ3Bia2RmMiddLCBmdW5jdGlvbiAobmFtZSkge1xuICBleHBvcnRzW25hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgIGVycm9yKCdzb3JyeSwnLCBuYW1lLCAnaXMgbm90IGltcGxlbWVudGVkIHlldCcpXG4gIH1cbn0pXG4iLCIvKlxyXG4gKiBBIEphdmFTY3JpcHQgaW1wbGVtZW50YXRpb24gb2YgdGhlIFJTQSBEYXRhIFNlY3VyaXR5LCBJbmMuIE1ENSBNZXNzYWdlXHJcbiAqIERpZ2VzdCBBbGdvcml0aG0sIGFzIGRlZmluZWQgaW4gUkZDIDEzMjEuXHJcbiAqIFZlcnNpb24gMi4xIENvcHlyaWdodCAoQykgUGF1bCBKb2huc3RvbiAxOTk5IC0gMjAwMi5cclxuICogT3RoZXIgY29udHJpYnV0b3JzOiBHcmVnIEhvbHQsIEFuZHJldyBLZXBlcnQsIFlkbmFyLCBMb3N0aW5ldFxyXG4gKiBEaXN0cmlidXRlZCB1bmRlciB0aGUgQlNEIExpY2Vuc2VcclxuICogU2VlIGh0dHA6Ly9wYWpob21lLm9yZy51ay9jcnlwdC9tZDUgZm9yIG1vcmUgaW5mby5cclxuICovXHJcblxyXG52YXIgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xyXG5cclxuLypcclxuICogUGVyZm9ybSBhIHNpbXBsZSBzZWxmLXRlc3QgdG8gc2VlIGlmIHRoZSBWTSBpcyB3b3JraW5nXHJcbiAqL1xyXG5mdW5jdGlvbiBtZDVfdm1fdGVzdCgpXHJcbntcclxuICByZXR1cm4gaGV4X21kNShcImFiY1wiKSA9PSBcIjkwMDE1MDk4M2NkMjRmYjBkNjk2M2Y3ZDI4ZTE3ZjcyXCI7XHJcbn1cclxuXHJcbi8qXHJcbiAqIENhbGN1bGF0ZSB0aGUgTUQ1IG9mIGFuIGFycmF5IG9mIGxpdHRsZS1lbmRpYW4gd29yZHMsIGFuZCBhIGJpdCBsZW5ndGhcclxuICovXHJcbmZ1bmN0aW9uIGNvcmVfbWQ1KHgsIGxlbilcclxue1xyXG4gIC8qIGFwcGVuZCBwYWRkaW5nICovXHJcbiAgeFtsZW4gPj4gNV0gfD0gMHg4MCA8PCAoKGxlbikgJSAzMik7XHJcbiAgeFsoKChsZW4gKyA2NCkgPj4+IDkpIDw8IDQpICsgMTRdID0gbGVuO1xyXG5cclxuICB2YXIgYSA9ICAxNzMyNTg0MTkzO1xyXG4gIHZhciBiID0gLTI3MTczMzg3OTtcclxuICB2YXIgYyA9IC0xNzMyNTg0MTk0O1xyXG4gIHZhciBkID0gIDI3MTczMzg3ODtcclxuXHJcbiAgZm9yKHZhciBpID0gMDsgaSA8IHgubGVuZ3RoOyBpICs9IDE2KVxyXG4gIHtcclxuICAgIHZhciBvbGRhID0gYTtcclxuICAgIHZhciBvbGRiID0gYjtcclxuICAgIHZhciBvbGRjID0gYztcclxuICAgIHZhciBvbGRkID0gZDtcclxuXHJcbiAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSsgMF0sIDcgLCAtNjgwODc2OTM2KTtcclxuICAgIGQgPSBtZDVfZmYoZCwgYSwgYiwgYywgeFtpKyAxXSwgMTIsIC0zODk1NjQ1ODYpO1xyXG4gICAgYyA9IG1kNV9mZihjLCBkLCBhLCBiLCB4W2krIDJdLCAxNywgIDYwNjEwNTgxOSk7XHJcbiAgICBiID0gbWQ1X2ZmKGIsIGMsIGQsIGEsIHhbaSsgM10sIDIyLCAtMTA0NDUyNTMzMCk7XHJcbiAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSsgNF0sIDcgLCAtMTc2NDE4ODk3KTtcclxuICAgIGQgPSBtZDVfZmYoZCwgYSwgYiwgYywgeFtpKyA1XSwgMTIsICAxMjAwMDgwNDI2KTtcclxuICAgIGMgPSBtZDVfZmYoYywgZCwgYSwgYiwgeFtpKyA2XSwgMTcsIC0xNDczMjMxMzQxKTtcclxuICAgIGIgPSBtZDVfZmYoYiwgYywgZCwgYSwgeFtpKyA3XSwgMjIsIC00NTcwNTk4Myk7XHJcbiAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSsgOF0sIDcgLCAgMTc3MDAzNTQxNik7XHJcbiAgICBkID0gbWQ1X2ZmKGQsIGEsIGIsIGMsIHhbaSsgOV0sIDEyLCAtMTk1ODQxNDQxNyk7XHJcbiAgICBjID0gbWQ1X2ZmKGMsIGQsIGEsIGIsIHhbaSsxMF0sIDE3LCAtNDIwNjMpO1xyXG4gICAgYiA9IG1kNV9mZihiLCBjLCBkLCBhLCB4W2krMTFdLCAyMiwgLTE5OTA0MDQxNjIpO1xyXG4gICAgYSA9IG1kNV9mZihhLCBiLCBjLCBkLCB4W2krMTJdLCA3ICwgIDE4MDQ2MDM2ODIpO1xyXG4gICAgZCA9IG1kNV9mZihkLCBhLCBiLCBjLCB4W2krMTNdLCAxMiwgLTQwMzQxMTAxKTtcclxuICAgIGMgPSBtZDVfZmYoYywgZCwgYSwgYiwgeFtpKzE0XSwgMTcsIC0xNTAyMDAyMjkwKTtcclxuICAgIGIgPSBtZDVfZmYoYiwgYywgZCwgYSwgeFtpKzE1XSwgMjIsICAxMjM2NTM1MzI5KTtcclxuXHJcbiAgICBhID0gbWQ1X2dnKGEsIGIsIGMsIGQsIHhbaSsgMV0sIDUgLCAtMTY1Nzk2NTEwKTtcclxuICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpKyA2XSwgOSAsIC0xMDY5NTAxNjMyKTtcclxuICAgIGMgPSBtZDVfZ2coYywgZCwgYSwgYiwgeFtpKzExXSwgMTQsICA2NDM3MTc3MTMpO1xyXG4gICAgYiA9IG1kNV9nZyhiLCBjLCBkLCBhLCB4W2krIDBdLCAyMCwgLTM3Mzg5NzMwMik7XHJcbiAgICBhID0gbWQ1X2dnKGEsIGIsIGMsIGQsIHhbaSsgNV0sIDUgLCAtNzAxNTU4NjkxKTtcclxuICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpKzEwXSwgOSAsICAzODAxNjA4Myk7XHJcbiAgICBjID0gbWQ1X2dnKGMsIGQsIGEsIGIsIHhbaSsxNV0sIDE0LCAtNjYwNDc4MzM1KTtcclxuICAgIGIgPSBtZDVfZ2coYiwgYywgZCwgYSwgeFtpKyA0XSwgMjAsIC00MDU1Mzc4NDgpO1xyXG4gICAgYSA9IG1kNV9nZyhhLCBiLCBjLCBkLCB4W2krIDldLCA1ICwgIDU2ODQ0NjQzOCk7XHJcbiAgICBkID0gbWQ1X2dnKGQsIGEsIGIsIGMsIHhbaSsxNF0sIDkgLCAtMTAxOTgwMzY5MCk7XHJcbiAgICBjID0gbWQ1X2dnKGMsIGQsIGEsIGIsIHhbaSsgM10sIDE0LCAtMTg3MzYzOTYxKTtcclxuICAgIGIgPSBtZDVfZ2coYiwgYywgZCwgYSwgeFtpKyA4XSwgMjAsICAxMTYzNTMxNTAxKTtcclxuICAgIGEgPSBtZDVfZ2coYSwgYiwgYywgZCwgeFtpKzEzXSwgNSAsIC0xNDQ0NjgxNDY3KTtcclxuICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpKyAyXSwgOSAsIC01MTQwMzc4NCk7XHJcbiAgICBjID0gbWQ1X2dnKGMsIGQsIGEsIGIsIHhbaSsgN10sIDE0LCAgMTczNTMyODQ3Myk7XHJcbiAgICBiID0gbWQ1X2dnKGIsIGMsIGQsIGEsIHhbaSsxMl0sIDIwLCAtMTkyNjYwNzczNCk7XHJcblxyXG4gICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2krIDVdLCA0ICwgLTM3ODU1OCk7XHJcbiAgICBkID0gbWQ1X2hoKGQsIGEsIGIsIGMsIHhbaSsgOF0sIDExLCAtMjAyMjU3NDQ2Myk7XHJcbiAgICBjID0gbWQ1X2hoKGMsIGQsIGEsIGIsIHhbaSsxMV0sIDE2LCAgMTgzOTAzMDU2Mik7XHJcbiAgICBiID0gbWQ1X2hoKGIsIGMsIGQsIGEsIHhbaSsxNF0sIDIzLCAtMzUzMDk1NTYpO1xyXG4gICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2krIDFdLCA0ICwgLTE1MzA5OTIwNjApO1xyXG4gICAgZCA9IG1kNV9oaChkLCBhLCBiLCBjLCB4W2krIDRdLCAxMSwgIDEyNzI4OTMzNTMpO1xyXG4gICAgYyA9IG1kNV9oaChjLCBkLCBhLCBiLCB4W2krIDddLCAxNiwgLTE1NTQ5NzYzMik7XHJcbiAgICBiID0gbWQ1X2hoKGIsIGMsIGQsIGEsIHhbaSsxMF0sIDIzLCAtMTA5NDczMDY0MCk7XHJcbiAgICBhID0gbWQ1X2hoKGEsIGIsIGMsIGQsIHhbaSsxM10sIDQgLCAgNjgxMjc5MTc0KTtcclxuICAgIGQgPSBtZDVfaGgoZCwgYSwgYiwgYywgeFtpKyAwXSwgMTEsIC0zNTg1MzcyMjIpO1xyXG4gICAgYyA9IG1kNV9oaChjLCBkLCBhLCBiLCB4W2krIDNdLCAxNiwgLTcyMjUyMTk3OSk7XHJcbiAgICBiID0gbWQ1X2hoKGIsIGMsIGQsIGEsIHhbaSsgNl0sIDIzLCAgNzYwMjkxODkpO1xyXG4gICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2krIDldLCA0ICwgLTY0MDM2NDQ4Nyk7XHJcbiAgICBkID0gbWQ1X2hoKGQsIGEsIGIsIGMsIHhbaSsxMl0sIDExLCAtNDIxODE1ODM1KTtcclxuICAgIGMgPSBtZDVfaGgoYywgZCwgYSwgYiwgeFtpKzE1XSwgMTYsICA1MzA3NDI1MjApO1xyXG4gICAgYiA9IG1kNV9oaChiLCBjLCBkLCBhLCB4W2krIDJdLCAyMywgLTk5NTMzODY1MSk7XHJcblxyXG4gICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2krIDBdLCA2ICwgLTE5ODYzMDg0NCk7XHJcbiAgICBkID0gbWQ1X2lpKGQsIGEsIGIsIGMsIHhbaSsgN10sIDEwLCAgMTEyNjg5MTQxNSk7XHJcbiAgICBjID0gbWQ1X2lpKGMsIGQsIGEsIGIsIHhbaSsxNF0sIDE1LCAtMTQxNjM1NDkwNSk7XHJcbiAgICBiID0gbWQ1X2lpKGIsIGMsIGQsIGEsIHhbaSsgNV0sIDIxLCAtNTc0MzQwNTUpO1xyXG4gICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2krMTJdLCA2ICwgIDE3MDA0ODU1NzEpO1xyXG4gICAgZCA9IG1kNV9paShkLCBhLCBiLCBjLCB4W2krIDNdLCAxMCwgLTE4OTQ5ODY2MDYpO1xyXG4gICAgYyA9IG1kNV9paShjLCBkLCBhLCBiLCB4W2krMTBdLCAxNSwgLTEwNTE1MjMpO1xyXG4gICAgYiA9IG1kNV9paShiLCBjLCBkLCBhLCB4W2krIDFdLCAyMSwgLTIwNTQ5MjI3OTkpO1xyXG4gICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2krIDhdLCA2ICwgIDE4NzMzMTMzNTkpO1xyXG4gICAgZCA9IG1kNV9paShkLCBhLCBiLCBjLCB4W2krMTVdLCAxMCwgLTMwNjExNzQ0KTtcclxuICAgIGMgPSBtZDVfaWkoYywgZCwgYSwgYiwgeFtpKyA2XSwgMTUsIC0xNTYwMTk4MzgwKTtcclxuICAgIGIgPSBtZDVfaWkoYiwgYywgZCwgYSwgeFtpKzEzXSwgMjEsICAxMzA5MTUxNjQ5KTtcclxuICAgIGEgPSBtZDVfaWkoYSwgYiwgYywgZCwgeFtpKyA0XSwgNiAsIC0xNDU1MjMwNzApO1xyXG4gICAgZCA9IG1kNV9paShkLCBhLCBiLCBjLCB4W2krMTFdLCAxMCwgLTExMjAyMTAzNzkpO1xyXG4gICAgYyA9IG1kNV9paShjLCBkLCBhLCBiLCB4W2krIDJdLCAxNSwgIDcxODc4NzI1OSk7XHJcbiAgICBiID0gbWQ1X2lpKGIsIGMsIGQsIGEsIHhbaSsgOV0sIDIxLCAtMzQzNDg1NTUxKTtcclxuXHJcbiAgICBhID0gc2FmZV9hZGQoYSwgb2xkYSk7XHJcbiAgICBiID0gc2FmZV9hZGQoYiwgb2xkYik7XHJcbiAgICBjID0gc2FmZV9hZGQoYywgb2xkYyk7XHJcbiAgICBkID0gc2FmZV9hZGQoZCwgb2xkZCk7XHJcbiAgfVxyXG4gIHJldHVybiBBcnJheShhLCBiLCBjLCBkKTtcclxuXHJcbn1cclxuXHJcbi8qXHJcbiAqIFRoZXNlIGZ1bmN0aW9ucyBpbXBsZW1lbnQgdGhlIGZvdXIgYmFzaWMgb3BlcmF0aW9ucyB0aGUgYWxnb3JpdGhtIHVzZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBtZDVfY21uKHEsIGEsIGIsIHgsIHMsIHQpXHJcbntcclxuICByZXR1cm4gc2FmZV9hZGQoYml0X3JvbChzYWZlX2FkZChzYWZlX2FkZChhLCBxKSwgc2FmZV9hZGQoeCwgdCkpLCBzKSxiKTtcclxufVxyXG5mdW5jdGlvbiBtZDVfZmYoYSwgYiwgYywgZCwgeCwgcywgdClcclxue1xyXG4gIHJldHVybiBtZDVfY21uKChiICYgYykgfCAoKH5iKSAmIGQpLCBhLCBiLCB4LCBzLCB0KTtcclxufVxyXG5mdW5jdGlvbiBtZDVfZ2coYSwgYiwgYywgZCwgeCwgcywgdClcclxue1xyXG4gIHJldHVybiBtZDVfY21uKChiICYgZCkgfCAoYyAmICh+ZCkpLCBhLCBiLCB4LCBzLCB0KTtcclxufVxyXG5mdW5jdGlvbiBtZDVfaGgoYSwgYiwgYywgZCwgeCwgcywgdClcclxue1xyXG4gIHJldHVybiBtZDVfY21uKGIgXiBjIF4gZCwgYSwgYiwgeCwgcywgdCk7XHJcbn1cclxuZnVuY3Rpb24gbWQ1X2lpKGEsIGIsIGMsIGQsIHgsIHMsIHQpXHJcbntcclxuICByZXR1cm4gbWQ1X2NtbihjIF4gKGIgfCAofmQpKSwgYSwgYiwgeCwgcywgdCk7XHJcbn1cclxuXHJcbi8qXHJcbiAqIEFkZCBpbnRlZ2Vycywgd3JhcHBpbmcgYXQgMl4zMi4gVGhpcyB1c2VzIDE2LWJpdCBvcGVyYXRpb25zIGludGVybmFsbHlcclxuICogdG8gd29yayBhcm91bmQgYnVncyBpbiBzb21lIEpTIGludGVycHJldGVycy5cclxuICovXHJcbmZ1bmN0aW9uIHNhZmVfYWRkKHgsIHkpXHJcbntcclxuICB2YXIgbHN3ID0gKHggJiAweEZGRkYpICsgKHkgJiAweEZGRkYpO1xyXG4gIHZhciBtc3cgPSAoeCA+PiAxNikgKyAoeSA+PiAxNikgKyAobHN3ID4+IDE2KTtcclxuICByZXR1cm4gKG1zdyA8PCAxNikgfCAobHN3ICYgMHhGRkZGKTtcclxufVxyXG5cclxuLypcclxuICogQml0d2lzZSByb3RhdGUgYSAzMi1iaXQgbnVtYmVyIHRvIHRoZSBsZWZ0LlxyXG4gKi9cclxuZnVuY3Rpb24gYml0X3JvbChudW0sIGNudClcclxue1xyXG4gIHJldHVybiAobnVtIDw8IGNudCkgfCAobnVtID4+PiAoMzIgLSBjbnQpKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBtZDUoYnVmKSB7XHJcbiAgcmV0dXJuIGhlbHBlcnMuaGFzaChidWYsIGNvcmVfbWQ1LCAxNik7XHJcbn07XHJcbiIsIi8vIE9yaWdpbmFsIGNvZGUgYWRhcHRlZCBmcm9tIFJvYmVydCBLaWVmZmVyLlxuLy8gZGV0YWlscyBhdCBodHRwczovL2dpdGh1Yi5jb20vYnJvb2ZhL25vZGUtdXVpZFxuKGZ1bmN0aW9uKCkge1xuICB2YXIgX2dsb2JhbCA9IHRoaXM7XG5cbiAgdmFyIG1hdGhSTkcsIHdoYXR3Z1JORztcblxuICAvLyBOT1RFOiBNYXRoLnJhbmRvbSgpIGRvZXMgbm90IGd1YXJhbnRlZSBcImNyeXB0b2dyYXBoaWMgcXVhbGl0eVwiXG4gIG1hdGhSTkcgPSBmdW5jdGlvbihzaXplKSB7XG4gICAgdmFyIGJ5dGVzID0gbmV3IEFycmF5KHNpemUpO1xuICAgIHZhciByO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIHI7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgIGlmICgoaSAmIDB4MDMpID09IDApIHIgPSBNYXRoLnJhbmRvbSgpICogMHgxMDAwMDAwMDA7XG4gICAgICBieXRlc1tpXSA9IHIgPj4+ICgoaSAmIDB4MDMpIDw8IDMpICYgMHhmZjtcbiAgICB9XG5cbiAgICByZXR1cm4gYnl0ZXM7XG4gIH1cblxuICBpZiAoX2dsb2JhbC5jcnlwdG8gJiYgY3J5cHRvLmdldFJhbmRvbVZhbHVlcykge1xuICAgIHdoYXR3Z1JORyA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgICAgIHZhciBieXRlcyA9IG5ldyBVaW50OEFycmF5KHNpemUpO1xuICAgICAgY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhieXRlcyk7XG4gICAgICByZXR1cm4gYnl0ZXM7XG4gICAgfVxuICB9XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSB3aGF0d2dSTkcgfHwgbWF0aFJORztcblxufSgpKVxuIiwiLypcbiAqIEEgSmF2YVNjcmlwdCBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgU2VjdXJlIEhhc2ggQWxnb3JpdGhtLCBTSEEtMSwgYXMgZGVmaW5lZFxuICogaW4gRklQUyBQVUIgMTgwLTFcbiAqIFZlcnNpb24gMi4xYSBDb3B5cmlnaHQgUGF1bCBKb2huc3RvbiAyMDAwIC0gMjAwMi5cbiAqIE90aGVyIGNvbnRyaWJ1dG9yczogR3JlZyBIb2x0LCBBbmRyZXcgS2VwZXJ0LCBZZG5hciwgTG9zdGluZXRcbiAqIERpc3RyaWJ1dGVkIHVuZGVyIHRoZSBCU0QgTGljZW5zZVxuICogU2VlIGh0dHA6Ly9wYWpob21lLm9yZy51ay9jcnlwdC9tZDUgZm9yIGRldGFpbHMuXG4gKi9cblxudmFyIGhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKTtcblxuLypcbiAqIENhbGN1bGF0ZSB0aGUgU0hBLTEgb2YgYW4gYXJyYXkgb2YgYmlnLWVuZGlhbiB3b3JkcywgYW5kIGEgYml0IGxlbmd0aFxuICovXG5mdW5jdGlvbiBjb3JlX3NoYTEoeCwgbGVuKVxue1xuICAvKiBhcHBlbmQgcGFkZGluZyAqL1xuICB4W2xlbiA+PiA1XSB8PSAweDgwIDw8ICgyNCAtIGxlbiAlIDMyKTtcbiAgeFsoKGxlbiArIDY0ID4+IDkpIDw8IDQpICsgMTVdID0gbGVuO1xuXG4gIHZhciB3ID0gQXJyYXkoODApO1xuICB2YXIgYSA9ICAxNzMyNTg0MTkzO1xuICB2YXIgYiA9IC0yNzE3MzM4Nzk7XG4gIHZhciBjID0gLTE3MzI1ODQxOTQ7XG4gIHZhciBkID0gIDI3MTczMzg3ODtcbiAgdmFyIGUgPSAtMTAwOTU4OTc3NjtcblxuICBmb3IodmFyIGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkgKz0gMTYpXG4gIHtcbiAgICB2YXIgb2xkYSA9IGE7XG4gICAgdmFyIG9sZGIgPSBiO1xuICAgIHZhciBvbGRjID0gYztcbiAgICB2YXIgb2xkZCA9IGQ7XG4gICAgdmFyIG9sZGUgPSBlO1xuXG4gICAgZm9yKHZhciBqID0gMDsgaiA8IDgwOyBqKyspXG4gICAge1xuICAgICAgaWYoaiA8IDE2KSB3W2pdID0geFtpICsgal07XG4gICAgICBlbHNlIHdbal0gPSByb2wod1tqLTNdIF4gd1tqLThdIF4gd1tqLTE0XSBeIHdbai0xNl0sIDEpO1xuICAgICAgdmFyIHQgPSBzYWZlX2FkZChzYWZlX2FkZChyb2woYSwgNSksIHNoYTFfZnQoaiwgYiwgYywgZCkpLFxuICAgICAgICAgICAgICAgICAgICAgICBzYWZlX2FkZChzYWZlX2FkZChlLCB3W2pdKSwgc2hhMV9rdChqKSkpO1xuICAgICAgZSA9IGQ7XG4gICAgICBkID0gYztcbiAgICAgIGMgPSByb2woYiwgMzApO1xuICAgICAgYiA9IGE7XG4gICAgICBhID0gdDtcbiAgICB9XG5cbiAgICBhID0gc2FmZV9hZGQoYSwgb2xkYSk7XG4gICAgYiA9IHNhZmVfYWRkKGIsIG9sZGIpO1xuICAgIGMgPSBzYWZlX2FkZChjLCBvbGRjKTtcbiAgICBkID0gc2FmZV9hZGQoZCwgb2xkZCk7XG4gICAgZSA9IHNhZmVfYWRkKGUsIG9sZGUpO1xuICB9XG4gIHJldHVybiBBcnJheShhLCBiLCBjLCBkLCBlKTtcblxufVxuXG4vKlxuICogUGVyZm9ybSB0aGUgYXBwcm9wcmlhdGUgdHJpcGxldCBjb21iaW5hdGlvbiBmdW5jdGlvbiBmb3IgdGhlIGN1cnJlbnRcbiAqIGl0ZXJhdGlvblxuICovXG5mdW5jdGlvbiBzaGExX2Z0KHQsIGIsIGMsIGQpXG57XG4gIGlmKHQgPCAyMCkgcmV0dXJuIChiICYgYykgfCAoKH5iKSAmIGQpO1xuICBpZih0IDwgNDApIHJldHVybiBiIF4gYyBeIGQ7XG4gIGlmKHQgPCA2MCkgcmV0dXJuIChiICYgYykgfCAoYiAmIGQpIHwgKGMgJiBkKTtcbiAgcmV0dXJuIGIgXiBjIF4gZDtcbn1cblxuLypcbiAqIERldGVybWluZSB0aGUgYXBwcm9wcmlhdGUgYWRkaXRpdmUgY29uc3RhbnQgZm9yIHRoZSBjdXJyZW50IGl0ZXJhdGlvblxuICovXG5mdW5jdGlvbiBzaGExX2t0KHQpXG57XG4gIHJldHVybiAodCA8IDIwKSA/ICAxNTE4NTAwMjQ5IDogKHQgPCA0MCkgPyAgMTg1OTc3NTM5MyA6XG4gICAgICAgICAodCA8IDYwKSA/IC0xODk0MDA3NTg4IDogLTg5OTQ5NzUxNDtcbn1cblxuLypcbiAqIEFkZCBpbnRlZ2Vycywgd3JhcHBpbmcgYXQgMl4zMi4gVGhpcyB1c2VzIDE2LWJpdCBvcGVyYXRpb25zIGludGVybmFsbHlcbiAqIHRvIHdvcmsgYXJvdW5kIGJ1Z3MgaW4gc29tZSBKUyBpbnRlcnByZXRlcnMuXG4gKi9cbmZ1bmN0aW9uIHNhZmVfYWRkKHgsIHkpXG57XG4gIHZhciBsc3cgPSAoeCAmIDB4RkZGRikgKyAoeSAmIDB4RkZGRik7XG4gIHZhciBtc3cgPSAoeCA+PiAxNikgKyAoeSA+PiAxNikgKyAobHN3ID4+IDE2KTtcbiAgcmV0dXJuIChtc3cgPDwgMTYpIHwgKGxzdyAmIDB4RkZGRik7XG59XG5cbi8qXG4gKiBCaXR3aXNlIHJvdGF0ZSBhIDMyLWJpdCBudW1iZXIgdG8gdGhlIGxlZnQuXG4gKi9cbmZ1bmN0aW9uIHJvbChudW0sIGNudClcbntcbiAgcmV0dXJuIChudW0gPDwgY250KSB8IChudW0gPj4+ICgzMiAtIGNudCkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNoYTEoYnVmKSB7XG4gIHJldHVybiBoZWxwZXJzLmhhc2goYnVmLCBjb3JlX3NoYTEsIDIwLCB0cnVlKTtcbn07XG4iLCJcbi8qKlxuICogQSBKYXZhU2NyaXB0IGltcGxlbWVudGF0aW9uIG9mIHRoZSBTZWN1cmUgSGFzaCBBbGdvcml0aG0sIFNIQS0yNTYsIGFzIGRlZmluZWRcbiAqIGluIEZJUFMgMTgwLTJcbiAqIFZlcnNpb24gMi4yLWJldGEgQ29weXJpZ2h0IEFuZ2VsIE1hcmluLCBQYXVsIEpvaG5zdG9uIDIwMDAgLSAyMDA5LlxuICogT3RoZXIgY29udHJpYnV0b3JzOiBHcmVnIEhvbHQsIEFuZHJldyBLZXBlcnQsIFlkbmFyLCBMb3N0aW5ldFxuICpcbiAqL1xuXG52YXIgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xuXG52YXIgc2FmZV9hZGQgPSBmdW5jdGlvbih4LCB5KSB7XG4gIHZhciBsc3cgPSAoeCAmIDB4RkZGRikgKyAoeSAmIDB4RkZGRik7XG4gIHZhciBtc3cgPSAoeCA+PiAxNikgKyAoeSA+PiAxNikgKyAobHN3ID4+IDE2KTtcbiAgcmV0dXJuIChtc3cgPDwgMTYpIHwgKGxzdyAmIDB4RkZGRik7XG59O1xuXG52YXIgUyA9IGZ1bmN0aW9uKFgsIG4pIHtcbiAgcmV0dXJuIChYID4+PiBuKSB8IChYIDw8ICgzMiAtIG4pKTtcbn07XG5cbnZhciBSID0gZnVuY3Rpb24oWCwgbikge1xuICByZXR1cm4gKFggPj4+IG4pO1xufTtcblxudmFyIENoID0gZnVuY3Rpb24oeCwgeSwgeikge1xuICByZXR1cm4gKCh4ICYgeSkgXiAoKH54KSAmIHopKTtcbn07XG5cbnZhciBNYWogPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gIHJldHVybiAoKHggJiB5KSBeICh4ICYgeikgXiAoeSAmIHopKTtcbn07XG5cbnZhciBTaWdtYTAyNTYgPSBmdW5jdGlvbih4KSB7XG4gIHJldHVybiAoUyh4LCAyKSBeIFMoeCwgMTMpIF4gUyh4LCAyMikpO1xufTtcblxudmFyIFNpZ21hMTI1NiA9IGZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIChTKHgsIDYpIF4gUyh4LCAxMSkgXiBTKHgsIDI1KSk7XG59O1xuXG52YXIgR2FtbWEwMjU2ID0gZnVuY3Rpb24oeCkge1xuICByZXR1cm4gKFMoeCwgNykgXiBTKHgsIDE4KSBeIFIoeCwgMykpO1xufTtcblxudmFyIEdhbW1hMTI1NiA9IGZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIChTKHgsIDE3KSBeIFMoeCwgMTkpIF4gUih4LCAxMCkpO1xufTtcblxudmFyIGNvcmVfc2hhMjU2ID0gZnVuY3Rpb24obSwgbCkge1xuICB2YXIgSyA9IG5ldyBBcnJheSgweDQyOEEyRjk4LDB4NzEzNzQ0OTEsMHhCNUMwRkJDRiwweEU5QjVEQkE1LDB4Mzk1NkMyNUIsMHg1OUYxMTFGMSwweDkyM0Y4MkE0LDB4QUIxQzVFRDUsMHhEODA3QUE5OCwweDEyODM1QjAxLDB4MjQzMTg1QkUsMHg1NTBDN0RDMywweDcyQkU1RDc0LDB4ODBERUIxRkUsMHg5QkRDMDZBNywweEMxOUJGMTc0LDB4RTQ5QjY5QzEsMHhFRkJFNDc4NiwweEZDMTlEQzYsMHgyNDBDQTFDQywweDJERTkyQzZGLDB4NEE3NDg0QUEsMHg1Q0IwQTlEQywweDc2Rjk4OERBLDB4OTgzRTUxNTIsMHhBODMxQzY2RCwweEIwMDMyN0M4LDB4QkY1OTdGQzcsMHhDNkUwMEJGMywweEQ1QTc5MTQ3LDB4NkNBNjM1MSwweDE0MjkyOTY3LDB4MjdCNzBBODUsMHgyRTFCMjEzOCwweDREMkM2REZDLDB4NTMzODBEMTMsMHg2NTBBNzM1NCwweDc2NkEwQUJCLDB4ODFDMkM5MkUsMHg5MjcyMkM4NSwweEEyQkZFOEExLDB4QTgxQTY2NEIsMHhDMjRCOEI3MCwweEM3NkM1MUEzLDB4RDE5MkU4MTksMHhENjk5MDYyNCwweEY0MEUzNTg1LDB4MTA2QUEwNzAsMHgxOUE0QzExNiwweDFFMzc2QzA4LDB4Mjc0ODc3NEMsMHgzNEIwQkNCNSwweDM5MUMwQ0IzLDB4NEVEOEFBNEEsMHg1QjlDQ0E0RiwweDY4MkU2RkYzLDB4NzQ4RjgyRUUsMHg3OEE1NjM2RiwweDg0Qzg3ODE0LDB4OENDNzAyMDgsMHg5MEJFRkZGQSwweEE0NTA2Q0VCLDB4QkVGOUEzRjcsMHhDNjcxNzhGMik7XG4gIHZhciBIQVNIID0gbmV3IEFycmF5KDB4NkEwOUU2NjcsIDB4QkI2N0FFODUsIDB4M0M2RUYzNzIsIDB4QTU0RkY1M0EsIDB4NTEwRTUyN0YsIDB4OUIwNTY4OEMsIDB4MUY4M0Q5QUIsIDB4NUJFMENEMTkpO1xuICAgIHZhciBXID0gbmV3IEFycmF5KDY0KTtcbiAgICB2YXIgYSwgYiwgYywgZCwgZSwgZiwgZywgaCwgaSwgajtcbiAgICB2YXIgVDEsIFQyO1xuICAvKiBhcHBlbmQgcGFkZGluZyAqL1xuICBtW2wgPj4gNV0gfD0gMHg4MCA8PCAoMjQgLSBsICUgMzIpO1xuICBtWygobCArIDY0ID4+IDkpIDw8IDQpICsgMTVdID0gbDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtLmxlbmd0aDsgaSArPSAxNikge1xuICAgIGEgPSBIQVNIWzBdOyBiID0gSEFTSFsxXTsgYyA9IEhBU0hbMl07IGQgPSBIQVNIWzNdOyBlID0gSEFTSFs0XTsgZiA9IEhBU0hbNV07IGcgPSBIQVNIWzZdOyBoID0gSEFTSFs3XTtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IDY0OyBqKyspIHtcbiAgICAgIGlmIChqIDwgMTYpIHtcbiAgICAgICAgV1tqXSA9IG1baiArIGldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgV1tqXSA9IHNhZmVfYWRkKHNhZmVfYWRkKHNhZmVfYWRkKEdhbW1hMTI1NihXW2ogLSAyXSksIFdbaiAtIDddKSwgR2FtbWEwMjU2KFdbaiAtIDE1XSkpLCBXW2ogLSAxNl0pO1xuICAgICAgfVxuICAgICAgVDEgPSBzYWZlX2FkZChzYWZlX2FkZChzYWZlX2FkZChzYWZlX2FkZChoLCBTaWdtYTEyNTYoZSkpLCBDaChlLCBmLCBnKSksIEtbal0pLCBXW2pdKTtcbiAgICAgIFQyID0gc2FmZV9hZGQoU2lnbWEwMjU2KGEpLCBNYWooYSwgYiwgYykpO1xuICAgICAgaCA9IGc7IGcgPSBmOyBmID0gZTsgZSA9IHNhZmVfYWRkKGQsIFQxKTsgZCA9IGM7IGMgPSBiOyBiID0gYTsgYSA9IHNhZmVfYWRkKFQxLCBUMik7XG4gICAgfVxuICAgIEhBU0hbMF0gPSBzYWZlX2FkZChhLCBIQVNIWzBdKTsgSEFTSFsxXSA9IHNhZmVfYWRkKGIsIEhBU0hbMV0pOyBIQVNIWzJdID0gc2FmZV9hZGQoYywgSEFTSFsyXSk7IEhBU0hbM10gPSBzYWZlX2FkZChkLCBIQVNIWzNdKTtcbiAgICBIQVNIWzRdID0gc2FmZV9hZGQoZSwgSEFTSFs0XSk7IEhBU0hbNV0gPSBzYWZlX2FkZChmLCBIQVNIWzVdKTsgSEFTSFs2XSA9IHNhZmVfYWRkKGcsIEhBU0hbNl0pOyBIQVNIWzddID0gc2FmZV9hZGQoaCwgSEFTSFs3XSk7XG4gIH1cbiAgcmV0dXJuIEhBU0g7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNoYTI1NihidWYpIHtcbiAgcmV0dXJuIGhlbHBlcnMuaGFzaChidWYsIGNvcmVfc2hhMjU2LCAzMiwgdHJ1ZSk7XG59O1xuIixudWxsLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgaWYgKGV2LnNvdXJjZSA9PT0gd2luZG93ICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsInZhciBTdHJlYW0gPSByZXF1aXJlKCdzdHJlYW0nKTtcbnZhciBzb2NranMgPSByZXF1aXJlKCdzb2NranMtY2xpZW50Jyk7XG52YXIgcmVzb2x2ZSA9IHJlcXVpcmUoJ3VybCcpLnJlc29sdmU7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHUsIGNiKSB7XG4gICAgdmFyIHVyaSA9IHJlc29sdmUod2luZG93LmxvY2F0aW9uLmhyZWYsIHUpO1xuICAgIFxuICAgIHZhciBzdHJlYW0gPSBuZXcgU3RyZWFtO1xuICAgIHN0cmVhbS5yZWFkYWJsZSA9IHRydWU7XG4gICAgc3RyZWFtLndyaXRhYmxlID0gdHJ1ZTtcbiAgICBcbiAgICB2YXIgcmVhZHkgPSBmYWxzZTtcbiAgICB2YXIgYnVmZmVyID0gW107XG4gICAgXG4gICAgdmFyIHNvY2sgPSBzb2NranModXJpKTtcbiAgICBzdHJlYW0uc29jayA9IHNvY2s7XG4gICAgXG4gICAgc3RyZWFtLndyaXRlID0gZnVuY3Rpb24gKG1zZykge1xuICAgICAgICBpZiAoIXJlYWR5IHx8IGJ1ZmZlci5sZW5ndGgpIGJ1ZmZlci5wdXNoKG1zZylcbiAgICAgICAgZWxzZSBzb2NrLnNlbmQobXNnKVxuICAgIH07XG4gICAgXG4gICAgc3RyZWFtLmVuZCA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgICAgaWYgKG1zZyAhPT0gdW5kZWZpbmVkKSBzdHJlYW0ud3JpdGUobXNnKTtcbiAgICAgICAgaWYgKCFyZWFkeSkge1xuICAgICAgICAgICAgc3RyZWFtLl9lbmRlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3RyZWFtLndyaXRhYmxlID0gZmFsc2U7XG4gICAgICAgIHNvY2suY2xvc2UoKTtcbiAgICB9O1xuICAgIFxuICAgIHN0cmVhbS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzdHJlYW0uX2VuZGVkID0gdHJ1ZTtcbiAgICAgICAgc3RyZWFtLndyaXRhYmxlID0gc3RyZWFtLnJlYWRhYmxlID0gZmFsc2U7XG4gICAgICAgIGJ1ZmZlci5sZW5ndGggPSAwXG4gICAgICAgIHNvY2suY2xvc2UoKTtcbiAgICB9O1xuICAgIFxuICAgIHNvY2sub25vcGVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSBjYigpO1xuICAgICAgICByZWFkeSA9IHRydWU7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnVmZmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzb2NrLnNlbmQoYnVmZmVyW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBidWZmZXIgPSBbXTtcbiAgICAgICAgc3RyZWFtLmVtaXQoJ2Nvbm5lY3QnKTtcbiAgICAgICAgaWYgKHN0cmVhbS5fZW5kZWQpIHN0cmVhbS5lbmQoKTtcbiAgICB9O1xuICAgIFxuICAgIHNvY2sub25tZXNzYWdlID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgc3RyZWFtLmVtaXQoJ2RhdGEnLCBlLmRhdGEpO1xuICAgIH07XG4gICAgXG4gICAgc29jay5vbmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzdHJlYW0uZW1pdCgnZW5kJyk7XG4gICAgICAgIHN0cmVhbS53cml0YWJsZSA9IGZhbHNlO1xuICAgICAgICBzdHJlYW0ucmVhZGFibGUgPSBmYWxzZTtcbiAgICB9O1xuICAgIFxuICAgIHJldHVybiBzdHJlYW07XG59O1xuIiwiLyogU29ja0pTIGNsaWVudCwgdmVyc2lvbiAwLjMuMS43LmdhNjdmLmRpcnR5LCBodHRwOi8vc29ja2pzLm9yZywgTUlUIExpY2Vuc2VcblxuQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS5cbiovXG5cbi8vIEpTT04yIGJ5IERvdWdsYXMgQ3JvY2tmb3JkIChtaW5pZmllZCkuXG52YXIgSlNPTjtKU09OfHwoSlNPTj17fSksZnVuY3Rpb24oKXtmdW5jdGlvbiBzdHIoYSxiKXt2YXIgYyxkLGUsZixnPWdhcCxoLGk9YlthXTtpJiZ0eXBlb2YgaT09XCJvYmplY3RcIiYmdHlwZW9mIGkudG9KU09OPT1cImZ1bmN0aW9uXCImJihpPWkudG9KU09OKGEpKSx0eXBlb2YgcmVwPT1cImZ1bmN0aW9uXCImJihpPXJlcC5jYWxsKGIsYSxpKSk7c3dpdGNoKHR5cGVvZiBpKXtjYXNlXCJzdHJpbmdcIjpyZXR1cm4gcXVvdGUoaSk7Y2FzZVwibnVtYmVyXCI6cmV0dXJuIGlzRmluaXRlKGkpP1N0cmluZyhpKTpcIm51bGxcIjtjYXNlXCJib29sZWFuXCI6Y2FzZVwibnVsbFwiOnJldHVybiBTdHJpbmcoaSk7Y2FzZVwib2JqZWN0XCI6aWYoIWkpcmV0dXJuXCJudWxsXCI7Z2FwKz1pbmRlbnQsaD1bXTtpZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KGkpPT09XCJbb2JqZWN0IEFycmF5XVwiKXtmPWkubGVuZ3RoO2ZvcihjPTA7YzxmO2MrPTEpaFtjXT1zdHIoYyxpKXx8XCJudWxsXCI7ZT1oLmxlbmd0aD09PTA/XCJbXVwiOmdhcD9cIltcXG5cIitnYXAraC5qb2luKFwiLFxcblwiK2dhcCkrXCJcXG5cIitnK1wiXVwiOlwiW1wiK2guam9pbihcIixcIikrXCJdXCIsZ2FwPWc7cmV0dXJuIGV9aWYocmVwJiZ0eXBlb2YgcmVwPT1cIm9iamVjdFwiKXtmPXJlcC5sZW5ndGg7Zm9yKGM9MDtjPGY7Yys9MSl0eXBlb2YgcmVwW2NdPT1cInN0cmluZ1wiJiYoZD1yZXBbY10sZT1zdHIoZCxpKSxlJiZoLnB1c2gocXVvdGUoZCkrKGdhcD9cIjogXCI6XCI6XCIpK2UpKX1lbHNlIGZvcihkIGluIGkpT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGksZCkmJihlPXN0cihkLGkpLGUmJmgucHVzaChxdW90ZShkKSsoZ2FwP1wiOiBcIjpcIjpcIikrZSkpO2U9aC5sZW5ndGg9PT0wP1wie31cIjpnYXA/XCJ7XFxuXCIrZ2FwK2guam9pbihcIixcXG5cIitnYXApK1wiXFxuXCIrZytcIn1cIjpcIntcIitoLmpvaW4oXCIsXCIpK1wifVwiLGdhcD1nO3JldHVybiBlfX1mdW5jdGlvbiBxdW90ZShhKXtlc2NhcGFibGUubGFzdEluZGV4PTA7cmV0dXJuIGVzY2FwYWJsZS50ZXN0KGEpPydcIicrYS5yZXBsYWNlKGVzY2FwYWJsZSxmdW5jdGlvbihhKXt2YXIgYj1tZXRhW2FdO3JldHVybiB0eXBlb2YgYj09XCJzdHJpbmdcIj9iOlwiXFxcXHVcIisoXCIwMDAwXCIrYS5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTQpfSkrJ1wiJzonXCInK2ErJ1wiJ31mdW5jdGlvbiBmKGEpe3JldHVybiBhPDEwP1wiMFwiK2E6YX1cInVzZSBzdHJpY3RcIix0eXBlb2YgRGF0ZS5wcm90b3R5cGUudG9KU09OIT1cImZ1bmN0aW9uXCImJihEYXRlLnByb3RvdHlwZS50b0pTT049ZnVuY3Rpb24oYSl7cmV0dXJuIGlzRmluaXRlKHRoaXMudmFsdWVPZigpKT90aGlzLmdldFVUQ0Z1bGxZZWFyKCkrXCItXCIrZih0aGlzLmdldFVUQ01vbnRoKCkrMSkrXCItXCIrZih0aGlzLmdldFVUQ0RhdGUoKSkrXCJUXCIrZih0aGlzLmdldFVUQ0hvdXJzKCkpK1wiOlwiK2YodGhpcy5nZXRVVENNaW51dGVzKCkpK1wiOlwiK2YodGhpcy5nZXRVVENTZWNvbmRzKCkpK1wiWlwiOm51bGx9LFN0cmluZy5wcm90b3R5cGUudG9KU09OPU51bWJlci5wcm90b3R5cGUudG9KU09OPUJvb2xlYW4ucHJvdG90eXBlLnRvSlNPTj1mdW5jdGlvbihhKXtyZXR1cm4gdGhpcy52YWx1ZU9mKCl9KTt2YXIgY3g9L1tcXHUwMDAwXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2csZXNjYXBhYmxlPS9bXFxcXFxcXCJcXHgwMC1cXHgxZlxceDdmLVxceDlmXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2csZ2FwLGluZGVudCxtZXRhPXtcIlxcYlwiOlwiXFxcXGJcIixcIlxcdFwiOlwiXFxcXHRcIixcIlxcblwiOlwiXFxcXG5cIixcIlxcZlwiOlwiXFxcXGZcIixcIlxcclwiOlwiXFxcXHJcIiwnXCInOidcXFxcXCInLFwiXFxcXFwiOlwiXFxcXFxcXFxcIn0scmVwO3R5cGVvZiBKU09OLnN0cmluZ2lmeSE9XCJmdW5jdGlvblwiJiYoSlNPTi5zdHJpbmdpZnk9ZnVuY3Rpb24oYSxiLGMpe3ZhciBkO2dhcD1cIlwiLGluZGVudD1cIlwiO2lmKHR5cGVvZiBjPT1cIm51bWJlclwiKWZvcihkPTA7ZDxjO2QrPTEpaW5kZW50Kz1cIiBcIjtlbHNlIHR5cGVvZiBjPT1cInN0cmluZ1wiJiYoaW5kZW50PWMpO3JlcD1iO2lmKCFifHx0eXBlb2YgYj09XCJmdW5jdGlvblwifHx0eXBlb2YgYj09XCJvYmplY3RcIiYmdHlwZW9mIGIubGVuZ3RoPT1cIm51bWJlclwiKXJldHVybiBzdHIoXCJcIix7XCJcIjphfSk7dGhyb3cgbmV3IEVycm9yKFwiSlNPTi5zdHJpbmdpZnlcIil9KSx0eXBlb2YgSlNPTi5wYXJzZSE9XCJmdW5jdGlvblwiJiYoSlNPTi5wYXJzZT1mdW5jdGlvbih0ZXh0LHJldml2ZXIpe2Z1bmN0aW9uIHdhbGsoYSxiKXt2YXIgYyxkLGU9YVtiXTtpZihlJiZ0eXBlb2YgZT09XCJvYmplY3RcIilmb3IoYyBpbiBlKU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChlLGMpJiYoZD13YWxrKGUsYyksZCE9PXVuZGVmaW5lZD9lW2NdPWQ6ZGVsZXRlIGVbY10pO3JldHVybiByZXZpdmVyLmNhbGwoYSxiLGUpfXZhciBqO3RleHQ9U3RyaW5nKHRleHQpLGN4Lmxhc3RJbmRleD0wLGN4LnRlc3QodGV4dCkmJih0ZXh0PXRleHQucmVwbGFjZShjeCxmdW5jdGlvbihhKXtyZXR1cm5cIlxcXFx1XCIrKFwiMDAwMFwiK2EuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikpLnNsaWNlKC00KX0pKTtpZigvXltcXF0sOnt9XFxzXSokLy50ZXN0KHRleHQucmVwbGFjZSgvXFxcXCg/OltcIlxcXFxcXC9iZm5ydF18dVswLTlhLWZBLUZdezR9KS9nLFwiQFwiKS5yZXBsYWNlKC9cIlteXCJcXFxcXFxuXFxyXSpcInx0cnVlfGZhbHNlfG51bGx8LT9cXGQrKD86XFwuXFxkKik/KD86W2VFXVsrXFwtXT9cXGQrKT8vZyxcIl1cIikucmVwbGFjZSgvKD86Xnw6fCwpKD86XFxzKlxcWykrL2csXCJcIikpKXtqPWV2YWwoXCIoXCIrdGV4dCtcIilcIik7cmV0dXJuIHR5cGVvZiByZXZpdmVyPT1cImZ1bmN0aW9uXCI/d2Fsayh7XCJcIjpqfSxcIlwiKTpqfXRocm93IG5ldyBTeW50YXhFcnJvcihcIkpTT04ucGFyc2VcIil9KX0oKVxuXG5cbi8vICAgICBbKl0gSW5jbHVkaW5nIGxpYi9pbmRleC5qc1xuLy8gUHVibGljIG9iamVjdFxudmFyIFNvY2tKUyA9IChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICB2YXIgX2RvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgICAgICAgICAgIHZhciBfd2luZG93ID0gd2luZG93O1xuICAgICAgICAgICAgICB2YXIgdXRpbHMgPSB7fTtcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3JldmVudHRhcmdldC5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxuLyogU2ltcGxpZmllZCBpbXBsZW1lbnRhdGlvbiBvZiBET00yIEV2ZW50VGFyZ2V0LlxuICogICBodHRwOi8vd3d3LnczLm9yZy9UUi9ET00tTGV2ZWwtMi1FdmVudHMvZXZlbnRzLmh0bWwjRXZlbnRzLUV2ZW50VGFyZ2V0XG4gKi9cbnZhciBSRXZlbnRUYXJnZXQgPSBmdW5jdGlvbigpIHt9O1xuUkV2ZW50VGFyZ2V0LnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHtcbiAgICBpZighdGhpcy5fbGlzdGVuZXJzKSB7XG4gICAgICAgICB0aGlzLl9saXN0ZW5lcnMgPSB7fTtcbiAgICB9XG4gICAgaWYoIShldmVudFR5cGUgaW4gdGhpcy5fbGlzdGVuZXJzKSkge1xuICAgICAgICB0aGlzLl9saXN0ZW5lcnNbZXZlbnRUeXBlXSA9IFtdO1xuICAgIH1cbiAgICB2YXIgYXJyID0gdGhpcy5fbGlzdGVuZXJzW2V2ZW50VHlwZV07XG4gICAgaWYodXRpbHMuYXJySW5kZXhPZihhcnIsIGxpc3RlbmVyKSA9PT0gLTEpIHtcbiAgICAgICAgYXJyLnB1c2gobGlzdGVuZXIpO1xuICAgIH1cbiAgICByZXR1cm47XG59O1xuXG5SRXZlbnRUYXJnZXQucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBsaXN0ZW5lcikge1xuICAgIGlmKCEodGhpcy5fbGlzdGVuZXJzICYmIChldmVudFR5cGUgaW4gdGhpcy5fbGlzdGVuZXJzKSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgYXJyID0gdGhpcy5fbGlzdGVuZXJzW2V2ZW50VHlwZV07XG4gICAgdmFyIGlkeCA9IHV0aWxzLmFyckluZGV4T2YoYXJyLCBsaXN0ZW5lcik7XG4gICAgaWYgKGlkeCAhPT0gLTEpIHtcbiAgICAgICAgaWYoYXJyLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHRoaXMuX2xpc3RlbmVyc1tldmVudFR5cGVdID0gYXJyLnNsaWNlKDAsIGlkeCkuY29uY2F0KCBhcnIuc2xpY2UoaWR4KzEpICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fbGlzdGVuZXJzW2V2ZW50VHlwZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm47XG59O1xuXG5SRXZlbnRUYXJnZXQucHJvdG90eXBlLmRpc3BhdGNoRXZlbnQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgdCA9IGV2ZW50LnR5cGU7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICAgIGlmICh0aGlzWydvbicrdF0pIHtcbiAgICAgICAgdGhpc1snb24nK3RdLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fbGlzdGVuZXJzICYmIHQgaW4gdGhpcy5fbGlzdGVuZXJzKSB7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpIDwgdGhpcy5fbGlzdGVuZXJzW3RdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLl9saXN0ZW5lcnNbdF1baV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi9yZXZlbnR0YXJnZXQuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3NpbXBsZWV2ZW50LmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgU2ltcGxlRXZlbnQgPSBmdW5jdGlvbih0eXBlLCBvYmopIHtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIGlmICh0eXBlb2Ygb2JqICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBmb3IodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShrKSkgY29udGludWU7XG4gICAgICAgICAgICB0aGlzW2tdID0gb2JqW2tdO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuU2ltcGxlRXZlbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHIgPSBbXTtcbiAgICBmb3IodmFyIGsgaW4gdGhpcykge1xuICAgICAgICBpZiAoIXRoaXMuaGFzT3duUHJvcGVydHkoaykpIGNvbnRpbnVlO1xuICAgICAgICB2YXIgdiA9IHRoaXNba107XG4gICAgICAgIGlmICh0eXBlb2YgdiA9PT0gJ2Z1bmN0aW9uJykgdiA9ICdbZnVuY3Rpb25dJztcbiAgICAgICAgci5wdXNoKGsgKyAnPScgKyB2KTtcbiAgICB9XG4gICAgcmV0dXJuICdTaW1wbGVFdmVudCgnICsgci5qb2luKCcsICcpICsgJyknO1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvc2ltcGxlZXZlbnQuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL2V2ZW50ZW1pdHRlci5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIEV2ZW50RW1pdHRlciA9IGZ1bmN0aW9uKGV2ZW50cykge1xuICAgIHRoaXMuZXZlbnRzID0gZXZlbnRzIHx8IFtdO1xufTtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGlmICghdGhhdC5udWtlZCAmJiB0aGF0WydvbicrdHlwZV0pIHtcbiAgICAgICAgdGhhdFsnb24nK3R5cGVdLmFwcGx5KHRoYXQsIGFyZ3MpO1xuICAgIH1cbiAgICBpZiAodXRpbHMuYXJySW5kZXhPZih0aGF0LmV2ZW50cywgdHlwZSkgPT09IC0xKSB7XG4gICAgICAgIHV0aWxzLmxvZygnRXZlbnQgJyArIEpTT04uc3RyaW5naWZ5KHR5cGUpICtcbiAgICAgICAgICAgICAgICAgICcgbm90IGxpc3RlZCAnICsgSlNPTi5zdHJpbmdpZnkodGhhdC5ldmVudHMpICtcbiAgICAgICAgICAgICAgICAgICcgaW4gJyArIHRoYXQpO1xuICAgIH1cbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubnVrZSA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5udWtlZCA9IHRydWU7XG4gICAgZm9yKHZhciBpPTA7IGk8dGhhdC5ldmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGVsZXRlIHRoYXRbdGhhdC5ldmVudHNbaV1dO1xuICAgIH1cbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL2V2ZW50ZW1pdHRlci5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdXRpbHMuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciByYW5kb21fc3RyaW5nX2NoYXJzID0gJ2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OV8nO1xudXRpbHMucmFuZG9tX3N0cmluZyA9IGZ1bmN0aW9uKGxlbmd0aCwgbWF4KSB7XG4gICAgbWF4ID0gbWF4IHx8IHJhbmRvbV9zdHJpbmdfY2hhcnMubGVuZ3RoO1xuICAgIHZhciBpLCByZXQgPSBbXTtcbiAgICBmb3IoaT0wOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcmV0LnB1c2goIHJhbmRvbV9zdHJpbmdfY2hhcnMuc3Vic3RyKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCksMSkgKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldC5qb2luKCcnKTtcbn07XG51dGlscy5yYW5kb21fbnVtYmVyID0gZnVuY3Rpb24obWF4KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG1heCk7XG59O1xudXRpbHMucmFuZG9tX251bWJlcl9zdHJpbmcgPSBmdW5jdGlvbihtYXgpIHtcbiAgICB2YXIgdCA9ICgnJysobWF4IC0gMSkpLmxlbmd0aDtcbiAgICB2YXIgcCA9IEFycmF5KHQrMSkuam9pbignMCcpO1xuICAgIHJldHVybiAocCArIHV0aWxzLnJhbmRvbV9udW1iZXIobWF4KSkuc2xpY2UoLXQpO1xufTtcblxuLy8gQXNzdW1pbmcgdGhhdCB1cmwgbG9va3MgbGlrZTogaHR0cDovL2FzZGFzZDoxMTEvYXNkXG51dGlscy5nZXRPcmlnaW4gPSBmdW5jdGlvbih1cmwpIHtcbiAgICB1cmwgKz0gJy8nO1xuICAgIHZhciBwYXJ0cyA9IHVybC5zcGxpdCgnLycpLnNsaWNlKDAsIDMpO1xuICAgIHJldHVybiBwYXJ0cy5qb2luKCcvJyk7XG59O1xuXG51dGlscy5pc1NhbWVPcmlnaW5VcmwgPSBmdW5jdGlvbih1cmxfYSwgdXJsX2IpIHtcbiAgICAvLyBsb2NhdGlvbi5vcmlnaW4gd291bGQgZG8sIGJ1dCBpdCdzIG5vdCBhbHdheXMgYXZhaWxhYmxlLlxuICAgIGlmICghdXJsX2IpIHVybF9iID0gX3dpbmRvdy5sb2NhdGlvbi5ocmVmO1xuXG4gICAgcmV0dXJuICh1cmxfYS5zcGxpdCgnLycpLnNsaWNlKDAsMykuam9pbignLycpXG4gICAgICAgICAgICAgICAgPT09XG4gICAgICAgICAgICB1cmxfYi5zcGxpdCgnLycpLnNsaWNlKDAsMykuam9pbignLycpKTtcbn07XG5cbnV0aWxzLmdldFBhcmVudERvbWFpbiA9IGZ1bmN0aW9uKHVybCkge1xuICAgIC8vIGlwdjQgaXAgYWRkcmVzc1xuICAgIGlmICgvXlswLTkuXSokLy50ZXN0KHVybCkpIHJldHVybiB1cmw7XG4gICAgLy8gaXB2NiBpcCBhZGRyZXNzXG4gICAgaWYgKC9eXFxbLy50ZXN0KHVybCkpIHJldHVybiB1cmw7XG4gICAgLy8gbm8gZG90c1xuICAgIGlmICghKC9bLl0vLnRlc3QodXJsKSkpIHJldHVybiB1cmw7XG5cbiAgICB2YXIgcGFydHMgPSB1cmwuc3BsaXQoJy4nKS5zbGljZSgxKTtcbiAgICByZXR1cm4gcGFydHMuam9pbignLicpO1xufTtcblxudXRpbHMub2JqZWN0RXh0ZW5kID0gZnVuY3Rpb24oZHN0LCBzcmMpIHtcbiAgICBmb3IodmFyIGsgaW4gc3JjKSB7XG4gICAgICAgIGlmIChzcmMuaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICAgIGRzdFtrXSA9IHNyY1trXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZHN0O1xufTtcblxudmFyIFdQcmVmaXggPSAnX2pwJztcblxudXRpbHMucG9sbHV0ZUdsb2JhbE5hbWVzcGFjZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghKFdQcmVmaXggaW4gX3dpbmRvdykpIHtcbiAgICAgICAgX3dpbmRvd1tXUHJlZml4XSA9IHt9O1xuICAgIH1cbn07XG5cbnV0aWxzLmNsb3NlRnJhbWUgPSBmdW5jdGlvbiAoY29kZSwgcmVhc29uKSB7XG4gICAgcmV0dXJuICdjJytKU09OLnN0cmluZ2lmeShbY29kZSwgcmVhc29uXSk7XG59O1xuXG51dGlscy51c2VyU2V0Q29kZSA9IGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgcmV0dXJuIGNvZGUgPT09IDEwMDAgfHwgKGNvZGUgPj0gMzAwMCAmJiBjb2RlIDw9IDQ5OTkpO1xufTtcblxuLy8gU2VlOiBodHRwOi8vd3d3LmVyZy5hYmRuLmFjLnVrL35nZXJyaXQvZGNjcC9ub3Rlcy9jY2lkMi9ydG9fZXN0aW1hdG9yL1xuLy8gYW5kIFJGQyAyOTg4LlxudXRpbHMuY291bnRSVE8gPSBmdW5jdGlvbiAocnR0KSB7XG4gICAgdmFyIHJ0bztcbiAgICBpZiAocnR0ID4gMTAwKSB7XG4gICAgICAgIHJ0byA9IDMgKiBydHQ7IC8vIHJ0byA+IDMwMG1zZWNcbiAgICB9IGVsc2Uge1xuICAgICAgICBydG8gPSBydHQgKyAyMDA7IC8vIDIwMG1zZWMgPCBydG8gPD0gMzAwbXNlY1xuICAgIH1cbiAgICByZXR1cm4gcnRvO1xufVxuXG51dGlscy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoX3dpbmRvdy5jb25zb2xlICYmIGNvbnNvbGUubG9nICYmIGNvbnNvbGUubG9nLmFwcGx5KSB7XG4gICAgICAgIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyk7XG4gICAgfVxufTtcblxudXRpbHMuYmluZCA9IGZ1bmN0aW9uKGZ1biwgdGhhdCkge1xuICAgIGlmIChmdW4uYmluZCkge1xuICAgICAgICByZXR1cm4gZnVuLmJpbmQodGhhdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bi5hcHBseSh0aGF0LCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH1cbn07XG5cbnV0aWxzLmZsYXRVcmwgPSBmdW5jdGlvbih1cmwpIHtcbiAgICByZXR1cm4gdXJsLmluZGV4T2YoJz8nKSA9PT0gLTEgJiYgdXJsLmluZGV4T2YoJyMnKSA9PT0gLTE7XG59O1xuXG51dGlscy5hbWVuZFVybCA9IGZ1bmN0aW9uKHVybCkge1xuICAgIHZhciBkbCA9IF9kb2N1bWVudC5sb2NhdGlvbjtcbiAgICBpZiAoIXVybCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dyb25nIHVybCBmb3IgU29ja0pTJyk7XG4gICAgfVxuICAgIGlmICghdXRpbHMuZmxhdFVybCh1cmwpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignT25seSBiYXNpYyB1cmxzIGFyZSBzdXBwb3J0ZWQgaW4gU29ja0pTJyk7XG4gICAgfVxuXG4gICAgLy8gICcvL2FiYycgLS0+ICdodHRwOi8vYWJjJ1xuICAgIGlmICh1cmwuaW5kZXhPZignLy8nKSA9PT0gMCkge1xuICAgICAgICB1cmwgPSBkbC5wcm90b2NvbCArIHVybDtcbiAgICB9XG4gICAgLy8gJy9hYmMnIC0tPiAnaHR0cDovL2xvY2FsaG9zdDo4MC9hYmMnXG4gICAgaWYgKHVybC5pbmRleE9mKCcvJykgPT09IDApIHtcbiAgICAgICAgdXJsID0gZGwucHJvdG9jb2wgKyAnLy8nICsgZGwuaG9zdCArIHVybDtcbiAgICB9XG4gICAgLy8gc3RyaXAgdHJhaWxpbmcgc2xhc2hlc1xuICAgIHVybCA9IHVybC5yZXBsYWNlKC9bL10rJC8sJycpO1xuICAgIHJldHVybiB1cmw7XG59O1xuXG4vLyBJRSBkb2Vzbid0IHN1cHBvcnQgW10uaW5kZXhPZi5cbnV0aWxzLmFyckluZGV4T2YgPSBmdW5jdGlvbihhcnIsIG9iail7XG4gICAgZm9yKHZhciBpPTA7IGkgPCBhcnIubGVuZ3RoOyBpKyspe1xuICAgICAgICBpZihhcnJbaV0gPT09IG9iail7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTE7XG59O1xuXG51dGlscy5hcnJTa2lwID0gZnVuY3Rpb24oYXJyLCBvYmopIHtcbiAgICB2YXIgaWR4ID0gdXRpbHMuYXJySW5kZXhPZihhcnIsIG9iaik7XG4gICAgaWYgKGlkeCA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIGFyci5zbGljZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBkc3QgPSBhcnIuc2xpY2UoMCwgaWR4KTtcbiAgICAgICAgcmV0dXJuIGRzdC5jb25jYXQoYXJyLnNsaWNlKGlkeCsxKSk7XG4gICAgfVxufTtcblxuLy8gVmlhOiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS8xMTMzMTIyLzIxMjFjNjAxYzU1NDkxNTU0ODNmNTBiZTNkYTUzMDVlODNiOGM1ZGZcbnV0aWxzLmlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHt9LnRvU3RyaW5nLmNhbGwodmFsdWUpLmluZGV4T2YoJ0FycmF5JykgPj0gMFxufTtcblxudXRpbHMuZGVsYXkgPSBmdW5jdGlvbih0LCBmdW4pIHtcbiAgICBpZih0eXBlb2YgdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBmdW4gPSB0O1xuICAgICAgICB0ID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCB0KTtcbn07XG5cblxuLy8gQ2hhcnMgd29ydGggZXNjYXBpbmcsIGFzIGRlZmluZWQgYnkgRG91Z2xhcyBDcm9ja2ZvcmQ6XG4vLyAgIGh0dHBzOi8vZ2l0aHViLmNvbS9kb3VnbGFzY3JvY2tmb3JkL0pTT04tanMvYmxvYi80N2E5ODgyY2RkZWIxZTg1MjllMDdhZjk3MzYyMTgwNzUzNzJiOGFjL2pzb24yLmpzI0wxOTZcbnZhciBqc29uX2VzY2FwYWJsZSA9IC9bXFxcXFxcXCJcXHgwMC1cXHgxZlxceDdmLVxceDlmXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2csXG4gICAganNvbl9sb29rdXAgPSB7XG5cIlxcdTAwMDBcIjpcIlxcXFx1MDAwMFwiLFwiXFx1MDAwMVwiOlwiXFxcXHUwMDAxXCIsXCJcXHUwMDAyXCI6XCJcXFxcdTAwMDJcIixcIlxcdTAwMDNcIjpcIlxcXFx1MDAwM1wiLFxuXCJcXHUwMDA0XCI6XCJcXFxcdTAwMDRcIixcIlxcdTAwMDVcIjpcIlxcXFx1MDAwNVwiLFwiXFx1MDAwNlwiOlwiXFxcXHUwMDA2XCIsXCJcXHUwMDA3XCI6XCJcXFxcdTAwMDdcIixcblwiXFxiXCI6XCJcXFxcYlwiLFwiXFx0XCI6XCJcXFxcdFwiLFwiXFxuXCI6XCJcXFxcblwiLFwiXFx1MDAwYlwiOlwiXFxcXHUwMDBiXCIsXCJcXGZcIjpcIlxcXFxmXCIsXCJcXHJcIjpcIlxcXFxyXCIsXG5cIlxcdTAwMGVcIjpcIlxcXFx1MDAwZVwiLFwiXFx1MDAwZlwiOlwiXFxcXHUwMDBmXCIsXCJcXHUwMDEwXCI6XCJcXFxcdTAwMTBcIixcIlxcdTAwMTFcIjpcIlxcXFx1MDAxMVwiLFxuXCJcXHUwMDEyXCI6XCJcXFxcdTAwMTJcIixcIlxcdTAwMTNcIjpcIlxcXFx1MDAxM1wiLFwiXFx1MDAxNFwiOlwiXFxcXHUwMDE0XCIsXCJcXHUwMDE1XCI6XCJcXFxcdTAwMTVcIixcblwiXFx1MDAxNlwiOlwiXFxcXHUwMDE2XCIsXCJcXHUwMDE3XCI6XCJcXFxcdTAwMTdcIixcIlxcdTAwMThcIjpcIlxcXFx1MDAxOFwiLFwiXFx1MDAxOVwiOlwiXFxcXHUwMDE5XCIsXG5cIlxcdTAwMWFcIjpcIlxcXFx1MDAxYVwiLFwiXFx1MDAxYlwiOlwiXFxcXHUwMDFiXCIsXCJcXHUwMDFjXCI6XCJcXFxcdTAwMWNcIixcIlxcdTAwMWRcIjpcIlxcXFx1MDAxZFwiLFxuXCJcXHUwMDFlXCI6XCJcXFxcdTAwMWVcIixcIlxcdTAwMWZcIjpcIlxcXFx1MDAxZlwiLFwiXFxcIlwiOlwiXFxcXFxcXCJcIixcIlxcXFxcIjpcIlxcXFxcXFxcXCIsXG5cIlxcdTAwN2ZcIjpcIlxcXFx1MDA3ZlwiLFwiXFx1MDA4MFwiOlwiXFxcXHUwMDgwXCIsXCJcXHUwMDgxXCI6XCJcXFxcdTAwODFcIixcIlxcdTAwODJcIjpcIlxcXFx1MDA4MlwiLFxuXCJcXHUwMDgzXCI6XCJcXFxcdTAwODNcIixcIlxcdTAwODRcIjpcIlxcXFx1MDA4NFwiLFwiXFx1MDA4NVwiOlwiXFxcXHUwMDg1XCIsXCJcXHUwMDg2XCI6XCJcXFxcdTAwODZcIixcblwiXFx1MDA4N1wiOlwiXFxcXHUwMDg3XCIsXCJcXHUwMDg4XCI6XCJcXFxcdTAwODhcIixcIlxcdTAwODlcIjpcIlxcXFx1MDA4OVwiLFwiXFx1MDA4YVwiOlwiXFxcXHUwMDhhXCIsXG5cIlxcdTAwOGJcIjpcIlxcXFx1MDA4YlwiLFwiXFx1MDA4Y1wiOlwiXFxcXHUwMDhjXCIsXCJcXHUwMDhkXCI6XCJcXFxcdTAwOGRcIixcIlxcdTAwOGVcIjpcIlxcXFx1MDA4ZVwiLFxuXCJcXHUwMDhmXCI6XCJcXFxcdTAwOGZcIixcIlxcdTAwOTBcIjpcIlxcXFx1MDA5MFwiLFwiXFx1MDA5MVwiOlwiXFxcXHUwMDkxXCIsXCJcXHUwMDkyXCI6XCJcXFxcdTAwOTJcIixcblwiXFx1MDA5M1wiOlwiXFxcXHUwMDkzXCIsXCJcXHUwMDk0XCI6XCJcXFxcdTAwOTRcIixcIlxcdTAwOTVcIjpcIlxcXFx1MDA5NVwiLFwiXFx1MDA5NlwiOlwiXFxcXHUwMDk2XCIsXG5cIlxcdTAwOTdcIjpcIlxcXFx1MDA5N1wiLFwiXFx1MDA5OFwiOlwiXFxcXHUwMDk4XCIsXCJcXHUwMDk5XCI6XCJcXFxcdTAwOTlcIixcIlxcdTAwOWFcIjpcIlxcXFx1MDA5YVwiLFxuXCJcXHUwMDliXCI6XCJcXFxcdTAwOWJcIixcIlxcdTAwOWNcIjpcIlxcXFx1MDA5Y1wiLFwiXFx1MDA5ZFwiOlwiXFxcXHUwMDlkXCIsXCJcXHUwMDllXCI6XCJcXFxcdTAwOWVcIixcblwiXFx1MDA5ZlwiOlwiXFxcXHUwMDlmXCIsXCJcXHUwMGFkXCI6XCJcXFxcdTAwYWRcIixcIlxcdTA2MDBcIjpcIlxcXFx1MDYwMFwiLFwiXFx1MDYwMVwiOlwiXFxcXHUwNjAxXCIsXG5cIlxcdTA2MDJcIjpcIlxcXFx1MDYwMlwiLFwiXFx1MDYwM1wiOlwiXFxcXHUwNjAzXCIsXCJcXHUwNjA0XCI6XCJcXFxcdTA2MDRcIixcIlxcdTA3MGZcIjpcIlxcXFx1MDcwZlwiLFxuXCJcXHUxN2I0XCI6XCJcXFxcdTE3YjRcIixcIlxcdTE3YjVcIjpcIlxcXFx1MTdiNVwiLFwiXFx1MjAwY1wiOlwiXFxcXHUyMDBjXCIsXCJcXHUyMDBkXCI6XCJcXFxcdTIwMGRcIixcblwiXFx1MjAwZVwiOlwiXFxcXHUyMDBlXCIsXCJcXHUyMDBmXCI6XCJcXFxcdTIwMGZcIixcIlxcdTIwMjhcIjpcIlxcXFx1MjAyOFwiLFwiXFx1MjAyOVwiOlwiXFxcXHUyMDI5XCIsXG5cIlxcdTIwMmFcIjpcIlxcXFx1MjAyYVwiLFwiXFx1MjAyYlwiOlwiXFxcXHUyMDJiXCIsXCJcXHUyMDJjXCI6XCJcXFxcdTIwMmNcIixcIlxcdTIwMmRcIjpcIlxcXFx1MjAyZFwiLFxuXCJcXHUyMDJlXCI6XCJcXFxcdTIwMmVcIixcIlxcdTIwMmZcIjpcIlxcXFx1MjAyZlwiLFwiXFx1MjA2MFwiOlwiXFxcXHUyMDYwXCIsXCJcXHUyMDYxXCI6XCJcXFxcdTIwNjFcIixcblwiXFx1MjA2MlwiOlwiXFxcXHUyMDYyXCIsXCJcXHUyMDYzXCI6XCJcXFxcdTIwNjNcIixcIlxcdTIwNjRcIjpcIlxcXFx1MjA2NFwiLFwiXFx1MjA2NVwiOlwiXFxcXHUyMDY1XCIsXG5cIlxcdTIwNjZcIjpcIlxcXFx1MjA2NlwiLFwiXFx1MjA2N1wiOlwiXFxcXHUyMDY3XCIsXCJcXHUyMDY4XCI6XCJcXFxcdTIwNjhcIixcIlxcdTIwNjlcIjpcIlxcXFx1MjA2OVwiLFxuXCJcXHUyMDZhXCI6XCJcXFxcdTIwNmFcIixcIlxcdTIwNmJcIjpcIlxcXFx1MjA2YlwiLFwiXFx1MjA2Y1wiOlwiXFxcXHUyMDZjXCIsXCJcXHUyMDZkXCI6XCJcXFxcdTIwNmRcIixcblwiXFx1MjA2ZVwiOlwiXFxcXHUyMDZlXCIsXCJcXHUyMDZmXCI6XCJcXFxcdTIwNmZcIixcIlxcdWZlZmZcIjpcIlxcXFx1ZmVmZlwiLFwiXFx1ZmZmMFwiOlwiXFxcXHVmZmYwXCIsXG5cIlxcdWZmZjFcIjpcIlxcXFx1ZmZmMVwiLFwiXFx1ZmZmMlwiOlwiXFxcXHVmZmYyXCIsXCJcXHVmZmYzXCI6XCJcXFxcdWZmZjNcIixcIlxcdWZmZjRcIjpcIlxcXFx1ZmZmNFwiLFxuXCJcXHVmZmY1XCI6XCJcXFxcdWZmZjVcIixcIlxcdWZmZjZcIjpcIlxcXFx1ZmZmNlwiLFwiXFx1ZmZmN1wiOlwiXFxcXHVmZmY3XCIsXCJcXHVmZmY4XCI6XCJcXFxcdWZmZjhcIixcblwiXFx1ZmZmOVwiOlwiXFxcXHVmZmY5XCIsXCJcXHVmZmZhXCI6XCJcXFxcdWZmZmFcIixcIlxcdWZmZmJcIjpcIlxcXFx1ZmZmYlwiLFwiXFx1ZmZmY1wiOlwiXFxcXHVmZmZjXCIsXG5cIlxcdWZmZmRcIjpcIlxcXFx1ZmZmZFwiLFwiXFx1ZmZmZVwiOlwiXFxcXHVmZmZlXCIsXCJcXHVmZmZmXCI6XCJcXFxcdWZmZmZcIn07XG5cbi8vIFNvbWUgZXh0cmEgY2hhcmFjdGVycyB0aGF0IENocm9tZSBnZXRzIHdyb25nLCBhbmQgc3Vic3RpdHV0ZXMgd2l0aFxuLy8gc29tZXRoaW5nIGVsc2Ugb24gdGhlIHdpcmUuXG52YXIgZXh0cmFfZXNjYXBhYmxlID0gL1tcXHgwMC1cXHgxZlxcdWQ4MDAtXFx1ZGZmZlxcdWZmZmVcXHVmZmZmXFx1MDMwMC1cXHUwMzMzXFx1MDMzZC1cXHUwMzQ2XFx1MDM0YS1cXHUwMzRjXFx1MDM1MC1cXHUwMzUyXFx1MDM1Ny1cXHUwMzU4XFx1MDM1Yy1cXHUwMzYyXFx1MDM3NFxcdTAzN2VcXHUwMzg3XFx1MDU5MS1cXHUwNWFmXFx1MDVjNFxcdTA2MTAtXFx1MDYxN1xcdTA2NTMtXFx1MDY1NFxcdTA2NTctXFx1MDY1YlxcdTA2NWQtXFx1MDY1ZVxcdTA2ZGYtXFx1MDZlMlxcdTA2ZWItXFx1MDZlY1xcdTA3MzBcXHUwNzMyLVxcdTA3MzNcXHUwNzM1LVxcdTA3MzZcXHUwNzNhXFx1MDczZFxcdTA3M2YtXFx1MDc0MVxcdTA3NDNcXHUwNzQ1XFx1MDc0N1xcdTA3ZWItXFx1MDdmMVxcdTA5NTFcXHUwOTU4LVxcdTA5NWZcXHUwOWRjLVxcdTA5ZGRcXHUwOWRmXFx1MGEzM1xcdTBhMzZcXHUwYTU5LVxcdTBhNWJcXHUwYTVlXFx1MGI1Yy1cXHUwYjVkXFx1MGUzOC1cXHUwZTM5XFx1MGY0M1xcdTBmNGRcXHUwZjUyXFx1MGY1N1xcdTBmNWNcXHUwZjY5XFx1MGY3Mi1cXHUwZjc2XFx1MGY3OFxcdTBmODAtXFx1MGY4M1xcdTBmOTNcXHUwZjlkXFx1MGZhMlxcdTBmYTdcXHUwZmFjXFx1MGZiOVxcdTE5MzktXFx1MTkzYVxcdTFhMTdcXHUxYjZiXFx1MWNkYS1cXHUxY2RiXFx1MWRjMC1cXHUxZGNmXFx1MWRmY1xcdTFkZmVcXHUxZjcxXFx1MWY3M1xcdTFmNzVcXHUxZjc3XFx1MWY3OVxcdTFmN2JcXHUxZjdkXFx1MWZiYlxcdTFmYmVcXHUxZmM5XFx1MWZjYlxcdTFmZDNcXHUxZmRiXFx1MWZlM1xcdTFmZWJcXHUxZmVlLVxcdTFmZWZcXHUxZmY5XFx1MWZmYlxcdTFmZmRcXHUyMDAwLVxcdTIwMDFcXHUyMGQwLVxcdTIwZDFcXHUyMGQ0LVxcdTIwZDdcXHUyMGU3LVxcdTIwZTlcXHUyMTI2XFx1MjEyYS1cXHUyMTJiXFx1MjMyOS1cXHUyMzJhXFx1MmFkY1xcdTMwMmItXFx1MzAyY1xcdWFhYjItXFx1YWFiM1xcdWY5MDAtXFx1ZmEwZFxcdWZhMTBcXHVmYTEyXFx1ZmExNS1cXHVmYTFlXFx1ZmEyMFxcdWZhMjJcXHVmYTI1LVxcdWZhMjZcXHVmYTJhLVxcdWZhMmRcXHVmYTMwLVxcdWZhNmRcXHVmYTcwLVxcdWZhZDlcXHVmYjFkXFx1ZmIxZlxcdWZiMmEtXFx1ZmIzNlxcdWZiMzgtXFx1ZmIzY1xcdWZiM2VcXHVmYjQwLVxcdWZiNDFcXHVmYjQzLVxcdWZiNDRcXHVmYjQ2LVxcdWZiNGVcXHVmZmYwLVxcdWZmZmZdL2csXG4gICAgZXh0cmFfbG9va3VwO1xuXG4vLyBKU09OIFF1b3RlIHN0cmluZy4gVXNlIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbiB3aGVuIHBvc3NpYmxlLlxudmFyIEpTT05RdW90ZSA9IChKU09OICYmIEpTT04uc3RyaW5naWZ5KSB8fCBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICBqc29uX2VzY2FwYWJsZS5sYXN0SW5kZXggPSAwO1xuICAgIGlmIChqc29uX2VzY2FwYWJsZS50ZXN0KHN0cmluZykpIHtcbiAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UoanNvbl9lc2NhcGFibGUsIGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgICAgIHJldHVybiBqc29uX2xvb2t1cFthXTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiAnXCInICsgc3RyaW5nICsgJ1wiJztcbn07XG5cbi8vIFRoaXMgbWF5IGJlIHF1aXRlIHNsb3csIHNvIGxldCdzIGRlbGF5IHVudGlsIHVzZXIgYWN0dWFsbHkgdXNlcyBiYWRcbi8vIGNoYXJhY3RlcnMuXG52YXIgdW5yb2xsX2xvb2t1cCA9IGZ1bmN0aW9uKGVzY2FwYWJsZSkge1xuICAgIHZhciBpO1xuICAgIHZhciB1bnJvbGxlZCA9IHt9XG4gICAgdmFyIGMgPSBbXVxuICAgIGZvcihpPTA7IGk8NjU1MzY7IGkrKykge1xuICAgICAgICBjLnB1c2goIFN0cmluZy5mcm9tQ2hhckNvZGUoaSkgKTtcbiAgICB9XG4gICAgZXNjYXBhYmxlLmxhc3RJbmRleCA9IDA7XG4gICAgYy5qb2luKCcnKS5yZXBsYWNlKGVzY2FwYWJsZSwgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgdW5yb2xsZWRbIGEgXSA9ICdcXFxcdScgKyAoJzAwMDAnICsgYS5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTQpO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfSk7XG4gICAgZXNjYXBhYmxlLmxhc3RJbmRleCA9IDA7XG4gICAgcmV0dXJuIHVucm9sbGVkO1xufTtcblxuLy8gUXVvdGUgc3RyaW5nLCBhbHNvIHRha2luZyBjYXJlIG9mIHVuaWNvZGUgY2hhcmFjdGVycyB0aGF0IGJyb3dzZXJzXG4vLyBvZnRlbiBicmVhay4gRXNwZWNpYWxseSwgdGFrZSBjYXJlIG9mIHVuaWNvZGUgc3Vycm9nYXRlczpcbi8vICAgIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTWFwcGluZ19vZl9Vbmljb2RlX2NoYXJhY3RlcnMjU3Vycm9nYXRlc1xudXRpbHMucXVvdGUgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICB2YXIgcXVvdGVkID0gSlNPTlF1b3RlKHN0cmluZyk7XG5cbiAgICAvLyBJbiBtb3N0IGNhc2VzIHRoaXMgc2hvdWxkIGJlIHZlcnkgZmFzdCBhbmQgZ29vZCBlbm91Z2guXG4gICAgZXh0cmFfZXNjYXBhYmxlLmxhc3RJbmRleCA9IDA7XG4gICAgaWYoIWV4dHJhX2VzY2FwYWJsZS50ZXN0KHF1b3RlZCkpIHtcbiAgICAgICAgcmV0dXJuIHF1b3RlZDtcbiAgICB9XG5cbiAgICBpZighZXh0cmFfbG9va3VwKSBleHRyYV9sb29rdXAgPSB1bnJvbGxfbG9va3VwKGV4dHJhX2VzY2FwYWJsZSk7XG5cbiAgICByZXR1cm4gcXVvdGVkLnJlcGxhY2UoZXh0cmFfZXNjYXBhYmxlLCBmdW5jdGlvbihhKSB7XG4gICAgICAgIHJldHVybiBleHRyYV9sb29rdXBbYV07XG4gICAgfSk7XG59XG5cbnZhciBfYWxsX3Byb3RvY29scyA9IFsnd2Vic29ja2V0JyxcbiAgICAgICAgICAgICAgICAgICAgICAneGRyLXN0cmVhbWluZycsXG4gICAgICAgICAgICAgICAgICAgICAgJ3hoci1zdHJlYW1pbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICdpZnJhbWUtZXZlbnRzb3VyY2UnLFxuICAgICAgICAgICAgICAgICAgICAgICdpZnJhbWUtaHRtbGZpbGUnLFxuICAgICAgICAgICAgICAgICAgICAgICd4ZHItcG9sbGluZycsXG4gICAgICAgICAgICAgICAgICAgICAgJ3hoci1wb2xsaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAnaWZyYW1lLXhoci1wb2xsaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAnanNvbnAtcG9sbGluZyddO1xuXG51dGlscy5wcm9iZVByb3RvY29scyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwcm9iZWQgPSB7fTtcbiAgICBmb3IodmFyIGk9MDsgaTxfYWxsX3Byb3RvY29scy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcHJvdG9jb2wgPSBfYWxsX3Byb3RvY29sc1tpXTtcbiAgICAgICAgLy8gVXNlciBjYW4gaGF2ZSBhIHR5cG8gaW4gcHJvdG9jb2wgbmFtZS5cbiAgICAgICAgcHJvYmVkW3Byb3RvY29sXSA9IFNvY2tKU1twcm90b2NvbF0gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFNvY2tKU1twcm90b2NvbF0uZW5hYmxlZCgpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvYmVkO1xufTtcblxudXRpbHMuZGV0ZWN0UHJvdG9jb2xzID0gZnVuY3Rpb24ocHJvYmVkLCBwcm90b2NvbHNfd2hpdGVsaXN0LCBpbmZvKSB7XG4gICAgdmFyIHBlID0ge30sXG4gICAgICAgIHByb3RvY29scyA9IFtdO1xuICAgIGlmICghcHJvdG9jb2xzX3doaXRlbGlzdCkgcHJvdG9jb2xzX3doaXRlbGlzdCA9IF9hbGxfcHJvdG9jb2xzO1xuICAgIGZvcih2YXIgaT0wOyBpPHByb3RvY29sc193aGl0ZWxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHByb3RvY29sID0gcHJvdG9jb2xzX3doaXRlbGlzdFtpXTtcbiAgICAgICAgcGVbcHJvdG9jb2xdID0gcHJvYmVkW3Byb3RvY29sXTtcbiAgICB9XG4gICAgdmFyIG1heWJlX3B1c2ggPSBmdW5jdGlvbihwcm90b3MpIHtcbiAgICAgICAgdmFyIHByb3RvID0gcHJvdG9zLnNoaWZ0KCk7XG4gICAgICAgIGlmIChwZVtwcm90b10pIHtcbiAgICAgICAgICAgIHByb3RvY29scy5wdXNoKHByb3RvKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChwcm90b3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIG1heWJlX3B1c2gocHJvdG9zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIDEuIFdlYnNvY2tldFxuICAgIGlmIChpbmZvLndlYnNvY2tldCAhPT0gZmFsc2UpIHtcbiAgICAgICAgbWF5YmVfcHVzaChbJ3dlYnNvY2tldCddKTtcbiAgICB9XG5cbiAgICAvLyAyLiBTdHJlYW1pbmdcbiAgICBpZiAocGVbJ3hoci1zdHJlYW1pbmcnXSAmJiAhaW5mby5udWxsX29yaWdpbikge1xuICAgICAgICBwcm90b2NvbHMucHVzaCgneGhyLXN0cmVhbWluZycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChwZVsneGRyLXN0cmVhbWluZyddICYmICFpbmZvLmNvb2tpZV9uZWVkZWQgJiYgIWluZm8ubnVsbF9vcmlnaW4pIHtcbiAgICAgICAgICAgIHByb3RvY29scy5wdXNoKCd4ZHItc3RyZWFtaW5nJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtYXliZV9wdXNoKFsnaWZyYW1lLWV2ZW50c291cmNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdpZnJhbWUtaHRtbGZpbGUnXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAzLiBQb2xsaW5nXG4gICAgaWYgKHBlWyd4aHItcG9sbGluZyddICYmICFpbmZvLm51bGxfb3JpZ2luKSB7XG4gICAgICAgIHByb3RvY29scy5wdXNoKCd4aHItcG9sbGluZycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChwZVsneGRyLXBvbGxpbmcnXSAmJiAhaW5mby5jb29raWVfbmVlZGVkICYmICFpbmZvLm51bGxfb3JpZ2luKSB7XG4gICAgICAgICAgICBwcm90b2NvbHMucHVzaCgneGRyLXBvbGxpbmcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1heWJlX3B1c2goWydpZnJhbWUteGhyLXBvbGxpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2pzb25wLXBvbGxpbmcnXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHByb3RvY29scztcbn1cbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdXRpbHMuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL2RvbS5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxuLy8gTWF5IGJlIHVzZWQgYnkgaHRtbGZpbGUganNvbnAgYW5kIHRyYW5zcG9ydHMuXG52YXIgTVByZWZpeCA9ICdfc29ja2pzX2dsb2JhbCc7XG51dGlscy5jcmVhdGVIb29rID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHdpbmRvd19pZCA9ICdhJyArIHV0aWxzLnJhbmRvbV9zdHJpbmcoOCk7XG4gICAgaWYgKCEoTVByZWZpeCBpbiBfd2luZG93KSkge1xuICAgICAgICB2YXIgbWFwID0ge307XG4gICAgICAgIF93aW5kb3dbTVByZWZpeF0gPSBmdW5jdGlvbih3aW5kb3dfaWQpIHtcbiAgICAgICAgICAgIGlmICghKHdpbmRvd19pZCBpbiBtYXApKSB7XG4gICAgICAgICAgICAgICAgbWFwW3dpbmRvd19pZF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiB3aW5kb3dfaWQsXG4gICAgICAgICAgICAgICAgICAgIGRlbDogZnVuY3Rpb24oKSB7ZGVsZXRlIG1hcFt3aW5kb3dfaWRdO31cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1hcFt3aW5kb3dfaWRdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBfd2luZG93W01QcmVmaXhdKHdpbmRvd19pZCk7XG59O1xuXG5cblxudXRpbHMuYXR0YWNoTWVzc2FnZSA9IGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgdXRpbHMuYXR0YWNoRXZlbnQoJ21lc3NhZ2UnLCBsaXN0ZW5lcik7XG59O1xudXRpbHMuYXR0YWNoRXZlbnQgPSBmdW5jdGlvbihldmVudCwgbGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIF93aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgX3dpbmRvdy5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lciwgZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIElFIHF1aXJrcy5cbiAgICAgICAgLy8gQWNjb3JkaW5nIHRvOiBodHRwOi8vc3RldmVzb3VkZXJzLmNvbS9taXNjL3Rlc3QtcG9zdG1lc3NhZ2UucGhwXG4gICAgICAgIC8vIHRoZSBtZXNzYWdlIGdldHMgZGVsaXZlcmVkIG9ubHkgdG8gJ2RvY3VtZW50Jywgbm90ICd3aW5kb3cnLlxuICAgICAgICBfZG9jdW1lbnQuYXR0YWNoRXZlbnQoXCJvblwiICsgZXZlbnQsIGxpc3RlbmVyKTtcbiAgICAgICAgLy8gSSBnZXQgJ3dpbmRvdycgZm9yIGllOC5cbiAgICAgICAgX3dpbmRvdy5hdHRhY2hFdmVudChcIm9uXCIgKyBldmVudCwgbGlzdGVuZXIpO1xuICAgIH1cbn07XG5cbnV0aWxzLmRldGFjaE1lc3NhZ2UgPSBmdW5jdGlvbihsaXN0ZW5lcikge1xuICAgIHV0aWxzLmRldGFjaEV2ZW50KCdtZXNzYWdlJywgbGlzdGVuZXIpO1xufTtcbnV0aWxzLmRldGFjaEV2ZW50ID0gZnVuY3Rpb24oZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBfd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIF93aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIsIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBfZG9jdW1lbnQuZGV0YWNoRXZlbnQoXCJvblwiICsgZXZlbnQsIGxpc3RlbmVyKTtcbiAgICAgICAgX3dpbmRvdy5kZXRhY2hFdmVudChcIm9uXCIgKyBldmVudCwgbGlzdGVuZXIpO1xuICAgIH1cbn07XG5cblxudmFyIG9uX3VubG9hZCA9IHt9O1xuLy8gVGhpbmdzIHJlZ2lzdGVyZWQgYWZ0ZXIgYmVmb3JldW5sb2FkIGFyZSB0byBiZSBjYWxsZWQgaW1tZWRpYXRlbHkuXG52YXIgYWZ0ZXJfdW5sb2FkID0gZmFsc2U7XG5cbnZhciB0cmlnZ2VyX3VubG9hZF9jYWxsYmFja3MgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IodmFyIHJlZiBpbiBvbl91bmxvYWQpIHtcbiAgICAgICAgb25fdW5sb2FkW3JlZl0oKTtcbiAgICAgICAgZGVsZXRlIG9uX3VubG9hZFtyZWZdO1xuICAgIH07XG59O1xuXG52YXIgdW5sb2FkX3RyaWdnZXJlZCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmKGFmdGVyX3VubG9hZCkgcmV0dXJuO1xuICAgIGFmdGVyX3VubG9hZCA9IHRydWU7XG4gICAgdHJpZ2dlcl91bmxvYWRfY2FsbGJhY2tzKCk7XG59O1xuXG4vLyBPbmJlZm9yZXVubG9hZCBhbG9uZSBpcyBub3QgcmVsaWFibGUuIFdlIGNvdWxkIHVzZSBvbmx5ICd1bmxvYWQnXG4vLyBidXQgaXQncyBub3Qgd29ya2luZyBpbiBvcGVyYSB3aXRoaW4gYW4gaWZyYW1lLiBMZXQncyB1c2UgYm90aC5cbnV0aWxzLmF0dGFjaEV2ZW50KCdiZWZvcmV1bmxvYWQnLCB1bmxvYWRfdHJpZ2dlcmVkKTtcbnV0aWxzLmF0dGFjaEV2ZW50KCd1bmxvYWQnLCB1bmxvYWRfdHJpZ2dlcmVkKTtcblxudXRpbHMudW5sb2FkX2FkZCA9IGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgdmFyIHJlZiA9IHV0aWxzLnJhbmRvbV9zdHJpbmcoOCk7XG4gICAgb25fdW5sb2FkW3JlZl0gPSBsaXN0ZW5lcjtcbiAgICBpZiAoYWZ0ZXJfdW5sb2FkKSB7XG4gICAgICAgIHV0aWxzLmRlbGF5KHRyaWdnZXJfdW5sb2FkX2NhbGxiYWNrcyk7XG4gICAgfVxuICAgIHJldHVybiByZWY7XG59O1xudXRpbHMudW5sb2FkX2RlbCA9IGZ1bmN0aW9uKHJlZikge1xuICAgIGlmIChyZWYgaW4gb25fdW5sb2FkKVxuICAgICAgICBkZWxldGUgb25fdW5sb2FkW3JlZl07XG59O1xuXG5cbnV0aWxzLmNyZWF0ZUlmcmFtZSA9IGZ1bmN0aW9uIChpZnJhbWVfdXJsLCBlcnJvcl9jYWxsYmFjaykge1xuICAgIHZhciBpZnJhbWUgPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gICAgdmFyIHRyZWYsIHVubG9hZF9yZWY7XG4gICAgdmFyIHVuYXR0YWNoID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0cmVmKTtcbiAgICAgICAgLy8gRXhwbG9yZXIgaGFkIHByb2JsZW1zIHdpdGggdGhhdC5cbiAgICAgICAgdHJ5IHtpZnJhbWUub25sb2FkID0gbnVsbDt9IGNhdGNoICh4KSB7fVxuICAgICAgICBpZnJhbWUub25lcnJvciA9IG51bGw7XG4gICAgfTtcbiAgICB2YXIgY2xlYW51cCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoaWZyYW1lKSB7XG4gICAgICAgICAgICB1bmF0dGFjaCgpO1xuICAgICAgICAgICAgLy8gVGhpcyB0aW1lb3V0IG1ha2VzIGNocm9tZSBmaXJlIG9uYmVmb3JldW5sb2FkIGV2ZW50XG4gICAgICAgICAgICAvLyB3aXRoaW4gaWZyYW1lLiBXaXRob3V0IHRoZSB0aW1lb3V0IGl0IGdvZXMgc3RyYWlnaHQgdG9cbiAgICAgICAgICAgIC8vIG9udW5sb2FkLlxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZihpZnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWZyYW1lLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWZyYW1lID0gbnVsbDtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgdXRpbHMudW5sb2FkX2RlbCh1bmxvYWRfcmVmKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIG9uZXJyb3IgPSBmdW5jdGlvbihyKSB7XG4gICAgICAgIGlmIChpZnJhbWUpIHtcbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIGVycm9yX2NhbGxiYWNrKHIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgcG9zdCA9IGZ1bmN0aW9uKG1zZywgb3JpZ2luKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHRoZSBpZnJhbWUgaXMgbm90IGxvYWRlZCwgSUUgcmFpc2VzIGFuIGV4Y2VwdGlvblxuICAgICAgICAgICAgLy8gb24gJ2NvbnRlbnRXaW5kb3cnLlxuICAgICAgICAgICAgaWYgKGlmcmFtZSAmJiBpZnJhbWUuY29udGVudFdpbmRvdykge1xuICAgICAgICAgICAgICAgIGlmcmFtZS5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKG1zZywgb3JpZ2luKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoeCkge307XG4gICAgfTtcblxuICAgIGlmcmFtZS5zcmMgPSBpZnJhbWVfdXJsO1xuICAgIGlmcmFtZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGlmcmFtZS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgaWZyYW1lLm9uZXJyb3IgPSBmdW5jdGlvbigpe29uZXJyb3IoJ29uZXJyb3InKTt9O1xuICAgIGlmcmFtZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gYG9ubG9hZGAgaXMgdHJpZ2dlcmVkIGJlZm9yZSBzY3JpcHRzIG9uIHRoZSBpZnJhbWUgYXJlXG4gICAgICAgIC8vIGV4ZWN1dGVkLiBHaXZlIGl0IGZldyBzZWNvbmRzIHRvIGFjdHVhbGx5IGxvYWQgc3R1ZmYuXG4gICAgICAgIGNsZWFyVGltZW91dCh0cmVmKTtcbiAgICAgICAgdHJlZiA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtvbmVycm9yKCdvbmxvYWQgdGltZW91dCcpO30sIDIwMDApO1xuICAgIH07XG4gICAgX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICB0cmVmID0gc2V0VGltZW91dChmdW5jdGlvbigpe29uZXJyb3IoJ3RpbWVvdXQnKTt9LCAxNTAwMCk7XG4gICAgdW5sb2FkX3JlZiA9IHV0aWxzLnVubG9hZF9hZGQoY2xlYW51cCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcG9zdDogcG9zdCxcbiAgICAgICAgY2xlYW51cDogY2xlYW51cCxcbiAgICAgICAgbG9hZGVkOiB1bmF0dGFjaFxuICAgIH07XG59O1xuXG51dGlscy5jcmVhdGVIdG1sZmlsZSA9IGZ1bmN0aW9uIChpZnJhbWVfdXJsLCBlcnJvcl9jYWxsYmFjaykge1xuICAgIHZhciBkb2MgPSBuZXcgQWN0aXZlWE9iamVjdCgnaHRtbGZpbGUnKTtcbiAgICB2YXIgdHJlZiwgdW5sb2FkX3JlZjtcbiAgICB2YXIgaWZyYW1lO1xuICAgIHZhciB1bmF0dGFjaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodHJlZik7XG4gICAgfTtcbiAgICB2YXIgY2xlYW51cCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoZG9jKSB7XG4gICAgICAgICAgICB1bmF0dGFjaCgpO1xuICAgICAgICAgICAgdXRpbHMudW5sb2FkX2RlbCh1bmxvYWRfcmVmKTtcbiAgICAgICAgICAgIGlmcmFtZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGlmcmFtZSk7XG4gICAgICAgICAgICBpZnJhbWUgPSBkb2MgPSBudWxsO1xuICAgICAgICAgICAgQ29sbGVjdEdhcmJhZ2UoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIG9uZXJyb3IgPSBmdW5jdGlvbihyKSAge1xuICAgICAgICBpZiAoZG9jKSB7XG4gICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICBlcnJvcl9jYWxsYmFjayhyKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIHBvc3QgPSBmdW5jdGlvbihtc2csIG9yaWdpbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB0aGUgaWZyYW1lIGlzIG5vdCBsb2FkZWQsIElFIHJhaXNlcyBhbiBleGNlcHRpb25cbiAgICAgICAgICAgIC8vIG9uICdjb250ZW50V2luZG93Jy5cbiAgICAgICAgICAgIGlmIChpZnJhbWUgJiYgaWZyYW1lLmNvbnRlbnRXaW5kb3cpIHtcbiAgICAgICAgICAgICAgICBpZnJhbWUuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZShtc2csIG9yaWdpbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKHgpIHt9O1xuICAgIH07XG5cbiAgICBkb2Mub3BlbigpO1xuICAgIGRvYy53cml0ZSgnPGh0bWw+PHMnICsgJ2NyaXB0PicgK1xuICAgICAgICAgICAgICAnZG9jdW1lbnQuZG9tYWluPVwiJyArIGRvY3VtZW50LmRvbWFpbiArICdcIjsnICtcbiAgICAgICAgICAgICAgJzwvcycgKyAnY3JpcHQ+PC9odG1sPicpO1xuICAgIGRvYy5jbG9zZSgpO1xuICAgIGRvYy5wYXJlbnRXaW5kb3dbV1ByZWZpeF0gPSBfd2luZG93W1dQcmVmaXhdO1xuICAgIHZhciBjID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRvYy5ib2R5LmFwcGVuZENoaWxkKGMpO1xuICAgIGlmcmFtZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICBjLmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgaWZyYW1lLnNyYyA9IGlmcmFtZV91cmw7XG4gICAgdHJlZiA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtvbmVycm9yKCd0aW1lb3V0Jyk7fSwgMTUwMDApO1xuICAgIHVubG9hZF9yZWYgPSB1dGlscy51bmxvYWRfYWRkKGNsZWFudXApO1xuICAgIHJldHVybiB7XG4gICAgICAgIHBvc3Q6IHBvc3QsXG4gICAgICAgIGNsZWFudXA6IGNsZWFudXAsXG4gICAgICAgIGxvYWRlZDogdW5hdHRhY2hcbiAgICB9O1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvZG9tLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi9kb20yLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgQWJzdHJhY3RYSFJPYmplY3QgPSBmdW5jdGlvbigpe307XG5BYnN0cmFjdFhIUk9iamVjdC5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKFsnY2h1bmsnLCAnZmluaXNoJ10pO1xuXG5BYnN0cmFjdFhIUk9iamVjdC5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24obWV0aG9kLCB1cmwsIHBheWxvYWQsIG9wdHMpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB0cnkge1xuICAgICAgICB0aGF0LnhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIH0gY2F0Y2goeCkge307XG5cbiAgICBpZiAoIXRoYXQueGhyKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGF0LnhociA9IG5ldyBfd2luZG93LkFjdGl2ZVhPYmplY3QoJ01pY3Jvc29mdC5YTUxIVFRQJyk7XG4gICAgICAgIH0gY2F0Y2goeCkge307XG4gICAgfVxuICAgIGlmIChfd2luZG93LkFjdGl2ZVhPYmplY3QgfHwgX3dpbmRvdy5YRG9tYWluUmVxdWVzdCkge1xuICAgICAgICAvLyBJRTggY2FjaGVzIGV2ZW4gUE9TVHNcbiAgICAgICAgdXJsICs9ICgodXJsLmluZGV4T2YoJz8nKSA9PT0gLTEpID8gJz8nIDogJyYnKSArICd0PScrKCtuZXcgRGF0ZSk7XG4gICAgfVxuXG4gICAgLy8gRXhwbG9yZXIgdGVuZHMgdG8ga2VlcCBjb25uZWN0aW9uIG9wZW4sIGV2ZW4gYWZ0ZXIgdGhlXG4gICAgLy8gdGFiIGdldHMgY2xvc2VkOiBodHRwOi8vYnVncy5qcXVlcnkuY29tL3RpY2tldC81MjgwXG4gICAgdGhhdC51bmxvYWRfcmVmID0gdXRpbHMudW5sb2FkX2FkZChmdW5jdGlvbigpe3RoYXQuX2NsZWFudXAodHJ1ZSk7fSk7XG4gICAgdHJ5IHtcbiAgICAgICAgdGhhdC54aHIub3BlbihtZXRob2QsIHVybCwgdHJ1ZSk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICAgIC8vIElFIHJhaXNlcyBhbiBleGNlcHRpb24gb24gd3JvbmcgcG9ydC5cbiAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnLCAwLCAnJyk7XG4gICAgICAgIHRoYXQuX2NsZWFudXAoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH07XG5cbiAgICBpZiAoIW9wdHMgfHwgIW9wdHMubm9fY3JlZGVudGlhbHMpIHtcbiAgICAgICAgLy8gTW96aWxsYSBkb2NzIHNheXMgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vWE1MSHR0cFJlcXVlc3QgOlxuICAgICAgICAvLyBcIlRoaXMgbmV2ZXIgYWZmZWN0cyBzYW1lLXNpdGUgcmVxdWVzdHMuXCJcbiAgICAgICAgdGhhdC54aHIud2l0aENyZWRlbnRpYWxzID0gJ3RydWUnO1xuICAgIH1cbiAgICBpZiAob3B0cyAmJiBvcHRzLmhlYWRlcnMpIHtcbiAgICAgICAgZm9yKHZhciBrZXkgaW4gb3B0cy5oZWFkZXJzKSB7XG4gICAgICAgICAgICB0aGF0Lnhoci5zZXRSZXF1ZXN0SGVhZGVyKGtleSwgb3B0cy5oZWFkZXJzW2tleV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhhdC54aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGF0Lnhocikge1xuICAgICAgICAgICAgdmFyIHggPSB0aGF0LnhocjtcbiAgICAgICAgICAgIHN3aXRjaCAoeC5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgLy8gSUUgZG9lc24ndCBsaWtlIHBlZWtpbmcgaW50byByZXNwb25zZVRleHQgb3Igc3RhdHVzXG4gICAgICAgICAgICAgICAgLy8gb24gTWljcm9zb2Z0LlhNTEhUVFAgYW5kIHJlYWR5c3RhdGU9M1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdGF0dXMgPSB4LnN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRleHQgPSB4LnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICB9IGNhdGNoICh4KSB7fTtcbiAgICAgICAgICAgICAgICAvLyBJRSBkb2VzIHJldHVybiByZWFkeXN0YXRlID09IDMgZm9yIDQwNCBhbnN3ZXJzLlxuICAgICAgICAgICAgICAgIGlmICh0ZXh0ICYmIHRleHQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LmVtaXQoJ2NodW5rJywgc3RhdHVzLCB0ZXh0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnLCB4LnN0YXR1cywgeC5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgIHRoYXQuX2NsZWFudXAoZmFsc2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGF0Lnhoci5zZW5kKHBheWxvYWQpO1xufTtcblxuQWJzdHJhY3RYSFJPYmplY3QucHJvdG90eXBlLl9jbGVhbnVwID0gZnVuY3Rpb24oYWJvcnQpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKCF0aGF0LnhocikgcmV0dXJuO1xuICAgIHV0aWxzLnVubG9hZF9kZWwodGhhdC51bmxvYWRfcmVmKTtcblxuICAgIC8vIElFIG5lZWRzIHRoaXMgZmllbGQgdG8gYmUgYSBmdW5jdGlvblxuICAgIHRoYXQueGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCl7fTtcblxuICAgIGlmIChhYm9ydCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhhdC54aHIuYWJvcnQoKTtcbiAgICAgICAgfSBjYXRjaCh4KSB7fTtcbiAgICB9XG4gICAgdGhhdC51bmxvYWRfcmVmID0gdGhhdC54aHIgPSBudWxsO1xufTtcblxuQWJzdHJhY3RYSFJPYmplY3QucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQubnVrZSgpO1xuICAgIHRoYXQuX2NsZWFudXAodHJ1ZSk7XG59O1xuXG52YXIgWEhSQ29yc09iamVjdCA9IHV0aWxzLlhIUkNvcnNPYmplY3QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgdXRpbHMuZGVsYXkoZnVuY3Rpb24oKXt0aGF0Ll9zdGFydC5hcHBseSh0aGF0LCBhcmdzKTt9KTtcbn07XG5YSFJDb3JzT2JqZWN0LnByb3RvdHlwZSA9IG5ldyBBYnN0cmFjdFhIUk9iamVjdCgpO1xuXG52YXIgWEhSTG9jYWxPYmplY3QgPSB1dGlscy5YSFJMb2NhbE9iamVjdCA9IGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBwYXlsb2FkKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHV0aWxzLmRlbGF5KGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoYXQuX3N0YXJ0KG1ldGhvZCwgdXJsLCBwYXlsb2FkLCB7XG4gICAgICAgICAgICBub19jcmVkZW50aWFsczogdHJ1ZVxuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5YSFJMb2NhbE9iamVjdC5wcm90b3R5cGUgPSBuZXcgQWJzdHJhY3RYSFJPYmplY3QoKTtcblxuXG5cbi8vIFJlZmVyZW5jZXM6XG4vLyAgIGh0dHA6Ly9hamF4aWFuLmNvbS9hcmNoaXZlcy8xMDAtbGluZS1hamF4LXdyYXBwZXJcbi8vICAgaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2NjMjg4MDYwKHY9VlMuODUpLmFzcHhcbnZhciBYRFJPYmplY3QgPSB1dGlscy5YRFJPYmplY3QgPSBmdW5jdGlvbihtZXRob2QsIHVybCwgcGF5bG9hZCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB1dGlscy5kZWxheShmdW5jdGlvbigpe3RoYXQuX3N0YXJ0KG1ldGhvZCwgdXJsLCBwYXlsb2FkKTt9KTtcbn07XG5YRFJPYmplY3QucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcihbJ2NodW5rJywgJ2ZpbmlzaCddKTtcblhEUk9iamVjdC5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24obWV0aG9kLCB1cmwsIHBheWxvYWQpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHhkciA9IG5ldyBYRG9tYWluUmVxdWVzdCgpO1xuICAgIC8vIElFIGNhY2hlcyBldmVuIFBPU1RzXG4gICAgdXJsICs9ICgodXJsLmluZGV4T2YoJz8nKSA9PT0gLTEpID8gJz8nIDogJyYnKSArICd0PScrKCtuZXcgRGF0ZSk7XG5cbiAgICB2YXIgb25lcnJvciA9IHhkci5vbnRpbWVvdXQgPSB4ZHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcsIDAsICcnKTtcbiAgICAgICAgdGhhdC5fY2xlYW51cChmYWxzZSk7XG4gICAgfTtcbiAgICB4ZHIub25wcm9ncmVzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGF0LmVtaXQoJ2NodW5rJywgMjAwLCB4ZHIucmVzcG9uc2VUZXh0KTtcbiAgICB9O1xuICAgIHhkci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnLCAyMDAsIHhkci5yZXNwb25zZVRleHQpO1xuICAgICAgICB0aGF0Ll9jbGVhbnVwKGZhbHNlKTtcbiAgICB9O1xuICAgIHRoYXQueGRyID0geGRyO1xuICAgIHRoYXQudW5sb2FkX3JlZiA9IHV0aWxzLnVubG9hZF9hZGQoZnVuY3Rpb24oKXt0aGF0Ll9jbGVhbnVwKHRydWUpO30pO1xuICAgIHRyeSB7XG4gICAgICAgIC8vIEZhaWxzIHdpdGggQWNjZXNzRGVuaWVkIGlmIHBvcnQgbnVtYmVyIGlzIGJvZ3VzXG4gICAgICAgIHRoYXQueGRyLm9wZW4obWV0aG9kLCB1cmwpO1xuICAgICAgICB0aGF0Lnhkci5zZW5kKHBheWxvYWQpO1xuICAgIH0gY2F0Y2goeCkge1xuICAgICAgICBvbmVycm9yKCk7XG4gICAgfVxufTtcblxuWERST2JqZWN0LnByb3RvdHlwZS5fY2xlYW51cCA9IGZ1bmN0aW9uKGFib3J0KSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICghdGhhdC54ZHIpIHJldHVybjtcbiAgICB1dGlscy51bmxvYWRfZGVsKHRoYXQudW5sb2FkX3JlZik7XG5cbiAgICB0aGF0Lnhkci5vbnRpbWVvdXQgPSB0aGF0Lnhkci5vbmVycm9yID0gdGhhdC54ZHIub25wcm9ncmVzcyA9XG4gICAgICAgIHRoYXQueGRyLm9ubG9hZCA9IG51bGw7XG4gICAgaWYgKGFib3J0KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGF0Lnhkci5hYm9ydCgpO1xuICAgICAgICB9IGNhdGNoKHgpIHt9O1xuICAgIH1cbiAgICB0aGF0LnVubG9hZF9yZWYgPSB0aGF0LnhkciA9IG51bGw7XG59O1xuXG5YRFJPYmplY3QucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQubnVrZSgpO1xuICAgIHRoYXQuX2NsZWFudXAodHJ1ZSk7XG59O1xuXG4vLyAxLiBJcyBuYXRpdmVseSB2aWEgWEhSXG4vLyAyLiBJcyBuYXRpdmVseSB2aWEgWERSXG4vLyAzLiBOb3BlLCBidXQgcG9zdE1lc3NhZ2UgaXMgdGhlcmUgc28gaXQgc2hvdWxkIHdvcmsgdmlhIHRoZSBJZnJhbWUuXG4vLyA0LiBOb3BlLCBzb3JyeS5cbnV0aWxzLmlzWEhSQ29yc0NhcGFibGUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoX3dpbmRvdy5YTUxIdHRwUmVxdWVzdCAmJiAnd2l0aENyZWRlbnRpYWxzJyBpbiBuZXcgWE1MSHR0cFJlcXVlc3QoKSkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgLy8gWERvbWFpblJlcXVlc3QgZG9lc24ndCB3b3JrIGlmIHBhZ2UgaXMgc2VydmVkIGZyb20gZmlsZTovL1xuICAgIGlmIChfd2luZG93LlhEb21haW5SZXF1ZXN0ICYmIF9kb2N1bWVudC5kb21haW4pIHtcbiAgICAgICAgcmV0dXJuIDI7XG4gICAgfVxuICAgIGlmIChJZnJhbWVUcmFuc3BvcnQuZW5hYmxlZCgpKSB7XG4gICAgICAgIHJldHVybiAzO1xuICAgIH1cbiAgICByZXR1cm4gNDtcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL2RvbTIuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3NvY2tqcy5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIFNvY2tKUyA9IGZ1bmN0aW9uKHVybCwgZGVwX3Byb3RvY29sc193aGl0ZWxpc3QsIG9wdGlvbnMpIHtcbiAgICBpZiAodGhpcyA9PT0gd2luZG93KSB7XG4gICAgICAgIC8vIG1ha2VzIGBuZXdgIG9wdGlvbmFsXG4gICAgICAgIHJldHVybiBuZXcgU29ja0pTKHVybCwgZGVwX3Byb3RvY29sc193aGl0ZWxpc3QsIG9wdGlvbnMpO1xuICAgIH1cbiAgICBcbiAgICB2YXIgdGhhdCA9IHRoaXMsIHByb3RvY29sc193aGl0ZWxpc3Q7XG4gICAgdGhhdC5fb3B0aW9ucyA9IHtkZXZlbDogZmFsc2UsIGRlYnVnOiBmYWxzZSwgcHJvdG9jb2xzX3doaXRlbGlzdDogW10sXG4gICAgICAgICAgICAgICAgICAgICBpbmZvOiB1bmRlZmluZWQsIHJ0dDogdW5kZWZpbmVkfTtcbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgICB1dGlscy5vYmplY3RFeHRlbmQodGhhdC5fb3B0aW9ucywgb3B0aW9ucyk7XG4gICAgfVxuICAgIHRoYXQuX2Jhc2VfdXJsID0gdXRpbHMuYW1lbmRVcmwodXJsKTtcbiAgICB0aGF0Ll9zZXJ2ZXIgPSB0aGF0Ll9vcHRpb25zLnNlcnZlciB8fCB1dGlscy5yYW5kb21fbnVtYmVyX3N0cmluZygxMDAwKTtcbiAgICBpZiAodGhhdC5fb3B0aW9ucy5wcm90b2NvbHNfd2hpdGVsaXN0ICYmXG4gICAgICAgIHRoYXQuX29wdGlvbnMucHJvdG9jb2xzX3doaXRlbGlzdC5sZW5ndGgpIHtcbiAgICAgICAgcHJvdG9jb2xzX3doaXRlbGlzdCA9IHRoYXQuX29wdGlvbnMucHJvdG9jb2xzX3doaXRlbGlzdDtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBEZXByZWNhdGVkIEFQSVxuICAgICAgICBpZiAodHlwZW9mIGRlcF9wcm90b2NvbHNfd2hpdGVsaXN0ID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgICAgZGVwX3Byb3RvY29sc193aGl0ZWxpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcHJvdG9jb2xzX3doaXRlbGlzdCA9IFtkZXBfcHJvdG9jb2xzX3doaXRlbGlzdF07XG4gICAgICAgIH0gZWxzZSBpZiAodXRpbHMuaXNBcnJheShkZXBfcHJvdG9jb2xzX3doaXRlbGlzdCkpIHtcbiAgICAgICAgICAgIHByb3RvY29sc193aGl0ZWxpc3QgPSBkZXBfcHJvdG9jb2xzX3doaXRlbGlzdFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvdG9jb2xzX3doaXRlbGlzdCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb3RvY29sc193aGl0ZWxpc3QpIHtcbiAgICAgICAgICAgIHRoYXQuX2RlYnVnKCdEZXByZWNhdGVkIEFQSTogVXNlIFwicHJvdG9jb2xzX3doaXRlbGlzdFwiIG9wdGlvbiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdpbnN0ZWFkIG9mIHN1cHBseWluZyBwcm90b2NvbCBsaXN0IGFzIGEgc2Vjb25kICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3BhcmFtZXRlciB0byBTb2NrSlMgY29uc3RydWN0b3IuJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhhdC5fcHJvdG9jb2xzID0gW107XG4gICAgdGhhdC5wcm90b2NvbCA9IG51bGw7XG4gICAgdGhhdC5yZWFkeVN0YXRlID0gU29ja0pTLkNPTk5FQ1RJTkc7XG4gICAgdGhhdC5faXIgPSBjcmVhdGVJbmZvUmVjZWl2ZXIodGhhdC5fYmFzZV91cmwpO1xuICAgIHRoYXQuX2lyLm9uZmluaXNoID0gZnVuY3Rpb24oaW5mbywgcnR0KSB7XG4gICAgICAgIHRoYXQuX2lyID0gbnVsbDtcbiAgICAgICAgaWYgKGluZm8pIHtcbiAgICAgICAgICAgIGlmICh0aGF0Ll9vcHRpb25zLmluZm8pIHtcbiAgICAgICAgICAgICAgICAvLyBPdmVycmlkZSBpZiB1c2VyIHN1cHBsaWVzIHRoZSBvcHRpb25cbiAgICAgICAgICAgICAgICBpbmZvID0gdXRpbHMub2JqZWN0RXh0ZW5kKGluZm8sIHRoYXQuX29wdGlvbnMuaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhhdC5fb3B0aW9ucy5ydHQpIHtcbiAgICAgICAgICAgICAgICBydHQgPSB0aGF0Ll9vcHRpb25zLnJ0dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoYXQuX2FwcGx5SW5mbyhpbmZvLCBydHQsIHByb3RvY29sc193aGl0ZWxpc3QpO1xuICAgICAgICAgICAgdGhhdC5fZGlkQ2xvc2UoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoYXQuX2RpZENsb3NlKDEwMDIsICdDYW5cXCd0IGNvbm5lY3QgdG8gc2VydmVyJywgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcbi8vIEluaGVyaXRhbmNlXG5Tb2NrSlMucHJvdG90eXBlID0gbmV3IFJFdmVudFRhcmdldCgpO1xuXG5Tb2NrSlMudmVyc2lvbiA9IFwiMC4zLjEuNy5nYTY3Zi5kaXJ0eVwiO1xuXG5Tb2NrSlMuQ09OTkVDVElORyA9IDA7XG5Tb2NrSlMuT1BFTiA9IDE7XG5Tb2NrSlMuQ0xPU0lORyA9IDI7XG5Tb2NrSlMuQ0xPU0VEID0gMztcblxuU29ja0pTLnByb3RvdHlwZS5fZGVidWcgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fb3B0aW9ucy5kZWJ1ZylcbiAgICAgICAgdXRpbHMubG9nLmFwcGx5KHV0aWxzLCBhcmd1bWVudHMpO1xufTtcblxuU29ja0pTLnByb3RvdHlwZS5fZGlzcGF0Y2hPcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnJlYWR5U3RhdGUgPT09IFNvY2tKUy5DT05ORUNUSU5HKSB7XG4gICAgICAgIGlmICh0aGF0Ll90cmFuc3BvcnRfdHJlZikge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoYXQuX3RyYW5zcG9ydF90cmVmKTtcbiAgICAgICAgICAgIHRoYXQuX3RyYW5zcG9ydF90cmVmID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGF0LnJlYWR5U3RhdGUgPSBTb2NrSlMuT1BFTjtcbiAgICAgICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudChcIm9wZW5cIikpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoZSBzZXJ2ZXIgbWlnaHQgaGF2ZSBiZWVuIHJlc3RhcnRlZCwgYW5kIGxvc3QgdHJhY2sgb2Ygb3VyXG4gICAgICAgIC8vIGNvbm5lY3Rpb24uXG4gICAgICAgIHRoYXQuX2RpZENsb3NlKDEwMDYsIFwiU2VydmVyIGxvc3Qgc2Vzc2lvblwiKTtcbiAgICB9XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLl9kaXNwYXRjaE1lc3NhZ2UgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnJlYWR5U3RhdGUgIT09IFNvY2tKUy5PUEVOKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoXCJtZXNzYWdlXCIsIHtkYXRhOiBkYXRhfSkpO1xufTtcblxuU29ja0pTLnByb3RvdHlwZS5fZGlzcGF0Y2hIZWFydGJlYXQgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnJlYWR5U3RhdGUgIT09IFNvY2tKUy5PUEVOKVxuICAgICAgICByZXR1cm47XG4gICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudCgnaGVhcnRiZWF0Jywge30pKTtcbn07XG5cblNvY2tKUy5wcm90b3R5cGUuX2RpZENsb3NlID0gZnVuY3Rpb24oY29kZSwgcmVhc29uLCBmb3JjZSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5yZWFkeVN0YXRlICE9PSBTb2NrSlMuQ09OTkVDVElORyAmJlxuICAgICAgICB0aGF0LnJlYWR5U3RhdGUgIT09IFNvY2tKUy5PUEVOICYmXG4gICAgICAgIHRoYXQucmVhZHlTdGF0ZSAhPT0gU29ja0pTLkNMT1NJTkcpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lOVkFMSURfU1RBVEVfRVJSJyk7XG4gICAgaWYgKHRoYXQuX2lyKSB7XG4gICAgICAgIHRoYXQuX2lyLm51a2UoKTtcbiAgICAgICAgdGhhdC5faXIgPSBudWxsO1xuICAgIH1cblxuICAgIGlmICh0aGF0Ll90cmFuc3BvcnQpIHtcbiAgICAgICAgdGhhdC5fdHJhbnNwb3J0LmRvQ2xlYW51cCgpO1xuICAgICAgICB0aGF0Ll90cmFuc3BvcnQgPSBudWxsO1xuICAgIH1cblxuICAgIHZhciBjbG9zZV9ldmVudCA9IG5ldyBTaW1wbGVFdmVudChcImNsb3NlXCIsIHtcbiAgICAgICAgY29kZTogY29kZSxcbiAgICAgICAgcmVhc29uOiByZWFzb24sXG4gICAgICAgIHdhc0NsZWFuOiB1dGlscy51c2VyU2V0Q29kZShjb2RlKX0pO1xuXG4gICAgaWYgKCF1dGlscy51c2VyU2V0Q29kZShjb2RlKSAmJlxuICAgICAgICB0aGF0LnJlYWR5U3RhdGUgPT09IFNvY2tKUy5DT05ORUNUSU5HICYmICFmb3JjZSkge1xuICAgICAgICBpZiAodGhhdC5fdHJ5X25leHRfcHJvdG9jb2woY2xvc2VfZXZlbnQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY2xvc2VfZXZlbnQgPSBuZXcgU2ltcGxlRXZlbnQoXCJjbG9zZVwiLCB7Y29kZTogMjAwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlYXNvbjogXCJBbGwgdHJhbnNwb3J0cyBmYWlsZWRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdhc0NsZWFuOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RfZXZlbnQ6IGNsb3NlX2V2ZW50fSk7XG4gICAgfVxuICAgIHRoYXQucmVhZHlTdGF0ZSA9IFNvY2tKUy5DTE9TRUQ7XG5cbiAgICB1dGlscy5kZWxheShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICB0aGF0LmRpc3BhdGNoRXZlbnQoY2xvc2VfZXZlbnQpO1xuICAgICAgICAgICAgICAgIH0pO1xufTtcblxuU29ja0pTLnByb3RvdHlwZS5fZGlkTWVzc2FnZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHR5cGUgPSBkYXRhLnNsaWNlKDAsIDEpO1xuICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgY2FzZSAnbyc6XG4gICAgICAgIHRoYXQuX2Rpc3BhdGNoT3BlbigpO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlICdhJzpcbiAgICAgICAgdmFyIHBheWxvYWQgPSBKU09OLnBhcnNlKGRhdGEuc2xpY2UoMSkgfHwgJ1tdJyk7XG4gICAgICAgIGZvcih2YXIgaT0wOyBpIDwgcGF5bG9hZC5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICB0aGF0Ll9kaXNwYXRjaE1lc3NhZ2UocGF5bG9hZFtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbSc6XG4gICAgICAgIHZhciBwYXlsb2FkID0gSlNPTi5wYXJzZShkYXRhLnNsaWNlKDEpIHx8ICdudWxsJyk7XG4gICAgICAgIHRoYXQuX2Rpc3BhdGNoTWVzc2FnZShwYXlsb2FkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSAnYyc6XG4gICAgICAgIHZhciBwYXlsb2FkID0gSlNPTi5wYXJzZShkYXRhLnNsaWNlKDEpIHx8ICdbXScpO1xuICAgICAgICB0aGF0Ll9kaWRDbG9zZShwYXlsb2FkWzBdLCBwYXlsb2FkWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSAnaCc6XG4gICAgICAgIHRoYXQuX2Rpc3BhdGNoSGVhcnRiZWF0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cblNvY2tKUy5wcm90b3R5cGUuX3RyeV9uZXh0X3Byb3RvY29sID0gZnVuY3Rpb24oY2xvc2VfZXZlbnQpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQucHJvdG9jb2wpIHtcbiAgICAgICAgdGhhdC5fZGVidWcoJ0Nsb3NlZCB0cmFuc3BvcnQ6JywgdGhhdC5wcm90b2NvbCwgJycrY2xvc2VfZXZlbnQpO1xuICAgICAgICB0aGF0LnByb3RvY29sID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoYXQuX3RyYW5zcG9ydF90cmVmKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGF0Ll90cmFuc3BvcnRfdHJlZik7XG4gICAgICAgIHRoYXQuX3RyYW5zcG9ydF90cmVmID0gbnVsbDtcbiAgICB9XG5cbiAgICB3aGlsZSgxKSB7XG4gICAgICAgIHZhciBwcm90b2NvbCA9IHRoYXQucHJvdG9jb2wgPSB0aGF0Ll9wcm90b2NvbHMuc2hpZnQoKTtcbiAgICAgICAgaWYgKCFwcm90b2NvbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNvbWUgcHJvdG9jb2xzIHJlcXVpcmUgYWNjZXNzIHRvIGBib2R5YCwgd2hhdCBpZiB3ZXJlIGluXG4gICAgICAgIC8vIHRoZSBgaGVhZGA/XG4gICAgICAgIGlmIChTb2NrSlNbcHJvdG9jb2xdICYmXG4gICAgICAgICAgICBTb2NrSlNbcHJvdG9jb2xdLm5lZWRfYm9keSA9PT0gdHJ1ZSAmJlxuICAgICAgICAgICAgKCFfZG9jdW1lbnQuYm9keSB8fFxuICAgICAgICAgICAgICh0eXBlb2YgX2RvY3VtZW50LnJlYWR5U3RhdGUgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAgICAgICYmIF9kb2N1bWVudC5yZWFkeVN0YXRlICE9PSAnY29tcGxldGUnKSkpIHtcbiAgICAgICAgICAgIHRoYXQuX3Byb3RvY29scy51bnNoaWZ0KHByb3RvY29sKTtcbiAgICAgICAgICAgIHRoYXQucHJvdG9jb2wgPSAnd2FpdGluZy1mb3ItbG9hZCc7XG4gICAgICAgICAgICB1dGlscy5hdHRhY2hFdmVudCgnbG9hZCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgdGhhdC5fdHJ5X25leHRfcHJvdG9jb2woKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIVNvY2tKU1twcm90b2NvbF0gfHxcbiAgICAgICAgICAgICAgIVNvY2tKU1twcm90b2NvbF0uZW5hYmxlZCh0aGF0Ll9vcHRpb25zKSkge1xuICAgICAgICAgICAgdGhhdC5fZGVidWcoJ1NraXBwaW5nIHRyYW5zcG9ydDonLCBwcm90b2NvbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgcm91bmRUcmlwcyA9IFNvY2tKU1twcm90b2NvbF0ucm91bmRUcmlwcyB8fCAxO1xuICAgICAgICAgICAgdmFyIHRvID0gKCh0aGF0Ll9vcHRpb25zLnJ0byB8fCAwKSAqIHJvdW5kVHJpcHMpIHx8IDUwMDA7XG4gICAgICAgICAgICB0aGF0Ll90cmFuc3BvcnRfdHJlZiA9IHV0aWxzLmRlbGF5KHRvLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5yZWFkeVN0YXRlID09PSBTb2NrSlMuQ09OTkVDVElORykge1xuICAgICAgICAgICAgICAgICAgICAvLyBJIGNhbid0IHVuZGVyc3RhbmQgaG93IGl0IGlzIHBvc3NpYmxlIHRvIHJ1blxuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHRpbWVyLCB3aGVuIHRoZSBzdGF0ZSBpcyBDTE9TRUQsIGJ1dFxuICAgICAgICAgICAgICAgICAgICAvLyBhcHBhcmVudGx5IGluIElFIGV2ZXJ5dGhpbiBpcyBwb3NzaWJsZS5cbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fZGlkQ2xvc2UoMjAwNywgXCJUcmFuc3BvcnQgdGltZW91dGVkXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgY29ubmlkID0gdXRpbHMucmFuZG9tX3N0cmluZyg4KTtcbiAgICAgICAgICAgIHZhciB0cmFuc191cmwgPSB0aGF0Ll9iYXNlX3VybCArICcvJyArIHRoYXQuX3NlcnZlciArICcvJyArIGNvbm5pZDtcbiAgICAgICAgICAgIHRoYXQuX2RlYnVnKCdPcGVuaW5nIHRyYW5zcG9ydDonLCBwcm90b2NvbCwgJyB1cmw6Jyt0cmFuc191cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAnIFJUTzonK3RoYXQuX29wdGlvbnMucnRvKTtcbiAgICAgICAgICAgIHRoYXQuX3RyYW5zcG9ydCA9IG5ldyBTb2NrSlNbcHJvdG9jb2xdKHRoYXQsIHRyYW5zX3VybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX2Jhc2VfdXJsKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuU29ja0pTLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKGNvZGUsIHJlYXNvbikge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAoY29kZSAmJiAhdXRpbHMudXNlclNldENvZGUoY29kZSkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIklOVkFMSURfQUNDRVNTX0VSUlwiKTtcbiAgICBpZih0aGF0LnJlYWR5U3RhdGUgIT09IFNvY2tKUy5DT05ORUNUSU5HICYmXG4gICAgICAgdGhhdC5yZWFkeVN0YXRlICE9PSBTb2NrSlMuT1BFTikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoYXQucmVhZHlTdGF0ZSA9IFNvY2tKUy5DTE9TSU5HO1xuICAgIHRoYXQuX2RpZENsb3NlKGNvZGUgfHwgMTAwMCwgcmVhc29uIHx8IFwiTm9ybWFsIGNsb3N1cmVcIik7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnJlYWR5U3RhdGUgPT09IFNvY2tKUy5DT05ORUNUSU5HKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lOVkFMSURfU1RBVEVfRVJSJyk7XG4gICAgaWYgKHRoYXQucmVhZHlTdGF0ZSA9PT0gU29ja0pTLk9QRU4pIHtcbiAgICAgICAgdGhhdC5fdHJhbnNwb3J0LmRvU2VuZCh1dGlscy5xdW90ZSgnJyArIGRhdGEpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5Tb2NrSlMucHJvdG90eXBlLl9hcHBseUluZm8gPSBmdW5jdGlvbihpbmZvLCBydHQsIHByb3RvY29sc193aGl0ZWxpc3QpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5fb3B0aW9ucy5pbmZvID0gaW5mbztcbiAgICB0aGF0Ll9vcHRpb25zLnJ0dCA9IHJ0dDtcbiAgICB0aGF0Ll9vcHRpb25zLnJ0byA9IHV0aWxzLmNvdW50UlRPKHJ0dCk7XG4gICAgdGhhdC5fb3B0aW9ucy5pbmZvLm51bGxfb3JpZ2luID0gIV9kb2N1bWVudC5kb21haW47XG4gICAgdmFyIHByb2JlZCA9IHV0aWxzLnByb2JlUHJvdG9jb2xzKCk7XG4gICAgdGhhdC5fcHJvdG9jb2xzID0gdXRpbHMuZGV0ZWN0UHJvdG9jb2xzKHByb2JlZCwgcHJvdG9jb2xzX3doaXRlbGlzdCwgaW5mbyk7XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi9zb2NranMuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLXdlYnNvY2tldC5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIFdlYlNvY2tldFRyYW5zcG9ydCA9IFNvY2tKUy53ZWJzb2NrZXQgPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciB1cmwgPSB0cmFuc191cmwgKyAnL3dlYnNvY2tldCc7XG4gICAgaWYgKHVybC5zbGljZSgwLCA1KSA9PT0gJ2h0dHBzJykge1xuICAgICAgICB1cmwgPSAnd3NzJyArIHVybC5zbGljZSg1KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgPSAnd3MnICsgdXJsLnNsaWNlKDQpO1xuICAgIH1cbiAgICB0aGF0LnJpID0gcmk7XG4gICAgdGhhdC51cmwgPSB1cmw7XG4gICAgdmFyIENvbnN0cnVjdG9yID0gX3dpbmRvdy5XZWJTb2NrZXQgfHwgX3dpbmRvdy5Nb3pXZWJTb2NrZXQ7XG5cbiAgICB0aGF0LndzID0gbmV3IENvbnN0cnVjdG9yKHRoYXQudXJsKTtcbiAgICB0aGF0LndzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdGhhdC5yaS5fZGlkTWVzc2FnZShlLmRhdGEpO1xuICAgIH07XG4gICAgLy8gRmlyZWZveCBoYXMgYW4gaW50ZXJlc3RpbmcgYnVnLiBJZiBhIHdlYnNvY2tldCBjb25uZWN0aW9uIGlzXG4gICAgLy8gY3JlYXRlZCBhZnRlciBvbmJlZm9yZXVubG9hZCwgaXQgc3RheXMgYWxpdmUgZXZlbiB3aGVuIHVzZXJcbiAgICAvLyBuYXZpZ2F0ZXMgYXdheSBmcm9tIHRoZSBwYWdlLiBJbiBzdWNoIHNpdHVhdGlvbiBsZXQncyBsaWUgLVxuICAgIC8vIGxldCdzIG5vdCBvcGVuIHRoZSB3cyBjb25uZWN0aW9uIGF0IGFsbC4gU2VlOlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9zb2NranMvc29ja2pzLWNsaWVudC9pc3N1ZXMvMjhcbiAgICAvLyBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTYwODVcbiAgICB0aGF0LnVubG9hZF9yZWYgPSB1dGlscy51bmxvYWRfYWRkKGZ1bmN0aW9uKCl7dGhhdC53cy5jbG9zZSgpfSk7XG4gICAgdGhhdC53cy5vbmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoYXQucmkuX2RpZE1lc3NhZ2UodXRpbHMuY2xvc2VGcmFtZSgxMDA2LCBcIldlYlNvY2tldCBjb25uZWN0aW9uIGJyb2tlblwiKSk7XG4gICAgfTtcbn07XG5cbldlYlNvY2tldFRyYW5zcG9ydC5wcm90b3R5cGUuZG9TZW5kID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHRoaXMud3Muc2VuZCgnWycgKyBkYXRhICsgJ10nKTtcbn07XG5cbldlYlNvY2tldFRyYW5zcG9ydC5wcm90b3R5cGUuZG9DbGVhbnVwID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHZhciB3cyA9IHRoYXQud3M7XG4gICAgaWYgKHdzKSB7XG4gICAgICAgIHdzLm9ubWVzc2FnZSA9IHdzLm9uY2xvc2UgPSBudWxsO1xuICAgICAgICB3cy5jbG9zZSgpO1xuICAgICAgICB1dGlscy51bmxvYWRfZGVsKHRoYXQudW5sb2FkX3JlZik7XG4gICAgICAgIHRoYXQudW5sb2FkX3JlZiA9IHRoYXQucmkgPSB0aGF0LndzID0gbnVsbDtcbiAgICB9XG59O1xuXG5XZWJTb2NrZXRUcmFuc3BvcnQuZW5hYmxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAhIShfd2luZG93LldlYlNvY2tldCB8fCBfd2luZG93Lk1veldlYlNvY2tldCk7XG59O1xuXG4vLyBJbiB0aGVvcnksIHdzIHNob3VsZCByZXF1aXJlIDEgcm91bmQgdHJpcC4gQnV0IGluIGNocm9tZSwgdGhpcyBpc1xuLy8gbm90IHZlcnkgc3RhYmxlIG92ZXIgU1NMLiBNb3N0IGxpa2VseSBhIHdzIGNvbm5lY3Rpb24gcmVxdWlyZXMgYVxuLy8gc2VwYXJhdGUgU1NMIGNvbm5lY3Rpb24sIGluIHdoaWNoIGNhc2UgMiByb3VuZCB0cmlwcyBhcmUgYW5cbi8vIGFic29sdXRlIG1pbnVtdW0uXG5XZWJTb2NrZXRUcmFuc3BvcnQucm91bmRUcmlwcyA9IDI7XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLXdlYnNvY2tldC5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtc2VuZGVyLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgQnVmZmVyZWRTZW5kZXIgPSBmdW5jdGlvbigpIHt9O1xuQnVmZmVyZWRTZW5kZXIucHJvdG90eXBlLnNlbmRfY29uc3RydWN0b3IgPSBmdW5jdGlvbihzZW5kZXIpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5zZW5kX2J1ZmZlciA9IFtdO1xuICAgIHRoYXQuc2VuZGVyID0gc2VuZGVyO1xufTtcbkJ1ZmZlcmVkU2VuZGVyLnByb3RvdHlwZS5kb1NlbmQgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQuc2VuZF9idWZmZXIucHVzaChtZXNzYWdlKTtcbiAgICBpZiAoIXRoYXQuc2VuZF9zdG9wKSB7XG4gICAgICAgIHRoYXQuc2VuZF9zY2hlZHVsZSgpO1xuICAgIH1cbn07XG5cbi8vIEZvciBwb2xsaW5nIHRyYW5zcG9ydHMgaW4gYSBzaXR1YXRpb24gd2hlbiBpbiB0aGUgbWVzc2FnZSBjYWxsYmFjayxcbi8vIG5ldyBtZXNzYWdlIGlzIGJlaW5nIHNlbmQuIElmIHRoZSBzZW5kaW5nIGNvbm5lY3Rpb24gd2FzIHN0YXJ0ZWRcbi8vIGJlZm9yZSByZWNlaXZpbmcgb25lLCBpdCBpcyBwb3NzaWJsZSB0byBzYXR1cmF0ZSB0aGUgbmV0d29yayBhbmRcbi8vIHRpbWVvdXQgZHVlIHRvIHRoZSBsYWNrIG9mIHJlY2VpdmluZyBzb2NrZXQuIFRvIGF2b2lkIHRoYXQgd2UgZGVsYXlcbi8vIHNlbmRpbmcgbWVzc2FnZXMgYnkgc29tZSBzbWFsbCB0aW1lLCBpbiBvcmRlciB0byBsZXQgcmVjZWl2aW5nXG4vLyBjb25uZWN0aW9uIGJlIHN0YXJ0ZWQgYmVmb3JlaGFuZC4gVGhpcyBpcyBvbmx5IGEgaGFsZm1lYXN1cmUgYW5kXG4vLyBkb2VzIG5vdCBmaXggdGhlIGJpZyBwcm9ibGVtLCBidXQgaXQgZG9lcyBtYWtlIHRoZSB0ZXN0cyBnbyBtb3JlXG4vLyBzdGFibGUgb24gc2xvdyBuZXR3b3Jrcy5cbkJ1ZmZlcmVkU2VuZGVyLnByb3RvdHlwZS5zZW5kX3NjaGVkdWxlX3dhaXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIHRyZWY7XG4gICAgdGhhdC5zZW5kX3N0b3AgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhhdC5zZW5kX3N0b3AgPSBudWxsO1xuICAgICAgICBjbGVhclRpbWVvdXQodHJlZik7XG4gICAgfTtcbiAgICB0cmVmID0gdXRpbHMuZGVsYXkoMjUsIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGF0LnNlbmRfc3RvcCA9IG51bGw7XG4gICAgICAgIHRoYXQuc2VuZF9zY2hlZHVsZSgpO1xuICAgIH0pO1xufTtcblxuQnVmZmVyZWRTZW5kZXIucHJvdG90eXBlLnNlbmRfc2NoZWR1bGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQuc2VuZF9idWZmZXIubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgcGF5bG9hZCA9ICdbJyArIHRoYXQuc2VuZF9idWZmZXIuam9pbignLCcpICsgJ10nO1xuICAgICAgICB0aGF0LnNlbmRfc3RvcCA9IHRoYXQuc2VuZGVyKHRoYXQudHJhbnNfdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBheWxvYWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2VuZF9zdG9wID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zZW5kX3NjaGVkdWxlX3dhaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgdGhhdC5zZW5kX2J1ZmZlciA9IFtdO1xuICAgIH1cbn07XG5cbkJ1ZmZlcmVkU2VuZGVyLnByb3RvdHlwZS5zZW5kX2Rlc3RydWN0b3IgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoYXQuX3NlbmRfc3RvcCkge1xuICAgICAgICB0aGF0Ll9zZW5kX3N0b3AoKTtcbiAgICB9XG4gICAgdGhhdC5fc2VuZF9zdG9wID0gbnVsbDtcbn07XG5cbnZhciBqc29uUEdlbmVyaWNTZW5kZXIgPSBmdW5jdGlvbih1cmwsIHBheWxvYWQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWYgKCEoJ19zZW5kX2Zvcm0nIGluIHRoYXQpKSB7XG4gICAgICAgIHZhciBmb3JtID0gdGhhdC5fc2VuZF9mb3JtID0gX2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvcm0nKTtcbiAgICAgICAgdmFyIGFyZWEgPSB0aGF0Ll9zZW5kX2FyZWEgPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcbiAgICAgICAgYXJlYS5uYW1lID0gJ2QnO1xuICAgICAgICBmb3JtLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGZvcm0uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBmb3JtLm1ldGhvZCA9ICdQT1NUJztcbiAgICAgICAgZm9ybS5lbmN0eXBlID0gJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCc7XG4gICAgICAgIGZvcm0uYWNjZXB0Q2hhcnNldCA9IFwiVVRGLThcIjtcbiAgICAgICAgZm9ybS5hcHBlbmRDaGlsZChhcmVhKTtcbiAgICAgICAgX2RvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZm9ybSk7XG4gICAgfVxuICAgIHZhciBmb3JtID0gdGhhdC5fc2VuZF9mb3JtO1xuICAgIHZhciBhcmVhID0gdGhhdC5fc2VuZF9hcmVhO1xuICAgIHZhciBpZCA9ICdhJyArIHV0aWxzLnJhbmRvbV9zdHJpbmcoOCk7XG4gICAgZm9ybS50YXJnZXQgPSBpZDtcbiAgICBmb3JtLmFjdGlvbiA9IHVybCArICcvanNvbnBfc2VuZD9pPScgKyBpZDtcblxuICAgIHZhciBpZnJhbWU7XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gaWU2IGR5bmFtaWMgaWZyYW1lcyB3aXRoIHRhcmdldD1cIlwiIHN1cHBvcnQgKHRoYW5rcyBDaHJpcyBMYW1iYWNoZXIpXG4gICAgICAgIGlmcmFtZSA9IF9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCc8aWZyYW1lIG5hbWU9XCInKyBpZCArJ1wiPicpO1xuICAgIH0gY2F0Y2goeCkge1xuICAgICAgICBpZnJhbWUgPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gICAgICAgIGlmcmFtZS5uYW1lID0gaWQ7XG4gICAgfVxuICAgIGlmcmFtZS5pZCA9IGlkO1xuICAgIGZvcm0uYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICBpZnJhbWUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgIHRyeSB7XG4gICAgICAgIGFyZWEudmFsdWUgPSBwYXlsb2FkO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgICB1dGlscy5sb2coJ1lvdXIgYnJvd3NlciBpcyBzZXJpb3VzbHkgYnJva2VuLiBHbyBob21lISAnICsgZS5tZXNzYWdlKTtcbiAgICB9XG4gICAgZm9ybS5zdWJtaXQoKTtcblxuICAgIHZhciBjb21wbGV0ZWQgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmICghaWZyYW1lLm9uZXJyb3IpIHJldHVybjtcbiAgICAgICAgaWZyYW1lLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGlmcmFtZS5vbmVycm9yID0gaWZyYW1lLm9ubG9hZCA9IG51bGw7XG4gICAgICAgIC8vIE9wZXJhIG1pbmkgZG9lc24ndCBsaWtlIGlmIHdlIEdDIGlmcmFtZVxuICAgICAgICAvLyBpbW1lZGlhdGVseSwgdGh1cyB0aGlzIHRpbWVvdXQuXG4gICAgICAgIHV0aWxzLmRlbGF5KDUwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIGlmcmFtZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGlmcmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgIGlmcmFtZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIGFyZWEudmFsdWUgPSAnJztcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICB9O1xuICAgIGlmcmFtZS5vbmVycm9yID0gaWZyYW1lLm9ubG9hZCA9IGNvbXBsZXRlZDtcbiAgICBpZnJhbWUub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoaWZyYW1lLnJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJykgY29tcGxldGVkKCk7XG4gICAgfTtcbiAgICByZXR1cm4gY29tcGxldGVkO1xufTtcblxudmFyIGNyZWF0ZUFqYXhTZW5kZXIgPSBmdW5jdGlvbihBamF4T2JqZWN0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHVybCwgcGF5bG9hZCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHhvID0gbmV3IEFqYXhPYmplY3QoJ1BPU1QnLCB1cmwgKyAnL3hocl9zZW5kJywgcGF5bG9hZCk7XG4gICAgICAgIHhvLm9uZmluaXNoID0gZnVuY3Rpb24oc3RhdHVzLCB0ZXh0KSB7XG4gICAgICAgICAgICBjYWxsYmFjayhzdGF0dXMpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oYWJvcnRfcmVhc29uKSB7XG4gICAgICAgICAgICBjYWxsYmFjaygwLCBhYm9ydF9yZWFzb24pO1xuICAgICAgICB9O1xuICAgIH07XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1zZW5kZXIuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLWpzb25wLXJlY2VpdmVyLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG4vLyBQYXJ0cyBkZXJpdmVkIGZyb20gU29ja2V0LmlvOlxuLy8gICAgaHR0cHM6Ly9naXRodWIuY29tL0xlYXJuQm9vc3Qvc29ja2V0LmlvL2Jsb2IvMC42LjE3L2xpYi9zb2NrZXQuaW8vdHJhbnNwb3J0cy9qc29ucC1wb2xsaW5nLmpzXG4vLyBhbmQgalF1ZXJ5LUpTT05QOlxuLy8gICAgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9qcXVlcnktanNvbnAvc291cmNlL2Jyb3dzZS90cnVuay9jb3JlL2pxdWVyeS5qc29ucC5qc1xudmFyIGpzb25QR2VuZXJpY1JlY2VpdmVyID0gZnVuY3Rpb24odXJsLCBjYWxsYmFjaykge1xuICAgIHZhciB0cmVmO1xuICAgIHZhciBzY3JpcHQgPSBfZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgdmFyIHNjcmlwdDI7ICAvLyBPcGVyYSBzeW5jaHJvbm91cyBsb2FkIHRyaWNrLlxuICAgIHZhciBjbG9zZV9zY3JpcHQgPSBmdW5jdGlvbihmcmFtZSkge1xuICAgICAgICBpZiAoc2NyaXB0Mikge1xuICAgICAgICAgICAgc2NyaXB0Mi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdDIpO1xuICAgICAgICAgICAgc2NyaXB0MiA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjcmlwdCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRyZWYpO1xuICAgICAgICAgICAgc2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcbiAgICAgICAgICAgIHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBzY3JpcHQub25lcnJvciA9XG4gICAgICAgICAgICAgICAgc2NyaXB0Lm9ubG9hZCA9IHNjcmlwdC5vbmNsaWNrID0gbnVsbDtcbiAgICAgICAgICAgIHNjcmlwdCA9IG51bGw7XG4gICAgICAgICAgICBjYWxsYmFjayhmcmFtZSk7XG4gICAgICAgICAgICBjYWxsYmFjayA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gSUU5IGZpcmVzICdlcnJvcicgZXZlbnQgYWZ0ZXIgb3JzYyBvciBiZWZvcmUsIGluIHJhbmRvbSBvcmRlci5cbiAgICB2YXIgbG9hZGVkX29rYXkgPSBmYWxzZTtcbiAgICB2YXIgZXJyb3JfdGltZXIgPSBudWxsO1xuXG4gICAgc2NyaXB0LmlkID0gJ2EnICsgdXRpbHMucmFuZG9tX3N0cmluZyg4KTtcbiAgICBzY3JpcHQuc3JjID0gdXJsO1xuICAgIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG4gICAgc2NyaXB0LmNoYXJzZXQgPSAnVVRGLTgnO1xuICAgIHNjcmlwdC5vbmVycm9yID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoIWVycm9yX3RpbWVyKSB7XG4gICAgICAgICAgICAvLyBEZWxheSBmaXJpbmcgY2xvc2Vfc2NyaXB0LlxuICAgICAgICAgICAgZXJyb3JfdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICghbG9hZGVkX29rYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2Vfc2NyaXB0KHV0aWxzLmNsb3NlRnJhbWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAxMDA2LFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJKU09OUCBzY3JpcHQgbG9hZGVkIGFibm9ybWFsbHkgKG9uZXJyb3IpXCIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgc2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgY2xvc2Vfc2NyaXB0KHV0aWxzLmNsb3NlRnJhbWUoMTAwNiwgXCJKU09OUCBzY3JpcHQgbG9hZGVkIGFibm9ybWFsbHkgKG9ubG9hZClcIikpO1xuICAgIH07XG5cbiAgICBzY3JpcHQub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoL2xvYWRlZHxjbG9zZWQvLnRlc3Qoc2NyaXB0LnJlYWR5U3RhdGUpKSB7XG4gICAgICAgICAgICBpZiAoc2NyaXB0ICYmIHNjcmlwdC5odG1sRm9yICYmIHNjcmlwdC5vbmNsaWNrKSB7XG4gICAgICAgICAgICAgICAgbG9hZGVkX29rYXkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEluIElFLCBhY3R1YWxseSBleGVjdXRlIHRoZSBzY3JpcHQuXG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdC5vbmNsaWNrKCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoeCkge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzY3JpcHQpIHtcbiAgICAgICAgICAgICAgICBjbG9zZV9zY3JpcHQodXRpbHMuY2xvc2VGcmFtZSgxMDA2LCBcIkpTT05QIHNjcmlwdCBsb2FkZWQgYWJub3JtYWxseSAob25yZWFkeXN0YXRlY2hhbmdlKVwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8vIElFOiBldmVudC9odG1sRm9yL29uY2xpY2sgdHJpY2suXG4gICAgLy8gT25lIGNhbid0IHJlbHkgb24gcHJvcGVyIG9yZGVyIGZvciBvbnJlYWR5c3RhdGVjaGFuZ2UuIEluIG9yZGVyIHRvXG4gICAgLy8gbWFrZSBzdXJlLCBzZXQgYSAnaHRtbEZvcicgYW5kICdldmVudCcgcHJvcGVydGllcywgc28gdGhhdFxuICAgIC8vIHNjcmlwdCBjb2RlIHdpbGwgYmUgaW5zdGFsbGVkIGFzICdvbmNsaWNrJyBoYW5kbGVyIGZvciB0aGVcbiAgICAvLyBzY3JpcHQgb2JqZWN0LiBMYXRlciwgb25yZWFkeXN0YXRlY2hhbmdlLCBtYW51YWxseSBleGVjdXRlIHRoaXNcbiAgICAvLyBjb2RlLiBGRiBhbmQgQ2hyb21lIGRvZXNuJ3Qgd29yayB3aXRoICdldmVudCcgYW5kICdodG1sRm9yJ1xuICAgIC8vIHNldC4gRm9yIHJlZmVyZW5jZSBzZWU6XG4gICAgLy8gICBodHRwOi8vamF1Ym91cmcubmV0LzIwMTAvMDcvbG9hZGluZy1zY3JpcHQtYXMtb25jbGljay1oYW5kbGVyLW9mLmh0bWxcbiAgICAvLyBBbHNvLCByZWFkIG9uIHRoYXQgYWJvdXQgc2NyaXB0IG9yZGVyaW5nOlxuICAgIC8vICAgaHR0cDovL3dpa2kud2hhdHdnLm9yZy93aWtpL0R5bmFtaWNfU2NyaXB0X0V4ZWN1dGlvbl9PcmRlclxuICAgIGlmICh0eXBlb2Ygc2NyaXB0LmFzeW5jID09PSAndW5kZWZpbmVkJyAmJiBfZG9jdW1lbnQuYXR0YWNoRXZlbnQpIHtcbiAgICAgICAgLy8gQWNjb3JkaW5nIHRvIG1vemlsbGEgZG9jcywgaW4gcmVjZW50IGJyb3dzZXJzIHNjcmlwdC5hc3luYyBkZWZhdWx0c1xuICAgICAgICAvLyB0byAndHJ1ZScsIHNvIHdlIG1heSB1c2UgaXQgdG8gZGV0ZWN0IGEgZ29vZCBicm93c2VyOlxuICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9IVE1ML0VsZW1lbnQvc2NyaXB0XG4gICAgICAgIGlmICghL29wZXJhL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICAgICAgICAgICAgLy8gTmFpdmVseSBhc3N1bWUgd2UncmUgaW4gSUVcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgc2NyaXB0Lmh0bWxGb3IgPSBzY3JpcHQuaWQ7XG4gICAgICAgICAgICAgICAgc2NyaXB0LmV2ZW50ID0gXCJvbmNsaWNrXCI7XG4gICAgICAgICAgICB9IGNhdGNoICh4KSB7fVxuICAgICAgICAgICAgc2NyaXB0LmFzeW5jID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE9wZXJhLCBzZWNvbmQgc3luYyBzY3JpcHQgaGFja1xuICAgICAgICAgICAgc2NyaXB0MiA9IF9kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgICAgIHNjcmlwdDIudGV4dCA9IFwidHJ5e3ZhciBhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ1wiK3NjcmlwdC5pZCtcIicpOyBpZihhKWEub25lcnJvcigpO31jYXRjaCh4KXt9O1wiO1xuICAgICAgICAgICAgc2NyaXB0LmFzeW5jID0gc2NyaXB0Mi5hc3luYyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygc2NyaXB0LmFzeW5jICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBzY3JpcHQuYXN5bmMgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIEZhbGxiYWNrIG1vc3RseSBmb3IgS29ucXVlcm9yIC0gc3R1cGlkIHRpbWVyLCAzNSBzZWNvbmRzIHNoYWxsIGJlIHBsZW50eS5cbiAgICB0cmVmID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvc2Vfc2NyaXB0KHV0aWxzLmNsb3NlRnJhbWUoMTAwNiwgXCJKU09OUCBzY3JpcHQgbG9hZGVkIGFibm9ybWFsbHkgKHRpbWVvdXQpXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgICB9LCAzNTAwMCk7XG5cbiAgICB2YXIgaGVhZCA9IF9kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xuICAgIGhlYWQuaW5zZXJ0QmVmb3JlKHNjcmlwdCwgaGVhZC5maXJzdENoaWxkKTtcbiAgICBpZiAoc2NyaXB0Mikge1xuICAgICAgICBoZWFkLmluc2VydEJlZm9yZShzY3JpcHQyLCBoZWFkLmZpcnN0Q2hpbGQpO1xuICAgIH1cbiAgICByZXR1cm4gY2xvc2Vfc2NyaXB0O1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtanNvbnAtcmVjZWl2ZXIuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLWpzb25wLXBvbGxpbmcuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbi8vIFRoZSBzaW1wbGVzdCBhbmQgbW9zdCByb2J1c3QgdHJhbnNwb3J0LCB1c2luZyB0aGUgd2VsbC1rbm93IGNyb3NzXG4vLyBkb21haW4gaGFjayAtIEpTT05QLiBUaGlzIHRyYW5zcG9ydCBpcyBxdWl0ZSBpbmVmZmljaWVudCAtIG9uZVxuLy8gbXNzYWdlIGNvdWxkIHVzZSB1cCB0byBvbmUgaHR0cCByZXF1ZXN0LiBCdXQgYXQgbGVhc3QgaXQgd29ya3MgYWxtb3N0XG4vLyBldmVyeXdoZXJlLlxuLy8gS25vd24gbGltaXRhdGlvbnM6XG4vLyAgIG8geW91IHdpbGwgZ2V0IGEgc3Bpbm5pbmcgY3Vyc29yXG4vLyAgIG8gZm9yIEtvbnF1ZXJvciBhIGR1bWIgdGltZXIgaXMgbmVlZGVkIHRvIGRldGVjdCBlcnJvcnNcblxuXG52YXIgSnNvblBUcmFuc3BvcnQgPSBTb2NrSlNbJ2pzb25wLXBvbGxpbmcnXSA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB1dGlscy5wb2xsdXRlR2xvYmFsTmFtZXNwYWNlKCk7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQucmkgPSByaTtcbiAgICB0aGF0LnRyYW5zX3VybCA9IHRyYW5zX3VybDtcbiAgICB0aGF0LnNlbmRfY29uc3RydWN0b3IoanNvblBHZW5lcmljU2VuZGVyKTtcbiAgICB0aGF0Ll9zY2hlZHVsZV9yZWN2KCk7XG59O1xuXG4vLyBJbmhlcml0bmFjZVxuSnNvblBUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEJ1ZmZlcmVkU2VuZGVyKCk7XG5cbkpzb25QVHJhbnNwb3J0LnByb3RvdHlwZS5fc2NoZWR1bGVfcmVjdiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRoYXQuX3JlY3Zfc3RvcCA9IG51bGw7XG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICAvLyBubyBkYXRhIC0gaGVhcnRiZWF0O1xuICAgICAgICAgICAgaWYgKCF0aGF0Ll9pc19jbG9zaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5yaS5fZGlkTWVzc2FnZShkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBUaGUgbWVzc2FnZSBjYW4gYmUgYSBjbG9zZSBtZXNzYWdlLCBhbmQgY2hhbmdlIGlzX2Nsb3Npbmcgc3RhdGUuXG4gICAgICAgIGlmICghdGhhdC5faXNfY2xvc2luZykge1xuICAgICAgICAgICAgdGhhdC5fc2NoZWR1bGVfcmVjdigpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGF0Ll9yZWN2X3N0b3AgPSBqc29uUFJlY2VpdmVyV3JhcHBlcih0aGF0LnRyYW5zX3VybCArICcvanNvbnAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb25QR2VuZXJpY1JlY2VpdmVyLCBjYWxsYmFjayk7XG59O1xuXG5Kc29uUFRyYW5zcG9ydC5lbmFibGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5Kc29uUFRyYW5zcG9ydC5uZWVkX2JvZHkgPSB0cnVlO1xuXG5cbkpzb25QVHJhbnNwb3J0LnByb3RvdHlwZS5kb0NsZWFudXAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5faXNfY2xvc2luZyA9IHRydWU7XG4gICAgaWYgKHRoYXQuX3JlY3Zfc3RvcCkge1xuICAgICAgICB0aGF0Ll9yZWN2X3N0b3AoKTtcbiAgICB9XG4gICAgdGhhdC5yaSA9IHRoYXQuX3JlY3Zfc3RvcCA9IG51bGw7XG4gICAgdGhhdC5zZW5kX2Rlc3RydWN0b3IoKTtcbn07XG5cblxuLy8gQWJzdHJhY3QgYXdheSBjb2RlIHRoYXQgaGFuZGxlcyBnbG9iYWwgbmFtZXNwYWNlIHBvbGx1dGlvbi5cbnZhciBqc29uUFJlY2VpdmVyV3JhcHBlciA9IGZ1bmN0aW9uKHVybCwgY29uc3RydWN0UmVjZWl2ZXIsIHVzZXJfY2FsbGJhY2spIHtcbiAgICB2YXIgaWQgPSAnYScgKyB1dGlscy5yYW5kb21fc3RyaW5nKDYpO1xuICAgIHZhciB1cmxfaWQgPSB1cmwgKyAnP2M9JyArIGVzY2FwZShXUHJlZml4ICsgJy4nICsgaWQpO1xuICAgIC8vIENhbGxiYWNrIHdpbGwgYmUgY2FsbGVkIGV4YWN0bHkgb25jZS5cbiAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbihmcmFtZSkge1xuICAgICAgICBkZWxldGUgX3dpbmRvd1tXUHJlZml4XVtpZF07XG4gICAgICAgIHVzZXJfY2FsbGJhY2soZnJhbWUpO1xuICAgIH07XG5cbiAgICB2YXIgY2xvc2Vfc2NyaXB0ID0gY29uc3RydWN0UmVjZWl2ZXIodXJsX2lkLCBjYWxsYmFjayk7XG4gICAgX3dpbmRvd1tXUHJlZml4XVtpZF0gPSBjbG9zZV9zY3JpcHQ7XG4gICAgdmFyIHN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKF93aW5kb3dbV1ByZWZpeF1baWRdKSB7XG4gICAgICAgICAgICBfd2luZG93W1dQcmVmaXhdW2lkXSh1dGlscy5jbG9zZUZyYW1lKDEwMDAsIFwiSlNPTlAgdXNlciBhYm9ydGVkIHJlYWRcIikpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gc3RvcDtcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLWpzb25wLXBvbGxpbmcuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLXhoci5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxudmFyIEFqYXhCYXNlZFRyYW5zcG9ydCA9IGZ1bmN0aW9uKCkge307XG5BamF4QmFzZWRUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEJ1ZmZlcmVkU2VuZGVyKCk7XG5cbkFqYXhCYXNlZFRyYW5zcG9ydC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsX3N1ZmZpeCwgUmVjZWl2ZXIsIEFqYXhPYmplY3QpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5yaSA9IHJpO1xuICAgIHRoYXQudHJhbnNfdXJsID0gdHJhbnNfdXJsO1xuICAgIHRoYXQuc2VuZF9jb25zdHJ1Y3RvcihjcmVhdGVBamF4U2VuZGVyKEFqYXhPYmplY3QpKTtcbiAgICB0aGF0LnBvbGwgPSBuZXcgUG9sbGluZyhyaSwgUmVjZWl2ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNfdXJsICsgdXJsX3N1ZmZpeCwgQWpheE9iamVjdCk7XG59O1xuXG5BamF4QmFzZWRUcmFuc3BvcnQucHJvdG90eXBlLmRvQ2xlYW51cCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5wb2xsKSB7XG4gICAgICAgIHRoYXQucG9sbC5hYm9ydCgpO1xuICAgICAgICB0aGF0LnBvbGwgPSBudWxsO1xuICAgIH1cbn07XG5cbi8vIHhoci1zdHJlYW1pbmdcbnZhciBYaHJTdHJlYW1pbmdUcmFuc3BvcnQgPSBTb2NrSlNbJ3hoci1zdHJlYW1pbmcnXSA9IGZ1bmN0aW9uKHJpLCB0cmFuc191cmwpIHtcbiAgICB0aGlzLnJ1bihyaSwgdHJhbnNfdXJsLCAnL3hocl9zdHJlYW1pbmcnLCBYaHJSZWNlaXZlciwgdXRpbHMuWEhSQ29yc09iamVjdCk7XG59O1xuXG5YaHJTdHJlYW1pbmdUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEFqYXhCYXNlZFRyYW5zcG9ydCgpO1xuXG5YaHJTdHJlYW1pbmdUcmFuc3BvcnQuZW5hYmxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFN1cHBvcnQgZm9yIENPUlMgQWpheCBha2EgQWpheDI/IE9wZXJhIDEyIGNsYWltcyBDT1JTIGJ1dFxuICAgIC8vIGRvZXNuJ3QgZG8gc3RyZWFtaW5nLlxuICAgIHJldHVybiAoX3dpbmRvdy5YTUxIdHRwUmVxdWVzdCAmJlxuICAgICAgICAgICAgJ3dpdGhDcmVkZW50aWFscycgaW4gbmV3IFhNTEh0dHBSZXF1ZXN0KCkgJiZcbiAgICAgICAgICAgICghL29wZXJhL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkpO1xufTtcblhoclN0cmVhbWluZ1RyYW5zcG9ydC5yb3VuZFRyaXBzID0gMjsgLy8gcHJlZmxpZ2h0LCBhamF4XG5cbi8vIFNhZmFyaSBnZXRzIGNvbmZ1c2VkIHdoZW4gYSBzdHJlYW1pbmcgYWpheCByZXF1ZXN0IGlzIHN0YXJ0ZWRcbi8vIGJlZm9yZSBvbmxvYWQuIFRoaXMgY2F1c2VzIHRoZSBsb2FkIGluZGljYXRvciB0byBzcGluIGluZGVmaW5ldGVseS5cblhoclN0cmVhbWluZ1RyYW5zcG9ydC5uZWVkX2JvZHkgPSB0cnVlO1xuXG5cbi8vIEFjY29yZGluZyB0bzpcbi8vICAgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNjQxNTA3L2RldGVjdC1icm93c2VyLXN1cHBvcnQtZm9yLWNyb3NzLWRvbWFpbi14bWxodHRwcmVxdWVzdHNcbi8vICAgaHR0cDovL2hhY2tzLm1vemlsbGEub3JnLzIwMDkvMDcvY3Jvc3Mtc2l0ZS14bWxodHRwcmVxdWVzdC13aXRoLWNvcnMvXG5cblxuLy8geGRyLXN0cmVhbWluZ1xudmFyIFhkclN0cmVhbWluZ1RyYW5zcG9ydCA9IFNvY2tKU1sneGRyLXN0cmVhbWluZyddID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCkge1xuICAgIHRoaXMucnVuKHJpLCB0cmFuc191cmwsICcveGhyX3N0cmVhbWluZycsIFhoclJlY2VpdmVyLCB1dGlscy5YRFJPYmplY3QpO1xufTtcblxuWGRyU3RyZWFtaW5nVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBBamF4QmFzZWRUcmFuc3BvcnQoKTtcblxuWGRyU3RyZWFtaW5nVHJhbnNwb3J0LmVuYWJsZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gISFfd2luZG93LlhEb21haW5SZXF1ZXN0O1xufTtcblhkclN0cmVhbWluZ1RyYW5zcG9ydC5yb3VuZFRyaXBzID0gMjsgLy8gcHJlZmxpZ2h0LCBhamF4XG5cblxuXG4vLyB4aHItcG9sbGluZ1xudmFyIFhoclBvbGxpbmdUcmFuc3BvcnQgPSBTb2NrSlNbJ3hoci1wb2xsaW5nJ10gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdGhpcy5ydW4ocmksIHRyYW5zX3VybCwgJy94aHInLCBYaHJSZWNlaXZlciwgdXRpbHMuWEhSQ29yc09iamVjdCk7XG59O1xuXG5YaHJQb2xsaW5nVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBBamF4QmFzZWRUcmFuc3BvcnQoKTtcblxuWGhyUG9sbGluZ1RyYW5zcG9ydC5lbmFibGVkID0gWGhyU3RyZWFtaW5nVHJhbnNwb3J0LmVuYWJsZWQ7XG5YaHJQb2xsaW5nVHJhbnNwb3J0LnJvdW5kVHJpcHMgPSAyOyAvLyBwcmVmbGlnaHQsIGFqYXhcblxuXG4vLyB4ZHItcG9sbGluZ1xudmFyIFhkclBvbGxpbmdUcmFuc3BvcnQgPSBTb2NrSlNbJ3hkci1wb2xsaW5nJ10gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdGhpcy5ydW4ocmksIHRyYW5zX3VybCwgJy94aHInLCBYaHJSZWNlaXZlciwgdXRpbHMuWERST2JqZWN0KTtcbn07XG5cblhkclBvbGxpbmdUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEFqYXhCYXNlZFRyYW5zcG9ydCgpO1xuXG5YZHJQb2xsaW5nVHJhbnNwb3J0LmVuYWJsZWQgPSBYZHJTdHJlYW1pbmdUcmFuc3BvcnQuZW5hYmxlZDtcblhkclBvbGxpbmdUcmFuc3BvcnQucm91bmRUcmlwcyA9IDI7IC8vIHByZWZsaWdodCwgYWpheFxuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy14aHIuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLWlmcmFtZS5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxuLy8gRmV3IGNvb2wgdHJhbnNwb3J0cyBkbyB3b3JrIG9ubHkgZm9yIHNhbWUtb3JpZ2luLiBJbiBvcmRlciB0byBtYWtlXG4vLyB0aGVtIHdvcmtpbmcgY3Jvc3MtZG9tYWluIHdlIHNoYWxsIHVzZSBpZnJhbWUsIHNlcnZlZCBmb3JtIHRoZVxuLy8gcmVtb3RlIGRvbWFpbi4gTmV3IGJyb3dzZXJzLCBoYXZlIGNhcGFiaWxpdGllcyB0byBjb21tdW5pY2F0ZSB3aXRoXG4vLyBjcm9zcyBkb21haW4gaWZyYW1lLCB1c2luZyBwb3N0TWVzc2FnZSgpLiBJbiBJRSBpdCB3YXMgaW1wbGVtZW50ZWRcbi8vIGZyb20gSUUgOCssIGJ1dCBvZiBjb3Vyc2UsIElFIGdvdCBzb21lIGRldGFpbHMgd3Jvbmc6XG4vLyAgICBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvY2MxOTcwMTUodj1WUy44NSkuYXNweFxuLy8gICAgaHR0cDovL3N0ZXZlc291ZGVycy5jb20vbWlzYy90ZXN0LXBvc3RtZXNzYWdlLnBocFxuXG52YXIgSWZyYW1lVHJhbnNwb3J0ID0gZnVuY3Rpb24oKSB7fTtcblxuSWZyYW1lVHJhbnNwb3J0LnByb3RvdHlwZS5pX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCwgYmFzZV91cmwpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5yaSA9IHJpO1xuICAgIHRoYXQub3JpZ2luID0gdXRpbHMuZ2V0T3JpZ2luKGJhc2VfdXJsKTtcbiAgICB0aGF0LmJhc2VfdXJsID0gYmFzZV91cmw7XG4gICAgdGhhdC50cmFuc191cmwgPSB0cmFuc191cmw7XG5cbiAgICB2YXIgaWZyYW1lX3VybCA9IGJhc2VfdXJsICsgJy9pZnJhbWUuaHRtbCc7XG4gICAgaWYgKHRoYXQucmkuX29wdGlvbnMuZGV2ZWwpIHtcbiAgICAgICAgaWZyYW1lX3VybCArPSAnP3Q9JyArICgrbmV3IERhdGUpO1xuICAgIH1cbiAgICB0aGF0LndpbmRvd19pZCA9IHV0aWxzLnJhbmRvbV9zdHJpbmcoOCk7XG4gICAgaWZyYW1lX3VybCArPSAnIycgKyB0aGF0LndpbmRvd19pZDtcblxuICAgIHRoYXQuaWZyYW1lT2JqID0gdXRpbHMuY3JlYXRlSWZyYW1lKGlmcmFtZV91cmwsIGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5yaS5fZGlkQ2xvc2UoMTAwNiwgXCJVbmFibGUgdG8gbG9hZCBhbiBpZnJhbWUgKFwiICsgciArIFwiKVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgIHRoYXQub25tZXNzYWdlX2NiID0gdXRpbHMuYmluZCh0aGF0Lm9ubWVzc2FnZSwgdGhhdCk7XG4gICAgdXRpbHMuYXR0YWNoTWVzc2FnZSh0aGF0Lm9ubWVzc2FnZV9jYik7XG59O1xuXG5JZnJhbWVUcmFuc3BvcnQucHJvdG90eXBlLmRvQ2xlYW51cCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5pZnJhbWVPYmopIHtcbiAgICAgICAgdXRpbHMuZGV0YWNoTWVzc2FnZSh0aGF0Lm9ubWVzc2FnZV9jYik7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHRoZSBpZnJhbWUgaXMgbm90IGxvYWRlZCwgSUUgcmFpc2VzIGFuIGV4Y2VwdGlvblxuICAgICAgICAgICAgLy8gb24gJ2NvbnRlbnRXaW5kb3cnLlxuICAgICAgICAgICAgaWYgKHRoYXQuaWZyYW1lT2JqLmlmcmFtZS5jb250ZW50V2luZG93KSB7XG4gICAgICAgICAgICAgICAgdGhhdC5wb3N0TWVzc2FnZSgnYycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoICh4KSB7fVxuICAgICAgICB0aGF0LmlmcmFtZU9iai5jbGVhbnVwKCk7XG4gICAgICAgIHRoYXQuaWZyYW1lT2JqID0gbnVsbDtcbiAgICAgICAgdGhhdC5vbm1lc3NhZ2VfY2IgPSB0aGF0LmlmcmFtZU9iaiA9IG51bGw7XG4gICAgfVxufTtcblxuSWZyYW1lVHJhbnNwb3J0LnByb3RvdHlwZS5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmIChlLm9yaWdpbiAhPT0gdGhhdC5vcmlnaW4pIHJldHVybjtcbiAgICB2YXIgd2luZG93X2lkID0gZS5kYXRhLnNsaWNlKDAsIDgpO1xuICAgIHZhciB0eXBlID0gZS5kYXRhLnNsaWNlKDgsIDkpO1xuICAgIHZhciBkYXRhID0gZS5kYXRhLnNsaWNlKDkpO1xuXG4gICAgaWYgKHdpbmRvd19pZCAhPT0gdGhhdC53aW5kb3dfaWQpIHJldHVybjtcblxuICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgY2FzZSAncyc6XG4gICAgICAgIHRoYXQuaWZyYW1lT2JqLmxvYWRlZCgpO1xuICAgICAgICB0aGF0LnBvc3RNZXNzYWdlKCdzJywgSlNPTi5zdHJpbmdpZnkoW1NvY2tKUy52ZXJzaW9uLCB0aGF0LnByb3RvY29sLCB0aGF0LnRyYW5zX3VybCwgdGhhdC5iYXNlX3VybF0pKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSAndCc6XG4gICAgICAgIHRoYXQucmkuX2RpZE1lc3NhZ2UoZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cbklmcmFtZVRyYW5zcG9ydC5wcm90b3R5cGUucG9zdE1lc3NhZ2UgPSBmdW5jdGlvbih0eXBlLCBkYXRhKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQuaWZyYW1lT2JqLnBvc3QodGhhdC53aW5kb3dfaWQgKyB0eXBlICsgKGRhdGEgfHwgJycpLCB0aGF0Lm9yaWdpbik7XG59O1xuXG5JZnJhbWVUcmFuc3BvcnQucHJvdG90eXBlLmRvU2VuZCA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgdGhpcy5wb3N0TWVzc2FnZSgnbScsIG1lc3NhZ2UpO1xufTtcblxuSWZyYW1lVHJhbnNwb3J0LmVuYWJsZWQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBwb3N0TWVzc2FnZSBtaXNiZWhhdmVzIGluIGtvbnF1ZXJvciA0LjYuNSAtIHRoZSBtZXNzYWdlcyBhcmUgZGVsaXZlcmVkIHdpdGhcbiAgICAvLyBodWdlIGRlbGF5LCBvciBub3QgYXQgYWxsLlxuICAgIHZhciBrb25xdWVyb3IgPSBuYXZpZ2F0b3IgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0tvbnF1ZXJvcicpICE9PSAtMTtcbiAgICByZXR1cm4gKCh0eXBlb2YgX3dpbmRvdy5wb3N0TWVzc2FnZSA9PT0gJ2Z1bmN0aW9uJyB8fFxuICAgICAgICAgICAgdHlwZW9mIF93aW5kb3cucG9zdE1lc3NhZ2UgPT09ICdvYmplY3QnKSAmJiAoIWtvbnF1ZXJvcikpO1xufTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtaWZyYW1lLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1pZnJhbWUtd2l0aGluLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgY3Vycl93aW5kb3dfaWQ7XG5cbnZhciBwb3N0TWVzc2FnZSA9IGZ1bmN0aW9uICh0eXBlLCBkYXRhKSB7XG4gICAgaWYocGFyZW50ICE9PSBfd2luZG93KSB7XG4gICAgICAgIHBhcmVudC5wb3N0TWVzc2FnZShjdXJyX3dpbmRvd19pZCArIHR5cGUgKyAoZGF0YSB8fCAnJyksICcqJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXRpbHMubG9nKFwiQ2FuJ3QgcG9zdE1lc3NhZ2UsIG5vIHBhcmVudCB3aW5kb3cuXCIsIHR5cGUsIGRhdGEpO1xuICAgIH1cbn07XG5cbnZhciBGYWNhZGVKUyA9IGZ1bmN0aW9uKCkge307XG5GYWNhZGVKUy5wcm90b3R5cGUuX2RpZENsb3NlID0gZnVuY3Rpb24gKGNvZGUsIHJlYXNvbikge1xuICAgIHBvc3RNZXNzYWdlKCd0JywgdXRpbHMuY2xvc2VGcmFtZShjb2RlLCByZWFzb24pKTtcbn07XG5GYWNhZGVKUy5wcm90b3R5cGUuX2RpZE1lc3NhZ2UgPSBmdW5jdGlvbiAoZnJhbWUpIHtcbiAgICBwb3N0TWVzc2FnZSgndCcsIGZyYW1lKTtcbn07XG5GYWNhZGVKUy5wcm90b3R5cGUuX2RvU2VuZCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdGhpcy5fdHJhbnNwb3J0LmRvU2VuZChkYXRhKTtcbn07XG5GYWNhZGVKUy5wcm90b3R5cGUuX2RvQ2xlYW51cCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl90cmFuc3BvcnQuZG9DbGVhbnVwKCk7XG59O1xuXG51dGlscy5wYXJlbnRfb3JpZ2luID0gdW5kZWZpbmVkO1xuXG5Tb2NrSlMuYm9vdHN0cmFwX2lmcmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmYWNhZGU7XG4gICAgY3Vycl93aW5kb3dfaWQgPSBfZG9jdW1lbnQubG9jYXRpb24uaGFzaC5zbGljZSgxKTtcbiAgICB2YXIgb25NZXNzYWdlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBpZihlLnNvdXJjZSAhPT0gcGFyZW50KSByZXR1cm47XG4gICAgICAgIGlmKHR5cGVvZiB1dGlscy5wYXJlbnRfb3JpZ2luID09PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgIHV0aWxzLnBhcmVudF9vcmlnaW4gPSBlLm9yaWdpbjtcbiAgICAgICAgaWYgKGUub3JpZ2luICE9PSB1dGlscy5wYXJlbnRfb3JpZ2luKSByZXR1cm47XG5cbiAgICAgICAgdmFyIHdpbmRvd19pZCA9IGUuZGF0YS5zbGljZSgwLCA4KTtcbiAgICAgICAgdmFyIHR5cGUgPSBlLmRhdGEuc2xpY2UoOCwgOSk7XG4gICAgICAgIHZhciBkYXRhID0gZS5kYXRhLnNsaWNlKDkpO1xuICAgICAgICBpZiAod2luZG93X2lkICE9PSBjdXJyX3dpbmRvd19pZCkgcmV0dXJuO1xuICAgICAgICBzd2l0Y2godHlwZSkge1xuICAgICAgICBjYXNlICdzJzpcbiAgICAgICAgICAgIHZhciBwID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uID0gcFswXTtcbiAgICAgICAgICAgIHZhciBwcm90b2NvbCA9IHBbMV07XG4gICAgICAgICAgICB2YXIgdHJhbnNfdXJsID0gcFsyXTtcbiAgICAgICAgICAgIHZhciBiYXNlX3VybCA9IHBbM107XG4gICAgICAgICAgICBpZiAodmVyc2lvbiAhPT0gU29ja0pTLnZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICB1dGlscy5sb2coXCJJbmNvbXBhdGliaWxlIFNvY2tKUyEgTWFpbiBzaXRlIHVzZXM6XCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICBcIiBcXFwiXCIgKyB2ZXJzaW9uICsgXCJcXFwiLCB0aGUgaWZyYW1lOlwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXCIgXFxcIlwiICsgU29ja0pTLnZlcnNpb24gKyBcIlxcXCIuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF1dGlscy5mbGF0VXJsKHRyYW5zX3VybCkgfHwgIXV0aWxzLmZsYXRVcmwoYmFzZV91cmwpKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMubG9nKFwiT25seSBiYXNpYyB1cmxzIGFyZSBzdXBwb3J0ZWQgaW4gU29ja0pTXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF1dGlscy5pc1NhbWVPcmlnaW5VcmwodHJhbnNfdXJsKSB8fFxuICAgICAgICAgICAgICAgICF1dGlscy5pc1NhbWVPcmlnaW5VcmwoYmFzZV91cmwpKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMubG9nKFwiQ2FuJ3QgY29ubmVjdCB0byBkaWZmZXJlbnQgZG9tYWluIGZyb20gd2l0aGluIGFuIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpZnJhbWUuIChcIiArIEpTT04uc3RyaW5naWZ5KFtfd2luZG93LmxvY2F0aW9uLmhyZWYsIHRyYW5zX3VybCwgYmFzZV91cmxdKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFwiKVwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmYWNhZGUgPSBuZXcgRmFjYWRlSlMoKTtcbiAgICAgICAgICAgIGZhY2FkZS5fdHJhbnNwb3J0ID0gbmV3IEZhY2FkZUpTW3Byb3RvY29sXShmYWNhZGUsIHRyYW5zX3VybCwgYmFzZV91cmwpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ20nOlxuICAgICAgICAgICAgZmFjYWRlLl9kb1NlbmQoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYyc6XG4gICAgICAgICAgICBpZiAoZmFjYWRlKVxuICAgICAgICAgICAgICAgIGZhY2FkZS5fZG9DbGVhbnVwKCk7XG4gICAgICAgICAgICBmYWNhZGUgPSBudWxsO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gYWxlcnQoJ3Rlc3QgdGlja2VyJyk7XG4gICAgLy8gZmFjYWRlID0gbmV3IEZhY2FkZUpTKCk7XG4gICAgLy8gZmFjYWRlLl90cmFuc3BvcnQgPSBuZXcgRmFjYWRlSlNbJ3ctaWZyYW1lLXhoci1wb2xsaW5nJ10oZmFjYWRlLCAnaHR0cDovL2hvc3QuY29tOjk5OTkvdGlja2VyLzEyL2Jhc2QnKTtcblxuICAgIHV0aWxzLmF0dGFjaE1lc3NhZ2Uob25NZXNzYWdlKTtcblxuICAgIC8vIFN0YXJ0XG4gICAgcG9zdE1lc3NhZ2UoJ3MnKTtcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLWlmcmFtZS13aXRoaW4uanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL2luZm8uanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBJbmZvUmVjZWl2ZXIgPSBmdW5jdGlvbihiYXNlX3VybCwgQWpheE9iamVjdCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB1dGlscy5kZWxheShmdW5jdGlvbigpe3RoYXQuZG9YaHIoYmFzZV91cmwsIEFqYXhPYmplY3QpO30pO1xufTtcblxuSW5mb1JlY2VpdmVyLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoWydmaW5pc2gnXSk7XG5cbkluZm9SZWNlaXZlci5wcm90b3R5cGUuZG9YaHIgPSBmdW5jdGlvbihiYXNlX3VybCwgQWpheE9iamVjdCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgdDAgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgIHZhciB4byA9IG5ldyBBamF4T2JqZWN0KCdHRVQnLCBiYXNlX3VybCArICcvaW5mbycpO1xuXG4gICAgdmFyIHRyZWYgPSB1dGlscy5kZWxheSg4MDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oKXt4by5vbnRpbWVvdXQoKTt9KTtcblxuICAgIHhvLm9uZmluaXNoID0gZnVuY3Rpb24oc3RhdHVzLCB0ZXh0KSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0cmVmKTtcbiAgICAgICAgdHJlZiA9IG51bGw7XG4gICAgICAgIGlmIChzdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgdmFyIHJ0dCA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgLSB0MDtcbiAgICAgICAgICAgIHZhciBpbmZvID0gSlNPTi5wYXJzZSh0ZXh0KTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5mbyAhPT0gJ29iamVjdCcpIGluZm8gPSB7fTtcbiAgICAgICAgICAgIHRoYXQuZW1pdCgnZmluaXNoJywgaW5mbywgcnR0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoYXQuZW1pdCgnZmluaXNoJyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHhvLm9udGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB4by5jbG9zZSgpO1xuICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcpO1xuICAgIH07XG59O1xuXG52YXIgSW5mb1JlY2VpdmVySWZyYW1lID0gZnVuY3Rpb24oYmFzZV91cmwpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIGdvID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpZnIgPSBuZXcgSWZyYW1lVHJhbnNwb3J0KCk7XG4gICAgICAgIGlmci5wcm90b2NvbCA9ICd3LWlmcmFtZS1pbmZvLXJlY2VpdmVyJztcbiAgICAgICAgdmFyIGZ1biA9IGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgciA9PT0gJ3N0cmluZycgJiYgci5zdWJzdHIoMCwxKSA9PT0gJ20nKSB7XG4gICAgICAgICAgICAgICAgdmFyIGQgPSBKU09OLnBhcnNlKHIuc3Vic3RyKDEpKTtcbiAgICAgICAgICAgICAgICB2YXIgaW5mbyA9IGRbMF0sIHJ0dCA9IGRbMV07XG4gICAgICAgICAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnLCBpbmZvLCBydHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGF0LmVtaXQoJ2ZpbmlzaCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWZyLmRvQ2xlYW51cCgpO1xuICAgICAgICAgICAgaWZyID0gbnVsbDtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIG1vY2tfcmkgPSB7XG4gICAgICAgICAgICBfb3B0aW9uczoge30sXG4gICAgICAgICAgICBfZGlkQ2xvc2U6IGZ1bixcbiAgICAgICAgICAgIF9kaWRNZXNzYWdlOiBmdW5cbiAgICAgICAgfTtcbiAgICAgICAgaWZyLmlfY29uc3RydWN0b3IobW9ja19yaSwgYmFzZV91cmwsIGJhc2VfdXJsKTtcbiAgICB9XG4gICAgaWYoIV9kb2N1bWVudC5ib2R5KSB7XG4gICAgICAgIHV0aWxzLmF0dGFjaEV2ZW50KCdsb2FkJywgZ28pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGdvKCk7XG4gICAgfVxufTtcbkluZm9SZWNlaXZlcklmcmFtZS5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKFsnZmluaXNoJ10pO1xuXG5cbnZhciBJbmZvUmVjZWl2ZXJGYWtlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gSXQgbWF5IG5vdCBiZSBwb3NzaWJsZSB0byBkbyBjcm9zcyBkb21haW4gQUpBWCB0byBnZXQgdGhlIGluZm9cbiAgICAvLyBkYXRhLCBmb3IgZXhhbXBsZSBmb3IgSUU3LiBCdXQgd2Ugd2FudCB0byBydW4gSlNPTlAsIHNvIGxldCdzXG4gICAgLy8gZmFrZSB0aGUgcmVzcG9uc2UsIHdpdGggcnR0PTJzIChydG89NnMpLlxuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB1dGlscy5kZWxheShmdW5jdGlvbigpIHtcbiAgICAgICAgdGhhdC5lbWl0KCdmaW5pc2gnLCB7fSwgMjAwMCk7XG4gICAgfSk7XG59O1xuSW5mb1JlY2VpdmVyRmFrZS5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKFsnZmluaXNoJ10pO1xuXG52YXIgY3JlYXRlSW5mb1JlY2VpdmVyID0gZnVuY3Rpb24oYmFzZV91cmwpIHtcbiAgICBpZiAodXRpbHMuaXNTYW1lT3JpZ2luVXJsKGJhc2VfdXJsKSkge1xuICAgICAgICAvLyBJZiwgZm9yIHNvbWUgcmVhc29uLCB3ZSBoYXZlIFNvY2tKUyBsb2NhbGx5IC0gdGhlcmUncyBub1xuICAgICAgICAvLyBuZWVkIHRvIHN0YXJ0IHVwIHRoZSBjb21wbGV4IG1hY2hpbmVyeS4gSnVzdCB1c2UgYWpheC5cbiAgICAgICAgcmV0dXJuIG5ldyBJbmZvUmVjZWl2ZXIoYmFzZV91cmwsIHV0aWxzLlhIUkxvY2FsT2JqZWN0KTtcbiAgICB9XG4gICAgc3dpdGNoICh1dGlscy5pc1hIUkNvcnNDYXBhYmxlKCkpIHtcbiAgICBjYXNlIDE6XG4gICAgICAgIHJldHVybiBuZXcgSW5mb1JlY2VpdmVyKGJhc2VfdXJsLCB1dGlscy5YSFJDb3JzT2JqZWN0KTtcbiAgICBjYXNlIDI6XG4gICAgICAgIHJldHVybiBuZXcgSW5mb1JlY2VpdmVyKGJhc2VfdXJsLCB1dGlscy5YRFJPYmplY3QpO1xuICAgIGNhc2UgMzpcbiAgICAgICAgLy8gT3BlcmFcbiAgICAgICAgcmV0dXJuIG5ldyBJbmZvUmVjZWl2ZXJJZnJhbWUoYmFzZV91cmwpO1xuICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIElFIDdcbiAgICAgICAgcmV0dXJuIG5ldyBJbmZvUmVjZWl2ZXJGYWtlKCk7XG4gICAgfTtcbn07XG5cblxudmFyIFdJbmZvUmVjZWl2ZXJJZnJhbWUgPSBGYWNhZGVKU1sndy1pZnJhbWUtaW5mby1yZWNlaXZlciddID0gZnVuY3Rpb24ocmksIF90cmFuc191cmwsIGJhc2VfdXJsKSB7XG4gICAgdmFyIGlyID0gbmV3IEluZm9SZWNlaXZlcihiYXNlX3VybCwgdXRpbHMuWEhSTG9jYWxPYmplY3QpO1xuICAgIGlyLm9uZmluaXNoID0gZnVuY3Rpb24oaW5mbywgcnR0KSB7XG4gICAgICAgIHJpLl9kaWRNZXNzYWdlKCdtJytKU09OLnN0cmluZ2lmeShbaW5mbywgcnR0XSkpO1xuICAgICAgICByaS5fZGlkQ2xvc2UoKTtcbiAgICB9XG59O1xuV0luZm9SZWNlaXZlcklmcmFtZS5wcm90b3R5cGUuZG9DbGVhbnVwID0gZnVuY3Rpb24oKSB7fTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvaW5mby5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtaWZyYW1lLWV2ZW50c291cmNlLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgRXZlbnRTb3VyY2VJZnJhbWVUcmFuc3BvcnQgPSBTb2NrSlNbJ2lmcmFtZS1ldmVudHNvdXJjZSddID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnByb3RvY29sID0gJ3ctaWZyYW1lLWV2ZW50c291cmNlJztcbiAgICB0aGF0LmlfY29uc3RydWN0b3IuYXBwbHkodGhhdCwgYXJndW1lbnRzKTtcbn07XG5cbkV2ZW50U291cmNlSWZyYW1lVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBJZnJhbWVUcmFuc3BvcnQoKTtcblxuRXZlbnRTb3VyY2VJZnJhbWVUcmFuc3BvcnQuZW5hYmxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKCdFdmVudFNvdXJjZScgaW4gX3dpbmRvdykgJiYgSWZyYW1lVHJhbnNwb3J0LmVuYWJsZWQoKTtcbn07XG5cbkV2ZW50U291cmNlSWZyYW1lVHJhbnNwb3J0Lm5lZWRfYm9keSA9IHRydWU7XG5FdmVudFNvdXJjZUlmcmFtZVRyYW5zcG9ydC5yb3VuZFRyaXBzID0gMzsgLy8gaHRtbCwgamF2YXNjcmlwdCwgZXZlbnRzb3VyY2VcblxuXG4vLyB3LWlmcmFtZS1ldmVudHNvdXJjZVxudmFyIEV2ZW50U291cmNlVHJhbnNwb3J0ID0gRmFjYWRlSlNbJ3ctaWZyYW1lLWV2ZW50c291cmNlJ10gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdGhpcy5ydW4ocmksIHRyYW5zX3VybCwgJy9ldmVudHNvdXJjZScsIEV2ZW50U291cmNlUmVjZWl2ZXIsIHV0aWxzLlhIUkxvY2FsT2JqZWN0KTtcbn1cbkV2ZW50U291cmNlVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBBamF4QmFzZWRUcmFuc3BvcnQoKTtcbi8vICAgICAgICAgWypdIEVuZCBvZiBsaWIvdHJhbnMtaWZyYW1lLWV2ZW50c291cmNlLmpzXG5cblxuLy8gICAgICAgICBbKl0gSW5jbHVkaW5nIGxpYi90cmFucy1pZnJhbWUteGhyLXBvbGxpbmcuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBYaHJQb2xsaW5nSWZyYW1lVHJhbnNwb3J0ID0gU29ja0pTWydpZnJhbWUteGhyLXBvbGxpbmcnXSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdGhhdC5wcm90b2NvbCA9ICd3LWlmcmFtZS14aHItcG9sbGluZyc7XG4gICAgdGhhdC5pX2NvbnN0cnVjdG9yLmFwcGx5KHRoYXQsIGFyZ3VtZW50cyk7XG59O1xuXG5YaHJQb2xsaW5nSWZyYW1lVHJhbnNwb3J0LnByb3RvdHlwZSA9IG5ldyBJZnJhbWVUcmFuc3BvcnQoKTtcblxuWGhyUG9sbGluZ0lmcmFtZVRyYW5zcG9ydC5lbmFibGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfd2luZG93LlhNTEh0dHBSZXF1ZXN0ICYmIElmcmFtZVRyYW5zcG9ydC5lbmFibGVkKCk7XG59O1xuXG5YaHJQb2xsaW5nSWZyYW1lVHJhbnNwb3J0Lm5lZWRfYm9keSA9IHRydWU7XG5YaHJQb2xsaW5nSWZyYW1lVHJhbnNwb3J0LnJvdW5kVHJpcHMgPSAzOyAvLyBodG1sLCBqYXZhc2NyaXB0LCB4aHJcblxuXG4vLyB3LWlmcmFtZS14aHItcG9sbGluZ1xudmFyIFhoclBvbGxpbmdJVHJhbnNwb3J0ID0gRmFjYWRlSlNbJ3ctaWZyYW1lLXhoci1wb2xsaW5nJ10gPSBmdW5jdGlvbihyaSwgdHJhbnNfdXJsKSB7XG4gICAgdGhpcy5ydW4ocmksIHRyYW5zX3VybCwgJy94aHInLCBYaHJSZWNlaXZlciwgdXRpbHMuWEhSTG9jYWxPYmplY3QpO1xufTtcblxuWGhyUG9sbGluZ0lUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEFqYXhCYXNlZFRyYW5zcG9ydCgpO1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1pZnJhbWUteGhyLXBvbGxpbmcuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLWlmcmFtZS1odG1sZmlsZS5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxuLy8gVGhpcyB0cmFuc3BvcnQgZ2VuZXJhbGx5IHdvcmtzIGluIGFueSBicm93c2VyLCBidXQgd2lsbCBjYXVzZSBhXG4vLyBzcGlubmluZyBjdXJzb3IgdG8gYXBwZWFyIGluIGFueSBicm93c2VyIG90aGVyIHRoYW4gSUUuXG4vLyBXZSBtYXkgdGVzdCB0aGlzIHRyYW5zcG9ydCBpbiBhbGwgYnJvd3NlcnMgLSB3aHkgbm90LCBidXQgaW5cbi8vIHByb2R1Y3Rpb24gaXQgc2hvdWxkIGJlIG9ubHkgcnVuIGluIElFLlxuXG52YXIgSHRtbEZpbGVJZnJhbWVUcmFuc3BvcnQgPSBTb2NrSlNbJ2lmcmFtZS1odG1sZmlsZSddID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnByb3RvY29sID0gJ3ctaWZyYW1lLWh0bWxmaWxlJztcbiAgICB0aGF0LmlfY29uc3RydWN0b3IuYXBwbHkodGhhdCwgYXJndW1lbnRzKTtcbn07XG5cbi8vIEluaGVyaXRhbmNlLlxuSHRtbEZpbGVJZnJhbWVUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IElmcmFtZVRyYW5zcG9ydCgpO1xuXG5IdG1sRmlsZUlmcmFtZVRyYW5zcG9ydC5lbmFibGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIElmcmFtZVRyYW5zcG9ydC5lbmFibGVkKCk7XG59O1xuXG5IdG1sRmlsZUlmcmFtZVRyYW5zcG9ydC5uZWVkX2JvZHkgPSB0cnVlO1xuSHRtbEZpbGVJZnJhbWVUcmFuc3BvcnQucm91bmRUcmlwcyA9IDM7IC8vIGh0bWwsIGphdmFzY3JpcHQsIGh0bWxmaWxlXG5cblxuLy8gdy1pZnJhbWUtaHRtbGZpbGVcbnZhciBIdG1sRmlsZVRyYW5zcG9ydCA9IEZhY2FkZUpTWyd3LWlmcmFtZS1odG1sZmlsZSddID0gZnVuY3Rpb24ocmksIHRyYW5zX3VybCkge1xuICAgIHRoaXMucnVuKHJpLCB0cmFuc191cmwsICcvaHRtbGZpbGUnLCBIdG1sZmlsZVJlY2VpdmVyLCB1dGlscy5YSFJMb2NhbE9iamVjdCk7XG59O1xuSHRtbEZpbGVUcmFuc3BvcnQucHJvdG90eXBlID0gbmV3IEFqYXhCYXNlZFRyYW5zcG9ydCgpO1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1pZnJhbWUtaHRtbGZpbGUuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLXBvbGxpbmcuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBQb2xsaW5nID0gZnVuY3Rpb24ocmksIFJlY2VpdmVyLCByZWN2X3VybCwgQWpheE9iamVjdCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGF0LnJpID0gcmk7XG4gICAgdGhhdC5SZWNlaXZlciA9IFJlY2VpdmVyO1xuICAgIHRoYXQucmVjdl91cmwgPSByZWN2X3VybDtcbiAgICB0aGF0LkFqYXhPYmplY3QgPSBBamF4T2JqZWN0O1xuICAgIHRoYXQuX3NjaGVkdWxlUmVjdigpO1xufTtcblxuUG9sbGluZy5wcm90b3R5cGUuX3NjaGVkdWxlUmVjdiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgcG9sbCA9IHRoYXQucG9sbCA9IG5ldyB0aGF0LlJlY2VpdmVyKHRoYXQucmVjdl91cmwsIHRoYXQuQWpheE9iamVjdCk7XG4gICAgdmFyIG1zZ19jb3VudGVyID0gMDtcbiAgICBwb2xsLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgbXNnX2NvdW50ZXIgKz0gMTtcbiAgICAgICAgdGhhdC5yaS5fZGlkTWVzc2FnZShlLmRhdGEpO1xuICAgIH07XG4gICAgcG9sbC5vbmNsb3NlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGF0LnBvbGwgPSBwb2xsID0gcG9sbC5vbm1lc3NhZ2UgPSBwb2xsLm9uY2xvc2UgPSBudWxsO1xuICAgICAgICBpZiAoIXRoYXQucG9sbF9pc19jbG9zaW5nKSB7XG4gICAgICAgICAgICBpZiAoZS5yZWFzb24gPT09ICdwZXJtYW5lbnQnKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5yaS5fZGlkQ2xvc2UoMTAwNiwgJ1BvbGxpbmcgZXJyb3IgKCcgKyBlLnJlYXNvbiArICcpJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoYXQuX3NjaGVkdWxlUmVjdigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn07XG5cblBvbGxpbmcucHJvdG90eXBlLmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIHRoYXQucG9sbF9pc19jbG9zaW5nID0gdHJ1ZTtcbiAgICBpZiAodGhhdC5wb2xsKSB7XG4gICAgICAgIHRoYXQucG9sbC5hYm9ydCgpO1xuICAgIH1cbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLXBvbGxpbmcuanNcblxuXG4vLyAgICAgICAgIFsqXSBJbmNsdWRpbmcgbGliL3RyYW5zLXJlY2VpdmVyLWV2ZW50c291cmNlLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgRXZlbnRTb3VyY2VSZWNlaXZlciA9IGZ1bmN0aW9uKHVybCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB2YXIgZXMgPSBuZXcgRXZlbnRTb3VyY2UodXJsKTtcbiAgICBlcy5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoJ21lc3NhZ2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsnZGF0YSc6IHVuZXNjYXBlKGUuZGF0YSl9KSk7XG4gICAgfTtcbiAgICB0aGF0LmVzX2Nsb3NlID0gZXMub25lcnJvciA9IGZ1bmN0aW9uKGUsIGFib3J0X3JlYXNvbikge1xuICAgICAgICAvLyBFUyBvbiByZWNvbm5lY3Rpb24gaGFzIHJlYWR5U3RhdGUgPSAwIG9yIDEuXG4gICAgICAgIC8vIG9uIG5ldHdvcmsgZXJyb3IgaXQncyBDTE9TRUQgPSAyXG4gICAgICAgIHZhciByZWFzb24gPSBhYm9ydF9yZWFzb24gPyAndXNlcicgOlxuICAgICAgICAgICAgKGVzLnJlYWR5U3RhdGUgIT09IDIgPyAnbmV0d29yaycgOiAncGVybWFuZW50Jyk7XG4gICAgICAgIHRoYXQuZXNfY2xvc2UgPSBlcy5vbm1lc3NhZ2UgPSBlcy5vbmVycm9yID0gbnVsbDtcbiAgICAgICAgLy8gRXZlbnRTb3VyY2UgcmVjb25uZWN0cyBhdXRvbWF0aWNhbGx5LlxuICAgICAgICBlcy5jbG9zZSgpO1xuICAgICAgICBlcyA9IG51bGw7XG4gICAgICAgIC8vIFNhZmFyaSBhbmQgY2hyb21lIDwgMTUgY3Jhc2ggaWYgd2UgY2xvc2Ugd2luZG93IGJlZm9yZVxuICAgICAgICAvLyB3YWl0aW5nIGZvciBFUyBjbGVhbnVwLiBTZWU6XG4gICAgICAgIC8vICAgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTg5MTU1XG4gICAgICAgIHV0aWxzLmRlbGF5KDIwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KCdjbG9zZScsIHtyZWFzb246IHJlYXNvbn0pKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgfTtcbn07XG5cbkV2ZW50U291cmNlUmVjZWl2ZXIucHJvdG90eXBlID0gbmV3IFJFdmVudFRhcmdldCgpO1xuXG5FdmVudFNvdXJjZVJlY2VpdmVyLnByb3RvdHlwZS5hYm9ydCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhhdC5lc19jbG9zZSkge1xuICAgICAgICB0aGF0LmVzX2Nsb3NlKHt9LCB0cnVlKTtcbiAgICB9XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1yZWNlaXZlci1ldmVudHNvdXJjZS5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtcmVjZWl2ZXItaHRtbGZpbGUuanNcbi8qXG4gKiAqKioqKiBCRUdJTiBMSUNFTlNFIEJMT0NLICoqKioqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAxMiBWTXdhcmUsIEluYy5cbiAqXG4gKiBGb3IgdGhlIGxpY2Vuc2Ugc2VlIENPUFlJTkcuXG4gKiAqKioqKiBFTkQgTElDRU5TRSBCTE9DSyAqKioqKlxuICovXG5cbnZhciBfaXNfaWVfaHRtbGZpbGVfY2FwYWJsZTtcbnZhciBpc0llSHRtbGZpbGVDYXBhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKF9pc19pZV9odG1sZmlsZV9jYXBhYmxlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKCdBY3RpdmVYT2JqZWN0JyBpbiBfd2luZG93KSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIF9pc19pZV9odG1sZmlsZV9jYXBhYmxlID0gISFuZXcgQWN0aXZlWE9iamVjdCgnaHRtbGZpbGUnKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKHgpIHt9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfaXNfaWVfaHRtbGZpbGVfY2FwYWJsZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBfaXNfaWVfaHRtbGZpbGVfY2FwYWJsZTtcbn07XG5cblxudmFyIEh0bWxmaWxlUmVjZWl2ZXIgPSBmdW5jdGlvbih1cmwpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdXRpbHMucG9sbHV0ZUdsb2JhbE5hbWVzcGFjZSgpO1xuXG4gICAgdGhhdC5pZCA9ICdhJyArIHV0aWxzLnJhbmRvbV9zdHJpbmcoNiwgMjYpO1xuICAgIHVybCArPSAoKHVybC5pbmRleE9mKCc/JykgPT09IC0xKSA/ICc/JyA6ICcmJykgK1xuICAgICAgICAnYz0nICsgZXNjYXBlKFdQcmVmaXggKyAnLicgKyB0aGF0LmlkKTtcblxuICAgIHZhciBjb25zdHJ1Y3RvciA9IGlzSWVIdG1sZmlsZUNhcGFibGUoKSA/XG4gICAgICAgIHV0aWxzLmNyZWF0ZUh0bWxmaWxlIDogdXRpbHMuY3JlYXRlSWZyYW1lO1xuXG4gICAgdmFyIGlmcmFtZU9iajtcbiAgICBfd2luZG93W1dQcmVmaXhdW3RoYXQuaWRdID0ge1xuICAgICAgICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWZyYW1lT2JqLmxvYWRlZCgpO1xuICAgICAgICB9LFxuICAgICAgICBtZXNzYWdlOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudCgnbWVzc2FnZScsIHsnZGF0YSc6IGRhdGF9KSk7XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQuaWZyYW1lX2Nsb3NlKHt9LCAnbmV0d29yaycpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGF0LmlmcmFtZV9jbG9zZSA9IGZ1bmN0aW9uKGUsIGFib3J0X3JlYXNvbikge1xuICAgICAgICBpZnJhbWVPYmouY2xlYW51cCgpO1xuICAgICAgICB0aGF0LmlmcmFtZV9jbG9zZSA9IGlmcmFtZU9iaiA9IG51bGw7XG4gICAgICAgIGRlbGV0ZSBfd2luZG93W1dQcmVmaXhdW3RoYXQuaWRdO1xuICAgICAgICB0aGF0LmRpc3BhdGNoRXZlbnQobmV3IFNpbXBsZUV2ZW50KCdjbG9zZScsIHtyZWFzb246IGFib3J0X3JlYXNvbn0pKTtcbiAgICB9O1xuICAgIGlmcmFtZU9iaiA9IGNvbnN0cnVjdG9yKHVybCwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmlmcmFtZV9jbG9zZSh7fSwgJ3Blcm1hbmVudCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xufTtcblxuSHRtbGZpbGVSZWNlaXZlci5wcm90b3R5cGUgPSBuZXcgUkV2ZW50VGFyZ2V0KCk7XG5cbkh0bWxmaWxlUmVjZWl2ZXIucHJvdG90eXBlLmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LmlmcmFtZV9jbG9zZSkge1xuICAgICAgICB0aGF0LmlmcmFtZV9jbG9zZSh7fSwgJ3VzZXInKTtcbiAgICB9XG59O1xuLy8gICAgICAgICBbKl0gRW5kIG9mIGxpYi90cmFucy1yZWNlaXZlci1odG1sZmlsZS5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdHJhbnMtcmVjZWl2ZXIteGhyLmpzXG4vKlxuICogKioqKiogQkVHSU4gTElDRU5TRSBCTE9DSyAqKioqKlxuICogQ29weXJpZ2h0IChjKSAyMDExLTIwMTIgVk13YXJlLCBJbmMuXG4gKlxuICogRm9yIHRoZSBsaWNlbnNlIHNlZSBDT1BZSU5HLlxuICogKioqKiogRU5EIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqL1xuXG52YXIgWGhyUmVjZWl2ZXIgPSBmdW5jdGlvbih1cmwsIEFqYXhPYmplY3QpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgdmFyIGJ1Zl9wb3MgPSAwO1xuXG4gICAgdGhhdC54byA9IG5ldyBBamF4T2JqZWN0KCdQT1NUJywgdXJsLCBudWxsKTtcbiAgICB0aGF0LnhvLm9uY2h1bmsgPSBmdW5jdGlvbihzdGF0dXMsIHRleHQpIHtcbiAgICAgICAgaWYgKHN0YXR1cyAhPT0gMjAwKSByZXR1cm47XG4gICAgICAgIHdoaWxlICgxKSB7XG4gICAgICAgICAgICB2YXIgYnVmID0gdGV4dC5zbGljZShidWZfcG9zKTtcbiAgICAgICAgICAgIHZhciBwID0gYnVmLmluZGV4T2YoJ1xcbicpO1xuICAgICAgICAgICAgaWYgKHAgPT09IC0xKSBicmVhaztcbiAgICAgICAgICAgIGJ1Zl9wb3MgKz0gcCsxO1xuICAgICAgICAgICAgdmFyIG1zZyA9IGJ1Zi5zbGljZSgwLCBwKTtcbiAgICAgICAgICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoJ21lc3NhZ2UnLCB7ZGF0YTogbXNnfSkpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGF0LnhvLm9uZmluaXNoID0gZnVuY3Rpb24oc3RhdHVzLCB0ZXh0KSB7XG4gICAgICAgIHRoYXQueG8ub25jaHVuayhzdGF0dXMsIHRleHQpO1xuICAgICAgICB0aGF0LnhvID0gbnVsbDtcbiAgICAgICAgdmFyIHJlYXNvbiA9IHN0YXR1cyA9PT0gMjAwID8gJ25ldHdvcmsnIDogJ3Blcm1hbmVudCc7XG4gICAgICAgIHRoYXQuZGlzcGF0Y2hFdmVudChuZXcgU2ltcGxlRXZlbnQoJ2Nsb3NlJywge3JlYXNvbjogcmVhc29ufSkpO1xuICAgIH1cbn07XG5cblhoclJlY2VpdmVyLnByb3RvdHlwZSA9IG5ldyBSRXZlbnRUYXJnZXQoKTtcblxuWGhyUmVjZWl2ZXIucHJvdG90eXBlLmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgIGlmICh0aGF0LnhvKSB7XG4gICAgICAgIHRoYXQueG8uY2xvc2UoKTtcbiAgICAgICAgdGhhdC5kaXNwYXRjaEV2ZW50KG5ldyBTaW1wbGVFdmVudCgnY2xvc2UnLCB7cmVhc29uOiAndXNlcid9KSk7XG4gICAgICAgIHRoYXQueG8gPSBudWxsO1xuICAgIH1cbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3RyYW5zLXJlY2VpdmVyLXhoci5qc1xuXG5cbi8vICAgICAgICAgWypdIEluY2x1ZGluZyBsaWIvdGVzdC1ob29rcy5qc1xuLypcbiAqICoqKioqIEJFR0lOIExJQ0VOU0UgQkxPQ0sgKioqKipcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDEyIFZNd2FyZSwgSW5jLlxuICpcbiAqIEZvciB0aGUgbGljZW5zZSBzZWUgQ09QWUlORy5cbiAqICoqKioqIEVORCBMSUNFTlNFIEJMT0NLICoqKioqXG4gKi9cblxuLy8gRm9yIHRlc3RpbmdcblNvY2tKUy5nZXRVdGlscyA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHV0aWxzO1xufTtcblxuU29ja0pTLmdldElmcmFtZVRyYW5zcG9ydCA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIElmcmFtZVRyYW5zcG9ydDtcbn07XG4vLyAgICAgICAgIFsqXSBFbmQgb2YgbGliL3Rlc3QtaG9va3MuanNcblxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFNvY2tKUztcbiAgICAgICAgICB9KSgpO1xuaWYgKCdfc29ja2pzX29ubG9hZCcgaW4gd2luZG93KSBzZXRUaW1lb3V0KF9zb2NranNfb25sb2FkLCAxKTtcblxuLy8gQU1EIGNvbXBsaWFuY2VcbmlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoJ3NvY2tqcycsIFtdLCBmdW5jdGlvbigpe3JldHVybiBTb2NrSlM7fSk7XG59XG5cbmlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFNvY2tKUztcbn1cbi8vICAgICBbKl0gRW5kIG9mIGxpYi9pbmRleC5qc1xuXG4vLyBbKl0gRW5kIG9mIGxpYi9hbGwuanNcblxuIiwidmFyIHBub2RlID0gcmVxdWlyZShcIi4uLy4uL1wiKTtcblxucG5vZGUuYWRkVHJhbnNwb3J0KFwid3NcIiwgcmVxdWlyZShcIi4vdHJhbnNwb3J0cy93c1wiKSk7XG5cbmlmKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmXG4gICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiZcbiAgIGV4cG9ydHMgPT09IG1vZHVsZS5leHBvcnRzKVxuICBtb2R1bGUuZXhwb3J0cyA9IHBub2RlO1xuXG53aW5kb3cucG5vZGUgPSBwbm9kZTtcbiIsInZhciBzaG9lID0gcmVxdWlyZSgnc2hvZScpO1xuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24oc3RyKSB7XG4gIGlmICh0eXBlb2Ygc3RyID09PSAnc3RyaW5nJyAmJiAvXi4rXFwvLiskLy50ZXN0KHN0cikpXG4gICAgc3RyID0gXCJodHRwOi8vXCIgKyBzdHI7XG4gIHJldHVybiBbc3RyXTtcbn07XG5cbmV4cG9ydHMuYmluZFNlcnZlciA9IGZ1bmN0aW9uKCkge1xuICB0aHJvdyBcImJpbmQgd3Mgc2VydmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhlIGJyb3dzZXJcIjtcbn07XG5cbmV4cG9ydHMuYmluZENsaWVudCA9IGZ1bmN0aW9uKCkge1xuXG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgdmFyIGVtaXR0ZXIgPSBhcmdzLnNoaWZ0KCk7XG4gIHZhciBzdHJlYW0gPSBzaG9lLmFwcGx5KG51bGwsIGFyZ3MpO1xuXG4gIGVtaXR0ZXIuZW1pdCgnc3RyZWFtJywgc3RyZWFtKTtcblxuICBzdHJlYW0ub25jZSgnY29ubmVjdCcsIGZ1bmN0aW9uKCkge1xuICAgIGVtaXR0ZXIuZW1pdCgnYm91bmQnKTtcbiAgfSk7XG5cbiAgZW1pdHRlci5vbmNlKCd1bmJpbmQnLCBmdW5jdGlvbigpIHtcbiAgICBzdHJlYW0uZW5kKCk7XG4gIH0pO1xuXG4gIHN0cmVhbS5vbmNlKCdlbmQnLCBmdW5jdGlvbigpIHtcbiAgICBlbWl0dGVyLmVtaXQoJ3VuYm91bmQnKTtcbiAgfSk7XG59O1xuIiwidmFyIGRub2RlID0gcmVxdWlyZSgnLi9saWIvZG5vZGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29ucywgb3B0cykge1xuICAgIHJldHVybiBuZXcgZG5vZGUoY29ucywgb3B0cyk7XG59O1xuIiwidmFyIHByb2Nlc3M9cmVxdWlyZShcIl9fYnJvd3NlcmlmeV9wcm9jZXNzXCIpO3ZhciBwcm90b2NvbCA9IHJlcXVpcmUoJ2Rub2RlLXByb3RvY29sJyk7XG52YXIgU3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJyk7XG52YXIganNvbiA9IHR5cGVvZiBKU09OID09PSAnb2JqZWN0JyA/IEpTT04gOiByZXF1aXJlKCdqc29uaWZ5Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZG5vZGU7XG5kbm9kZS5wcm90b3R5cGUgPSB7fTtcbihmdW5jdGlvbiAoKSB7IC8vIGJyb3dzZXJzIGV0Y1xuICAgIGZvciAodmFyIGtleSBpbiBTdHJlYW0ucHJvdG90eXBlKSB7XG4gICAgICAgIGRub2RlLnByb3RvdHlwZVtrZXldID0gU3RyZWFtLnByb3RvdHlwZVtrZXldO1xuICAgIH1cbn0pKCk7XG5cbmZ1bmN0aW9uIGRub2RlIChjb25zLCBvcHRzKSB7XG4gICAgU3RyZWFtLmNhbGwodGhpcyk7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIFxuICAgIHNlbGYub3B0cyA9IG9wdHMgfHwge307XG4gICAgXG4gICAgc2VsZi5jb25zID0gdHlwZW9mIGNvbnMgPT09ICdmdW5jdGlvbidcbiAgICAgICAgPyBjb25zXG4gICAgICAgIDogZnVuY3Rpb24gKCkgeyByZXR1cm4gY29ucyB8fCB7fSB9XG4gICAgO1xuICAgIFxuICAgIHNlbGYucmVhZGFibGUgPSB0cnVlO1xuICAgIHNlbGYud3JpdGFibGUgPSB0cnVlO1xuICAgIFxuICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoc2VsZi5fZW5kZWQpIHJldHVybjtcbiAgICAgICAgc2VsZi5wcm90byA9IHNlbGYuX2NyZWF0ZVByb3RvKCk7XG4gICAgICAgIHNlbGYucHJvdG8uc3RhcnQoKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghc2VsZi5faGFuZGxlUXVldWUpIHJldHVybjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLl9oYW5kbGVRdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc2VsZi5oYW5kbGUoc2VsZi5faGFuZGxlUXVldWVbaV0pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmRub2RlLnByb3RvdHlwZS5fY3JlYXRlUHJvdG8gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBwcm90byA9IHByb3RvY29sKGZ1bmN0aW9uIChyZW1vdGUpIHtcbiAgICAgICAgaWYgKHNlbGYuX2VuZGVkKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICB2YXIgcmVmID0gc2VsZi5jb25zLmNhbGwodGhpcywgcmVtb3RlLCBzZWxmKTtcbiAgICAgICAgaWYgKHR5cGVvZiByZWYgIT09ICdvYmplY3QnKSByZWYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgc2VsZi5lbWl0KCdsb2NhbCcsIHJlZiwgc2VsZik7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gcmVmO1xuICAgIH0sIHNlbGYub3B0cy5wcm90byk7XG4gICAgXG4gICAgcHJvdG8ub24oJ3JlbW90ZScsIGZ1bmN0aW9uIChyZW1vdGUpIHtcbiAgICAgICAgc2VsZi5lbWl0KCdyZW1vdGUnLCByZW1vdGUsIHNlbGYpO1xuICAgICAgICBzZWxmLmVtaXQoJ3JlYWR5Jyk7IC8vIGJhY2t3YXJkcyBjb21wYXRhYmlsaXR5LCBkZXByZWNhdGVkXG4gICAgfSk7XG4gICAgXG4gICAgcHJvdG8ub24oJ3JlcXVlc3QnLCBmdW5jdGlvbiAocmVxKSB7XG4gICAgICAgIGlmICghc2VsZi5yZWFkYWJsZSkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgaWYgKHNlbGYub3B0cy5lbWl0ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgc2VsZi5lbWl0KCdkYXRhJywgcmVxKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHNlbGYuZW1pdCgnZGF0YScsIGpzb24uc3RyaW5naWZ5KHJlcSkgKyAnXFxuJyk7XG4gICAgfSk7XG4gICAgXG4gICAgcHJvdG8ub24oJ2ZhaWwnLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIC8vIGVycm9ycyB0aGF0IHRoZSByZW1vdGUgZW5kIHdhcyByZXNwb25zaWJsZSBmb3JcbiAgICAgICAgc2VsZi5lbWl0KCdmYWlsJywgZXJyKTtcbiAgICB9KTtcbiAgICBcbiAgICBwcm90by5vbignZXJyb3InLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIC8vIGVycm9ycyB0aGF0IHRoZSBsb2NhbCBjb2RlIHdhcyByZXNwb25zaWJsZSBmb3JcbiAgICAgICAgc2VsZi5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgfSk7XG4gICAgXG4gICAgcmV0dXJuIHByb3RvO1xufTtcblxuZG5vZGUucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gKGJ1Zikge1xuICAgIGlmICh0aGlzLl9lbmRlZCkgcmV0dXJuO1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgcm93O1xuICAgIFxuICAgIGlmIChidWYgJiYgdHlwZW9mIGJ1ZiA9PT0gJ29iamVjdCdcbiAgICAmJiBidWYuY29uc3RydWN0b3IgJiYgYnVmLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdCdWZmZXInXG4gICAgJiYgYnVmLmxlbmd0aFxuICAgICYmIHR5cGVvZiBidWYuc2xpY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gdHJlYXQgbGlrZSBhIGJ1ZmZlclxuICAgICAgICBpZiAoIXNlbGYuX2J1ZnMpIHNlbGYuX2J1ZnMgPSBbXTtcbiAgICAgICAgXG4gICAgICAgIC8vIHRyZWF0IGxpa2UgYSBidWZmZXJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBpIDwgYnVmLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoYnVmW2ldID09PSAweDBhKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fYnVmcy5wdXNoKGJ1Zi5zbGljZShqLCBpKSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIGxpbmUgPSAnJztcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IHNlbGYuX2J1ZnMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZSArPSBTdHJpbmcoc2VsZi5fYnVmc1trXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRyeSB7IHJvdyA9IGpzb24ucGFyc2UobGluZSkgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHsgcmV0dXJuIHNlbGYuZW5kKCkgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGogPSBpICsgMTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBzZWxmLmhhbmRsZShyb3cpO1xuICAgICAgICAgICAgICAgIHNlbGYuX2J1ZnMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGogPCBidWYubGVuZ3RoKSBzZWxmLl9idWZzLnB1c2goYnVmLnNsaWNlKGosIGJ1Zi5sZW5ndGgpKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoYnVmICYmIHR5cGVvZiBidWYgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIC8vIC5pc0J1ZmZlcigpIHdpdGhvdXQgdGhlIEJ1ZmZlclxuICAgICAgICAvLyBVc2Ugc2VsZiB0byBwaXBlIEpTT05TdHJlYW0ucGFyc2UoKSBzdHJlYW1zLlxuICAgICAgICBzZWxmLmhhbmRsZShidWYpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBidWYgIT09ICdzdHJpbmcnKSBidWYgPSBTdHJpbmcoYnVmKTtcbiAgICAgICAgaWYgKCFzZWxmLl9saW5lKSBzZWxmLl9saW5lID0gJyc7XG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1Zi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGJ1Zi5jaGFyQ29kZUF0KGkpID09PSAweDBhKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHsgcm93ID0ganNvbi5wYXJzZShzZWxmLl9saW5lKSB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycikgeyByZXR1cm4gc2VsZi5lbmQoKSB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2VsZi5fbGluZSA9ICcnO1xuICAgICAgICAgICAgICAgIHNlbGYuaGFuZGxlKHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHNlbGYuX2xpbmUgKz0gYnVmLmNoYXJBdChpKVxuICAgICAgICB9XG4gICAgfVxufTtcblxuZG5vZGUucHJvdG90eXBlLmhhbmRsZSA9IGZ1bmN0aW9uIChyb3cpIHtcbiAgICBpZiAoIXRoaXMucHJvdG8pIHtcbiAgICAgICAgaWYgKCF0aGlzLl9oYW5kbGVRdWV1ZSkgdGhpcy5faGFuZGxlUXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5faGFuZGxlUXVldWUucHVzaChyb3cpO1xuICAgIH1cbiAgICBlbHNlIHRoaXMucHJvdG8uaGFuZGxlKHJvdyk7XG59O1xuXG5kbm9kZS5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9lbmRlZCkgcmV0dXJuO1xuICAgIHRoaXMuX2VuZGVkID0gdHJ1ZTtcbiAgICB0aGlzLndyaXRhYmxlID0gZmFsc2U7XG4gICAgdGhpcy5yZWFkYWJsZSA9IGZhbHNlO1xuICAgIHRoaXMuZW1pdCgnZW5kJyk7XG59O1xuXG5kbm9kZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmVuZCgpO1xufTtcbiIsInZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XG52YXIgc2NydWJiZXIgPSByZXF1aXJlKCcuL2xpYi9zY3J1YicpO1xudmFyIG9iamVjdEtleXMgPSByZXF1aXJlKCcuL2xpYi9rZXlzJyk7XG52YXIgZm9yRWFjaCA9IHJlcXVpcmUoJy4vbGliL2ZvcmVhY2gnKTtcbnZhciBpc0VudW1lcmFibGUgPSByZXF1aXJlKCcuL2xpYi9pc19lbnVtJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbnMsIG9wdHMpIHtcbiAgICByZXR1cm4gbmV3IFByb3RvKGNvbnMsIG9wdHMpO1xufTtcblxuKGZ1bmN0aW9uICgpIHsgLy8gYnJvd3NlcnMgYmxlaFxuICAgIGZvciAodmFyIGtleSBpbiBFdmVudEVtaXR0ZXIucHJvdG90eXBlKSB7XG4gICAgICAgIFByb3RvLnByb3RvdHlwZVtrZXldID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZVtrZXldO1xuICAgIH1cbn0pKCk7XG5cbmZ1bmN0aW9uIFByb3RvIChjb25zLCBvcHRzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIEV2ZW50RW1pdHRlci5jYWxsKHNlbGYpO1xuICAgIGlmICghb3B0cykgb3B0cyA9IHt9O1xuICAgIFxuICAgIHNlbGYucmVtb3RlID0ge307XG4gICAgc2VsZi5jYWxsYmFja3MgPSB7IGxvY2FsIDogW10sIHJlbW90ZSA6IFtdIH07XG4gICAgc2VsZi53cmFwID0gb3B0cy53cmFwO1xuICAgIHNlbGYudW53cmFwID0gb3B0cy51bndyYXA7XG4gICAgXG4gICAgc2VsZi5zY3J1YmJlciA9IHNjcnViYmVyKHNlbGYuY2FsbGJhY2tzLmxvY2FsKTtcbiAgICBcbiAgICBpZiAodHlwZW9mIGNvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgc2VsZi5pbnN0YW5jZSA9IG5ldyBjb25zKHNlbGYucmVtb3RlLCBzZWxmKTtcbiAgICB9XG4gICAgZWxzZSBzZWxmLmluc3RhbmNlID0gY29ucyB8fCB7fTtcbn1cblxuUHJvdG8ucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucmVxdWVzdCgnbWV0aG9kcycsIFsgdGhpcy5pbnN0YW5jZSBdKTtcbn07XG5cblByb3RvLnByb3RvdHlwZS5jdWxsID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgZGVsZXRlIHRoaXMuY2FsbGJhY2tzLnJlbW90ZVtpZF07XG4gICAgdGhpcy5lbWl0KCdyZXF1ZXN0Jywge1xuICAgICAgICBtZXRob2QgOiAnY3VsbCcsXG4gICAgICAgIGFyZ3VtZW50cyA6IFsgaWQgXVxuICAgIH0pO1xufTtcblxuUHJvdG8ucHJvdG90eXBlLnJlcXVlc3QgPSBmdW5jdGlvbiAobWV0aG9kLCBhcmdzKSB7XG4gICAgdmFyIHNjcnViID0gdGhpcy5zY3J1YmJlci5zY3J1YihhcmdzKTtcbiAgICBcbiAgICB0aGlzLmVtaXQoJ3JlcXVlc3QnLCB7XG4gICAgICAgIG1ldGhvZCA6IG1ldGhvZCxcbiAgICAgICAgYXJndW1lbnRzIDogc2NydWIuYXJndW1lbnRzLFxuICAgICAgICBjYWxsYmFja3MgOiBzY3J1Yi5jYWxsYmFja3MsXG4gICAgICAgIGxpbmtzIDogc2NydWIubGlua3NcbiAgICB9KTtcbn07XG5cblByb3RvLnByb3RvdHlwZS5oYW5kbGUgPSBmdW5jdGlvbiAocmVxKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBhcmdzID0gc2VsZi5zY3J1YmJlci51bnNjcnViKHJlcSwgZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIGlmIChzZWxmLmNhbGxiYWNrcy5yZW1vdGVbaWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhIG5ldyBmdW5jdGlvbiBvbmx5IGlmIG9uZSBoYXNuJ3QgYWxyZWFkeSBiZWVuIGNyZWF0ZWRcbiAgICAgICAgICAgIC8vIGZvciBhIHBhcnRpY3VsYXIgaWRcbiAgICAgICAgICAgIHZhciBjYiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnJlcXVlc3QoaWQsIFtdLnNsaWNlLmFwcGx5KGFyZ3VtZW50cykpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHNlbGYuY2FsbGJhY2tzLnJlbW90ZVtpZF0gPSBzZWxmLndyYXAgPyBzZWxmLndyYXAoY2IsIGlkKSA6IGNiO1xuICAgICAgICAgICAgcmV0dXJuIGNiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZWxmLnVud3JhcFxuICAgICAgICAgICAgPyBzZWxmLnVud3JhcChzZWxmLmNhbGxiYWNrcy5yZW1vdGVbaWRdLCBpZClcbiAgICAgICAgICAgIDogc2VsZi5jYWxsYmFja3MucmVtb3RlW2lkXVxuICAgICAgICA7XG4gICAgfSk7XG4gICAgXG4gICAgaWYgKHJlcS5tZXRob2QgPT09ICdtZXRob2RzJykge1xuICAgICAgICBzZWxmLmhhbmRsZU1ldGhvZHMoYXJnc1swXSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHJlcS5tZXRob2QgPT09ICdjdWxsJykge1xuICAgICAgICBmb3JFYWNoKGFyZ3MsIGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgZGVsZXRlIHNlbGYuY2FsbGJhY2tzLmxvY2FsW2lkXTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiByZXEubWV0aG9kID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAoaXNFbnVtZXJhYmxlKHNlbGYuaW5zdGFuY2UsIHJlcS5tZXRob2QpKSB7XG4gICAgICAgICAgICBzZWxmLmFwcGx5KHNlbGYuaW5zdGFuY2VbcmVxLm1ldGhvZF0sIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5lbWl0KCdmYWlsJywgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICdyZXF1ZXN0IGZvciBub24tZW51bWVyYWJsZSBtZXRob2Q6ICcgKyByZXEubWV0aG9kXG4gICAgICAgICAgICApKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgcmVxLm1ldGhvZCA9PSAnbnVtYmVyJykge1xuICAgICAgICB2YXIgZm4gPSBzZWxmLmNhbGxiYWNrcy5sb2NhbFtyZXEubWV0aG9kXTtcbiAgICAgICAgaWYgKCFmbikge1xuICAgICAgICAgICAgc2VsZi5lbWl0KCdmYWlsJywgbmV3IEVycm9yKCdubyBzdWNoIG1ldGhvZCcpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHNlbGYuYXBwbHkoZm4sIGFyZ3MpO1xuICAgIH1cbn07XG5cblByb3RvLnByb3RvdHlwZS5oYW5kbGVNZXRob2RzID0gZnVuY3Rpb24gKG1ldGhvZHMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHR5cGVvZiBtZXRob2RzICE9ICdvYmplY3QnKSB7XG4gICAgICAgIG1ldGhvZHMgPSB7fTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29weSBzaW5jZSBhc3NpZ25tZW50IGRpc2NhcmRzIHRoZSBwcmV2aW91cyByZWZzXG4gICAgZm9yRWFjaChvYmplY3RLZXlzKHNlbGYucmVtb3RlKSwgZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBkZWxldGUgc2VsZi5yZW1vdGVba2V5XTtcbiAgICB9KTtcbiAgICBcbiAgICBmb3JFYWNoKG9iamVjdEtleXMobWV0aG9kcyksIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgc2VsZi5yZW1vdGVba2V5XSA9IG1ldGhvZHNba2V5XTtcbiAgICB9KTtcbiAgICBcbiAgICBzZWxmLmVtaXQoJ3JlbW90ZScsIHNlbGYucmVtb3RlKTtcbiAgICBzZWxmLmVtaXQoJ3JlYWR5Jyk7XG59O1xuXG5Qcm90by5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbiAoZiwgYXJncykge1xuICAgIHRyeSB7IGYuYXBwbHkodW5kZWZpbmVkLCBhcmdzKSB9XG4gICAgY2F0Y2ggKGVycikgeyB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKSB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmb3JFYWNoICh4cywgZikge1xuICAgIGlmICh4cy5mb3JFYWNoKSByZXR1cm4geHMuZm9yRWFjaChmKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZi5jYWxsKHhzLCB4c1tpXSwgaSk7XG4gICAgfVxufVxuIiwidmFyIG9iamVjdEtleXMgPSByZXF1aXJlKCcuL2tleXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqLCBrZXkpIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZSkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iaiwga2V5KTtcbiAgICB9XG4gICAgdmFyIGtleXMgPSBvYmplY3RLZXlzKG9iaik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChrZXkgPT09IGtleXNbaV0pIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBrZXlzLnB1c2goa2V5KTtcbiAgICByZXR1cm4ga2V5cztcbn07XG4iLCJ2YXIgdHJhdmVyc2UgPSByZXF1aXJlKCd0cmF2ZXJzZScpO1xudmFyIG9iamVjdEtleXMgPSByZXF1aXJlKCcuL2tleXMnKTtcbnZhciBmb3JFYWNoID0gcmVxdWlyZSgnLi9mb3JlYWNoJyk7XG5cbmZ1bmN0aW9uIGluZGV4T2YgKHhzLCB4KSB7XG4gICAgaWYgKHhzLmluZGV4T2YpIHJldHVybiB4cy5pbmRleE9mKHgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIGlmICh4c1tpXSA9PT0geCkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xufVxuXG4vLyBzY3J1YiBjYWxsYmFja3Mgb3V0IG9mIHJlcXVlc3RzIGluIG9yZGVyIHRvIGNhbGwgdGhlbSBhZ2FpbiBsYXRlclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY2FsbGJhY2tzKSB7XG4gICAgcmV0dXJuIG5ldyBTY3J1YmJlcihjYWxsYmFja3MpO1xufTtcblxuZnVuY3Rpb24gU2NydWJiZXIgKGNhbGxiYWNrcykge1xuICAgIHRoaXMuY2FsbGJhY2tzID0gY2FsbGJhY2tzO1xufVxuXG4vLyBUYWtlIHRoZSBmdW5jdGlvbnMgb3V0IGFuZCBub3RlIHRoZW0gZm9yIGZ1dHVyZSB1c2VcblNjcnViYmVyLnByb3RvdHlwZS5zY3J1YiA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHBhdGhzID0ge307XG4gICAgdmFyIGxpbmtzID0gW107XG4gICAgXG4gICAgdmFyIGFyZ3MgPSB0cmF2ZXJzZShvYmopLm1hcChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICBpZiAodHlwZW9mIG5vZGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHZhciBpID0gaW5kZXhPZihzZWxmLmNhbGxiYWNrcywgbm9kZSk7XG4gICAgICAgICAgICBpZiAoaSA+PSAwICYmICEoaSBpbiBwYXRocykpIHtcbiAgICAgICAgICAgICAgICAvLyBLZWVwIHByZXZpb3VzIGZ1bmN0aW9uIElEcyBvbmx5IGZvciB0aGUgZmlyc3QgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICAvLyBmb3VuZC4gVGhpcyBpcyBzb21ld2hhdCBzdWJvcHRpbWFsIGJ1dCB0aGUgYWx0ZXJuYXRpdmVzXG4gICAgICAgICAgICAgICAgLy8gYXJlIHdvcnNlLlxuICAgICAgICAgICAgICAgIHBhdGhzW2ldID0gdGhpcy5wYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGlkID0gc2VsZi5jYWxsYmFja3MubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHNlbGYuY2FsbGJhY2tzLnB1c2gobm9kZSk7XG4gICAgICAgICAgICAgICAgcGF0aHNbaWRdID0gdGhpcy5wYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSgnW0Z1bmN0aW9uXScpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuY2lyY3VsYXIpIHtcbiAgICAgICAgICAgIGxpbmtzLnB1c2goeyBmcm9tIDogdGhpcy5jaXJjdWxhci5wYXRoLCB0byA6IHRoaXMucGF0aCB9KTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlKCdbQ2lyY3VsYXJdJyk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgICBhcmd1bWVudHMgOiBhcmdzLFxuICAgICAgICBjYWxsYmFja3MgOiBwYXRocyxcbiAgICAgICAgbGlua3MgOiBsaW5rc1xuICAgIH07XG59O1xuIFxuLy8gUmVwbGFjZSBjYWxsYmFja3MuIFRoZSBzdXBwbGllZCBmdW5jdGlvbiBzaG91bGQgdGFrZSBhIGNhbGxiYWNrIGlkIGFuZFxuLy8gcmV0dXJuIGEgY2FsbGJhY2sgb2YgaXRzIG93bi5cblNjcnViYmVyLnByb3RvdHlwZS51bnNjcnViID0gZnVuY3Rpb24gKG1zZywgZikge1xuICAgIHZhciBhcmdzID0gbXNnLmFyZ3VtZW50cyB8fCBbXTtcbiAgICBmb3JFYWNoKG9iamVjdEtleXMobXNnLmNhbGxiYWNrcyB8fCB7fSksIGZ1bmN0aW9uIChzaWQpIHtcbiAgICAgICAgdmFyIGlkID0gcGFyc2VJbnQoc2lkLCAxMCk7XG4gICAgICAgIHZhciBwYXRoID0gbXNnLmNhbGxiYWNrc1tpZF07XG4gICAgICAgIHRyYXZlcnNlLnNldChhcmdzLCBwYXRoLCBmKGlkKSk7XG4gICAgfSk7XG4gICAgXG4gICAgZm9yRWFjaChtc2cubGlua3MgfHwgW10sIGZ1bmN0aW9uIChsaW5rKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IHRyYXZlcnNlLmdldChhcmdzLCBsaW5rLmZyb20pO1xuICAgICAgICB0cmF2ZXJzZS5zZXQoYXJncywgbGluay50bywgdmFsdWUpO1xuICAgIH0pO1xuICAgIFxuICAgIHJldHVybiBhcmdzO1xufTtcbiIsInZhciB0cmF2ZXJzZSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiBuZXcgVHJhdmVyc2Uob2JqKTtcbn07XG5cbmZ1bmN0aW9uIFRyYXZlcnNlIChvYmopIHtcbiAgICB0aGlzLnZhbHVlID0gb2JqO1xufVxuXG5UcmF2ZXJzZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKHBzKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLnZhbHVlO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHMubGVuZ3RoOyBpICsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBwc1tpXTtcbiAgICAgICAgaWYgKCFub2RlIHx8ICFoYXNPd25Qcm9wZXJ0eS5jYWxsKG5vZGUsIGtleSkpIHtcbiAgICAgICAgICAgIG5vZGUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZVtrZXldO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbn07XG5cblRyYXZlcnNlLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAocHMpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMudmFsdWU7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcy5sZW5ndGg7IGkgKyspIHtcbiAgICAgICAgdmFyIGtleSA9IHBzW2ldO1xuICAgICAgICBpZiAoIW5vZGUgfHwgIWhhc093blByb3BlcnR5LmNhbGwobm9kZSwga2V5KSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlW2tleV07XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufTtcblxuVHJhdmVyc2UucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChwcywgdmFsdWUpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMudmFsdWU7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcy5sZW5ndGggLSAxOyBpICsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBwc1tpXTtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wZXJ0eS5jYWxsKG5vZGUsIGtleSkpIG5vZGVba2V5XSA9IHt9O1xuICAgICAgICBub2RlID0gbm9kZVtrZXldO1xuICAgIH1cbiAgICBub2RlW3BzW2ldXSA9IHZhbHVlO1xuICAgIHJldHVybiB2YWx1ZTtcbn07XG5cblRyYXZlcnNlLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICByZXR1cm4gd2Fsayh0aGlzLnZhbHVlLCBjYiwgdHJ1ZSk7XG59O1xuXG5UcmF2ZXJzZS5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChjYikge1xuICAgIHRoaXMudmFsdWUgPSB3YWxrKHRoaXMudmFsdWUsIGNiLCBmYWxzZSk7XG4gICAgcmV0dXJuIHRoaXMudmFsdWU7XG59O1xuXG5UcmF2ZXJzZS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKGNiLCBpbml0KSB7XG4gICAgdmFyIHNraXAgPSBhcmd1bWVudHMubGVuZ3RoID09PSAxO1xuICAgIHZhciBhY2MgPSBza2lwID8gdGhpcy52YWx1ZSA6IGluaXQ7XG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICghdGhpcy5pc1Jvb3QgfHwgIXNraXApIHtcbiAgICAgICAgICAgIGFjYyA9IGNiLmNhbGwodGhpcywgYWNjLCB4KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBhY2M7XG59O1xuXG5UcmF2ZXJzZS5wcm90b3R5cGUucGF0aHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFjYyA9IFtdO1xuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoeCkge1xuICAgICAgICBhY2MucHVzaCh0aGlzLnBhdGgpOyBcbiAgICB9KTtcbiAgICByZXR1cm4gYWNjO1xufTtcblxuVHJhdmVyc2UucHJvdG90eXBlLm5vZGVzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhY2MgPSBbXTtcbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgYWNjLnB1c2godGhpcy5ub2RlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gYWNjO1xufTtcblxuVHJhdmVyc2UucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBwYXJlbnRzID0gW10sIG5vZGVzID0gW107XG4gICAgXG4gICAgcmV0dXJuIChmdW5jdGlvbiBjbG9uZSAoc3JjKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHBhcmVudHNbaV0gPT09IHNyYykge1xuICAgICAgICAgICAgICAgIHJldHVybiBub2Rlc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHR5cGVvZiBzcmMgPT09ICdvYmplY3QnICYmIHNyYyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGRzdCA9IGNvcHkoc3JjKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcGFyZW50cy5wdXNoKHNyYyk7XG4gICAgICAgICAgICBub2Rlcy5wdXNoKGRzdCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvckVhY2gob2JqZWN0S2V5cyhzcmMpLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgZHN0W2tleV0gPSBjbG9uZShzcmNba2V5XSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcGFyZW50cy5wb3AoKTtcbiAgICAgICAgICAgIG5vZGVzLnBvcCgpO1xuICAgICAgICAgICAgcmV0dXJuIGRzdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBzcmM7XG4gICAgICAgIH1cbiAgICB9KSh0aGlzLnZhbHVlKTtcbn07XG5cbmZ1bmN0aW9uIHdhbGsgKHJvb3QsIGNiLCBpbW11dGFibGUpIHtcbiAgICB2YXIgcGF0aCA9IFtdO1xuICAgIHZhciBwYXJlbnRzID0gW107XG4gICAgdmFyIGFsaXZlID0gdHJ1ZTtcbiAgICBcbiAgICByZXR1cm4gKGZ1bmN0aW9uIHdhbGtlciAobm9kZV8pIHtcbiAgICAgICAgdmFyIG5vZGUgPSBpbW11dGFibGUgPyBjb3B5KG5vZGVfKSA6IG5vZGVfO1xuICAgICAgICB2YXIgbW9kaWZpZXJzID0ge307XG4gICAgICAgIFxuICAgICAgICB2YXIga2VlcEdvaW5nID0gdHJ1ZTtcbiAgICAgICAgXG4gICAgICAgIHZhciBzdGF0ZSA9IHtcbiAgICAgICAgICAgIG5vZGUgOiBub2RlLFxuICAgICAgICAgICAgbm9kZV8gOiBub2RlXyxcbiAgICAgICAgICAgIHBhdGggOiBbXS5jb25jYXQocGF0aCksXG4gICAgICAgICAgICBwYXJlbnQgOiBwYXJlbnRzW3BhcmVudHMubGVuZ3RoIC0gMV0sXG4gICAgICAgICAgICBwYXJlbnRzIDogcGFyZW50cyxcbiAgICAgICAgICAgIGtleSA6IHBhdGguc2xpY2UoLTEpWzBdLFxuICAgICAgICAgICAgaXNSb290IDogcGF0aC5sZW5ndGggPT09IDAsXG4gICAgICAgICAgICBsZXZlbCA6IHBhdGgubGVuZ3RoLFxuICAgICAgICAgICAgY2lyY3VsYXIgOiBudWxsLFxuICAgICAgICAgICAgdXBkYXRlIDogZnVuY3Rpb24gKHgsIHN0b3BIZXJlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzdGF0ZS5pc1Jvb3QpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUucGFyZW50Lm5vZGVbc3RhdGUua2V5XSA9IHg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN0YXRlLm5vZGUgPSB4O1xuICAgICAgICAgICAgICAgIGlmIChzdG9wSGVyZSkga2VlcEdvaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ2RlbGV0ZScgOiBmdW5jdGlvbiAoc3RvcEhlcmUpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgc3RhdGUucGFyZW50Lm5vZGVbc3RhdGUua2V5XTtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcEhlcmUpIGtlZXBHb2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlbW92ZSA6IGZ1bmN0aW9uIChzdG9wSGVyZSkge1xuICAgICAgICAgICAgICAgIGlmIChpc0FycmF5KHN0YXRlLnBhcmVudC5ub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5wYXJlbnQubm9kZS5zcGxpY2Uoc3RhdGUua2V5LCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBzdGF0ZS5wYXJlbnQubm9kZVtzdGF0ZS5rZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3RvcEhlcmUpIGtlZXBHb2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGtleXMgOiBudWxsLFxuICAgICAgICAgICAgYmVmb3JlIDogZnVuY3Rpb24gKGYpIHsgbW9kaWZpZXJzLmJlZm9yZSA9IGYgfSxcbiAgICAgICAgICAgIGFmdGVyIDogZnVuY3Rpb24gKGYpIHsgbW9kaWZpZXJzLmFmdGVyID0gZiB9LFxuICAgICAgICAgICAgcHJlIDogZnVuY3Rpb24gKGYpIHsgbW9kaWZpZXJzLnByZSA9IGYgfSxcbiAgICAgICAgICAgIHBvc3QgOiBmdW5jdGlvbiAoZikgeyBtb2RpZmllcnMucG9zdCA9IGYgfSxcbiAgICAgICAgICAgIHN0b3AgOiBmdW5jdGlvbiAoKSB7IGFsaXZlID0gZmFsc2UgfSxcbiAgICAgICAgICAgIGJsb2NrIDogZnVuY3Rpb24gKCkgeyBrZWVwR29pbmcgPSBmYWxzZSB9XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBpZiAoIWFsaXZlKSByZXR1cm4gc3RhdGU7XG4gICAgICAgIFxuICAgICAgICBmdW5jdGlvbiB1cGRhdGVTdGF0ZSgpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhdGUubm9kZSA9PT0gJ29iamVjdCcgJiYgc3RhdGUubm9kZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmICghc3RhdGUua2V5cyB8fCBzdGF0ZS5ub2RlXyAhPT0gc3RhdGUubm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5rZXlzID0gb2JqZWN0S2V5cyhzdGF0ZS5ub2RlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBzdGF0ZS5pc0xlYWYgPSBzdGF0ZS5rZXlzLmxlbmd0aCA9PSAwO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50c1tpXS5ub2RlXyA9PT0gbm9kZV8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLmNpcmN1bGFyID0gcGFyZW50c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RhdGUuaXNMZWFmID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzdGF0ZS5rZXlzID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3RhdGUubm90TGVhZiA9ICFzdGF0ZS5pc0xlYWY7XG4gICAgICAgICAgICBzdGF0ZS5ub3RSb290ID0gIXN0YXRlLmlzUm9vdDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdXBkYXRlU3RhdGUoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHVzZSByZXR1cm4gdmFsdWVzIHRvIHVwZGF0ZSBpZiBkZWZpbmVkXG4gICAgICAgIHZhciByZXQgPSBjYi5jYWxsKHN0YXRlLCBzdGF0ZS5ub2RlKTtcbiAgICAgICAgaWYgKHJldCAhPT0gdW5kZWZpbmVkICYmIHN0YXRlLnVwZGF0ZSkgc3RhdGUudXBkYXRlKHJldCk7XG4gICAgICAgIFxuICAgICAgICBpZiAobW9kaWZpZXJzLmJlZm9yZSkgbW9kaWZpZXJzLmJlZm9yZS5jYWxsKHN0YXRlLCBzdGF0ZS5ub2RlKTtcbiAgICAgICAgXG4gICAgICAgIGlmICgha2VlcEdvaW5nKSByZXR1cm4gc3RhdGU7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIHN0YXRlLm5vZGUgPT0gJ29iamVjdCdcbiAgICAgICAgJiYgc3RhdGUubm9kZSAhPT0gbnVsbCAmJiAhc3RhdGUuY2lyY3VsYXIpIHtcbiAgICAgICAgICAgIHBhcmVudHMucHVzaChzdGF0ZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHVwZGF0ZVN0YXRlKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvckVhY2goc3RhdGUua2V5cywgZnVuY3Rpb24gKGtleSwgaSkge1xuICAgICAgICAgICAgICAgIHBhdGgucHVzaChrZXkpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChtb2RpZmllcnMucHJlKSBtb2RpZmllcnMucHJlLmNhbGwoc3RhdGUsIHN0YXRlLm5vZGVba2V5XSwga2V5KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSB3YWxrZXIoc3RhdGUubm9kZVtrZXldKTtcbiAgICAgICAgICAgICAgICBpZiAoaW1tdXRhYmxlICYmIGhhc093blByb3BlcnR5LmNhbGwoc3RhdGUubm9kZSwga2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5ub2RlW2tleV0gPSBjaGlsZC5ub2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjaGlsZC5pc0xhc3QgPSBpID09IHN0YXRlLmtleXMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICBjaGlsZC5pc0ZpcnN0ID0gaSA9PSAwO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChtb2RpZmllcnMucG9zdCkgbW9kaWZpZXJzLnBvc3QuY2FsbChzdGF0ZSwgY2hpbGQpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHBhdGgucG9wKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHBhcmVudHMucG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChtb2RpZmllcnMuYWZ0ZXIpIG1vZGlmaWVycy5hZnRlci5jYWxsKHN0YXRlLCBzdGF0ZS5ub2RlKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9KShyb290KS5ub2RlO1xufVxuXG5mdW5jdGlvbiBjb3B5IChzcmMpIHtcbiAgICBpZiAodHlwZW9mIHNyYyA9PT0gJ29iamVjdCcgJiYgc3JjICE9PSBudWxsKSB7XG4gICAgICAgIHZhciBkc3Q7XG4gICAgICAgIFxuICAgICAgICBpZiAoaXNBcnJheShzcmMpKSB7XG4gICAgICAgICAgICBkc3QgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc0RhdGUoc3JjKSkge1xuICAgICAgICAgICAgZHN0ID0gbmV3IERhdGUoc3JjLmdldFRpbWUgPyBzcmMuZ2V0VGltZSgpIDogc3JjKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc1JlZ0V4cChzcmMpKSB7XG4gICAgICAgICAgICBkc3QgPSBuZXcgUmVnRXhwKHNyYyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNFcnJvcihzcmMpKSB7XG4gICAgICAgICAgICBkc3QgPSB7IG1lc3NhZ2U6IHNyYy5tZXNzYWdlIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNCb29sZWFuKHNyYykpIHtcbiAgICAgICAgICAgIGRzdCA9IG5ldyBCb29sZWFuKHNyYyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNOdW1iZXIoc3JjKSkge1xuICAgICAgICAgICAgZHN0ID0gbmV3IE51bWJlcihzcmMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzU3RyaW5nKHNyYykpIHtcbiAgICAgICAgICAgIGRzdCA9IG5ldyBTdHJpbmcoc3JjKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChPYmplY3QuY3JlYXRlICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZikge1xuICAgICAgICAgICAgZHN0ID0gT2JqZWN0LmNyZWF0ZShPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc3JjKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc3JjLmNvbnN0cnVjdG9yID09PSBPYmplY3QpIHtcbiAgICAgICAgICAgIGRzdCA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHByb3RvID1cbiAgICAgICAgICAgICAgICAoc3JjLmNvbnN0cnVjdG9yICYmIHNyYy5jb25zdHJ1Y3Rvci5wcm90b3R5cGUpXG4gICAgICAgICAgICAgICAgfHwgc3JjLl9fcHJvdG9fX1xuICAgICAgICAgICAgICAgIHx8IHt9XG4gICAgICAgICAgICA7XG4gICAgICAgICAgICB2YXIgVCA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICAgICAgVC5wcm90b3R5cGUgPSBwcm90bztcbiAgICAgICAgICAgIGRzdCA9IG5ldyBUO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3JFYWNoKG9iamVjdEtleXMoc3JjKSwgZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgZHN0W2tleV0gPSBzcmNba2V5XTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkc3Q7XG4gICAgfVxuICAgIGVsc2UgcmV0dXJuIHNyYztcbn1cblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiBrZXlzIChvYmopIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgcmVzLnB1c2goa2V5KVxuICAgIHJldHVybiByZXM7XG59O1xuXG5mdW5jdGlvbiB0b1MgKG9iaikgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgfVxuZnVuY3Rpb24gaXNEYXRlIChvYmopIHsgcmV0dXJuIHRvUyhvYmopID09PSAnW29iamVjdCBEYXRlXScgfVxuZnVuY3Rpb24gaXNSZWdFeHAgKG9iaikgeyByZXR1cm4gdG9TKG9iaikgPT09ICdbb2JqZWN0IFJlZ0V4cF0nIH1cbmZ1bmN0aW9uIGlzRXJyb3IgKG9iaikgeyByZXR1cm4gdG9TKG9iaikgPT09ICdbb2JqZWN0IEVycm9yXScgfVxuZnVuY3Rpb24gaXNCb29sZWFuIChvYmopIHsgcmV0dXJuIHRvUyhvYmopID09PSAnW29iamVjdCBCb29sZWFuXScgfVxuZnVuY3Rpb24gaXNOdW1iZXIgKG9iaikgeyByZXR1cm4gdG9TKG9iaikgPT09ICdbb2JqZWN0IE51bWJlcl0nIH1cbmZ1bmN0aW9uIGlzU3RyaW5nIChvYmopIHsgcmV0dXJuIHRvUyhvYmopID09PSAnW29iamVjdCBTdHJpbmddJyB9XG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiBpc0FycmF5ICh4cykge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxudmFyIGZvckVhY2ggPSBmdW5jdGlvbiAoeHMsIGZuKSB7XG4gICAgaWYgKHhzLmZvckVhY2gpIHJldHVybiB4cy5mb3JFYWNoKGZuKVxuICAgIGVsc2UgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBmbih4c1tpXSwgaSwgeHMpO1xuICAgIH1cbn07XG5cbmZvckVhY2gob2JqZWN0S2V5cyhUcmF2ZXJzZS5wcm90b3R5cGUpLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgdHJhdmVyc2Vba2V5XSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIHZhciB0ID0gbmV3IFRyYXZlcnNlKG9iaik7XG4gICAgICAgIHJldHVybiB0W2tleV0uYXBwbHkodCwgYXJncyk7XG4gICAgfTtcbn0pO1xuXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QuaGFzT3duUHJvcGVydHkgfHwgZnVuY3Rpb24gKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIGtleSBpbiBvYmo7XG59O1xuIiwiZXhwb3J0cy5wYXJzZSA9IHJlcXVpcmUoJy4vbGliL3BhcnNlJyk7XG5leHBvcnRzLnN0cmluZ2lmeSA9IHJlcXVpcmUoJy4vbGliL3N0cmluZ2lmeScpO1xuIiwidmFyIGF0LCAvLyBUaGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgY2hhcmFjdGVyXG4gICAgY2gsIC8vIFRoZSBjdXJyZW50IGNoYXJhY3RlclxuICAgIGVzY2FwZWUgPSB7XG4gICAgICAgICdcIic6ICAnXCInLFxuICAgICAgICAnXFxcXCc6ICdcXFxcJyxcbiAgICAgICAgJy8nOiAgJy8nLFxuICAgICAgICBiOiAgICAnXFxiJyxcbiAgICAgICAgZjogICAgJ1xcZicsXG4gICAgICAgIG46ICAgICdcXG4nLFxuICAgICAgICByOiAgICAnXFxyJyxcbiAgICAgICAgdDogICAgJ1xcdCdcbiAgICB9LFxuICAgIHRleHQsXG5cbiAgICBlcnJvciA9IGZ1bmN0aW9uIChtKSB7XG4gICAgICAgIC8vIENhbGwgZXJyb3Igd2hlbiBzb21ldGhpbmcgaXMgd3JvbmcuXG4gICAgICAgIHRocm93IHtcbiAgICAgICAgICAgIG5hbWU6ICAgICdTeW50YXhFcnJvcicsXG4gICAgICAgICAgICBtZXNzYWdlOiBtLFxuICAgICAgICAgICAgYXQ6ICAgICAgYXQsXG4gICAgICAgICAgICB0ZXh0OiAgICB0ZXh0XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBcbiAgICBuZXh0ID0gZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgLy8gSWYgYSBjIHBhcmFtZXRlciBpcyBwcm92aWRlZCwgdmVyaWZ5IHRoYXQgaXQgbWF0Y2hlcyB0aGUgY3VycmVudCBjaGFyYWN0ZXIuXG4gICAgICAgIGlmIChjICYmIGMgIT09IGNoKSB7XG4gICAgICAgICAgICBlcnJvcihcIkV4cGVjdGVkICdcIiArIGMgKyBcIicgaW5zdGVhZCBvZiAnXCIgKyBjaCArIFwiJ1wiKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gR2V0IHRoZSBuZXh0IGNoYXJhY3Rlci4gV2hlbiB0aGVyZSBhcmUgbm8gbW9yZSBjaGFyYWN0ZXJzLFxuICAgICAgICAvLyByZXR1cm4gdGhlIGVtcHR5IHN0cmluZy5cbiAgICAgICAgXG4gICAgICAgIGNoID0gdGV4dC5jaGFyQXQoYXQpO1xuICAgICAgICBhdCArPSAxO1xuICAgICAgICByZXR1cm4gY2g7XG4gICAgfSxcbiAgICBcbiAgICBudW1iZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIFBhcnNlIGEgbnVtYmVyIHZhbHVlLlxuICAgICAgICB2YXIgbnVtYmVyLFxuICAgICAgICAgICAgc3RyaW5nID0gJyc7XG4gICAgICAgIFxuICAgICAgICBpZiAoY2ggPT09ICctJykge1xuICAgICAgICAgICAgc3RyaW5nID0gJy0nO1xuICAgICAgICAgICAgbmV4dCgnLScpO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChjaCA+PSAnMCcgJiYgY2ggPD0gJzknKSB7XG4gICAgICAgICAgICBzdHJpbmcgKz0gY2g7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoID09PSAnLicpIHtcbiAgICAgICAgICAgIHN0cmluZyArPSAnLic7XG4gICAgICAgICAgICB3aGlsZSAobmV4dCgpICYmIGNoID49ICcwJyAmJiBjaCA8PSAnOScpIHtcbiAgICAgICAgICAgICAgICBzdHJpbmcgKz0gY2g7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoID09PSAnZScgfHwgY2ggPT09ICdFJykge1xuICAgICAgICAgICAgc3RyaW5nICs9IGNoO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgaWYgKGNoID09PSAnLScgfHwgY2ggPT09ICcrJykge1xuICAgICAgICAgICAgICAgIHN0cmluZyArPSBjaDtcbiAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aGlsZSAoY2ggPj0gJzAnICYmIGNoIDw9ICc5Jykge1xuICAgICAgICAgICAgICAgIHN0cmluZyArPSBjaDtcbiAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbnVtYmVyID0gK3N0cmluZztcbiAgICAgICAgaWYgKCFpc0Zpbml0ZShudW1iZXIpKSB7XG4gICAgICAgICAgICBlcnJvcihcIkJhZCBudW1iZXJcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVtYmVyO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBzdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIFBhcnNlIGEgc3RyaW5nIHZhbHVlLlxuICAgICAgICB2YXIgaGV4LFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIHN0cmluZyA9ICcnLFxuICAgICAgICAgICAgdWZmZmY7XG4gICAgICAgIFxuICAgICAgICAvLyBXaGVuIHBhcnNpbmcgZm9yIHN0cmluZyB2YWx1ZXMsIHdlIG11c3QgbG9vayBmb3IgXCIgYW5kIFxcIGNoYXJhY3RlcnMuXG4gICAgICAgIGlmIChjaCA9PT0gJ1wiJykge1xuICAgICAgICAgICAgd2hpbGUgKG5leHQoKSkge1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ1wiJykge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ1xcXFwnKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoID09PSAndScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVmZmZmID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCA0OyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZXggPSBwYXJzZUludChuZXh0KCksIDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRmluaXRlKGhleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVmZmZmID0gdWZmZmYgKiAxNiArIGhleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHVmZmZmKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZXNjYXBlZVtjaF0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcgKz0gZXNjYXBlZVtjaF07XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmluZyArPSBjaDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3IoXCJCYWQgc3RyaW5nXCIpO1xuICAgIH0sXG5cbiAgICB3aGl0ZSA9IGZ1bmN0aW9uICgpIHtcblxuLy8gU2tpcCB3aGl0ZXNwYWNlLlxuXG4gICAgICAgIHdoaWxlIChjaCAmJiBjaCA8PSAnICcpIHtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB3b3JkID0gZnVuY3Rpb24gKCkge1xuXG4vLyB0cnVlLCBmYWxzZSwgb3IgbnVsbC5cblxuICAgICAgICBzd2l0Y2ggKGNoKSB7XG4gICAgICAgIGNhc2UgJ3QnOlxuICAgICAgICAgICAgbmV4dCgndCcpO1xuICAgICAgICAgICAgbmV4dCgncicpO1xuICAgICAgICAgICAgbmV4dCgndScpO1xuICAgICAgICAgICAgbmV4dCgnZScpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGNhc2UgJ2YnOlxuICAgICAgICAgICAgbmV4dCgnZicpO1xuICAgICAgICAgICAgbmV4dCgnYScpO1xuICAgICAgICAgICAgbmV4dCgnbCcpO1xuICAgICAgICAgICAgbmV4dCgncycpO1xuICAgICAgICAgICAgbmV4dCgnZScpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBjYXNlICduJzpcbiAgICAgICAgICAgIG5leHQoJ24nKTtcbiAgICAgICAgICAgIG5leHQoJ3UnKTtcbiAgICAgICAgICAgIG5leHQoJ2wnKTtcbiAgICAgICAgICAgIG5leHQoJ2wnKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGVycm9yKFwiVW5leHBlY3RlZCAnXCIgKyBjaCArIFwiJ1wiKTtcbiAgICB9LFxuXG4gICAgdmFsdWUsICAvLyBQbGFjZSBob2xkZXIgZm9yIHRoZSB2YWx1ZSBmdW5jdGlvbi5cblxuICAgIGFycmF5ID0gZnVuY3Rpb24gKCkge1xuXG4vLyBQYXJzZSBhbiBhcnJheSB2YWx1ZS5cblxuICAgICAgICB2YXIgYXJyYXkgPSBbXTtcblxuICAgICAgICBpZiAoY2ggPT09ICdbJykge1xuICAgICAgICAgICAgbmV4dCgnWycpO1xuICAgICAgICAgICAgd2hpdGUoKTtcbiAgICAgICAgICAgIGlmIChjaCA9PT0gJ10nKSB7XG4gICAgICAgICAgICAgICAgbmV4dCgnXScpO1xuICAgICAgICAgICAgICAgIHJldHVybiBhcnJheTsgICAvLyBlbXB0eSBhcnJheVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2hpbGUgKGNoKSB7XG4gICAgICAgICAgICAgICAgYXJyYXkucHVzaCh2YWx1ZSgpKTtcbiAgICAgICAgICAgICAgICB3aGl0ZSgpO1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ10nKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoJ10nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBuZXh0KCcsJyk7XG4gICAgICAgICAgICAgICAgd2hpdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlcnJvcihcIkJhZCBhcnJheVwiKTtcbiAgICB9LFxuXG4gICAgb2JqZWN0ID0gZnVuY3Rpb24gKCkge1xuXG4vLyBQYXJzZSBhbiBvYmplY3QgdmFsdWUuXG5cbiAgICAgICAgdmFyIGtleSxcbiAgICAgICAgICAgIG9iamVjdCA9IHt9O1xuXG4gICAgICAgIGlmIChjaCA9PT0gJ3snKSB7XG4gICAgICAgICAgICBuZXh0KCd7Jyk7XG4gICAgICAgICAgICB3aGl0ZSgpO1xuICAgICAgICAgICAgaWYgKGNoID09PSAnfScpIHtcbiAgICAgICAgICAgICAgICBuZXh0KCd9Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdDsgICAvLyBlbXB0eSBvYmplY3RcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlIChjaCkge1xuICAgICAgICAgICAgICAgIGtleSA9IHN0cmluZygpO1xuICAgICAgICAgICAgICAgIHdoaXRlKCk7XG4gICAgICAgICAgICAgICAgbmV4dCgnOicpO1xuICAgICAgICAgICAgICAgIGlmIChPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IoJ0R1cGxpY2F0ZSBrZXkgXCInICsga2V5ICsgJ1wiJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG9iamVjdFtrZXldID0gdmFsdWUoKTtcbiAgICAgICAgICAgICAgICB3aGl0ZSgpO1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoJ30nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmV4dCgnLCcpO1xuICAgICAgICAgICAgICAgIHdoaXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3IoXCJCYWQgb2JqZWN0XCIpO1xuICAgIH07XG5cbnZhbHVlID0gZnVuY3Rpb24gKCkge1xuXG4vLyBQYXJzZSBhIEpTT04gdmFsdWUuIEl0IGNvdWxkIGJlIGFuIG9iamVjdCwgYW4gYXJyYXksIGEgc3RyaW5nLCBhIG51bWJlcixcbi8vIG9yIGEgd29yZC5cblxuICAgIHdoaXRlKCk7XG4gICAgc3dpdGNoIChjaCkge1xuICAgIGNhc2UgJ3snOlxuICAgICAgICByZXR1cm4gb2JqZWN0KCk7XG4gICAgY2FzZSAnWyc6XG4gICAgICAgIHJldHVybiBhcnJheSgpO1xuICAgIGNhc2UgJ1wiJzpcbiAgICAgICAgcmV0dXJuIHN0cmluZygpO1xuICAgIGNhc2UgJy0nOlxuICAgICAgICByZXR1cm4gbnVtYmVyKCk7XG4gICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGNoID49ICcwJyAmJiBjaCA8PSAnOScgPyBudW1iZXIoKSA6IHdvcmQoKTtcbiAgICB9XG59O1xuXG4vLyBSZXR1cm4gdGhlIGpzb25fcGFyc2UgZnVuY3Rpb24uIEl0IHdpbGwgaGF2ZSBhY2Nlc3MgdG8gYWxsIG9mIHRoZSBhYm92ZVxuLy8gZnVuY3Rpb25zIGFuZCB2YXJpYWJsZXMuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNvdXJjZSwgcmV2aXZlcikge1xuICAgIHZhciByZXN1bHQ7XG4gICAgXG4gICAgdGV4dCA9IHNvdXJjZTtcbiAgICBhdCA9IDA7XG4gICAgY2ggPSAnICc7XG4gICAgcmVzdWx0ID0gdmFsdWUoKTtcbiAgICB3aGl0ZSgpO1xuICAgIGlmIChjaCkge1xuICAgICAgICBlcnJvcihcIlN5bnRheCBlcnJvclwiKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBpcyBhIHJldml2ZXIgZnVuY3Rpb24sIHdlIHJlY3Vyc2l2ZWx5IHdhbGsgdGhlIG5ldyBzdHJ1Y3R1cmUsXG4gICAgLy8gcGFzc2luZyBlYWNoIG5hbWUvdmFsdWUgcGFpciB0byB0aGUgcmV2aXZlciBmdW5jdGlvbiBmb3IgcG9zc2libGVcbiAgICAvLyB0cmFuc2Zvcm1hdGlvbiwgc3RhcnRpbmcgd2l0aCBhIHRlbXBvcmFyeSByb290IG9iamVjdCB0aGF0IGhvbGRzIHRoZSByZXN1bHRcbiAgICAvLyBpbiBhbiBlbXB0eSBrZXkuIElmIHRoZXJlIGlzIG5vdCBhIHJldml2ZXIgZnVuY3Rpb24sIHdlIHNpbXBseSByZXR1cm4gdGhlXG4gICAgLy8gcmVzdWx0LlxuXG4gICAgcmV0dXJuIHR5cGVvZiByZXZpdmVyID09PSAnZnVuY3Rpb24nID8gKGZ1bmN0aW9uIHdhbGsoaG9sZGVyLCBrZXkpIHtcbiAgICAgICAgdmFyIGssIHYsIHZhbHVlID0gaG9sZGVyW2tleV07XG4gICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBmb3IgKGsgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCBrKSkge1xuICAgICAgICAgICAgICAgICAgICB2ID0gd2Fsayh2YWx1ZSwgayk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlW2tdID0gdjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB2YWx1ZVtrXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV2aXZlci5jYWxsKGhvbGRlciwga2V5LCB2YWx1ZSk7XG4gICAgfSh7Jyc6IHJlc3VsdH0sICcnKSkgOiByZXN1bHQ7XG59O1xuIiwidmFyIGN4ID0gL1tcXHUwMDAwXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2csXG4gICAgZXNjYXBhYmxlID0gL1tcXFxcXFxcIlxceDAwLVxceDFmXFx4N2YtXFx4OWZcXHUwMGFkXFx1MDYwMC1cXHUwNjA0XFx1MDcwZlxcdTE3YjRcXHUxN2I1XFx1MjAwYy1cXHUyMDBmXFx1MjAyOC1cXHUyMDJmXFx1MjA2MC1cXHUyMDZmXFx1ZmVmZlxcdWZmZjAtXFx1ZmZmZl0vZyxcbiAgICBnYXAsXG4gICAgaW5kZW50LFxuICAgIG1ldGEgPSB7ICAgIC8vIHRhYmxlIG9mIGNoYXJhY3RlciBzdWJzdGl0dXRpb25zXG4gICAgICAgICdcXGInOiAnXFxcXGInLFxuICAgICAgICAnXFx0JzogJ1xcXFx0JyxcbiAgICAgICAgJ1xcbic6ICdcXFxcbicsXG4gICAgICAgICdcXGYnOiAnXFxcXGYnLFxuICAgICAgICAnXFxyJzogJ1xcXFxyJyxcbiAgICAgICAgJ1wiJyA6ICdcXFxcXCInLFxuICAgICAgICAnXFxcXCc6ICdcXFxcXFxcXCdcbiAgICB9LFxuICAgIHJlcDtcblxuZnVuY3Rpb24gcXVvdGUoc3RyaW5nKSB7XG4gICAgLy8gSWYgdGhlIHN0cmluZyBjb250YWlucyBubyBjb250cm9sIGNoYXJhY3RlcnMsIG5vIHF1b3RlIGNoYXJhY3RlcnMsIGFuZCBub1xuICAgIC8vIGJhY2tzbGFzaCBjaGFyYWN0ZXJzLCB0aGVuIHdlIGNhbiBzYWZlbHkgc2xhcCBzb21lIHF1b3RlcyBhcm91bmQgaXQuXG4gICAgLy8gT3RoZXJ3aXNlIHdlIG11c3QgYWxzbyByZXBsYWNlIHRoZSBvZmZlbmRpbmcgY2hhcmFjdGVycyB3aXRoIHNhZmUgZXNjYXBlXG4gICAgLy8gc2VxdWVuY2VzLlxuICAgIFxuICAgIGVzY2FwYWJsZS5sYXN0SW5kZXggPSAwO1xuICAgIHJldHVybiBlc2NhcGFibGUudGVzdChzdHJpbmcpID8gJ1wiJyArIHN0cmluZy5yZXBsYWNlKGVzY2FwYWJsZSwgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgdmFyIGMgPSBtZXRhW2FdO1xuICAgICAgICByZXR1cm4gdHlwZW9mIGMgPT09ICdzdHJpbmcnID8gYyA6XG4gICAgICAgICAgICAnXFxcXHUnICsgKCcwMDAwJyArIGEuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikpLnNsaWNlKC00KTtcbiAgICB9KSArICdcIicgOiAnXCInICsgc3RyaW5nICsgJ1wiJztcbn1cblxuZnVuY3Rpb24gc3RyKGtleSwgaG9sZGVyKSB7XG4gICAgLy8gUHJvZHVjZSBhIHN0cmluZyBmcm9tIGhvbGRlcltrZXldLlxuICAgIHZhciBpLCAgICAgICAgICAvLyBUaGUgbG9vcCBjb3VudGVyLlxuICAgICAgICBrLCAgICAgICAgICAvLyBUaGUgbWVtYmVyIGtleS5cbiAgICAgICAgdiwgICAgICAgICAgLy8gVGhlIG1lbWJlciB2YWx1ZS5cbiAgICAgICAgbGVuZ3RoLFxuICAgICAgICBtaW5kID0gZ2FwLFxuICAgICAgICBwYXJ0aWFsLFxuICAgICAgICB2YWx1ZSA9IGhvbGRlcltrZXldO1xuICAgIFxuICAgIC8vIElmIHRoZSB2YWx1ZSBoYXMgYSB0b0pTT04gbWV0aG9kLCBjYWxsIGl0IHRvIG9idGFpbiBhIHJlcGxhY2VtZW50IHZhbHVlLlxuICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmXG4gICAgICAgICAgICB0eXBlb2YgdmFsdWUudG9KU09OID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhbHVlID0gdmFsdWUudG9KU09OKGtleSk7XG4gICAgfVxuICAgIFxuICAgIC8vIElmIHdlIHdlcmUgY2FsbGVkIHdpdGggYSByZXBsYWNlciBmdW5jdGlvbiwgdGhlbiBjYWxsIHRoZSByZXBsYWNlciB0b1xuICAgIC8vIG9idGFpbiBhIHJlcGxhY2VtZW50IHZhbHVlLlxuICAgIGlmICh0eXBlb2YgcmVwID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhbHVlID0gcmVwLmNhbGwoaG9sZGVyLCBrZXksIHZhbHVlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gV2hhdCBoYXBwZW5zIG5leHQgZGVwZW5kcyBvbiB0aGUgdmFsdWUncyB0eXBlLlxuICAgIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICByZXR1cm4gcXVvdGUodmFsdWUpO1xuICAgICAgICBcbiAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgIC8vIEpTT04gbnVtYmVycyBtdXN0IGJlIGZpbml0ZS4gRW5jb2RlIG5vbi1maW5pdGUgbnVtYmVycyBhcyBudWxsLlxuICAgICAgICAgICAgcmV0dXJuIGlzRmluaXRlKHZhbHVlKSA/IFN0cmluZyh2YWx1ZSkgOiAnbnVsbCc7XG4gICAgICAgIFxuICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgY2FzZSAnbnVsbCc6XG4gICAgICAgICAgICAvLyBJZiB0aGUgdmFsdWUgaXMgYSBib29sZWFuIG9yIG51bGwsIGNvbnZlcnQgaXQgdG8gYSBzdHJpbmcuIE5vdGU6XG4gICAgICAgICAgICAvLyB0eXBlb2YgbnVsbCBkb2VzIG5vdCBwcm9kdWNlICdudWxsJy4gVGhlIGNhc2UgaXMgaW5jbHVkZWQgaGVyZSBpblxuICAgICAgICAgICAgLy8gdGhlIHJlbW90ZSBjaGFuY2UgdGhhdCB0aGlzIGdldHMgZml4ZWQgc29tZWRheS5cbiAgICAgICAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuICAgICAgICAgICAgXG4gICAgICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm4gJ251bGwnO1xuICAgICAgICAgICAgZ2FwICs9IGluZGVudDtcbiAgICAgICAgICAgIHBhcnRpYWwgPSBbXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQXJyYXkuaXNBcnJheVxuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuYXBwbHkodmFsdWUpID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gdmFsdWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJ0aWFsW2ldID0gc3RyKGksIHZhbHVlKSB8fCAnbnVsbCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIEpvaW4gYWxsIG9mIHRoZSBlbGVtZW50cyB0b2dldGhlciwgc2VwYXJhdGVkIHdpdGggY29tbWFzLCBhbmRcbiAgICAgICAgICAgICAgICAvLyB3cmFwIHRoZW0gaW4gYnJhY2tldHMuXG4gICAgICAgICAgICAgICAgdiA9IHBhcnRpYWwubGVuZ3RoID09PSAwID8gJ1tdJyA6IGdhcCA/XG4gICAgICAgICAgICAgICAgICAgICdbXFxuJyArIGdhcCArIHBhcnRpYWwuam9pbignLFxcbicgKyBnYXApICsgJ1xcbicgKyBtaW5kICsgJ10nIDpcbiAgICAgICAgICAgICAgICAgICAgJ1snICsgcGFydGlhbC5qb2luKCcsJykgKyAnXSc7XG4gICAgICAgICAgICAgICAgZ2FwID0gbWluZDtcbiAgICAgICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gSWYgdGhlIHJlcGxhY2VyIGlzIGFuIGFycmF5LCB1c2UgaXQgdG8gc2VsZWN0IHRoZSBtZW1iZXJzIHRvIGJlXG4gICAgICAgICAgICAvLyBzdHJpbmdpZmllZC5cbiAgICAgICAgICAgIGlmIChyZXAgJiYgdHlwZW9mIHJlcCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBsZW5ndGggPSByZXAubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBrID0gcmVwW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGsgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2ID0gc3RyKGssIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFydGlhbC5wdXNoKHF1b3RlKGspICsgKGdhcCA/ICc6ICcgOiAnOicpICsgdik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2UsIGl0ZXJhdGUgdGhyb3VnaCBhbGwgb2YgdGhlIGtleXMgaW4gdGhlIG9iamVjdC5cbiAgICAgICAgICAgICAgICBmb3IgKGsgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgaykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHYgPSBzdHIoaywgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJ0aWFsLnB1c2gocXVvdGUoaykgKyAoZ2FwID8gJzogJyA6ICc6JykgKyB2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAvLyBKb2luIGFsbCBvZiB0aGUgbWVtYmVyIHRleHRzIHRvZ2V0aGVyLCBzZXBhcmF0ZWQgd2l0aCBjb21tYXMsXG4gICAgICAgIC8vIGFuZCB3cmFwIHRoZW0gaW4gYnJhY2VzLlxuXG4gICAgICAgIHYgPSBwYXJ0aWFsLmxlbmd0aCA9PT0gMCA/ICd7fScgOiBnYXAgP1xuICAgICAgICAgICAgJ3tcXG4nICsgZ2FwICsgcGFydGlhbC5qb2luKCcsXFxuJyArIGdhcCkgKyAnXFxuJyArIG1pbmQgKyAnfScgOlxuICAgICAgICAgICAgJ3snICsgcGFydGlhbC5qb2luKCcsJykgKyAnfSc7XG4gICAgICAgIGdhcCA9IG1pbmQ7XG4gICAgICAgIHJldHVybiB2O1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUsIHJlcGxhY2VyLCBzcGFjZSkge1xuICAgIHZhciBpO1xuICAgIGdhcCA9ICcnO1xuICAgIGluZGVudCA9ICcnO1xuICAgIFxuICAgIC8vIElmIHRoZSBzcGFjZSBwYXJhbWV0ZXIgaXMgYSBudW1iZXIsIG1ha2UgYW4gaW5kZW50IHN0cmluZyBjb250YWluaW5nIHRoYXRcbiAgICAvLyBtYW55IHNwYWNlcy5cbiAgICBpZiAodHlwZW9mIHNwYWNlID09PSAnbnVtYmVyJykge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc3BhY2U7IGkgKz0gMSkge1xuICAgICAgICAgICAgaW5kZW50ICs9ICcgJztcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBJZiB0aGUgc3BhY2UgcGFyYW1ldGVyIGlzIGEgc3RyaW5nLCBpdCB3aWxsIGJlIHVzZWQgYXMgdGhlIGluZGVudCBzdHJpbmcuXG4gICAgZWxzZSBpZiAodHlwZW9mIHNwYWNlID09PSAnc3RyaW5nJykge1xuICAgICAgICBpbmRlbnQgPSBzcGFjZTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBpcyBhIHJlcGxhY2VyLCBpdCBtdXN0IGJlIGEgZnVuY3Rpb24gb3IgYW4gYXJyYXkuXG4gICAgLy8gT3RoZXJ3aXNlLCB0aHJvdyBhbiBlcnJvci5cbiAgICByZXAgPSByZXBsYWNlcjtcbiAgICBpZiAocmVwbGFjZXIgJiYgdHlwZW9mIHJlcGxhY2VyICE9PSAnZnVuY3Rpb24nXG4gICAgJiYgKHR5cGVvZiByZXBsYWNlciAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIHJlcGxhY2VyLmxlbmd0aCAhPT0gJ251bWJlcicpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSlNPTi5zdHJpbmdpZnknKTtcbiAgICB9XG4gICAgXG4gICAgLy8gTWFrZSBhIGZha2Ugcm9vdCBvYmplY3QgY29udGFpbmluZyBvdXIgdmFsdWUgdW5kZXIgdGhlIGtleSBvZiAnJy5cbiAgICAvLyBSZXR1cm4gdGhlIHJlc3VsdCBvZiBzdHJpbmdpZnlpbmcgdGhlIHZhbHVlLlxuICAgIHJldHVybiBzdHIoJycsIHsnJzogdmFsdWV9KTtcbn07XG4iLCJ2YXIgcHJvY2Vzcz1yZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIik7OyFmdW5jdGlvbihleHBvcnRzLCB1bmRlZmluZWQpIHtcblxuICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgPyBBcnJheS5pc0FycmF5IDogZnVuY3Rpb24gX2lzQXJyYXkob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSBcIltvYmplY3QgQXJyYXldXCI7XG4gIH07XG4gIHZhciBkZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbiAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBpZiAodGhpcy5fY29uZikge1xuICAgICAgY29uZmlndXJlLmNhbGwodGhpcywgdGhpcy5fY29uZik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY29uZmlndXJlKGNvbmYpIHtcbiAgICBpZiAoY29uZikge1xuXG4gICAgICB0aGlzLl9jb25mID0gY29uZjtcblxuICAgICAgY29uZi5kZWxpbWl0ZXIgJiYgKHRoaXMuZGVsaW1pdGVyID0gY29uZi5kZWxpbWl0ZXIpO1xuICAgICAgY29uZi5tYXhMaXN0ZW5lcnMgJiYgKHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgPSBjb25mLm1heExpc3RlbmVycyk7XG4gICAgICBjb25mLndpbGRjYXJkICYmICh0aGlzLndpbGRjYXJkID0gY29uZi53aWxkY2FyZCk7XG4gICAgICBjb25mLm5ld0xpc3RlbmVyICYmICh0aGlzLm5ld0xpc3RlbmVyID0gY29uZi5uZXdMaXN0ZW5lcik7XG5cbiAgICAgIGlmICh0aGlzLndpbGRjYXJkKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJUcmVlID0ge307XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gRXZlbnRFbWl0dGVyKGNvbmYpIHtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICB0aGlzLm5ld0xpc3RlbmVyID0gZmFsc2U7XG4gICAgY29uZmlndXJlLmNhbGwodGhpcywgY29uZik7XG4gIH1cblxuICAvL1xuICAvLyBBdHRlbnRpb24sIGZ1bmN0aW9uIHJldHVybiB0eXBlIG5vdyBpcyBhcnJheSwgYWx3YXlzICFcbiAgLy8gSXQgaGFzIHplcm8gZWxlbWVudHMgaWYgbm8gYW55IG1hdGNoZXMgZm91bmQgYW5kIG9uZSBvciBtb3JlXG4gIC8vIGVsZW1lbnRzIChsZWFmcykgaWYgdGhlcmUgYXJlIG1hdGNoZXNcbiAgLy9cbiAgZnVuY3Rpb24gc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlLCBpKSB7XG4gICAgaWYgKCF0cmVlKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHZhciBsaXN0ZW5lcnM9W10sIGxlYWYsIGxlbiwgYnJhbmNoLCB4VHJlZSwgeHhUcmVlLCBpc29sYXRlZEJyYW5jaCwgZW5kUmVhY2hlZCxcbiAgICAgICAgdHlwZUxlbmd0aCA9IHR5cGUubGVuZ3RoLCBjdXJyZW50VHlwZSA9IHR5cGVbaV0sIG5leHRUeXBlID0gdHlwZVtpKzFdO1xuICAgIGlmIChpID09PSB0eXBlTGVuZ3RoICYmIHRyZWUuX2xpc3RlbmVycykge1xuICAgICAgLy9cbiAgICAgIC8vIElmIGF0IHRoZSBlbmQgb2YgdGhlIGV2ZW50KHMpIGxpc3QgYW5kIHRoZSB0cmVlIGhhcyBsaXN0ZW5lcnNcbiAgICAgIC8vIGludm9rZSB0aG9zZSBsaXN0ZW5lcnMuXG4gICAgICAvL1xuICAgICAgaWYgKHR5cGVvZiB0cmVlLl9saXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaGFuZGxlcnMgJiYgaGFuZGxlcnMucHVzaCh0cmVlLl9saXN0ZW5lcnMpO1xuICAgICAgICByZXR1cm4gW3RyZWVdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChsZWFmID0gMCwgbGVuID0gdHJlZS5fbGlzdGVuZXJzLmxlbmd0aDsgbGVhZiA8IGxlbjsgbGVhZisrKSB7XG4gICAgICAgICAgaGFuZGxlcnMgJiYgaGFuZGxlcnMucHVzaCh0cmVlLl9saXN0ZW5lcnNbbGVhZl0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbdHJlZV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKChjdXJyZW50VHlwZSA9PT0gJyonIHx8IGN1cnJlbnRUeXBlID09PSAnKionKSB8fCB0cmVlW2N1cnJlbnRUeXBlXSkge1xuICAgICAgLy9cbiAgICAgIC8vIElmIHRoZSBldmVudCBlbWl0dGVkIGlzICcqJyBhdCB0aGlzIHBhcnRcbiAgICAgIC8vIG9yIHRoZXJlIGlzIGEgY29uY3JldGUgbWF0Y2ggYXQgdGhpcyBwYXRjaFxuICAgICAgLy9cbiAgICAgIGlmIChjdXJyZW50VHlwZSA9PT0gJyonKSB7XG4gICAgICAgIGZvciAoYnJhbmNoIGluIHRyZWUpIHtcbiAgICAgICAgICBpZiAoYnJhbmNoICE9PSAnX2xpc3RlbmVycycgJiYgdHJlZS5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKzEpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpc3RlbmVycztcbiAgICAgIH0gZWxzZSBpZihjdXJyZW50VHlwZSA9PT0gJyoqJykge1xuICAgICAgICBlbmRSZWFjaGVkID0gKGkrMSA9PT0gdHlwZUxlbmd0aCB8fCAoaSsyID09PSB0eXBlTGVuZ3RoICYmIG5leHRUeXBlID09PSAnKicpKTtcbiAgICAgICAgaWYoZW5kUmVhY2hlZCAmJiB0cmVlLl9saXN0ZW5lcnMpIHtcbiAgICAgICAgICAvLyBUaGUgbmV4dCBlbGVtZW50IGhhcyBhIF9saXN0ZW5lcnMsIGFkZCBpdCB0byB0aGUgaGFuZGxlcnMuXG4gICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWUsIHR5cGVMZW5ndGgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoYnJhbmNoIGluIHRyZWUpIHtcbiAgICAgICAgICBpZiAoYnJhbmNoICE9PSAnX2xpc3RlbmVycycgJiYgdHJlZS5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XG4gICAgICAgICAgICBpZihicmFuY2ggPT09ICcqJyB8fCBicmFuY2ggPT09ICcqKicpIHtcbiAgICAgICAgICAgICAgaWYodHJlZVticmFuY2hdLl9saXN0ZW5lcnMgJiYgIWVuZFJlYWNoZWQpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCB0eXBlTGVuZ3RoKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbYnJhbmNoXSwgaSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGJyYW5jaCA9PT0gbmV4dFR5cGUpIHtcbiAgICAgICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbYnJhbmNoXSwgaSsyKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBObyBtYXRjaCBvbiB0aGlzIG9uZSwgc2hpZnQgaW50byB0aGUgdHJlZSBidXQgbm90IGluIHRoZSB0eXBlIGFycmF5LlxuICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsaXN0ZW5lcnM7XG4gICAgICB9XG5cbiAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2N1cnJlbnRUeXBlXSwgaSsxKSk7XG4gICAgfVxuXG4gICAgeFRyZWUgPSB0cmVlWycqJ107XG4gICAgaWYgKHhUcmVlKSB7XG4gICAgICAvL1xuICAgICAgLy8gSWYgdGhlIGxpc3RlbmVyIHRyZWUgd2lsbCBhbGxvdyBhbnkgbWF0Y2ggZm9yIHRoaXMgcGFydCxcbiAgICAgIC8vIHRoZW4gcmVjdXJzaXZlbHkgZXhwbG9yZSBhbGwgYnJhbmNoZXMgb2YgdGhlIHRyZWVcbiAgICAgIC8vXG4gICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHhUcmVlLCBpKzEpO1xuICAgIH1cblxuICAgIHh4VHJlZSA9IHRyZWVbJyoqJ107XG4gICAgaWYoeHhUcmVlKSB7XG4gICAgICBpZihpIDwgdHlwZUxlbmd0aCkge1xuICAgICAgICBpZih4eFRyZWUuX2xpc3RlbmVycykge1xuICAgICAgICAgIC8vIElmIHdlIGhhdmUgYSBsaXN0ZW5lciBvbiBhICcqKicsIGl0IHdpbGwgY2F0Y2ggYWxsLCBzbyBhZGQgaXRzIGhhbmRsZXIuXG4gICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWUsIHR5cGVMZW5ndGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQnVpbGQgYXJyYXlzIG9mIG1hdGNoaW5nIG5leHQgYnJhbmNoZXMgYW5kIG90aGVycy5cbiAgICAgICAgZm9yKGJyYW5jaCBpbiB4eFRyZWUpIHtcbiAgICAgICAgICBpZihicmFuY2ggIT09ICdfbGlzdGVuZXJzJyAmJiB4eFRyZWUuaGFzT3duUHJvcGVydHkoYnJhbmNoKSkge1xuICAgICAgICAgICAgaWYoYnJhbmNoID09PSBuZXh0VHlwZSkge1xuICAgICAgICAgICAgICAvLyBXZSBrbm93IHRoZSBuZXh0IGVsZW1lbnQgd2lsbCBtYXRjaCwgc28ganVtcCB0d2ljZS5cbiAgICAgICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbYnJhbmNoXSwgaSsyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZihicmFuY2ggPT09IGN1cnJlbnRUeXBlKSB7XG4gICAgICAgICAgICAgIC8vIEN1cnJlbnQgbm9kZSBtYXRjaGVzLCBtb3ZlIGludG8gdGhlIHRyZWUuXG4gICAgICAgICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeHhUcmVlW2JyYW5jaF0sIGkrMSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpc29sYXRlZEJyYW5jaCA9IHt9O1xuICAgICAgICAgICAgICBpc29sYXRlZEJyYW5jaFticmFuY2hdID0geHhUcmVlW2JyYW5jaF07XG4gICAgICAgICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeyAnKionOiBpc29sYXRlZEJyYW5jaCB9LCBpKzEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKHh4VHJlZS5fbGlzdGVuZXJzKSB7XG4gICAgICAgIC8vIFdlIGhhdmUgcmVhY2hlZCB0aGUgZW5kIGFuZCBzdGlsbCBvbiBhICcqKidcbiAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWUsIHR5cGVMZW5ndGgpO1xuICAgICAgfSBlbHNlIGlmKHh4VHJlZVsnKiddICYmIHh4VHJlZVsnKiddLl9saXN0ZW5lcnMpIHtcbiAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbJyonXSwgdHlwZUxlbmd0aCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGxpc3RlbmVycztcbiAgfVxuXG4gIGZ1bmN0aW9uIGdyb3dMaXN0ZW5lclRyZWUodHlwZSwgbGlzdGVuZXIpIHtcblxuICAgIHR5cGUgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcblxuICAgIC8vXG4gICAgLy8gTG9va3MgZm9yIHR3byBjb25zZWN1dGl2ZSAnKionLCBpZiBzbywgZG9uJ3QgYWRkIHRoZSBldmVudCBhdCBhbGwuXG4gICAgLy9cbiAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0eXBlLmxlbmd0aDsgaSsxIDwgbGVuOyBpKyspIHtcbiAgICAgIGlmKHR5cGVbaV0gPT09ICcqKicgJiYgdHlwZVtpKzFdID09PSAnKionKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgdHJlZSA9IHRoaXMubGlzdGVuZXJUcmVlO1xuICAgIHZhciBuYW1lID0gdHlwZS5zaGlmdCgpO1xuXG4gICAgd2hpbGUgKG5hbWUpIHtcblxuICAgICAgaWYgKCF0cmVlW25hbWVdKSB7XG4gICAgICAgIHRyZWVbbmFtZV0gPSB7fTtcbiAgICAgIH1cblxuICAgICAgdHJlZSA9IHRyZWVbbmFtZV07XG5cbiAgICAgIGlmICh0eXBlLmxlbmd0aCA9PT0gMCkge1xuXG4gICAgICAgIGlmICghdHJlZS5fbGlzdGVuZXJzKSB7XG4gICAgICAgICAgdHJlZS5fbGlzdGVuZXJzID0gbGlzdGVuZXI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih0eXBlb2YgdHJlZS5fbGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdHJlZS5fbGlzdGVuZXJzID0gW3RyZWUuX2xpc3RlbmVycywgbGlzdGVuZXJdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzQXJyYXkodHJlZS5fbGlzdGVuZXJzKSkge1xuXG4gICAgICAgICAgdHJlZS5fbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuXG4gICAgICAgICAgaWYgKCF0cmVlLl9saXN0ZW5lcnMud2FybmVkKSB7XG5cbiAgICAgICAgICAgIHZhciBtID0gZGVmYXVsdE1heExpc3RlbmVycztcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBtID0gdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG0gPiAwICYmIHRyZWUuX2xpc3RlbmVycy5sZW5ndGggPiBtKSB7XG5cbiAgICAgICAgICAgICAgdHJlZS5fbGlzdGVuZXJzLndhcm5lZCA9IHRydWU7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyZWUuX2xpc3RlbmVycy5sZW5ndGgpO1xuICAgICAgICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgbmFtZSA9IHR5cGUuc2hpZnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuXG4gIC8vIDEwIGxpc3RlbmVycyBhcmUgYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaFxuICAvLyBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbiAgLy9cbiAgLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4gIC8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZGVsaW1pdGVyID0gJy4nO1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XG4gICAgdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyA9IG47XG4gICAgaWYgKCF0aGlzLl9jb25mKSB0aGlzLl9jb25mID0ge307XG4gICAgdGhpcy5fY29uZi5tYXhMaXN0ZW5lcnMgPSBuO1xuICB9O1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnQgPSAnJztcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihldmVudCwgZm4pIHtcbiAgICB0aGlzLm1hbnkoZXZlbnQsIDEsIGZuKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm1hbnkgPSBmdW5jdGlvbihldmVudCwgdHRsLCBmbikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWFueSBvbmx5IGFjY2VwdHMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGlzdGVuZXIoKSB7XG4gICAgICBpZiAoLS10dGwgPT09IDApIHtcbiAgICAgICAgc2VsZi5vZmYoZXZlbnQsIGxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgbGlzdGVuZXIuX29yaWdpbiA9IGZuO1xuXG4gICAgdGhpcy5vbihldmVudCwgbGlzdGVuZXIpO1xuXG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICB0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xuXG4gICAgdmFyIHR5cGUgPSBhcmd1bWVudHNbMF07XG5cbiAgICBpZiAodHlwZSA9PT0gJ25ld0xpc3RlbmVyJyAmJiAhdGhpcy5uZXdMaXN0ZW5lcikge1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgfVxuXG4gICAgLy8gTG9vcCB0aHJvdWdoIHRoZSAqX2FsbCogZnVuY3Rpb25zIGFuZCBpbnZva2UgdGhlbS5cbiAgICBpZiAodGhpcy5fYWxsKSB7XG4gICAgICB2YXIgbCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShsIC0gMSk7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGw7IGkrKykgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICBmb3IgKGkgPSAwLCBsID0gdGhpcy5fYWxsLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcbiAgICAgICAgdGhpcy5fYWxsW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuXG4gICAgICBpZiAoIXRoaXMuX2FsbCAmJlxuICAgICAgICAhdGhpcy5fZXZlbnRzLmVycm9yICYmXG4gICAgICAgICEodGhpcy53aWxkY2FyZCAmJiB0aGlzLmxpc3RlbmVyVHJlZS5lcnJvcikpIHtcblxuICAgICAgICBpZiAoYXJndW1lbnRzWzFdIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICB0aHJvdyBhcmd1bWVudHNbMV07IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5jYXVnaHQsIHVuc3BlY2lmaWVkICdlcnJvcicgZXZlbnQuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgaGFuZGxlcjtcblxuICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgIGhhbmRsZXIgPSBbXTtcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xuICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgaGFuZGxlciwgbnMsIHRoaXMubGlzdGVuZXJUcmVlLCAwKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSlcbiAgICAgICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgLy8gc2xvd2VyXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGwgLSAxKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbDsgaSsrKSBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlIGlmIChoYW5kbGVyKSB7XG4gICAgICB2YXIgbCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShsIC0gMSk7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGw7IGkrKykgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICAgIHZhciBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XG4gICAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAobGlzdGVuZXJzLmxlbmd0aCA+IDApIHx8IHRoaXMuX2FsbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fYWxsO1xuICAgIH1cblxuICB9O1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuXG4gICAgaWYgKHR5cGVvZiB0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLm9uQW55KHR5cGUpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdvbiBvbmx5IGFjY2VwdHMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gICAgfVxuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XG5cbiAgICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09IFwibmV3TGlzdGVuZXJzXCIhIEJlZm9yZVxuICAgIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJzXCIuXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgIGdyb3dMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCB0eXBlLCBsaXN0ZW5lcik7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xuICAgICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgICB9XG4gICAgZWxzZSBpZih0eXBlb2YgdGhpcy5fZXZlbnRzW3R5cGVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcbiAgICB9XG4gICAgZWxzZSBpZiAoaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG4gICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG5cbiAgICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gICAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcblxuICAgICAgICB2YXIgbSA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIG0gPSB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG5cbiAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbkFueSA9IGZ1bmN0aW9uKGZuKSB7XG5cbiAgICBpZighdGhpcy5fYWxsKSB7XG4gICAgICB0aGlzLl9hbGwgPSBbXTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ29uQW55IG9ubHkgYWNjZXB0cyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICAvLyBBZGQgdGhlIGZ1bmN0aW9uIHRvIHRoZSBldmVudCBsaXN0ZW5lciBjb2xsZWN0aW9uLlxuICAgIHRoaXMuX2FsbC5wdXNoKGZuKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdyZW1vdmVMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICAgIH1cblxuICAgIHZhciBoYW5kbGVycyxsZWFmcz1bXTtcblxuICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xuICAgICAgbGVhZnMgPSBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBudWxsLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuICAgICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHJldHVybiB0aGlzO1xuICAgICAgaGFuZGxlcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgICBsZWFmcy5wdXNoKHtfbGlzdGVuZXJzOmhhbmRsZXJzfSk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaUxlYWY9MDsgaUxlYWY8bGVhZnMubGVuZ3RoOyBpTGVhZisrKSB7XG4gICAgICB2YXIgbGVhZiA9IGxlYWZzW2lMZWFmXTtcbiAgICAgIGhhbmRsZXJzID0gbGVhZi5fbGlzdGVuZXJzO1xuICAgICAgaWYgKGlzQXJyYXkoaGFuZGxlcnMpKSB7XG5cbiAgICAgICAgdmFyIHBvc2l0aW9uID0gLTE7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGhhbmRsZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKGhhbmRsZXJzW2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgICAgKGhhbmRsZXJzW2ldLmxpc3RlbmVyICYmIGhhbmRsZXJzW2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikgfHxcbiAgICAgICAgICAgIChoYW5kbGVyc1tpXS5fb3JpZ2luICYmIGhhbmRsZXJzW2ldLl9vcmlnaW4gPT09IGxpc3RlbmVyKSkge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uIDwgMCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodGhpcy53aWxkY2FyZCkge1xuICAgICAgICAgIGxlYWYuX2xpc3RlbmVycy5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhbmRsZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBsZWFmLl9saXN0ZW5lcnM7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChoYW5kbGVycyA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgKGhhbmRsZXJzLmxpc3RlbmVyICYmIGhhbmRsZXJzLmxpc3RlbmVyID09PSBsaXN0ZW5lcikgfHxcbiAgICAgICAgKGhhbmRsZXJzLl9vcmlnaW4gJiYgaGFuZGxlcnMuX29yaWdpbiA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgICAgICBkZWxldGUgbGVhZi5fbGlzdGVuZXJzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZkFueSA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIGkgPSAwLCBsID0gMCwgZm5zO1xuICAgIGlmIChmbiAmJiB0aGlzLl9hbGwgJiYgdGhpcy5fYWxsLmxlbmd0aCA+IDApIHtcbiAgICAgIGZucyA9IHRoaXMuX2FsbDtcbiAgICAgIGZvcihpID0gMCwgbCA9IGZucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYoZm4gPT09IGZuc1tpXSkge1xuICAgICAgICAgIGZucy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYWxsID0gW107XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZjtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgIXRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZih0aGlzLndpbGRjYXJkKSB7XG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcbiAgICAgIHZhciBsZWFmcyA9IHNlYXJjaExpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIG51bGwsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XG5cbiAgICAgIGZvciAodmFyIGlMZWFmPTA7IGlMZWFmPGxlYWZzLmxlbmd0aDsgaUxlYWYrKykge1xuICAgICAgICB2YXIgbGVhZiA9IGxlYWZzW2lMZWFmXTtcbiAgICAgICAgbGVhZi5fbGlzdGVuZXJzID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgcmV0dXJuIHRoaXM7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICBpZih0aGlzLndpbGRjYXJkKSB7XG4gICAgICB2YXIgaGFuZGxlcnMgPSBbXTtcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xuICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgaGFuZGxlcnMsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XG4gICAgICByZXR1cm4gaGFuZGxlcnM7XG4gICAgfVxuXG4gICAgdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcblxuICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB0aGlzLl9ldmVudHNbdHlwZV0gPSBbXTtcbiAgICBpZiAoIWlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnNBbnkgPSBmdW5jdGlvbigpIHtcblxuICAgIGlmKHRoaXMuX2FsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2FsbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gIH07XG5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBFdmVudEVtaXR0ZXI7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgZXhwb3J0cy5FdmVudEVtaXR0ZXIyID0gRXZlbnRFbWl0dGVyO1xuICB9XG5cbn0odHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBwcm9jZXNzLnRpdGxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcgPyBleHBvcnRzIDogd2luZG93KTtcbiIsIlxuZnVuY3Rpb24gU3RvcmUoa2V5cykge1xuICBpZigha2V5cy5sZW5ndGgpXG4gICAgdGhyb3cgXCJZb3UgbXVzdCBwcm92aWRlIHNvbWUga2V5cyB0byBpbmRleFwiO1xuICBBcnJheS5jYWxsKHRoaXMpO1xuICB0aGlzLmluZGljZXMgPSB7fTtcbiAgZm9yKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspXG4gICAgdGhpcy5pbmRpY2VzW2tleXNbaV1dID0ge307XG59XG5TdG9yZS5wcm90b3R5cGUgPSBbXTtcblN0b3JlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihrZXkpIHtcbiAgcmV0dXJuIHRoaXMuZ2V0QnkobnVsbCwga2V5KTtcbn07XG5TdG9yZS5wcm90b3R5cGUuZ2V0QnkgPSBmdW5jdGlvbihpbmRleCwga2V5KSB7XG4gIHN3aXRjaCh0eXBlb2Yga2V5KSB7XG4gICAgY2FzZSBcIm51bWJlclwiOiByZXR1cm4gdGhpc1trZXldO1xuICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgIGlmKGluZGV4KVxuICAgICAgICByZXR1cm4gdGhpcy5pbmRpY2VzW2luZGV4XSA/IHRoaXMuaW5kaWNlc1tpbmRleF1ba2V5XSB8fCBudWxsIDogbnVsbDtcbiAgICAgIGZvcihpbmRleCBpbiB0aGlzLmluZGljZXMpXG4gICAgICAgIGlmKGtleSBpbiB0aGlzLmluZGljZXNbaW5kZXhdKVxuICAgICAgICAgIHJldHVybiB0aGlzLmluZGljZXNbaW5kZXhdW2tleV07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5TdG9yZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24ob2JqKSB7XG4gIHRoaXMucHVzaChvYmopO1xuICBmb3IodmFyIGsgaW4gdGhpcy5pbmRpY2VzKVxuICAgIGlmKGsgaW4gb2JqKVxuICAgICAgdGhpcy5pbmRpY2VzW2tdW29ialtrXV0gPSBvYmo7XG59O1xuXG5TdG9yZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24ob2JqKSB7XG4gIGlmKHR5cGVvZiBvYmogIT09IFwib2JqZWN0XCIpXG4gICAgb2JqID0gdGhpcy5nZXQob2JqKTtcbiAgaWYob2JqID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgdmFyIGkgPSB0aGlzLmluZGV4T2Yob2JqKTtcbiAgaWYoaSA9PT0gLTEpIHJldHVybiBudWxsO1xuICB0aGlzLnNwbGljZShpLCAxKTtcbiAgZm9yKHZhciBrIGluIHRoaXMuaW5kaWNlcylcbiAgICBpZihrIGluIG9iailcbiAgICAgIGRlbGV0ZSB0aGlzLmluZGljZXNba11bb2JqW2tdXTtcbiAgcmV0dXJuIG9iajtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgU3RvcmUoYXJndW1lbnRzKTtcbn07IiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjYuM1xudmFyIEJhc2UsIER5bmFtaWNFeHBvc2VkLCBFbWl0dGVyLCBMb2dnZXIsIFJlbW90ZUNvbnRleHQsIGFkZHIsIGFkZHJzLCBjcnlwdG8sIGd1aWQsIGlwcywgbmFtZSwgb3MsIHRyYW5zcG9ydE1nciwgdXRpbCwgXywgX2ksIF9sZW4sIF9yZWYsXG4gIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5LFxuICBfX2V4dGVuZHMgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKF9faGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgX19zbGljZSA9IFtdLnNsaWNlLFxuICBfX2luZGV4T2YgPSBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uKGl0ZW0pIHsgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykgeyBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHJldHVybiBpOyB9IHJldHVybiAtMTsgfTtcblxuRW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjInKS5FdmVudEVtaXR0ZXIyO1xuXG51dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG5fID0gcmVxdWlyZSgnLi4vdmVuZG9yL2xvZGFzaCcpO1xuXG50cmFuc3BvcnRNZ3IgPSByZXF1aXJlKCcuL3RyYW5zcG9ydC1tZ3InKTtcblxuUmVtb3RlQ29udGV4dCA9IHJlcXVpcmUoJy4vY29udGV4dCcpO1xuXG5Mb2dnZXIgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gIF9fZXh0ZW5kcyhMb2dnZXIsIF9zdXBlcik7XG5cbiAgTG9nZ2VyLnByb3RvdHlwZS5uYW1lID0gJ0xvZ2dlcic7XG5cbiAgZnVuY3Rpb24gTG9nZ2VyKCkge1xuICAgIExvZ2dlci5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCB7XG4gICAgICB3aWxkY2FyZDogdHJ1ZVxuICAgIH0pO1xuICB9XG5cbiAgTG9nZ2VyLnByb3RvdHlwZS5sb2cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3JlZjtcbiAgICBpZiAoKF9yZWYgPSB0aGlzLm9wdHMpICE9IG51bGwgPyBfcmVmLmRlYnVnIDogdm9pZCAwKSB7XG4gICAgICByZXR1cm4gY29uc29sZS5sb2codGhpcy50b1N0cmluZygpICsgJyAnICsgdXRpbC5mb3JtYXQuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XG4gICAgfVxuICB9O1xuXG4gIExvZ2dlci5wcm90b3R5cGUud2FybiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBjb25zb2xlLndhcm4oJ1dBUk5JTkc6ICcgKyB0aGlzLnRvU3RyaW5nKCkgKyAnICcgKyB1dGlsLmZvcm1hdC5hcHBseShudWxsLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICBMb2dnZXIucHJvdG90eXBlLmVyciA9IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICBlLm1lc3NhZ2UgPSBcIlwiICsgdGhpcyArIFwiIFwiICsgZS5tZXNzYWdlO1xuICAgIH0gZWxzZSB7XG4gICAgICBlID0gbmV3IEVycm9yKGUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5lbWl0KCdlcnJvcicsIGUpO1xuICB9O1xuXG4gIExvZ2dlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXCJcIiArIHRoaXMubmFtZSArIFwiOiBcIiArIHRoaXMuaWQgKyAodGhpcy5zdWJpZCA/ICcgKCcgKyB0aGlzLnN1YmlkICsgJyknIDogJycpICsgXCI6XCI7XG4gIH07XG5cbiAgcmV0dXJuIExvZ2dlcjtcblxufSkoRW1pdHRlcik7XG5cbmNyeXB0byA9IHJlcXVpcmUoXCJjcnlwdG9cIik7XG5cbmd1aWQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGNyeXB0by5yYW5kb21CeXRlcyg2KS50b1N0cmluZygnaGV4Jyk7XG59O1xuXG5vcyA9IHJlcXVpcmUoXCJvc1wiKTtcblxuaXBzID0gW107XG5cbl9yZWYgPSB0eXBlb2Ygb3MubmV0d29ya0ludGVyZmFjZXMgPT09IFwiZnVuY3Rpb25cIiA/IG9zLm5ldHdvcmtJbnRlcmZhY2VzKCkgOiB2b2lkIDA7XG5mb3IgKG5hbWUgaW4gX3JlZikge1xuICBhZGRycyA9IF9yZWZbbmFtZV07XG4gIGZvciAoX2kgPSAwLCBfbGVuID0gYWRkcnMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICBhZGRyID0gYWRkcnNbX2ldO1xuICAgIGlmIChhZGRyLmZhbWlseSA9PT0gJ0lQdjQnKSB7XG4gICAgICBpcHMucHVzaChhZGRyLmFkZHJlc3MpO1xuICAgIH1cbiAgfVxufVxuXG5EeW5hbWljRXhwb3NlZCA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gRHluYW1pY0V4cG9zZWQoZm4pIHtcbiAgICB0aGlzLmZuID0gZm47XG4gIH1cblxuICByZXR1cm4gRHluYW1pY0V4cG9zZWQ7XG5cbn0pKCk7XG5cbkJhc2UgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gIF9fZXh0ZW5kcyhCYXNlLCBfc3VwZXIpO1xuXG4gIEJhc2UucHJvdG90eXBlLm5hbWUgPSAnQmFzZSc7XG5cbiAgZnVuY3Rpb24gQmFzZShpbmNvbWluZykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgQmFzZS5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmd1aWQgPSBndWlkKCk7XG4gICAgaWYgKChpbmNvbWluZyAhPSBudWxsID8gaW5jb21pbmcubmFtZSA6IHZvaWQgMCkgPT09ICdMb2NhbFBlZXInKSB7XG4gICAgICB0aGlzLnBhcmVudCA9IGluY29taW5nO1xuICAgICAgdGhpcy5vcHRzID0gdGhpcy5wYXJlbnQub3B0cztcbiAgICAgIHRoaXMuaWQgPSB0aGlzLnBhcmVudC5pZCB8fCB0aGlzLmd1aWQ7XG4gICAgICB0aGlzLnN1YmlkID0gKHRoaXMubmFtZSA9PT0gXCJTZXJ2ZXJcIiA/IFwic1wiIDogXCJjXCIpICsgdGhpcy5wYXJlbnQuY291bnRbdGhpcy5uYW1lID09PSBcIlNlcnZlclwiID8gXCJzZXJ2ZXJcIiA6IFwiY2xpZW50XCJdO1xuICAgICAgdGhpcy5wdWJzdWIgPSB0aGlzLnBhcmVudC5wdWJzdWI7XG4gICAgICB0aGlzLmV4cG9zZWQgPSB0aGlzLnBhcmVudC5leHBvc2VkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9wdHMgPSBfLmlzU3RyaW5nKGluY29taW5nKSA/IHtcbiAgICAgICAgaWQ6IGluY29taW5nXG4gICAgICB9IDogaW5jb21pbmcgfHwge307XG4gICAgICB0aGlzLmlkID0gdGhpcy5vcHRzLmlkIHx8IHRoaXMuZ3VpZDtcbiAgICAgIHRoaXMuc3ViaWQgPSBudWxsO1xuICAgICAgdGhpcy5wdWJzdWIgPSBuZXcgRW1pdHRlcjtcbiAgICAgIHRoaXMuZXhwb3NlZCA9IHRoaXMuZGVmYXVsdEV4cG9zZWQoKTtcbiAgICB9XG4gICAgXy5kZWZhdWx0cyh0aGlzLm9wdHMsIHRoaXMuZGVmYXVsdHMpO1xuICAgIGlmICh0aGlzLm9wdHMuZGVidWcpIHtcbiAgICAgIHRoaXMub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKFwiRVJST1IgRU1JVFRFRDogXCIgKyAoZXJyLnN0YWNrIHx8IGVycikpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIF8uYmluZEFsbCh0aGlzKTtcbiAgICB0aGlzLnVuYm91bmQgPSB0cnVlO1xuICB9XG5cbiAgQmFzZS5wcm90b3R5cGUub3B0aW9ucyA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgICByZXR1cm4gXy5leHRlbmQodGhpcy5vcHRzLCBvcHRzKTtcbiAgfTtcblxuICBCYXNlLnByb3RvdHlwZS5kZWZhdWx0RXhwb3NlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmO1xuICAgIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiB7XG4gICAgICBfcG5vZGU6IHtcbiAgICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICAgIGd1aWQ6IHRoaXMuZ3VpZCxcbiAgICAgICAgaXBzOiBpcHMuZmlsdGVyKGZ1bmN0aW9uKGlwKSB7XG4gICAgICAgICAgcmV0dXJuIGlwICE9PSAnMTI3LjAuMC4xJztcbiAgICAgICAgfSksXG4gICAgICAgIHN1YnNjcmliZTogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5ldmVudHNbZXZlbnRdID0gMTtcbiAgICAgICAgfSxcbiAgICAgICAgdW5zdWJzY3JpYmU6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgcmV0dXJuIGRlbGV0ZSB0aGlzLmV2ZW50c1tldmVudF07XG4gICAgICAgIH0sXG4gICAgICAgIHB1Ymxpc2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBhcmdzLCBjYjtcbiAgICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNiID0gYXJncy5zaGlmdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZWxmLnB1YnN1Yi5lbWl0LmFwcGx5KHNlbGYucHVic3ViLCBhcmdzKTtcbiAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgIHJldHVybiBjYih0cnVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHBpbmc6IGZ1bmN0aW9uKGNiKSB7XG4gICAgICAgICAgcmV0dXJuIGNiKHRydWUpO1xuICAgICAgICB9LFxuICAgICAgICBldmVudHM6IHRoaXMuZXhwb3NlRHluYW1pYyhmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgZXZ0cztcbiAgICAgICAgICBldnRzID0gT2JqZWN0LmtleXMoc2VsZi5wdWJzdWIuX2V2ZW50cyk7XG4gICAgICAgICAgc2VsZi5sb2coXCJleHBvc2luZyBldmVudHM6ICVqXCIsIGV2dHMpO1xuICAgICAgICAgIHJldHVybiBldnRzO1xuICAgICAgICB9KVxuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgQmFzZS5wcm90b3R5cGUuZXhwb3NlRHluYW1pYyA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgcmV0dXJuIG5ldyBEeW5hbWljRXhwb3NlZChmbik7XG4gIH07XG5cbiAgQmFzZS5wcm90b3R5cGUuZXhwb3NlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8ubWVyZ2UodGhpcy5leHBvc2VkLCBvYmopO1xuICB9O1xuXG4gIEJhc2UucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncywgZXJyLCBldmVudHMsIHNlbGYsIHRyYW5zO1xuICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgIGlmICh0aGlzLmJvdW5kKSB7XG4gICAgICBpZiAodGhpcy51bmJpbmRpbmcpIHtcbiAgICAgICAgdGhpcy53YXJuKCd1bmJpbmQgaW4gcHJvZ3Jlc3MnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMudEVtaXR0ZXIpIHtcbiAgICAgIHRoaXMudEVtaXR0ZXIucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgfVxuICAgIHRoaXMudEVtaXR0ZXIgPSBuZXcgRW1pdHRlcjtcbiAgICBldmVudHMgPSBbJ2JpbmRpbmcnLCAnYm91bmQnLCAndW5iaW5kaW5nJywgJ3VuYm91bmQnXTtcbiAgICBzZWxmID0gdGhpcztcbiAgICB0aGlzLnRFbWl0dGVyLm9uQW55KGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MsIGUsIF9qLCBfbGVuMSwgX3JlZjE7XG4gICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgIHNlbGYubG9nKCdULUVWRU5UJywgdGhpcy5ldmVudCk7XG4gICAgICBpZiAoX3JlZjEgPSB0aGlzLmV2ZW50LCBfX2luZGV4T2YuY2FsbChldmVudHMsIF9yZWYxKSA+PSAwKSB7XG4gICAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IGV2ZW50cy5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgICBlID0gZXZlbnRzW19qXTtcbiAgICAgICAgICBzZWxmW2VdID0gZSA9PT0gdGhpcy5ldmVudDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2VsZi5lbWl0LmFwcGx5KG51bGwsIFt0aGlzLmV2ZW50XS5jb25jYXQoYXJncykpO1xuICAgIH0pO1xuICAgIHRyeSB7XG4gICAgICB0cmFucyA9IHRyYW5zcG9ydE1nci5nZXQoYXJncyk7XG4gICAgICBhcmdzLnVuc2hpZnQodGhpcy50RW1pdHRlcik7XG4gICAgICB0aGlzLnRFbWl0dGVyLmVtaXQoJ2JpbmRpbmcnKTtcbiAgICAgIHRyYW5zW1wiYmluZFwiICsgdGhpcy5uYW1lXS5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGVyciA9IF9lcnJvcjtcbiAgICAgIGVyci5tZXNzYWdlID0gXCJUcmFuc3BvcnQ6IFwiICsgZXJyLm1lc3NhZ2U7XG4gICAgICB0aGlzLmVycihlcnIpO1xuICAgIH1cbiAgfTtcblxuICBCYXNlLnByb3RvdHlwZS51bmJpbmQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIGlmICh0aGlzLnVuYm91bmQpIHtcbiAgICAgIGlmICh0aGlzLmJpbmRpbmcpIHtcbiAgICAgICAgdGhpcy53YXJuKCdiaW5kIGluIHByb2dyZXNzJyk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgdGhpcy5vbmNlKCd1bmJvdW5kJywgY2FsbGJhY2spO1xuICAgIH1cbiAgICB0aGlzLnRFbWl0dGVyLmVtaXQoJ3VuYmluZGluZycpO1xuICAgIHRoaXMudEVtaXR0ZXIuZW1pdCgndW5iaW5kJyk7XG4gIH07XG5cbiAgQmFzZS5wcm90b3R5cGUud3JhcE9iamVjdCA9IGZ1bmN0aW9uKGlucHV0LCBjdHgpIHtcbiAgICByZXR1cm4gdGhpcy53cmFwT2JqZWN0QWNjKCdyb290JywgaW5wdXQsIGN0eCk7XG4gIH07XG5cbiAgQmFzZS5wcm90b3R5cGUud3JhcE9iamVjdEFjYyA9IGZ1bmN0aW9uKG5hbWUsIGlucHV0LCBjdHgpIHtcbiAgICB2YXIgaywgb3V0cHV0LCB0eXBlLCB2O1xuICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIER5bmFtaWNFeHBvc2VkKSB7XG4gICAgICByZXR1cm4gaW5wdXQuZm4oKTtcbiAgICB9XG4gICAgdHlwZSA9IHR5cGVvZiBpbnB1dDtcbiAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH1cbiAgICBpZiAoaW5wdXQgJiYgdHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG91dHB1dCA9IHt9O1xuICAgICAgZm9yIChrIGluIGlucHV0KSB7XG4gICAgICAgIHYgPSBpbnB1dFtrXTtcbiAgICAgICAgb3V0cHV0W2tdID0gdGhpcy53cmFwT2JqZWN0QWNjKGssIHYsIGN0eCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHRoaXMudGltZW91dGlmeShuYW1lLCBpbnB1dCwgY3R4KTtcbiAgICB9XG4gICAgcmV0dXJuIGlucHV0O1xuICB9O1xuXG4gIEJhc2UucHJvdG90eXBlLnRpbWVvdXRpZnkgPSBmdW5jdGlvbihuYW1lLCBmbiwgY3R4KSB7XG4gICAgdmFyIHNlbGYsIHR5cGUsIF9iYXNlLFxuICAgICAgX3RoaXMgPSB0aGlzO1xuICAgIGlmIChjdHggPT0gbnVsbCkge1xuICAgICAgY3R4ID0gdGhpcztcbiAgICB9XG4gICAgc2VsZiA9IHRoaXM7XG4gICAgKF9iYXNlID0gc2VsZi50aW1lb3V0aWZ5KS5pZCB8fCAoX2Jhc2UuaWQgPSAwKTtcbiAgICB0eXBlID0gY3R4IGluc3RhbmNlb2YgUmVtb3RlQ29udGV4dCA/ICdsb2NhbCcgOiAncmVtb3RlJztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYSwgYXJncywgaSwgaWQsIHQsIHRpbWVkb3V0LCBfaiwgX2xlbjE7XG4gICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgIHQgPSBudWxsO1xuICAgICAgdGltZWRvdXQgPSBmYWxzZTtcbiAgICAgIGlkID0gc2VsZi50aW1lb3V0aWZ5LmlkKys7XG4gICAgICBmb3IgKGkgPSBfaiA9IDAsIF9sZW4xID0gYXJncy5sZW5ndGg7IF9qIDwgX2xlbjE7IGkgPSArK19qKSB7XG4gICAgICAgIGEgPSBhcmdzW2ldO1xuICAgICAgICBpZiAodHlwZW9mIGEgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBhcmdzW2ldID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodCk7XG4gICAgICAgICAgICBpZiAodGltZWRvdXQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi5lbWl0KFsndGltZWluJywgbmFtZV0sIGFyZ3MsIGN0eCk7XG4gICAgICAgICAgICBhLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICB0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRpbWVkb3V0ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICghc2VsZi5ib3VuZCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLmVtaXQoWyd0aW1lb3V0JywgbmFtZV0sIGFyZ3MsIGN0eCk7XG4gICAgICAgICAgfSwgc2VsZi5vcHRzLnRpbWVvdXQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZm4uYXBwbHkoY3R4LCBhcmdzKTtcbiAgICB9O1xuICB9O1xuXG4gIEJhc2UucHJvdG90eXBlLmlwcyA9IGlwcztcblxuICByZXR1cm4gQmFzZTtcblxufSkoTG9nZ2VyKTtcblxuQmFzZS5Mb2dnZXIgPSBMb2dnZXI7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFzZTtcblxuLypcbi8vQCBzb3VyY2VNYXBwaW5nVVJMPWJhc2UubWFwXG4qL1xuIiwidmFyIHByb2Nlc3M9cmVxdWlyZShcIl9fYnJvd3NlcmlmeV9wcm9jZXNzXCIpOy8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS42LjNcbnZhciBCYXNlLCBDbGllbnQsIFJlbW90ZUNvbnRleHQsIGRub2RlLCBoZWxwZXIsIF8sXG4gIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5LFxuICBfX2V4dGVuZHMgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKF9faGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgX19zbGljZSA9IFtdLnNsaWNlO1xuXG5fID0gcmVxdWlyZSgnLi4vLi4vdmVuZG9yL2xvZGFzaCcpO1xuXG5kbm9kZSA9IHJlcXVpcmUoJ2Rub2RlJyk7XG5cbkJhc2UgPSByZXF1aXJlKCcuLi9iYXNlJyk7XG5cbmhlbHBlciA9IHJlcXVpcmUoJy4uL2hlbHBlcicpO1xuXG5SZW1vdGVDb250ZXh0ID0gcmVxdWlyZSgnLi4vY29udGV4dCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENsaWVudCA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgX19leHRlbmRzKENsaWVudCwgX3N1cGVyKTtcblxuICBDbGllbnQucHJvdG90eXBlLm5hbWUgPSAnQ2xpZW50JztcblxuICBDbGllbnQucHJvdG90eXBlLmRlZmF1bHRzID0ge1xuICAgIGRlYnVnOiBmYWxzZSxcbiAgICBtYXhSZXRyaWVzOiA1LFxuICAgIHRpbWVvdXQ6IDUwMDAsXG4gICAgcmV0cnlJbnRlcnZhbDogNTAwLFxuICAgIHBpbmdJbnRlcnZhbDogNTAwMCxcbiAgICBwb3J0OiA3MzM3XG4gIH07XG5cbiAgZnVuY3Rpb24gQ2xpZW50KCkge1xuICAgIHZhciBvblJlYWQsIG9uV3JpdGUsXG4gICAgICBfdGhpcyA9IHRoaXM7XG4gICAgQ2xpZW50Ll9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIHRoaXMuY291bnQgPSB7XG4gICAgICBwaW5nOiAwLFxuICAgICAgcG9uZzogMCxcbiAgICAgIGF0dGVtcHQ6IDBcbiAgICB9O1xuICAgIHRoaXMuY29ubmVjdCA9IF8udGhyb3R0bGUodGhpcy5jb25uZWN0LCB0aGlzLm9wdHMucmV0cnlJbnRlcnZhbCwge1xuICAgICAgbGVhZGluZzogdHJ1ZVxuICAgIH0pO1xuICAgIHRoaXMucGluZyA9IF8udGhyb3R0bGUodGhpcy5waW5nLCB0aGlzLm9wdHMucGluZ0ludGVydmFsKTtcbiAgICB0aGlzLm9uKFsndGltZW91dCcsICdwaW5nJ10sIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIF90aGlzLmxvZyhcInBpbmcgVElNRU9VVCFcIik7XG4gICAgfSk7XG4gICAgdGhpcy5iaW5kVG8gPSB0aGlzLmJpbmQ7XG4gICAgdGhpcy5vbigndW5ib3VuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMucmVjb25uZWN0KCk7XG4gICAgfSk7XG4gICAgdGhpcy5vbigndXJpJywgZnVuY3Rpb24odXJpKSB7XG4gICAgICBfdGhpcy51cmkgPSB1cmk7XG4gICAgfSk7XG4gICAgb25SZWFkID0gZnVuY3Rpb24ocmVhZCkge1xuICAgICAgX3RoaXMucmVhZCA9IHJlYWQ7XG4gICAgICBpZiAoX3RoaXMuZC5zcGxpY2VkUmVhZCkge1xuICAgICAgICBfdGhpcy5lcnIobmV3IEVycm9yKFwiQWxyZWFkeSBzcGxpY2VkIHJlYWQgc3RyZWFtXCIpKTtcbiAgICAgIH1cbiAgICAgIGlmICghaGVscGVyLmlzUmVhZGFibGUocmVhZCkpIHtcbiAgICAgICAgX3RoaXMuZXJyKG5ldyBFcnJvcihcIkludmFsaWQgcmVhZCBzdHJlYW1cIikpO1xuICAgICAgfVxuICAgICAgcmVhZC5vbignZXJyb3InLCBfdGhpcy5vblN0cmVhbUVycm9yKTtcbiAgICAgIF90aGlzLmN0eC5nZXRBZGRyKHJlYWQpO1xuICAgICAgX3RoaXMuZC5zcGxpY2VkUmVhZCA9IHRydWU7XG4gICAgICByZXR1cm4gcmVhZC5waXBlKF90aGlzLmQpO1xuICAgIH07XG4gICAgb25Xcml0ZSA9IGZ1bmN0aW9uKHdyaXRlKSB7XG4gICAgICBfdGhpcy53cml0ZSA9IHdyaXRlO1xuICAgICAgaWYgKF90aGlzLmQuc3BsaWNlZFdyaXRlKSB7XG4gICAgICAgIF90aGlzLmVycihuZXcgRXJyb3IoXCJBbHJlYWR5IHNwbGljZWQgd3JpdGUgc3RyZWFtXCIpKTtcbiAgICAgIH1cbiAgICAgIGlmICghaGVscGVyLmlzV3JpdGFibGUod3JpdGUpKSB7XG4gICAgICAgIF90aGlzLmVycihuZXcgRXJyb3IoXCJJbnZhbGlkIHdyaXRlIHN0cmVhbVwiKSk7XG4gICAgICB9XG4gICAgICB3cml0ZS5vbignZXJyb3InLCBfdGhpcy5vblN0cmVhbUVycm9yKTtcbiAgICAgIF90aGlzLmQuc3BsaWNlZFdyaXRlID0gdHJ1ZTtcbiAgICAgIHJldHVybiBfdGhpcy5kLnBpcGUod3JpdGUpO1xuICAgIH07XG4gICAgdGhpcy5vbigncmVhZCcsIGZ1bmN0aW9uKHJlYWQpIHtcbiAgICAgIHJldHVybiBvblJlYWQocmVhZCk7XG4gICAgfSk7XG4gICAgdGhpcy5vbignd3JpdGUnLCBmdW5jdGlvbih3cml0ZSkge1xuICAgICAgcmV0dXJuIG9uV3JpdGUod3JpdGUpO1xuICAgIH0pO1xuICAgIHRoaXMub24oJ3N0cmVhbScsIGZ1bmN0aW9uKHN0cmVhbSkge1xuICAgICAgb25SZWFkKHN0cmVhbSk7XG4gICAgICByZXR1cm4gb25Xcml0ZShzdHJlYW0pO1xuICAgIH0pO1xuICB9XG5cbiAgQ2xpZW50LnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jb3VudC5hdHRlbXB0ID0gMDtcbiAgICB0aGlzLmJpbmRBcmdzID0gYXJndW1lbnRzO1xuICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrKHRoaXMucmVjb25uZWN0KTtcbiAgfTtcblxuICBDbGllbnQucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubG9nKFwiQ0xJRU5UIFVOQklORFwiKTtcbiAgICB0aGlzLmNvdW50LmF0dGVtcHQgPSBJbmZpbml0eTtcbiAgICByZXR1cm4gQ2xpZW50Ll9fc3VwZXJfXy51bmJpbmQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcblxuICBDbGllbnQucHJvdG90eXBlLnNlcnZlciA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgaWYgKHRoaXMuYm91bmQgJiYgdGhpcy5yZW1vdGUpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayh0aGlzLnJlbW90ZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLnVuYm91bmQpIHtcbiAgICAgIHRoaXMuY291bnQuYXR0ZW1wdCA9IDA7XG4gICAgICB0aGlzLnJlY29ubmVjdCgpO1xuICAgIH1cbiAgICB0aGlzLm9uY2UoJ3JlbW90ZScsIGNhbGxiYWNrKTtcbiAgfTtcblxuICBDbGllbnQucHJvdG90eXBlLnVuZ2V0ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICByZXR1cm4gdGhpcy5yZW1vdmVMaXN0ZW5lcigncmVtb3RlJywgY2FsbGJhY2spO1xuICB9O1xuXG4gIENsaWVudC5wcm90b3R5cGUucmVjb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCEodGhpcy51bmJvdW5kICYmIHRoaXMuY291bnQuYXR0ZW1wdCA8IHRoaXMub3B0cy5tYXhSZXRyaWVzKSkge1xuICAgICAgaWYgKHRoaXMuZCkge1xuICAgICAgICB0aGlzLmQucmVtb3ZlQWxsTGlzdGVuZXJzKCkuZW5kKCk7XG4gICAgICAgIHRoaXMuZCA9IG51bGw7XG4gICAgICB9XG4gICAgICB0aGlzLmVtaXQoJ2Rvd24nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdCgpO1xuICB9O1xuXG4gIENsaWVudC5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgaWYgKCF0aGlzLmJpbmRBcmdzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMubG9nKFwiY29ubmVjdGluZy4uLi5cIik7XG4gICAgdGhpcy5jb3VudC5hdHRlbXB0Kys7XG4gICAgdGhpcy5jdHggPSBuZXcgUmVtb3RlQ29udGV4dDtcbiAgICB0aGlzLmQgPSBkbm9kZSh0aGlzLndyYXBPYmplY3QodGhpcy5leHBvc2VkLCB0aGlzLmN0eCkpO1xuICAgIHRoaXMuZC5zcGxpY2VkUmVhZCA9IGZhbHNlO1xuICAgIHRoaXMuZC5zcGxpY2VkV3JpdGUgPSBmYWxzZTtcbiAgICB0aGlzLmQub25jZSgncmVtb3RlJywgdGhpcy5vblJlbW90ZSk7XG4gICAgdGhpcy5kLm9uY2UoJ2VuZCcsIHRoaXMub25FbmQpO1xuICAgIHRoaXMuZC5vbmNlKCdlcnJvcicsIHRoaXMub25FcnJvcik7XG4gICAgdGhpcy5kLm9uY2UoJ2ZhaWwnLCB0aGlzLm9uU3RyZWFtRXJyb3IpO1xuICAgIHRoaXMuY29ubmVjdC50ID0gc2V0VGltZW91dCh0aGlzLm9uQ29ubmVjdFRpbWVvdXQsIHRoaXMub3B0cy50aW1lb3V0KTtcbiAgICB0aGlzLmQub25jZSgncmVtb3RlJywgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KF90aGlzLmNvbm5lY3QudCk7XG4gICAgfSk7XG4gICAgdGhpcy5sb2coXCJjb25uZWN0aW9uIGF0dGVtcHQgXCIgKyB0aGlzLmNvdW50LmF0dGVtcHQgKyBcIi4uLlwiKTtcbiAgICBCYXNlLnByb3RvdHlwZS5iaW5kLmFwcGx5KHRoaXMsIHRoaXMuYmluZEFyZ3MpO1xuICB9O1xuXG4gIENsaWVudC5wcm90b3R5cGUub25Db25uZWN0VGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy5lbWl0KCd0aW1lb3V0LmNvbm5lY3QnKTtcbiAgICByZXR1cm4gdGhpcy51bmJpbmQoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gX3RoaXMucmVjb25uZWN0KCk7XG4gICAgfSk7XG4gIH07XG5cbiAgQ2xpZW50LnByb3RvdHlwZS5vblN0cmVhbUVycm9yID0gZnVuY3Rpb24oZXJyKSB7XG4gICAgdGhpcy53YXJuKFwic3RyZWFtIGVycm9yOiBcIiArIGVyci5tZXNzYWdlKTtcbiAgICBpZiAodGhpcy51bmJvdW5kIHx8IHRoaXMudW5iaW5kaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMubG9nKFwic3RyZWFtIGVycm9yOiBcIiArIGVyci5tZXNzYWdlKTtcbiAgICB0aGlzLnJlY29ubmVjdCgpO1xuICB9O1xuXG4gIENsaWVudC5wcm90b3R5cGUub25FcnJvciA9IGZ1bmN0aW9uKGVycikge1xuICAgIHZhciBtc2c7XG4gICAgdGhpcy53YXJuKFwiPT09PT0gXCIgKyAoZXJyLnN0YWNrIHx8IGVycikpO1xuICAgIGlmICh0aGlzLnVuYm91bmQgfHwgdGhpcy51bmJpbmRpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbXNnID0gZXJyLnN0YWNrID8gZXJyLnN0YWNrICsgXCJcXG49PT09XCIgOiBlcnI7XG4gICAgcmV0dXJuIHRoaXMuZXJyKG5ldyBFcnJvcihtc2cpKTtcbiAgfTtcblxuICBDbGllbnQucHJvdG90eXBlLm9uUmVtb3RlID0gZnVuY3Rpb24ocmVtb3RlKSB7XG4gICAgdmFyIG1ldGE7XG4gICAgcmVtb3RlID0gdGhpcy53cmFwT2JqZWN0KHJlbW90ZSk7XG4gICAgbWV0YSA9IHJlbW90ZSAhPSBudWxsID8gcmVtb3RlLl9wbm9kZSA6IHZvaWQgMDtcbiAgICBpZiAodHlwZW9mIChtZXRhICE9IG51bGwgPyBtZXRhLnBpbmcgOiB2b2lkIDApICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHJldHVybiB0aGlzLmVycihuZXcgRXJyb3IoXCJJbnZhbGlkIHBub2RlIGhvc3RcIikpO1xuICAgIH1cbiAgICB0aGlzLnJlbW90ZSA9IHJlbW90ZTtcbiAgICB0aGlzLmN0eC5nZXRNZXRhKG1ldGEpO1xuICAgIHRoaXMubG9nKFwic2VydmVyIHJlbW90ZSFcIik7XG4gICAgdGhpcy5lbWl0KCdyZW1vdGUnLCB0aGlzLnJlbW90ZSwgdGhpcyk7XG4gICAgdGhpcy5lbWl0KCd1cCcpO1xuICAgIHJldHVybiB0aGlzLnBpbmcoKTtcbiAgfTtcblxuICBDbGllbnQucHJvdG90eXBlLnBpbmcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIGlmICh0aGlzLnVuYm91bmQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jb3VudC5waW5nKys7XG4gICAgcmV0dXJuIHRoaXMucmVtb3RlLl9wbm9kZS5waW5nKGZ1bmN0aW9uKG9rKSB7XG4gICAgICBpZiAob2sgPT09IHRydWUpIHtcbiAgICAgICAgX3RoaXMuY291bnQucG9uZysrO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF90aGlzLnBpbmcoKTtcbiAgICB9KTtcbiAgfTtcblxuICBDbGllbnQucHJvdG90eXBlLm9uRW5kID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5sb2coXCJzZXJ2ZXIgY2xvc2VkIHJlY29ubmVjdGlvblwiKTtcbiAgICByZXR1cm4gdGhpcy5yZWNvbm5lY3QoKTtcbiAgfTtcblxuICBDbGllbnQucHJvdG90eXBlLnB1Ymxpc2ggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyxcbiAgICAgIF90aGlzID0gdGhpcztcbiAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICB0aGlzLnNlcnZlcihmdW5jdGlvbihyZW1vdGUpIHtcbiAgICAgIHZhciBldmVudDtcbiAgICAgIGV2ZW50ID0gdHlwZW9mIGFyZ3NbMF0gPT09ICdmdW5jdGlvbicgPyBhcmdzWzFdIDogYXJnc1swXTtcbiAgICAgIGlmICghX3RoaXMuY3R4LmV2ZW50c1tldmVudF0pIHtcbiAgICAgICAgX3RoaXMubG9nKFwic2VydmVyIFwiICsgX3RoaXMuY3R4LmlkICsgXCIgaXNudCBzdWJzY3JpYmVkIHRvIFwiICsgZXZlbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBfdGhpcy5sb2coXCJwdWJsaXNoaW5nIGEgXCIgKyBldmVudCk7XG4gICAgICByZXR1cm4gcmVtb3RlLl9wbm9kZS5wdWJsaXNoLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgIH0pO1xuICB9O1xuXG4gIENsaWVudC5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZuKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICBpZiAoZm4pIHtcbiAgICAgIHRoaXMucHVic3ViLm9uKGV2ZW50LCBmbik7XG4gICAgfVxuICAgIGlmICh0aGlzLnB1YnN1Yi5saXN0ZW5lcnMoZXZlbnQpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdGhpcy5zZXJ2ZXIoZnVuY3Rpb24ocmVtb3RlKSB7XG4gICAgICAgIHJldHVybiByZW1vdGUuX3Bub2RlLnN1YnNjcmliZShldmVudCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgQ2xpZW50LnByb3RvdHlwZS5zZXJpYWxpemUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy51cmk7XG4gIH07XG5cbiAgcmV0dXJuIENsaWVudDtcblxufSkoQmFzZSk7XG5cbi8qXG4vL0Agc291cmNlTWFwcGluZ1VSTD1jbGllbnQubWFwXG4qL1xuIiwidmFyIHByb2Nlc3M9cmVxdWlyZShcIl9fYnJvd3NlcmlmeV9wcm9jZXNzXCIpOy8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS42LjNcbnZhciBSZW1vdGVDb250ZXh0LCBTb2NrZXQsIF87XG5cbl8gPSByZXF1aXJlKCcuLi92ZW5kb3IvbG9kYXNoJyk7XG5cblNvY2tldCA9IHJlcXVpcmUoXCJuZXRcIikuU29ja2V0O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbW90ZUNvbnRleHQgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIFJlbW90ZUNvbnRleHQoKSB7XG4gICAgdGhpcy5pZCA9ICcuLi4nO1xuICAgIHRoaXMuZ3VpZCA9ICcuLi4nO1xuICAgIHRoaXMuZGF0YSA9IHt9O1xuICAgIHRoaXMuZXZlbnRzID0ge307XG4gIH1cblxuICBSZW1vdGVDb250ZXh0LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihrKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YVtrXTtcbiAgfTtcblxuICBSZW1vdGVDb250ZXh0LnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihrLCB2KSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YVtrXSA9IHY7XG4gIH07XG5cbiAgUmVtb3RlQ29udGV4dC5wcm90b3R5cGUuY29tYmluZSA9IGZ1bmN0aW9uKGN0eCkge1xuICAgIGlmIChjdHguaWQgIT09IHRoaXMuaWQgfHwgY3R4Lmd1aWQgIT09IHRoaXMuZ3VpZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRhdGEgPSBjdHguZGF0YSA9IF8ubWVyZ2UodGhpcy5kYXRhLCBjdHguZGF0YSk7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRzID0gY3R4LmV2ZW50cyA9IF8ubWVyZ2UodGhpcy5ldmVudHMsIGN0eC5ldmVudHMpO1xuICB9O1xuXG4gIFJlbW90ZUNvbnRleHQucHJvdG90eXBlLmdldEFkZHIgPSBmdW5jdGlvbihzdHJlYW0pIHtcbiAgICB2YXIgc29jaztcbiAgICBpZiAocHJvY2Vzcy5icm93c2VyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChzdHJlYW0gaW5zdGFuY2VvZiBTb2NrZXQpIHtcbiAgICAgIHNvY2sgPSBzdHJlYW07XG4gICAgfSBlbHNlIGlmIChzdHJlYW0uY29ubmVjdGlvbiBpbnN0YW5jZW9mIFNvY2tldCkge1xuICAgICAgc29jayA9IHN0cmVhbS5jb25uZWN0aW9uO1xuICAgIH1cbiAgICBpZiAoc29jaykge1xuICAgICAgdGhpcy5pcCA9IHNvY2sucmVtb3RlQWRkcmVzcztcbiAgICAgIHJldHVybiB0aGlzLnBvcnQgPSBzb2NrLnJlbW90ZVBvcnQ7XG4gICAgfVxuICB9O1xuXG4gIFJlbW90ZUNvbnRleHQucHJvdG90eXBlLmdldE1ldGEgPSBmdW5jdGlvbihtZXRhKSB7XG4gICAgdmFyIGUsIF9pLCBfbGVuLCBfcmVmLCBfcmVzdWx0cztcbiAgICB0aGlzLmlkID0gbWV0YS5pZCwgdGhpcy5ndWlkID0gbWV0YS5ndWlkO1xuICAgIF9yZWYgPSBtZXRhLmV2ZW50cztcbiAgICBfcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgZSA9IF9yZWZbX2ldO1xuICAgICAgX3Jlc3VsdHMucHVzaCh0aGlzLmV2ZW50c1tlXSA9IDEpO1xuICAgIH1cbiAgICByZXR1cm4gX3Jlc3VsdHM7XG4gIH07XG5cbiAgcmV0dXJuIFJlbW90ZUNvbnRleHQ7XG5cbn0pKCk7XG5cbi8qXG4vL0Agc291cmNlTWFwcGluZ1VSTD1jb250ZXh0Lm1hcFxuKi9cbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS42LjNcbnZhciBzZXRGbnM7XG5cbmV4cG9ydHMuaXNSZWFkYWJsZSA9IGZ1bmN0aW9uKHN0cmVhbSkge1xuICByZXR1cm4gc3RyZWFtLnJlYWRhYmxlID09PSB0cnVlIHx8IHR5cGVvZiBzdHJlYW0ucmVhZCA9PT0gJ2Z1bmN0aW9uJztcbn07XG5cbmV4cG9ydHMuaXNXcml0YWJsZSA9IGZ1bmN0aW9uKHN0cmVhbSkge1xuICByZXR1cm4gc3RyZWFtLndyaXRhYmxlID09PSB0cnVlIHx8IHR5cGVvZiBzdHJlYW0ud3JpdGUgPT09ICdmdW5jdGlvbic7XG59O1xuXG5leHBvcnRzLnNlcmlhbGl6ZSA9IGZ1bmN0aW9uKG9iaikge1xuICB2YXIga2V5LCBuZXdvYmosIG87XG4gIGlmIChvYmogaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIHJldHVybiBvYmouZmlsdGVyKGZ1bmN0aW9uKG8pIHtcbiAgICAgIHJldHVybiB0eXBlb2Ygby5zZXJpYWxpemUgPT09ICdmdW5jdGlvbic7XG4gICAgfSkubWFwKGZ1bmN0aW9uKG8pIHtcbiAgICAgIHJldHVybiBvLnNlcmlhbGl6ZSgpO1xuICAgIH0pO1xuICB9XG4gIG5ld29iaiA9IHt9O1xuICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICBvID0gb2JqW2tleV07XG4gICAgaWYgKG8uc2VyaWFsaXplKSB7XG4gICAgICBuZXdvYmpba2V5XSA9IG8uc2VyaWFsaXplKCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBuZXdvYmo7XG59O1xuXG5leHBvcnRzLmNhbGxiYWNrZXIgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICB2YXIgZXhwZWN0aW5nLCByZWNlaXZlZDtcbiAgcmVjZWl2ZWQgPSAwO1xuICBleHBlY3RpbmcgPSAwO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgZXhwZWN0aW5nKys7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmVjZWl2ZWQrKztcbiAgICAgIGlmIChleHBlY3RpbmcgPT09IHJlY2VpdmVkKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfTtcbiAgfTtcbn07XG5cbnNldEZucyA9IHtcbiAgaGFzOiBmdW5jdGlvbihvKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5kZXhPZihvKSAhPT0gLTE7XG4gIH0sXG4gIGFkZDogZnVuY3Rpb24obykge1xuICAgIGlmICh0aGlzLmhhcyhvKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLnB1c2gobyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24obykge1xuICAgIHZhciBpO1xuICAgIGkgPSB0aGlzLmluZGV4T2Yobyk7XG4gICAgaWYgKGkgPT09IC0xKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuc3BsaWNlKGksIDEpO1xuICAgIHJldHVybiB0cnVlO1xuICB9LFxuICBjb3B5OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zbGljZSgpO1xuICB9LFxuICBmaW5kOiBmdW5jdGlvbihmbikge1xuICAgIHZhciBvLCBfaSwgX2xlbjtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHRoaXMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIG8gPSB0aGlzW19pXTtcbiAgICAgIGlmIChmbihvKSkge1xuICAgICAgICByZXR1cm4gbztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG4gIGZpbmRBbGw6IGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIG8sIG9zLCBfaSwgX2xlbjtcbiAgICBvcyA9IFtdO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gdGhpcy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgbyA9IHRoaXNbX2ldO1xuICAgICAgaWYgKGZuKG8pKSB7XG4gICAgICAgIG9zLnB1c2gobyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvcztcbiAgfSxcbiAgZmluZEJ5OiBmdW5jdGlvbihrLCB2KSB7XG4gICAgcmV0dXJuIHRoaXMuZmluZChmdW5jdGlvbihvKSB7XG4gICAgICByZXR1cm4gb1trXSA9PT0gdjtcbiAgICB9KTtcbiAgfSxcbiAgZmluZEFsbEJ5OiBmdW5jdGlvbihrLCB2KSB7XG4gICAgcmV0dXJuIHRoaXMuZmluZEFsbChmdW5jdGlvbihvKSB7XG4gICAgICByZXR1cm4gb1trXSA9PT0gdjtcbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0cy5zZXQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGFyciwgZm4sIG5hbWU7XG4gIGFyciA9IFtdO1xuICBmb3IgKG5hbWUgaW4gc2V0Rm5zKSB7XG4gICAgZm4gPSBzZXRGbnNbbmFtZV07XG4gICAgYXJyW25hbWVdID0gZm47XG4gIH1cbiAgcmV0dXJuIGFycjtcbn07XG5cbi8qXG4vL0Agc291cmNlTWFwcGluZ1VSTD1oZWxwZXIubWFwXG4qL1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjYuM1xudmFyIEJhc2UsIENsaWVudCwgTG9jYWxQZWVyLCBTZXJ2ZXI7XG5cbkJhc2UgPSByZXF1aXJlKCcuL2Jhc2UnKTtcblxuU2VydmVyID0gcmVxdWlyZSgnLi9zZXJ2ZXIvc2VydmVyJyk7XG5cbkNsaWVudCA9IHJlcXVpcmUoJy4vY2xpZW50L2NsaWVudCcpO1xuXG5Mb2NhbFBlZXIgPSByZXF1aXJlKCcuL3BlZXIvbG9jYWwtcGVlcicpO1xuXG50cnkge1xuICByZXF1aXJlKCdzb3VyY2UtbWFwLXN1cHBvcnQnKS5pbnN0YWxsKCk7XG59IGNhdGNoIChfZXJyb3IpIHt9XG5cbmV4cG9ydHMuYWRkVHJhbnNwb3J0ID0gcmVxdWlyZSgnLi90cmFuc3BvcnQtbWdyJykuYWRkO1xuXG5leHBvcnRzLmNsaWVudCA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgcmV0dXJuIG5ldyBDbGllbnQob3B0cyk7XG59O1xuXG5leHBvcnRzLnNlcnZlciA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgcmV0dXJuIG5ldyBTZXJ2ZXIob3B0cyk7XG59O1xuXG5leHBvcnRzLnBlZXIgPSBmdW5jdGlvbihvcHRzKSB7XG4gIHJldHVybiBuZXcgTG9jYWxQZWVyKG9wdHMpO1xufTtcblxuZXhwb3J0cy5pbnN0YWxsID0gZnVuY3Rpb24ocGx1Z2luKSB7XG4gIHZhciBlcnI7XG4gIGVyciA9IGZ1bmN0aW9uKG1zZykge1xuICAgIHJldHVybiBjb25zb2xlLndhcm4oXCJwbm9kZTogQ2Fubm90IGluc3RhbGwgcGx1Z2luOiBcIiArIG1zZyk7XG4gIH07XG4gIGlmICh0eXBlb2YgcGx1Z2luICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBlcnIoXCJtdXN0IGJlIGFuIG9iamVjdFwiKTtcbiAgfVxuICBpZiAodHlwZW9mIHBsdWdpbi5uYW1lICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBlcnIoXCJtdXN0IGhhdmUgYSBzdHJpbmcgJ25hbWUnIHByb3BlcnR5XCIpO1xuICB9XG4gIGlmICh0eXBlb2YgcGx1Z2luLmZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGVycihcIm11c3QgaGF2ZSBhIGZ1bmN0aW9uICdmbicgcHJvcGVydHlcIik7XG4gIH1cbiAgaWYgKEJhc2UucHJvdG90eXBlW3BsdWdpbi5uYW1lXSAhPT0gdm9pZCAwKSB7XG4gICAgcmV0dXJuIGVycihcInByb3BlcnR5ICdcIiArIHBsdWdpbi5uYW1lICsgXCInIGFscmVhZHkgZXhpc3RzIG9uIHRoZSBwcm90b3R5cGVcIik7XG4gIH1cbiAgQmFzZS5wcm90b3R5cGVbcGx1Z2luLm5hbWVdID0gcGx1Z2luLmZuO1xuICByZXR1cm4gdHJ1ZTtcbn07XG5cbmV4cG9ydHMuaGVscGVyID0gcmVxdWlyZSgnLi9oZWxwZXInKTtcblxuLypcbi8vQCBzb3VyY2VNYXBwaW5nVVJMPWluZGV4Lm1hcFxuKi9cbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS42LjNcbnZhciBCYXNlLCBDbGllbnQsIENvbm5lY3Rpb24sIExvY2FsUGVlciwgT2JqZWN0SW5kZXgsIFJlbW90ZVBlZXIsIFNlcnZlciwgaGVscGVyLCBfLFxuICBfX2hhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eSxcbiAgX19leHRlbmRzID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChfX2hhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gIF9fc2xpY2UgPSBbXS5zbGljZTtcblxuXyA9IHJlcXVpcmUoJy4uLy4uL3ZlbmRvci9sb2Rhc2gnKTtcblxuU2VydmVyID0gcmVxdWlyZSgnLi4vc2VydmVyL3NlcnZlcicpO1xuXG5Db25uZWN0aW9uID0gcmVxdWlyZSgnLi4vc2VydmVyL2Nvbm5lY3Rpb24nKTtcblxuQ2xpZW50ID0gcmVxdWlyZSgnLi4vY2xpZW50L2NsaWVudCcpO1xuXG5CYXNlID0gcmVxdWlyZSgnLi4vYmFzZScpO1xuXG5oZWxwZXIgPSByZXF1aXJlKCcuLi9oZWxwZXInKTtcblxuUmVtb3RlUGVlciA9IHJlcXVpcmUoJy4vcmVtb3RlLXBlZXInKTtcblxuT2JqZWN0SW5kZXggPSByZXF1aXJlKCdvYmplY3QtaW5kZXgnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBMb2NhbFBlZXIgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gIF9fZXh0ZW5kcyhMb2NhbFBlZXIsIF9zdXBlcik7XG5cbiAgTG9jYWxQZWVyLnByb3RvdHlwZS5uYW1lID0gJ0xvY2FsUGVlcic7XG5cbiAgTG9jYWxQZWVyLnByb3RvdHlwZS5kZWZhdWx0cyA9IHtcbiAgICBkZWJ1ZzogZmFsc2UsXG4gICAgd2FpdDogMTAwMCxcbiAgICBsZWFybjogZmFsc2VcbiAgfTtcblxuICBmdW5jdGlvbiBMb2NhbFBlZXIoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICBMb2NhbFBlZXIuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgdGhpcy5jb3VudCA9IHtcbiAgICAgIHNlcnZlcjogMCxcbiAgICAgIGNsaWVudDogMFxuICAgIH07XG4gICAgdGhpcy5zZXJ2ZXJzID0ge307XG4gICAgdGhpcy5jbGllbnRzID0ge307XG4gICAgdGhpcy5wZWVycyA9IGhlbHBlci5zZXQoKTtcbiAgICBpZiAodGhpcy5vcHRzLmxlYXJuKSB7XG4gICAgICB0aGlzLmV4cG9zZSh7XG4gICAgICAgIF9wbm9kZToge1xuICAgICAgICAgIHNlcmlhbGl6ZTogdGhpcy5leHBvc2VEeW5hbWljKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLnNlcmlhbGl6ZSgpO1xuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIExvY2FsUGVlci5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmVycm9yKFwiYmluZCgpIGlzIGFtYmlndW91cywgcGxlYXNlIHVzZSBiaW5kT24oKSBhbmQgYmluZFRvKClcIik7XG4gIH07XG5cbiAgTG9jYWxQZWVyLnByb3RvdHlwZS5iaW5kT24gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiwgc2VydmVyLFxuICAgICAgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuY291bnQuc2VydmVyKys7XG4gICAgc2VydmVyID0gbmV3IFNlcnZlcih0aGlzKTtcbiAgICBzZWxmID0gdGhpcztcbiAgICBzZXJ2ZXIub25BbnkoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncywgZTtcbiAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgZSA9IFtdLmNvbmNhdChzZXJ2ZXIuc3ViaWQpLmNvbmNhdCh0aGlzLmV2ZW50KTtcbiAgICAgIGFyZ3MudW5zaGlmdChlKTtcbiAgICAgIHJldHVybiBzZWxmLmVtaXQuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfSk7XG4gICAgc2VydmVyLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGVycikge1xuICAgICAgcmV0dXJuIF90aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICB9KTtcbiAgICBzZXJ2ZXIub24oJ2Nvbm5lY3Rpb24nLCBmdW5jdGlvbihjb25uKSB7XG4gICAgICByZXR1cm4gY29ubi5vbmNlKCdyZW1vdGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIF90aGlzLm9uUGVlcihjb25uKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHNlcnZlci5iaW5kT24uYXBwbHkoc2VydmVyLCBhcmd1bWVudHMpO1xuICAgIHRoaXMuc2VydmVyc1tzZXJ2ZXIuZ3VpZF0gPSBzZXJ2ZXI7XG4gICAgc2VydmVyLm9uY2UoJ3VuYm91bmQnLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkZWxldGUgX3RoaXMuc2VydmVyc1tzZXJ2ZXIuZ3VpZF07XG4gICAgfSk7XG4gIH07XG5cbiAgTG9jYWxQZWVyLnByb3RvdHlwZS5iaW5kVG8gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2xpZW50LCBzZWxmLFxuICAgICAgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuY291bnQuY2xpZW50Kys7XG4gICAgY2xpZW50ID0gbmV3IENsaWVudCh0aGlzKTtcbiAgICBzZWxmID0gdGhpcztcbiAgICBjbGllbnQub25BbnkoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncywgZTtcbiAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgZSA9IFtdLmNvbmNhdChjbGllbnQuc3ViaWQpLmNvbmNhdCh0aGlzLmV2ZW50KTtcbiAgICAgIGFyZ3MudW5zaGlmdChlKTtcbiAgICAgIHJldHVybiBzZWxmLmVtaXQuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfSk7XG4gICAgY2xpZW50Lm9uKCdlcnJvcicsIGZ1bmN0aW9uKGVycikge1xuICAgICAgcmV0dXJuIF90aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICB9KTtcbiAgICBjbGllbnQub24oJ3JlbW90ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIF90aGlzLm9uUGVlcihjbGllbnQpO1xuICAgIH0pO1xuICAgIGNsaWVudC5iaW5kVG8uYXBwbHkoY2xpZW50LCBhcmd1bWVudHMpO1xuICAgIHRoaXMuY2xpZW50c1tjbGllbnQuZ3VpZF0gPSBjbGllbnQ7XG4gICAgY2xpZW50Lm9uY2UoJ3VuYm91bmQnLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkZWxldGUgX3RoaXMuY2xpZW50c1tjbGllbnQuZ3VpZF07XG4gICAgfSk7XG4gIH07XG5cbiAgTG9jYWxQZWVyLnByb3RvdHlwZS51bmJpbmQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHZhciBjbGllbnQsIGd1aWQsIG1rQ2IsIHNlcnZlciwgX3JlZiwgX3JlZjEsXG4gICAgICBfdGhpcyA9IHRoaXM7XG4gICAgbWtDYiA9IGhlbHBlci5jYWxsYmFja2VyKGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3RoaXMuZW1pdCgndW5ib3VuZC1hbGwnKTtcbiAgICB9KTtcbiAgICBfcmVmID0gdGhpcy5jbGllbnRzO1xuICAgIGZvciAoZ3VpZCBpbiBfcmVmKSB7XG4gICAgICBjbGllbnQgPSBfcmVmW2d1aWRdO1xuICAgICAgY2xpZW50LnVuYmluZChta0NiKCkpO1xuICAgIH1cbiAgICBfcmVmMSA9IHRoaXMuc2VydmVycztcbiAgICBmb3IgKGd1aWQgaW4gX3JlZjEpIHtcbiAgICAgIHNlcnZlciA9IF9yZWYxW2d1aWRdO1xuICAgICAgc2VydmVyLnVuYmluZChta0NiKCkpO1xuICAgIH1cbiAgfTtcblxuICBMb2NhbFBlZXIucHJvdG90eXBlLm9uUGVlciA9IGZ1bmN0aW9uKGNsaWNvbm4pIHtcbiAgICB2YXIgZ3VpZCwgaWQsIGlwcywgcGVlciwgcmVtb3RlLCBfcmVmLFxuICAgICAgX3RoaXMgPSB0aGlzO1xuICAgIGlmICghKGNsaWNvbm4gaW5zdGFuY2VvZiBDbGllbnQgfHwgY2xpY29ubiBpbnN0YW5jZW9mIENvbm5lY3Rpb24pKSB7XG4gICAgICByZXR1cm4gdGhpcy5sb2coXCJtdXN0IGJlIGNsaWVudCBvciBjb25uXCIpO1xuICAgIH1cbiAgICByZW1vdGUgPSBjbGljb25uLnJlbW90ZTtcbiAgICBpZiAoIXJlbW90ZSkge1xuICAgICAgcmV0dXJuIHRoaXMubG9nKCdwZWVyIG1pc3NpbmcgcmVtb3RlJyk7XG4gICAgfVxuICAgIF9yZWYgPSByZW1vdGUuX3Bub2RlLCBndWlkID0gX3JlZi5ndWlkLCBpZCA9IF9yZWYuaWQsIGlwcyA9IF9yZWYuaXBzO1xuICAgIGlmICghZ3VpZCkge1xuICAgICAgcmV0dXJuIHRoaXMubG9nKCdwZWVyIG1pc3NpbmcgZ3VpZCcpO1xuICAgIH1cbiAgICBwZWVyID0gdGhpcy5wZWVycy5maW5kQnkoJ2d1aWQnLCBndWlkKTtcbiAgICBpZiAoIXBlZXIpIHtcbiAgICAgIHBlZXIgPSBuZXcgUmVtb3RlUGVlcih0aGlzLCBndWlkLCBpZCwgaXBzKTtcbiAgICAgIHRoaXMucGVlcnMuYWRkKHBlZXIpO1xuICAgICAgcGVlci5vbigndXAnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMuZW1pdCgncGVlcicsIHBlZXIpO1xuICAgICAgICByZXR1cm4gX3RoaXMuZW1pdCgncmVtb3RlJywgcGVlci5yZW1vdGUpO1xuICAgICAgfSk7XG4gICAgICBwZWVyLm9uKCdkb3duJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBfdGhpcy5sb2coXCJsb3N0IHBlZXIgJXNcIiwgaWQpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHBlZXIuYWRkKGNsaWNvbm4pO1xuICB9O1xuXG4gIExvY2FsUGVlci5wcm90b3R5cGUuc2VyaWFsaXplID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNlcnZlcnM6IGhlbHBlci5zZXJpYWxpemUodGhpcy5zZXJ2ZXJzKSxcbiAgICAgIHBlZXJzOiBoZWxwZXIuc2VyaWFsaXplKHRoaXMucGVlcnMpXG4gICAgfTtcbiAgfTtcblxuICBMb2NhbFBlZXIucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgdmFyIHBlZXIsIHJlbXMsIF9pLCBfbGVuLCBfcmVmO1xuICAgIHJlbXMgPSBbXTtcbiAgICBfcmVmID0gdGhpcy5wZWVycztcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIHBlZXIgPSBfcmVmW19pXTtcbiAgICAgIGlmIChwZWVyLnVwKSB7XG4gICAgICAgIHJlbXMucHVzaChwZWVyLnJlbW90ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjYWxsYmFjayhyZW1zKTtcbiAgfTtcblxuICBMb2NhbFBlZXIucHJvdG90eXBlLnBlZXIgPSBmdW5jdGlvbihpZCwgY2FsbGJhY2spIHtcbiAgICB2YXIgY2hlY2ssIGdldCwgdCxcbiAgICAgIF90aGlzID0gdGhpcztcbiAgICBnZXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBwZWVyO1xuICAgICAgcGVlciA9IF90aGlzLnBlZXJzLmZpbmRCeSgnaWQnLCBpZCkgfHwgX3RoaXMucGVlcnMuZmluZEJ5KCdndWlkJywgaWQpO1xuICAgICAgaWYgKCEocGVlciAhPSBudWxsID8gcGVlci51cCA6IHZvaWQgMCkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgX3RoaXMubG9nKFwiRk9VTkQgUEVFUjogXCIgKyBpZCk7XG4gICAgICBjYWxsYmFjayhwZWVyLnJlbW90ZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIGlmIChnZXQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5sb2coXCJDSEVDSyBQRUVSOiBcIiArIGlkKTtcbiAgICAgIGlmICghZ2V0KCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5vZmYoJ3BlZXInLCBjaGVjayk7XG4gICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KHQpO1xuICAgIH07XG4gICAgdCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5vZmYoJ3BlZXInLCBjaGVjayk7XG4gICAgICByZXR1cm4gX3RoaXMuZW1pdCgnd2FpdG91dCcsIGlkKTtcbiAgICB9LCB0aGlzLm9wdHMud2FpdCk7XG4gICAgcmV0dXJuIHRoaXMub24oJ3BlZXInLCBjaGVjayk7XG4gIH07XG5cbiAgTG9jYWxQZWVyLnByb3RvdHlwZS5wdWJsaXNoID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHBlZXIsIF9pLCBfbGVuLCBfcmVmO1xuICAgIF9yZWYgPSB0aGlzLnBlZXJzO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgcGVlciA9IF9yZWZbX2ldO1xuICAgICAgaWYgKHBlZXIudXApIHtcbiAgICAgICAgcGVlci5wdWJsaXNoLmFwcGx5KHBlZXIsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIExvY2FsUGVlci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZuKSB7XG4gICAgdmFyIHBlZXIsIF9pLCBfbGVuLCBfcmVmO1xuICAgIHRoaXMucHVic3ViLm9uKGV2ZW50LCBmbik7XG4gICAgaWYgKHRoaXMucHVic3ViLmxpc3RlbmVycyhldmVudCkubGVuZ3RoID09PSAxKSB7XG4gICAgICBfcmVmID0gdGhpcy5wZWVycztcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBwZWVyID0gX3JlZltfaV07XG4gICAgICAgIGlmICh0eXBlb2YgcGVlci5zdWJzY3JpYmUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIHBlZXIuc3Vic2NyaWJlKGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBMb2NhbFBlZXIucHJvdG90eXBlLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZuKSB7XG4gICAgcmV0dXJuIHRoaXMucHVic3ViLm9mZihldmVudCwgZm4pO1xuICB9O1xuXG4gIHJldHVybiBMb2NhbFBlZXI7XG5cbn0pKEJhc2UpO1xuXG4vKlxuLy9AIHNvdXJjZU1hcHBpbmdVUkw9bG9jYWwtcGVlci5tYXBcbiovXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuNi4zXG52YXIgQmFzZSwgUmVtb3RlQ29udGV4dCwgUmVtb3RlUGVlciwgaGVscGVyLFxuICBfX2hhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eSxcbiAgX19leHRlbmRzID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChfX2hhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH07XG5cbkJhc2UgPSByZXF1aXJlKCcuLi9iYXNlJyk7XG5cblJlbW90ZUNvbnRleHQgPSByZXF1aXJlKCcuLi9jb250ZXh0Jyk7XG5cbmhlbHBlciA9IHJlcXVpcmUoJy4uL2hlbHBlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbW90ZVBlZXIgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gIF9fZXh0ZW5kcyhSZW1vdGVQZWVyLCBfc3VwZXIpO1xuXG4gIFJlbW90ZVBlZXIucHJvdG90eXBlLm5hbWUgPSAnUmVtb3RlUGVlcic7XG5cbiAgZnVuY3Rpb24gUmVtb3RlUGVlcihsb2NhbCwgZ3VpZCwgaWQsIGlwcykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy5sb2NhbCA9IGxvY2FsO1xuICAgIHRoaXMuZ3VpZCA9IGd1aWQ7XG4gICAgdGhpcy5pZCA9IGlkO1xuICAgIHRoaXMuaXBzID0gaXBzO1xuICAgIHRoaXMub3B0cyA9IHRoaXMubG9jYWwub3B0cztcbiAgICB0aGlzLmNsaWNvbm5zID0gW107XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICd1cmknLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgX3JlZjtcbiAgICAgICAgcmV0dXJuIChfcmVmID0gX3RoaXMuY2xpY29ubnNbMF0pICE9IG51bGwgPyBfcmVmLnVyaSA6IHZvaWQgMDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLmNvbm5lY3RpbmcgPSBmYWxzZTtcbiAgICB0aGlzLmN0eCA9IG5ldyBSZW1vdGVDb250ZXh0O1xuICAgIHRoaXMuY3R4LmlkID0gaWQ7XG4gICAgdGhpcy5jdHguZ3VpZCA9IGd1aWQ7XG4gICAgdGhpcy5pc1VwKGZhbHNlKTtcbiAgfVxuXG4gIFJlbW90ZVBlZXIucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGNsaWNvbm4pIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuY3R4LmNvbWJpbmUoY2xpY29ubi5jdHgpO1xuICAgIHRoaXMuY2xpY29ubnMucHVzaChjbGljb25uKTtcbiAgICBjbGljb25uLm9uY2UoJ2Rvd24nLCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLmxvZyhcIkxPU1QgQ09OTkVDVElPTiAoXCIgKyBfdGhpcy51cmkgKyBcIilcIik7XG4gICAgICBfdGhpcy5jbGljb25ucy5zcGxpY2UoX3RoaXMuY2xpY29ubnMuaW5kZXhPZihjbGljb25uKSwgMSk7XG4gICAgICByZXR1cm4gX3RoaXMuc2V0QWN0aXZlKCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXMuc2V0QWN0aXZlKCk7XG4gIH07XG5cbiAgUmVtb3RlUGVlci5wcm90b3R5cGUuc2V0QWN0aXZlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGM7XG4gICAgYyA9IHRoaXMuY2xpY29ubnNbMF07XG4gICAgdGhpcy5yZW1vdGUgPSBjID8gYy5yZW1vdGUgOiBudWxsO1xuICAgIHRoaXMucHVibGlzaCA9IGMgPyBjLnB1Ymxpc2guYmluZChjKSA6IG51bGw7XG4gICAgdGhpcy5zdWJzY3JpYmUgPSBjID8gYy5zdWJzY3JpYmUuYmluZChjKSA6IG51bGw7XG4gICAgcmV0dXJuIHRoaXMuaXNVcCghIXRoaXMucmVtb3RlKTtcbiAgfTtcblxuICBSZW1vdGVQZWVyLnByb3RvdHlwZS5pc1VwID0gZnVuY3Rpb24odXApIHtcbiAgICBpZiAodGhpcy51cCA9PT0gdXApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHVwKSB7XG4gICAgICB0aGlzLnVwID0gdHJ1ZTtcbiAgICAgIHRoaXMuZW1pdCgndXAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy51cCA9IGZhbHNlO1xuICAgICAgdGhpcy5yZW1vdGUgPSBudWxsO1xuICAgICAgdGhpcy5lbWl0KCdkb3duJyk7XG4gICAgfVxuICAgIHRoaXMubG9nKFwiXCIgKyAodGhpcy51cCA/ICdVUCcgOiAnRE9XTicpICsgXCIgKCNjb25uczpcIiArIHRoaXMuY2xpY29ubnMubGVuZ3RoICsgXCIpXCIpO1xuICB9O1xuXG4gIFJlbW90ZVBlZXIucHJvdG90eXBlLnNlcmlhbGl6ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIGd1aWQ6IHRoaXMuZ3VpZCxcbiAgICAgIGlwczogdGhpcy5pcHMsXG4gICAgICBjbGllbnRzOiBoZWxwZXIuc2VyaWFsaXplKHRoaXMuY2xpZW50cylcbiAgICB9O1xuICB9O1xuXG4gIFJlbW90ZVBlZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIFwiXCIgKyB0aGlzLm5hbWUgKyBcIjogXCIgKyB0aGlzLmxvY2FsLmlkICsgXCI6IFwiICsgdGhpcy5pZCArIFwiOlwiO1xuICB9O1xuXG4gIHJldHVybiBSZW1vdGVQZWVyO1xuXG59KShCYXNlLkxvZ2dlcik7XG5cbi8qXG4vL0Agc291cmNlTWFwcGluZ1VSTD1yZW1vdGUtcGVlci5tYXBcbiovXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuNi4zXG52YXIgQmFzZSwgQ29ubmVjdGlvbiwgT2JqZWN0SW5kZXgsIFJlbW90ZUNvbnRleHQsIGRub2RlLCBoZWxwZXIsIHNlcnZlcnMsXG4gIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5LFxuICBfX2V4dGVuZHMgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKF9faGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfTtcblxuZG5vZGUgPSByZXF1aXJlKCdkbm9kZScpO1xuXG5CYXNlID0gcmVxdWlyZSgnLi4vYmFzZScpO1xuXG5oZWxwZXIgPSByZXF1aXJlKCcuLi9oZWxwZXInKTtcblxuUmVtb3RlQ29udGV4dCA9IHJlcXVpcmUoJy4uL2NvbnRleHQnKTtcblxuT2JqZWN0SW5kZXggPSByZXF1aXJlKCdvYmplY3QtaW5kZXgnKTtcblxuc2VydmVycyA9IFtdO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbm5lY3Rpb24gPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gIF9fZXh0ZW5kcyhDb25uZWN0aW9uLCBfc3VwZXIpO1xuXG4gIENvbm5lY3Rpb24ucHJvdG90eXBlLm5hbWUgPSAnQ29ubmVjdGlvbic7XG5cbiAgZnVuY3Rpb24gQ29ubmVjdGlvbihzZXJ2ZXIsIHJlYWQsIHdyaXRlKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzLnNlcnZlciA9IHNlcnZlcjtcbiAgICB0aGlzLm9wdHMgPSB0aGlzLnNlcnZlci5vcHRzO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAndXJpJywge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIF90aGlzLnNlcnZlci51cmk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5hY2NlcHRlZCA9IGZhbHNlO1xuICAgIHRoaXMuaWQgPSB0aGlzLmd1aWQgPSBcIi4uLlwiO1xuICAgIHRoaXMuc3VicyA9IHt9O1xuICAgIHRoaXMuY3R4ID0gbmV3IFJlbW90ZUNvbnRleHQ7XG4gICAgdGhpcy5jdHguZ2V0QWRkcihyZWFkKTtcbiAgICB0aGlzLmQgPSBkbm9kZSh0aGlzLnNlcnZlci53cmFwT2JqZWN0KHRoaXMuc2VydmVyLmV4cG9zZWQsIHRoaXMuY3R4KSk7XG4gICAgdGhpcy5kLm9uKCdlcnJvcicsIHRoaXMub25FcnJvci5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmQub24oJ2ZhaWwnLCB0aGlzLm9uRmFpbC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmQub25jZSgncmVtb3RlJywgdGhpcy5vblJlbW90ZS5iaW5kKHRoaXMpKTtcbiAgICByZWFkLm9uY2UoJ2Nsb3NlJywgdGhpcy5kLmVuZCk7XG4gICAgcmVhZC5vbmNlKCdlbmQnLCB0aGlzLmQuZW5kKTtcbiAgICBpZiAocmVhZCAhPT0gd3JpdGUpIHtcbiAgICAgIHdyaXRlLm9uY2UoJ2Nsb3NlJywgdGhpcy5kLmVuZCk7XG4gICAgICB3cml0ZS5vbmNlKCdlbmQnLCB0aGlzLmQuZW5kKTtcbiAgICB9XG4gICAgdGhpcy5kLm9uY2UoJ2VuZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIF90aGlzLmVtaXQoJ2Rvd24nKTtcbiAgICB9KTtcbiAgICByZWFkLnBpcGUodGhpcy5kKS5waXBlKHdyaXRlKTtcbiAgfVxuXG4gIENvbm5lY3Rpb24ucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uKGNiKSB7XG4gICAgaWYgKGNiKSB7XG4gICAgICB0aGlzLmQub25jZSgnZW5kJywgY2IpO1xuICAgIH1cbiAgICB0aGlzLmQuZW5kKCk7XG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gIH07XG5cbiAgQ29ubmVjdGlvbi5wcm90b3R5cGUub25SZW1vdGUgPSBmdW5jdGlvbihyZW1vdGUpIHtcbiAgICB2YXIgbWV0YTtcbiAgICByZW1vdGUgPSB0aGlzLnNlcnZlci53cmFwT2JqZWN0KHJlbW90ZSk7XG4gICAgbWV0YSA9IHJlbW90ZS5fcG5vZGU7XG4gICAgaWYgKCFtZXRhKSB7XG4gICAgICB0aGlzLndhcm4oXCJJbnZhbGlkIHBub2RlIGNvbm5lY3Rpb25cIik7XG4gICAgICBkLmVuZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmlkID0gbWV0YS5pZCwgdGhpcy5ndWlkID0gbWV0YS5ndWlkO1xuICAgIHRoaXMuY3R4LmdldE1ldGEobWV0YSk7XG4gICAgdGhpcy5yZW1vdGUgPSByZW1vdGU7XG4gICAgdGhpcy5lbWl0KCdyZW1vdGUnLCByZW1vdGUpO1xuICAgIHRoaXMuZW1pdCgndXAnKTtcbiAgfTtcblxuICBDb25uZWN0aW9uLnByb3RvdHlwZS5vbkVycm9yID0gZnVuY3Rpb24oZXJyKSB7XG4gICAgdGhpcy53YXJuKFwiZG5vZGUgZXJyb3I6IFwiICsgZXJyKTtcbiAgICByZXR1cm4gdGhpcy5lbWl0KCdlcnJvcicsIGVycik7XG4gIH07XG5cbiAgQ29ubmVjdGlvbi5wcm90b3R5cGUub25GYWlsID0gZnVuY3Rpb24oZXJyKSB7XG4gICAgdGhpcy53YXJuKFwiZG5vZGUgZmFpbDogXCIgKyBlcnIpO1xuICAgIHJldHVybiB0aGlzLmVtaXQoJ2ZhaWwnLCBlcnIpO1xuICB9O1xuXG4gIENvbm5lY3Rpb24ucHJvdG90eXBlLnB1Ymxpc2ggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncztcbiAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgIGlmICghdGhpcy5jdHguZXZlbnRzW2FyZ3NbMF1dKSB7XG4gICAgICB0aGlzLmxvZyhcIm5vdCBzdWJzY3JpYmVkIHRvIGV2ZW50OiBcIiArIGFyZ3NbMF0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5yZW1vdGUuX3Bub2RlLnB1Ymxpc2guYXBwbHkobnVsbCwgYXJncyk7XG4gIH07XG5cbiAgQ29ubmVjdGlvbi5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXZlbnQsIGZuKSB7XG4gICAgcmV0dXJuIHRoaXMucmVtb3RlLl9wbm9kZS5zdWJzY3JpYmUoZXZlbnQpO1xuICB9O1xuXG4gIENvbm5lY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIFwiXCIgKyB0aGlzLm5hbWUgKyBcIjogXCIgKyB0aGlzLnNlcnZlci5pZCArIFwiIC0+IFwiICsgdGhpcy5pZCArIFwiOlwiO1xuICB9O1xuXG4gIHJldHVybiBDb25uZWN0aW9uO1xuXG59KShCYXNlLkxvZ2dlcik7XG5cbi8qXG4vL0Agc291cmNlTWFwcGluZ1VSTD1jb25uZWN0aW9uLm1hcFxuKi9cbiIsInZhciBwcm9jZXNzPXJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKTsvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuNi4zXG52YXIgQmFzZSwgQ29ubmVjdGlvbiwgT2JqZWN0SW5kZXgsIFNlcnZlciwgZG5vZGUsIGhlbHBlciwgc2VydmVycyxcbiAgX19oYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHksXG4gIF9fZXh0ZW5kcyA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoX19oYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9O1xuXG5kbm9kZSA9IHJlcXVpcmUoJ2Rub2RlJyk7XG5cbkJhc2UgPSByZXF1aXJlKCcuLi9iYXNlJyk7XG5cbmhlbHBlciA9IHJlcXVpcmUoJy4uL2hlbHBlcicpO1xuXG5PYmplY3RJbmRleCA9IHJlcXVpcmUoJ29iamVjdC1pbmRleCcpO1xuXG5Db25uZWN0aW9uID0gcmVxdWlyZSgnLi9jb25uZWN0aW9uJyk7XG5cbnNlcnZlcnMgPSBbXTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZXJ2ZXIgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gIF9fZXh0ZW5kcyhTZXJ2ZXIsIF9zdXBlcik7XG5cbiAgU2VydmVyLnByb3RvdHlwZS5uYW1lID0gJ1NlcnZlcic7XG5cbiAgU2VydmVyLnByb3RvdHlwZS5kZWZhdWx0cyA9IHtcbiAgICBkZWJ1ZzogZmFsc2UsXG4gICAgd2FpdDogNTAwMCxcbiAgICB0aW1lb3V0OiA1MDAwXG4gIH07XG5cbiAgZnVuY3Rpb24gU2VydmVyKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgc2VydmVycy5wdXNoKHRoaXMpO1xuICAgIFNlcnZlci5fX3N1cGVyX18uY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB0aGlzLmNvbm5lY3Rpb25zID0gaGVscGVyLnNldCgpO1xuICAgIHRoaXMuYmluZE9uID0gdGhpcy5iaW5kO1xuICAgIHRoaXMub24oJ3VuYmluZGluZycsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGNvbm4sIF9pLCBfbGVuLCBfcmVmO1xuICAgICAgX3JlZiA9IF90aGlzLmNvbm5lY3Rpb25zLmNvcHkoKTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBjb25uID0gX3JlZltfaV07XG4gICAgICAgIGNvbm4udW5iaW5kKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5vbigndXJpJywgZnVuY3Rpb24odXJpKSB7XG4gICAgICBfdGhpcy51cmkgPSB1cmk7XG4gICAgfSk7XG4gICAgdGhpcy5vbignc3RyZWFtJywgdGhpcy5oYW5kbGUpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIFNlcnZlci5wcm90b3R5cGUuaGFuZGxlID0gZnVuY3Rpb24ocmVhZCwgd3JpdGUpIHtcbiAgICB2YXIgY29ubixcbiAgICAgIF90aGlzID0gdGhpcztcbiAgICBpZiAocmVhZC53cml0ZSAmJiAhKHdyaXRlICE9IG51bGwgPyB3cml0ZS53cml0ZSA6IHZvaWQgMCkpIHtcbiAgICAgIHdyaXRlID0gcmVhZDtcbiAgICB9XG4gICAgaWYgKCFoZWxwZXIuaXNSZWFkYWJsZShyZWFkKSkge1xuICAgICAgdGhpcy5lcnIobmV3IEVycm9yKFwiSW52YWxpZCByZWFkIHN0cmVhbVwiKSk7XG4gICAgfVxuICAgIGlmICghaGVscGVyLmlzV3JpdGFibGUod3JpdGUpKSB7XG4gICAgICB0aGlzLmVycihuZXcgRXJyb3IoXCJJbnZhbGlkIHdyaXRlIHN0cmVhbVwiKSk7XG4gICAgfVxuICAgIGNvbm4gPSBuZXcgQ29ubmVjdGlvbih0aGlzLCByZWFkLCB3cml0ZSk7XG4gICAgY29ubi5vbignZXJyb3InLCB0aGlzLm9uRXJyb3IpO1xuICAgIGNvbm4ub24oJ2ZhaWwnLCB0aGlzLm9uRmFpbCk7XG4gICAgY29ubi5vbmNlKCd1cCcsIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMubG9nKFwiQ09OTiBVUCBcIiArIGNvbm4uaWQpO1xuICAgICAgaWYgKF90aGlzLmNvbm5lY3Rpb25zLmZpbmRBbGxCeSgnaWQnLCBjb25uLmlkKS5sZW5ndGggPj0gMiB8fCBfdGhpcy5jb25uZWN0aW9ucy5maW5kQWxsQnkoJ2d1aWQnLCBjb25uLmd1aWQpLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgIF90aGlzLndhcm4oXCJyZWplY3RlZCBkdXBsaWNhdGUgY29ubiB3aXRoIGlkIFwiICsgY29ubi5pZCArIFwiIChcIiArIGNvbm4uZ3VpZCArIFwiKVwiKTtcbiAgICAgICAgY29ubi51bmJpbmQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29ubi5hY2NlcHRlZCA9IHRydWU7XG4gICAgICBfdGhpcy5lbWl0KCdyZW1vdGUnLCBjb25uLnJlbW90ZSk7XG4gICAgfSk7XG4gICAgY29ubi5vbmNlKCdkb3duJywgZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5sb2coXCJDT05OIERPV04gXCIgKyBjb25uLmlkKTtcbiAgICAgIGlmIChfdGhpcy5jb25uZWN0aW9ucy5yZW1vdmUoY29ubikpIHtcbiAgICAgICAgX3RoaXMuZW1pdCgnZGlzY29ubmVjdGlvbicsIGNvbm4pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuY29ubmVjdGlvbnMuYWRkKGNvbm4pO1xuICAgIHRoaXMuZW1pdCgnY29ubmVjdGlvbicsIGNvbm4sIHRoaXMpO1xuICB9O1xuXG4gIFNlcnZlci5wcm90b3R5cGUub25FcnJvciA9IGZ1bmN0aW9uKGVycikge1xuICAgIHJldHVybiB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgfTtcblxuICBTZXJ2ZXIucHJvdG90eXBlLm9uRmFpbCA9IGZ1bmN0aW9uKGVycikge1xuICAgIHJldHVybiB0aGlzLmVtaXQoJ2ZhaWwnLCBlcnIpO1xuICB9O1xuXG4gIFNlcnZlci5wcm90b3R5cGUuY2xpZW50ID0gZnVuY3Rpb24oaWQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGNoZWNrLCBnZXQsIHQsXG4gICAgICBfdGhpcyA9IHRoaXM7XG4gICAgZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY29ubjtcbiAgICAgIGNvbm4gPSBfdGhpcy5jb25uZWN0aW9ucy5maW5kQnkoJ2lkJywgaWQpIHx8IF90aGlzLmNvbm5lY3Rpb25zLmZpbmRCeSgnZ3VpZCcsIGlkKTtcbiAgICAgIGlmICghY29ubikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBjYWxsYmFjayhjb25uLnJlbW90ZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIGlmIChnZXQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCFnZXQoKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLm9mZigncmVtb3RlJywgY2hlY2spO1xuICAgICAgcmV0dXJuIGNsZWFyVGltZW91dCh0KTtcbiAgICB9O1xuICAgIHQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMub2ZmKCdyZW1vdGUnLCBjaGVjayk7XG4gICAgICByZXR1cm4gX3RoaXMuZW1pdCgnd2FpdG91dCcsIGlkKTtcbiAgICB9LCB0aGlzLm9wdHMud2FpdCk7XG4gICAgdGhpcy5vbigncmVtb3RlJywgY2hlY2spO1xuICB9O1xuXG4gIFNlcnZlci5wcm90b3R5cGUuYWxsID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB2YXIgY29ubiwgcmVtcywgX2ksIF9sZW4sIF9yZWY7XG4gICAgcmVtcyA9IFtdO1xuICAgIF9yZWYgPSB0aGlzLmNvbm5lY3Rpb25zO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgY29ubiA9IF9yZWZbX2ldO1xuICAgICAgcmVtcy5wdXNoKGNvbm4ucmVtb3RlKTtcbiAgICB9XG4gICAgcmV0dXJuIGNhbGxiYWNrKHJlbXMpO1xuICB9O1xuXG4gIFNlcnZlci5wcm90b3R5cGUucHVibGlzaCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzLCBjb25uLCBfaSwgX2xlbiwgX3JlZjtcbiAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgIF9yZWYgPSB0aGlzLmNvbm5lY3Rpb25zO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgY29ubiA9IF9yZWZbX2ldO1xuICAgICAgY29ubi5wdWJsaXNoLmFwcGx5KGNvbm4sIGFyZ3MpO1xuICAgIH1cbiAgfTtcblxuICBTZXJ2ZXIucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uKGV2ZW50LCBmbikge1xuICAgIHZhciBjb25uLCBfaSwgX2xlbiwgX3JlZjtcbiAgICB0aGlzLnB1YnN1Yi5vbihldmVudCwgZm4pO1xuICAgIGlmICh0aGlzLnB1YnN1Yi5saXN0ZW5lcnMoZXZlbnQpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgX3JlZiA9IHRoaXMuY29ubmVjdGlvbnM7XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgY29ubiA9IF9yZWZbX2ldO1xuICAgICAgICBjb25uLnN1YnNjcmliZShldmVudCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIFNlcnZlci5wcm90b3R5cGUuc2VyaWFsaXplID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMudXJpO1xuICB9O1xuXG4gIHJldHVybiBTZXJ2ZXI7XG5cbn0pKEJhc2UpO1xuXG5pZiAodHlwZW9mIHByb2Nlc3Mub24gPT09IFwiZnVuY3Rpb25cIikge1xuICBwcm9jZXNzLm9uKCdleGl0JywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlcnZlciwgX2ksIF9sZW4sIF9yZXN1bHRzO1xuICAgIF9yZXN1bHRzID0gW107XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBzZXJ2ZXJzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBzZXJ2ZXIgPSBzZXJ2ZXJzW19pXTtcbiAgICAgIF9yZXN1bHRzLnB1c2goc2VydmVyLnVuYmluZCgpKTtcbiAgICB9XG4gICAgcmV0dXJuIF9yZXN1bHRzO1xuICB9KTtcbn1cblxuaWYgKHR5cGVvZiBwcm9jZXNzLm9uID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgcHJvY2Vzcy5vbignU0lHSU5UJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHByb2Nlc3MuZXhpdCgpO1xuICB9KTtcbn1cblxuLypcbi8vQCBzb3VyY2VNYXBwaW5nVVJMPXNlcnZlci5tYXBcbiovXG4iLCJ2YXIgcHJvY2Vzcz1yZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIiksX19kaXJuYW1lPVwiLy4uLy4uL291dC90cmFuc3BvcnQtbWdyXCI7Ly8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjYuM1xudmFyIGZpbGVzLCBmcywgaGVscGVyLCBwYXJzZSwgcGF0aCwgcmUsIHRyYW5zcG9ydHM7XG5cbmZzID0gcmVxdWlyZSgnZnMnKTtcblxucGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuaGVscGVyID0gcmVxdWlyZSgnLi4vaGVscGVyJyk7XG5cbnJlID0gL14oW2Etel0rKTpcXC9cXC8vO1xuXG50cmFuc3BvcnRzID0ge307XG5cbnBhcnNlID0gZnVuY3Rpb24oc3RyKSB7XG4gIHZhciBhcmdzLCBob3N0bmFtZSwgcG9ydDtcbiAgYXJncyA9IFtdO1xuICBpZiAodHlwZW9mIHN0ciA9PT0gJ3N0cmluZycgJiYgL14oLis/KSg6KFxcZCspKT8kLy50ZXN0KHN0cikpIHtcbiAgICBob3N0bmFtZSA9IFJlZ0V4cC4kMTtcbiAgICBwb3J0ID0gcGFyc2VJbnQoUmVnRXhwLiQzLCAxMCk7XG4gICAgaWYgKHBvcnQpIHtcbiAgICAgIGFyZ3MucHVzaChwb3J0KTtcbiAgICB9XG4gICAgYXJncy5wdXNoKGhvc3RuYW1lKTtcbiAgfVxuICByZXR1cm4gYXJncztcbn07XG5cbmV4cG9ydHMuZ2V0ID0gZnVuY3Rpb24oYXJncykge1xuICB2YXIgbmFtZSwgcGFyc2VGbiwgcGFyc2VkLCB0cmFucywgdHJhbnNwb3J0LCB1cmk7XG4gIHRyYW5zcG9ydCA9IGFyZ3Muc2hpZnQoKTtcbiAgaWYgKHR5cGVvZiB0cmFuc3BvcnQgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCB0cmFuc3BvcnQgbmFtZVwiKTtcbiAgfVxuICBpZiAocmUudGVzdCh0cmFuc3BvcnQpKSB7XG4gICAgbmFtZSA9IFJlZ0V4cC4kMTtcbiAgICB0cmFucyA9IHRyYW5zcG9ydHNbbmFtZV07XG4gICAgdXJpID0gdHJhbnNwb3J0LnJlcGxhY2UocmUsICcnKTtcbiAgfSBlbHNlIHtcbiAgICBuYW1lID0gdHJhbnNwb3J0O1xuICAgIHRyYW5zID0gdHJhbnNwb3J0c1tuYW1lXTtcbiAgfVxuICBpZiAoIXRyYW5zKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiJ1wiICsgbmFtZSArIFwiJyBub3QgZm91bmRcIik7XG4gIH1cbiAgcGFyc2VGbiA9IHRyYW5zLnBhcnNlIHx8IHBhcnNlO1xuICBwYXJzZWQgPSBwYXJzZUZuKHVyaSk7XG4gIHdoaWxlIChwYXJzZWQgJiYgcGFyc2VkLmxlbmd0aCkge1xuICAgIGFyZ3MudW5zaGlmdChwYXJzZWQucG9wKCkpO1xuICB9XG4gIHJldHVybiB0cmFucztcbn07XG5cbmV4cG9ydHMuYWRkID0gZnVuY3Rpb24obmFtZSwgb2JqKSB7XG4gIGlmICh0eXBlb2Ygb2JqLmJpbmRTZXJ2ZXIgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIG9iai5iaW5kQ2xpZW50ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgXCJUcmFuc3BvcnQgJ1wiICsgbmFtZSArIFwiJyBjYW5ub3QgYmUgYWRkZWQsIGJpbmQgbWV0aG9kcyBhcmUgbWlzc2luZ1wiO1xuICB9XG4gIGlmICgvW15hLXpdLy50ZXN0KG5hbWUpKSB7XG4gICAgdGhyb3cgXCJUcmFuc3BvcnQgbmFtZSBtdXN0IGJlIGxvd2VyY2FzZSBsZXR0ZXJzIG9ubHlcIjtcbiAgfVxuICBpZiAodHJhbnNwb3J0c1tuYW1lXSkge1xuICAgIHRocm93IFwiVHJhbnNwb3J0ICdcIiArIG5hbWUgKyBcIicgYWxyZWFkeSBleGlzdHNcIjtcbiAgfVxuICB0cmFuc3BvcnRzW25hbWVdID0gb2JqO1xuICByZXR1cm4gdHJ1ZTtcbn07XG5cbmlmICghcHJvY2Vzcy5icm93c2VyKSB7XG4gIGZpbGVzID0gZnMucmVhZGRpclN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgXCJ0cmFuc3BvcnRzXCIpKTtcbiAgZmlsZXMuZmlsdGVyKGZ1bmN0aW9uKGYpIHtcbiAgICByZXR1cm4gL1xcLmpzJC8udGVzdChmKTtcbiAgfSkuZm9yRWFjaChmdW5jdGlvbihmKSB7XG4gICAgcmV0dXJuIGV4cG9ydHMuYWRkKGYucmVwbGFjZSgnLmpzJywgJycpLCByZXF1aXJlKFwiLi90cmFuc3BvcnRzL1wiICsgZikpO1xuICB9KTtcbn1cblxuLypcbi8vQCBzb3VyY2VNYXBwaW5nVVJMPWluZGV4Lm1hcFxuKi9cbiIsInZhciBnbG9iYWw9c2VsZjsvKipcbiAqIEBsaWNlbnNlXG4gKiBMby1EYXNoIDEuMy4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2Rlcm4gaW5jbHVkZT1cIm1lcmdlLHRocm90dGxlLGRlZmF1bHRzLGV4dGVuZCxiaW5kQWxsXCIgLW8gaW5kZXguanNgXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjQuNCA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgSW5jLlxuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG47KGZ1bmN0aW9uKHdpbmRvdykge1xuXG4gIC8qKiBVc2VkIGFzIGEgc2FmZSByZWZlcmVuY2UgZm9yIGB1bmRlZmluZWRgIGluIHByZSBFUzUgZW52aXJvbm1lbnRzICovXG4gIHZhciB1bmRlZmluZWQ7XG5cbiAgLyoqIFVzZWQgdG8gcG9vbCBhcnJheXMgYW5kIG9iamVjdHMgdXNlZCBpbnRlcm5hbGx5ICovXG4gIHZhciBhcnJheVBvb2wgPSBbXSxcbiAgICAgIG9iamVjdFBvb2wgPSBbXTtcblxuICAvKiogVXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgSURzICovXG4gIHZhciBpZENvdW50ZXIgPSAwO1xuXG4gIC8qKiBVc2VkIGludGVybmFsbHkgdG8gaW5kaWNhdGUgdmFyaW91cyB0aGluZ3MgKi9cbiAgdmFyIGluZGljYXRvck9iamVjdCA9IHt9O1xuXG4gIC8qKiBVc2VkIHRvIHByZWZpeCBrZXlzIHRvIGF2b2lkIGlzc3VlcyB3aXRoIGBfX3Byb3RvX19gIGFuZCBwcm9wZXJ0aWVzIG9uIGBPYmplY3QucHJvdG90eXBlYCAqL1xuICB2YXIga2V5UHJlZml4ID0gK25ldyBEYXRlICsgJyc7XG5cbiAgLyoqIFVzZWQgYXMgdGhlIHNpemUgd2hlbiBvcHRpbWl6YXRpb25zIGFyZSBlbmFibGVkIGZvciBsYXJnZSBhcnJheXMgKi9cbiAgdmFyIGxhcmdlQXJyYXlTaXplID0gNzU7XG5cbiAgLyoqIFVzZWQgYXMgdGhlIG1heCBzaXplIG9mIHRoZSBgYXJyYXlQb29sYCBhbmQgYG9iamVjdFBvb2xgICovXG4gIHZhciBtYXhQb29sU2l6ZSA9IDQwO1xuXG4gIC8qKiBVc2VkIHRvIG1hdGNoIGVtcHR5IHN0cmluZyBsaXRlcmFscyBpbiBjb21waWxlZCB0ZW1wbGF0ZSBzb3VyY2UgKi9cbiAgdmFyIHJlRW1wdHlTdHJpbmdMZWFkaW5nID0gL1xcYl9fcCBcXCs9ICcnOy9nLFxuICAgICAgcmVFbXB0eVN0cmluZ01pZGRsZSA9IC9cXGIoX19wIFxcKz0pICcnIFxcKy9nLFxuICAgICAgcmVFbXB0eVN0cmluZ1RyYWlsaW5nID0gLyhfX2VcXCguKj9cXCl8XFxiX190XFwpKSBcXCtcXG4nJzsvZztcblxuICAvKiogVXNlZCB0byBtYXRjaCBIVE1MIGVudGl0aWVzICovXG4gIHZhciByZUVzY2FwZWRIdG1sID0gLyYoPzphbXB8bHR8Z3R8cXVvdHwjMzkpOy9nO1xuXG4gIC8qKlxuICAgKiBVc2VkIHRvIG1hdGNoIEVTNiB0ZW1wbGF0ZSBkZWxpbWl0ZXJzXG4gICAqIGh0dHA6Ly9wZW9wbGUubW96aWxsYS5vcmcvfmpvcmVuZG9yZmYvZXM2LWRyYWZ0Lmh0bWwjc2VjLTcuOC42XG4gICAqL1xuICB2YXIgcmVFc1RlbXBsYXRlID0gL1xcJFxceyhbXlxcXFx9XSooPzpcXFxcLlteXFxcXH1dKikqKVxcfS9nO1xuXG4gIC8qKiBVc2VkIHRvIG1hdGNoIHJlZ2V4cCBmbGFncyBmcm9tIHRoZWlyIGNvZXJjZWQgc3RyaW5nIHZhbHVlcyAqL1xuICB2YXIgcmVGbGFncyA9IC9cXHcqJC87XG5cbiAgLyoqIFVzZWQgdG8gbWF0Y2ggXCJpbnRlcnBvbGF0ZVwiIHRlbXBsYXRlIGRlbGltaXRlcnMgKi9cbiAgdmFyIHJlSW50ZXJwb2xhdGUgPSAvPCU9KFtcXHNcXFNdKz8pJT4vZztcblxuICAvKiogVXNlZCB0byBkZXRlY3QgZnVuY3Rpb25zIGNvbnRhaW5pbmcgYSBgdGhpc2AgcmVmZXJlbmNlICovXG4gIHZhciByZVRoaXMgPSAocmVUaGlzID0gL1xcYnRoaXNcXGIvKSAmJiByZVRoaXMudGVzdChmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pICYmIHJlVGhpcztcblxuICAvKiogVXNlZCB0byBlbnN1cmUgY2FwdHVyaW5nIG9yZGVyIG9mIHRlbXBsYXRlIGRlbGltaXRlcnMgKi9cbiAgdmFyIHJlTm9NYXRjaCA9IC8oJF4pLztcblxuICAvKiogVXNlZCB0byBtYXRjaCBIVE1MIGNoYXJhY3RlcnMgKi9cbiAgdmFyIHJlVW5lc2NhcGVkSHRtbCA9IC9bJjw+XCInXS9nO1xuXG4gIC8qKiBVc2VkIHRvIG1hdGNoIHVuZXNjYXBlZCBjaGFyYWN0ZXJzIGluIGNvbXBpbGVkIHN0cmluZyBsaXRlcmFscyAqL1xuICB2YXIgcmVVbmVzY2FwZWRTdHJpbmcgPSAvWydcXG5cXHJcXHRcXHUyMDI4XFx1MjAyOVxcXFxdL2c7XG5cbiAgLyoqIFVzZWQgdG8gbWFrZSB0ZW1wbGF0ZSBzb3VyY2VVUkxzIGVhc2llciB0byBpZGVudGlmeSAqL1xuICB2YXIgdGVtcGxhdGVDb3VudGVyID0gMDtcblxuICAvKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHNob3J0Y3V0cyAqL1xuICB2YXIgYXJnc0NsYXNzID0gJ1tvYmplY3QgQXJndW1lbnRzXScsXG4gICAgICBhcnJheUNsYXNzID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICAgIGJvb2xDbGFzcyA9ICdbb2JqZWN0IEJvb2xlYW5dJyxcbiAgICAgIGRhdGVDbGFzcyA9ICdbb2JqZWN0IERhdGVdJyxcbiAgICAgIGVycm9yQ2xhc3MgPSAnW29iamVjdCBFcnJvcl0nLFxuICAgICAgZnVuY0NsYXNzID0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcbiAgICAgIG51bWJlckNsYXNzID0gJ1tvYmplY3QgTnVtYmVyXScsXG4gICAgICBvYmplY3RDbGFzcyA9ICdbb2JqZWN0IE9iamVjdF0nLFxuICAgICAgcmVnZXhwQ2xhc3MgPSAnW29iamVjdCBSZWdFeHBdJyxcbiAgICAgIHN0cmluZ0NsYXNzID0gJ1tvYmplY3QgU3RyaW5nXSc7XG5cbiAgLyoqIFVzZWQgdG8gZGV0ZXJtaW5lIGlmIHZhbHVlcyBhcmUgb2YgdGhlIGxhbmd1YWdlIHR5cGUgT2JqZWN0ICovXG4gIHZhciBvYmplY3RUeXBlcyA9IHtcbiAgICAnYm9vbGVhbic6IGZhbHNlLFxuICAgICdmdW5jdGlvbic6IHRydWUsXG4gICAgJ29iamVjdCc6IHRydWUsXG4gICAgJ251bWJlcic6IGZhbHNlLFxuICAgICdzdHJpbmcnOiBmYWxzZSxcbiAgICAndW5kZWZpbmVkJzogZmFsc2VcbiAgfTtcblxuICAvKiogVXNlZCB0byBlc2NhcGUgY2hhcmFjdGVycyBmb3IgaW5jbHVzaW9uIGluIGNvbXBpbGVkIHN0cmluZyBsaXRlcmFscyAqL1xuICB2YXIgc3RyaW5nRXNjYXBlcyA9IHtcbiAgICAnXFxcXCc6ICdcXFxcJyxcbiAgICBcIidcIjogXCInXCIsXG4gICAgJ1xcbic6ICduJyxcbiAgICAnXFxyJzogJ3InLFxuICAgICdcXHQnOiAndCcsXG4gICAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAgICdcXHUyMDI5JzogJ3UyMDI5J1xuICB9O1xuXG4gIC8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZXhwb3J0c2AgKi9cbiAgdmFyIGZyZWVFeHBvcnRzID0gb2JqZWN0VHlwZXNbdHlwZW9mIGV4cG9ydHNdICYmIGV4cG9ydHM7XG5cbiAgLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBtb2R1bGVgICovXG4gIHZhciBmcmVlTW9kdWxlID0gb2JqZWN0VHlwZXNbdHlwZW9mIG1vZHVsZV0gJiYgbW9kdWxlICYmIG1vZHVsZS5leHBvcnRzID09IGZyZWVFeHBvcnRzICYmIG1vZHVsZTtcblxuICAvKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYGdsb2JhbGAsIGZyb20gTm9kZS5qcyBvciBCcm93c2VyaWZpZWQgY29kZSwgYW5kIHVzZSBpdCBhcyBgd2luZG93YCAqL1xuICB2YXIgZnJlZUdsb2JhbCA9IG9iamVjdFR5cGVzW3R5cGVvZiBnbG9iYWxdICYmIGdsb2JhbDtcbiAgaWYgKGZyZWVHbG9iYWwgJiYgKGZyZWVHbG9iYWwuZ2xvYmFsID09PSBmcmVlR2xvYmFsIHx8IGZyZWVHbG9iYWwud2luZG93ID09PSBmcmVlR2xvYmFsKSkge1xuICAgIHdpbmRvdyA9IGZyZWVHbG9iYWw7XG4gIH1cblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogR2V0cyBhbiBhcnJheSBmcm9tIHRoZSBhcnJheSBwb29sIG9yIGNyZWF0ZXMgYSBuZXcgb25lIGlmIHRoZSBwb29sIGlzIGVtcHR5LlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcmV0dXJucyB7QXJyYXl9IFRoZSBhcnJheSBmcm9tIHRoZSBwb29sLlxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0QXJyYXkoKSB7XG4gICAgcmV0dXJuIGFycmF5UG9vbC5wb3AoKSB8fCBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFuIG9iamVjdCBmcm9tIHRoZSBvYmplY3QgcG9vbCBvciBjcmVhdGVzIGEgbmV3IG9uZSBpZiB0aGUgcG9vbCBpcyBlbXB0eS5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHJldHVybnMge09iamVjdH0gVGhlIG9iamVjdCBmcm9tIHRoZSBwb29sLlxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0T2JqZWN0KCkge1xuICAgIHJldHVybiBvYmplY3RQb29sLnBvcCgpIHx8IHtcbiAgICAgICdhcnJheSc6IG51bGwsXG4gICAgICAnY2FjaGUnOiBudWxsLFxuICAgICAgJ2ZhbHNlJzogZmFsc2UsXG4gICAgICAnbGVhZGluZyc6IGZhbHNlLFxuICAgICAgJ21heFdhaXQnOiAwLFxuICAgICAgJ251bGwnOiBmYWxzZSxcbiAgICAgICdudW1iZXInOiBudWxsLFxuICAgICAgJ29iamVjdCc6IG51bGwsXG4gICAgICAncHVzaCc6IG51bGwsXG4gICAgICAnc3RyaW5nJzogbnVsbCxcbiAgICAgICd0cmFpbGluZyc6IGZhbHNlLFxuICAgICAgJ3RydWUnOiBmYWxzZSxcbiAgICAgICd1bmRlZmluZWQnOiBmYWxzZVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQSBuby1vcGVyYXRpb24gZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBub29wKCkge1xuICAgIC8vIG5vIG9wZXJhdGlvbiBwZXJmb3JtZWRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWxlYXNlcyB0aGUgZ2l2ZW4gYGFycmF5YCBiYWNrIHRvIHRoZSBhcnJheSBwb29sLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0FycmF5fSBbYXJyYXldIFRoZSBhcnJheSB0byByZWxlYXNlLlxuICAgKi9cbiAgZnVuY3Rpb24gcmVsZWFzZUFycmF5KGFycmF5KSB7XG4gICAgYXJyYXkubGVuZ3RoID0gMDtcbiAgICBpZiAoYXJyYXlQb29sLmxlbmd0aCA8IG1heFBvb2xTaXplKSB7XG4gICAgICBhcnJheVBvb2wucHVzaChhcnJheSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbGVhc2VzIHRoZSBnaXZlbiBgb2JqZWN0YCBiYWNrIHRvIHRoZSBvYmplY3QgcG9vbC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvYmplY3RdIFRoZSBvYmplY3QgdG8gcmVsZWFzZS5cbiAgICovXG4gIGZ1bmN0aW9uIHJlbGVhc2VPYmplY3Qob2JqZWN0KSB7XG4gICAgdmFyIGNhY2hlID0gb2JqZWN0LmNhY2hlO1xuICAgIGlmIChjYWNoZSkge1xuICAgICAgcmVsZWFzZU9iamVjdChjYWNoZSk7XG4gICAgfVxuICAgIG9iamVjdC5hcnJheSA9IG9iamVjdC5jYWNoZSA9b2JqZWN0Lm9iamVjdCA9IG9iamVjdC5udW1iZXIgPSBvYmplY3Quc3RyaW5nID1udWxsO1xuICAgIGlmIChvYmplY3RQb29sLmxlbmd0aCA8IG1heFBvb2xTaXplKSB7XG4gICAgICBvYmplY3RQb29sLnB1c2gob2JqZWN0KTtcbiAgICB9XG4gIH1cblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogVXNlZCBmb3IgYEFycmF5YCBtZXRob2QgcmVmZXJlbmNlcy5cbiAgICpcbiAgICogTm9ybWFsbHkgYEFycmF5LnByb3RvdHlwZWAgd291bGQgc3VmZmljZSwgaG93ZXZlciwgdXNpbmcgYW4gYXJyYXkgbGl0ZXJhbFxuICAgKiBhdm9pZHMgaXNzdWVzIGluIE5hcndoYWwuXG4gICAqL1xuICB2YXIgYXJyYXlSZWYgPSBbXTtcblxuICAvKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzICovXG4gIHZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGUsXG4gICAgICBzdHJpbmdQcm90byA9IFN0cmluZy5wcm90b3R5cGU7XG5cbiAgLyoqIFVzZWQgdG8gcmVzdG9yZSB0aGUgb3JpZ2luYWwgYF9gIHJlZmVyZW5jZSBpbiBgbm9Db25mbGljdGAgKi9cbiAgdmFyIG9sZERhc2ggPSB3aW5kb3cuXztcblxuICAvKiogVXNlZCB0byBkZXRlY3QgaWYgYSBtZXRob2QgaXMgbmF0aXZlICovXG4gIHZhciByZU5hdGl2ZSA9IFJlZ0V4cCgnXicgK1xuICAgIFN0cmluZyhvYmplY3RQcm90by52YWx1ZU9mKVxuICAgICAgLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCAnXFxcXCQmJylcbiAgICAgIC5yZXBsYWNlKC92YWx1ZU9mfGZvciBbXlxcXV0rL2csICcuKz8nKSArICckJ1xuICApO1xuXG4gIC8qKiBOYXRpdmUgbWV0aG9kIHNob3J0Y3V0cyAqL1xuICB2YXIgY2VpbCA9IE1hdGguY2VpbCxcbiAgICAgIGNsZWFyVGltZW91dCA9IHdpbmRvdy5jbGVhclRpbWVvdXQsXG4gICAgICBjb25jYXQgPSBhcnJheVJlZi5jb25jYXQsXG4gICAgICBmbG9vciA9IE1hdGguZmxvb3IsXG4gICAgICBmblRvU3RyaW5nID0gRnVuY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nLFxuICAgICAgZ2V0UHJvdG90eXBlT2YgPSByZU5hdGl2ZS50ZXN0KGdldFByb3RvdHlwZU9mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKSAmJiBnZXRQcm90b3R5cGVPZixcbiAgICAgIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHksXG4gICAgICBwdXNoID0gYXJyYXlSZWYucHVzaCxcbiAgICAgIHByb3BlcnR5SXNFbnVtZXJhYmxlID0gb2JqZWN0UHJvdG8ucHJvcGVydHlJc0VudW1lcmFibGUsXG4gICAgICBzZXRUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQsXG4gICAgICB0b1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4gIC8qIE5hdGl2ZSBtZXRob2Qgc2hvcnRjdXRzIGZvciBtZXRob2RzIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzICovXG4gIHZhciBuYXRpdmVCaW5kID0gcmVOYXRpdmUudGVzdChuYXRpdmVCaW5kID0gdG9TdHJpbmcuYmluZCkgJiYgbmF0aXZlQmluZCxcbiAgICAgIG5hdGl2ZUNyZWF0ZSA9IHJlTmF0aXZlLnRlc3QobmF0aXZlQ3JlYXRlID0gIE9iamVjdC5jcmVhdGUpICYmIG5hdGl2ZUNyZWF0ZSxcbiAgICAgIG5hdGl2ZUlzQXJyYXkgPSByZU5hdGl2ZS50ZXN0KG5hdGl2ZUlzQXJyYXkgPSBBcnJheS5pc0FycmF5KSAmJiBuYXRpdmVJc0FycmF5LFxuICAgICAgbmF0aXZlSXNGaW5pdGUgPSB3aW5kb3cuaXNGaW5pdGUsXG4gICAgICBuYXRpdmVJc05hTiA9IHdpbmRvdy5pc05hTixcbiAgICAgIG5hdGl2ZUtleXMgPSByZU5hdGl2ZS50ZXN0KG5hdGl2ZUtleXMgPSBPYmplY3Qua2V5cykgJiYgbmF0aXZlS2V5cyxcbiAgICAgIG5hdGl2ZU1heCA9IE1hdGgubWF4LFxuICAgICAgbmF0aXZlTWluID0gTWF0aC5taW4sXG4gICAgICBuYXRpdmVSYW5kb20gPSBNYXRoLnJhbmRvbSxcbiAgICAgIG5hdGl2ZVNsaWNlID0gYXJyYXlSZWYuc2xpY2U7XG5cbiAgLyoqIERldGVjdCB2YXJpb3VzIGVudmlyb25tZW50cyAqL1xuICB2YXIgaXNJZU9wZXJhID0gcmVOYXRpdmUudGVzdCh3aW5kb3cuYXR0YWNoRXZlbnQpLFxuICAgICAgaXNWOCA9IG5hdGl2ZUJpbmQgJiYgIS9cXG58dHJ1ZS8udGVzdChuYXRpdmVCaW5kICsgaXNJZU9wZXJhKTtcblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGBsb2Rhc2hgIG9iamVjdCwgd2hpY2ggd3JhcHMgdGhlIGdpdmVuIGB2YWx1ZWAsIHRvIGVuYWJsZSBtZXRob2RcbiAgICogY2hhaW5pbmcuXG4gICAqXG4gICAqIEluIGFkZGl0aW9uIHRvIExvLURhc2ggbWV0aG9kcywgd3JhcHBlcnMgYWxzbyBoYXZlIHRoZSBmb2xsb3dpbmcgYEFycmF5YCBtZXRob2RzOlxuICAgKiBgY29uY2F0YCwgYGpvaW5gLCBgcG9wYCwgYHB1c2hgLCBgcmV2ZXJzZWAsIGBzaGlmdGAsIGBzbGljZWAsIGBzb3J0YCwgYHNwbGljZWAsXG4gICAqIGFuZCBgdW5zaGlmdGBcbiAgICpcbiAgICogQ2hhaW5pbmcgaXMgc3VwcG9ydGVkIGluIGN1c3RvbSBidWlsZHMgYXMgbG9uZyBhcyB0aGUgYHZhbHVlYCBtZXRob2QgaXNcbiAgICogaW1wbGljaXRseSBvciBleHBsaWNpdGx5IGluY2x1ZGVkIGluIHRoZSBidWlsZC5cbiAgICpcbiAgICogVGhlIGNoYWluYWJsZSB3cmFwcGVyIGZ1bmN0aW9ucyBhcmU6XG4gICAqIGBhZnRlcmAsIGBhc3NpZ25gLCBgYmluZGAsIGBiaW5kQWxsYCwgYGJpbmRLZXlgLCBgY2hhaW5gLCBgY29tcGFjdGAsXG4gICAqIGBjb21wb3NlYCwgYGNvbmNhdGAsIGBjb3VudEJ5YCwgYGNyZWF0ZUNhbGxiYWNrYCwgYGRlYm91bmNlYCwgYGRlZmF1bHRzYCxcbiAgICogYGRlZmVyYCwgYGRlbGF5YCwgYGRpZmZlcmVuY2VgLCBgZmlsdGVyYCwgYGZsYXR0ZW5gLCBgZm9yRWFjaGAsIGBmb3JJbmAsXG4gICAqIGBmb3JPd25gLCBgZnVuY3Rpb25zYCwgYGdyb3VwQnlgLCBgaW5pdGlhbGAsIGBpbnRlcnNlY3Rpb25gLCBgaW52ZXJ0YCxcbiAgICogYGludm9rZWAsIGBrZXlzYCwgYG1hcGAsIGBtYXhgLCBgbWVtb2l6ZWAsIGBtZXJnZWAsIGBtaW5gLCBgb2JqZWN0YCwgYG9taXRgLFxuICAgKiBgb25jZWAsIGBwYWlyc2AsIGBwYXJ0aWFsYCwgYHBhcnRpYWxSaWdodGAsIGBwaWNrYCwgYHBsdWNrYCwgYHB1c2hgLCBgcmFuZ2VgLFxuICAgKiBgcmVqZWN0YCwgYHJlc3RgLCBgcmV2ZXJzZWAsIGBzaHVmZmxlYCwgYHNsaWNlYCwgYHNvcnRgLCBgc29ydEJ5YCwgYHNwbGljZWAsXG4gICAqIGB0YXBgLCBgdGhyb3R0bGVgLCBgdGltZXNgLCBgdG9BcnJheWAsIGB0cmFuc2Zvcm1gLCBgdW5pb25gLCBgdW5pcWAsIGB1bnNoaWZ0YCxcbiAgICogYHVuemlwYCwgYHZhbHVlc2AsIGB3aGVyZWAsIGB3aXRob3V0YCwgYHdyYXBgLCBhbmQgYHppcGBcbiAgICpcbiAgICogVGhlIG5vbi1jaGFpbmFibGUgd3JhcHBlciBmdW5jdGlvbnMgYXJlOlxuICAgKiBgY2xvbmVgLCBgY2xvbmVEZWVwYCwgYGNvbnRhaW5zYCwgYGVzY2FwZWAsIGBldmVyeWAsIGBmaW5kYCwgYGhhc2AsXG4gICAqIGBpZGVudGl0eWAsIGBpbmRleE9mYCwgYGlzQXJndW1lbnRzYCwgYGlzQXJyYXlgLCBgaXNCb29sZWFuYCwgYGlzRGF0ZWAsXG4gICAqIGBpc0VsZW1lbnRgLCBgaXNFbXB0eWAsIGBpc0VxdWFsYCwgYGlzRmluaXRlYCwgYGlzRnVuY3Rpb25gLCBgaXNOYU5gLFxuICAgKiBgaXNOdWxsYCwgYGlzTnVtYmVyYCwgYGlzT2JqZWN0YCwgYGlzUGxhaW5PYmplY3RgLCBgaXNSZWdFeHBgLCBgaXNTdHJpbmdgLFxuICAgKiBgaXNVbmRlZmluZWRgLCBgam9pbmAsIGBsYXN0SW5kZXhPZmAsIGBtaXhpbmAsIGBub0NvbmZsaWN0YCwgYHBhcnNlSW50YCxcbiAgICogYHBvcGAsIGByYW5kb21gLCBgcmVkdWNlYCwgYHJlZHVjZVJpZ2h0YCwgYHJlc3VsdGAsIGBzaGlmdGAsIGBzaXplYCwgYHNvbWVgLFxuICAgKiBgc29ydGVkSW5kZXhgLCBgcnVuSW5Db250ZXh0YCwgYHRlbXBsYXRlYCwgYHVuZXNjYXBlYCwgYHVuaXF1ZUlkYCwgYW5kIGB2YWx1ZWBcbiAgICpcbiAgICogVGhlIHdyYXBwZXIgZnVuY3Rpb25zIGBmaXJzdGAgYW5kIGBsYXN0YCByZXR1cm4gd3JhcHBlZCB2YWx1ZXMgd2hlbiBgbmAgaXNcbiAgICogcGFzc2VkLCBvdGhlcndpc2UgdGhleSByZXR1cm4gdW53cmFwcGVkIHZhbHVlcy5cbiAgICpcbiAgICogQG5hbWUgX1xuICAgKiBAY29uc3RydWN0b3JcbiAgICogQGFsaWFzIGNoYWluXG4gICAqIEBjYXRlZ29yeSBDaGFpbmluZ1xuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZSBUaGUgdmFsdWUgdG8gd3JhcCBpbiBhIGBsb2Rhc2hgIGluc3RhbmNlLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGEgYGxvZGFzaGAgaW5zdGFuY2UuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHZhciB3cmFwcGVkID0gXyhbMSwgMiwgM10pO1xuICAgKlxuICAgKiAvLyByZXR1cm5zIGFuIHVud3JhcHBlZCB2YWx1ZVxuICAgKiB3cmFwcGVkLnJlZHVjZShmdW5jdGlvbihzdW0sIG51bSkge1xuICAgKiAgIHJldHVybiBzdW0gKyBudW07XG4gICAqIH0pO1xuICAgKiAvLyA9PiA2XG4gICAqXG4gICAqIC8vIHJldHVybnMgYSB3cmFwcGVkIHZhbHVlXG4gICAqIHZhciBzcXVhcmVzID0gd3JhcHBlZC5tYXAoZnVuY3Rpb24obnVtKSB7XG4gICAqICAgcmV0dXJuIG51bSAqIG51bTtcbiAgICogfSk7XG4gICAqXG4gICAqIF8uaXNBcnJheShzcXVhcmVzKTtcbiAgICogLy8gPT4gZmFsc2VcbiAgICpcbiAgICogXy5pc0FycmF5KHNxdWFyZXMudmFsdWUoKSk7XG4gICAqIC8vID0+IHRydWVcbiAgICovXG4gIGZ1bmN0aW9uIGxvZGFzaCgpIHtcbiAgICAvLyBubyBvcGVyYXRpb24gcGVyZm9ybWVkXG4gIH1cblxuICAvKipcbiAgICogQW4gb2JqZWN0IHVzZWQgdG8gZmxhZyBlbnZpcm9ubWVudHMgZmVhdHVyZXMuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQHR5cGUgT2JqZWN0XG4gICAqL1xuICB2YXIgc3VwcG9ydCA9IGxvZGFzaC5zdXBwb3J0ID0ge307XG5cbiAgLyoqXG4gICAqIERldGVjdCBpZiBgRnVuY3Rpb24jYmluZGAgZXhpc3RzIGFuZCBpcyBpbmZlcnJlZCB0byBiZSBmYXN0IChhbGwgYnV0IFY4KS5cbiAgICpcbiAgICogQG1lbWJlck9mIF8uc3VwcG9ydFxuICAgKiBAdHlwZSBCb29sZWFuXG4gICAqL1xuICBzdXBwb3J0LmZhc3RCaW5kID0gbmF0aXZlQmluZCAmJiAhaXNWODtcblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQsIHdoZW4gY2FsbGVkLCBpbnZva2VzIGBmdW5jYCB3aXRoIHRoZSBgdGhpc2AgYmluZGluZ1xuICAgKiBvZiBgdGhpc0FyZ2AgYW5kIHByZXBlbmRzIGFueSBgcGFydGlhbEFyZ3NgIHRvIHRoZSBhcmd1bWVudHMgcGFzc2VkIHRvIHRoZVxuICAgKiBib3VuZCBmdW5jdGlvbi5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtGdW5jdGlvbnxTdHJpbmd9IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGJpbmQgb3IgdGhlIG1ldGhvZCBuYW1lLlxuICAgKiBAcGFyYW0ge01peGVkfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBmdW5jYC5cbiAgICogQHBhcmFtIHtBcnJheX0gcGFydGlhbEFyZ3MgQW4gYXJyYXkgb2YgYXJndW1lbnRzIHRvIGJlIHBhcnRpYWxseSBhcHBsaWVkLlxuICAgKiBAcGFyYW0ge09iamVjdH0gW2lkaWNhdG9yXSBVc2VkIHRvIGluZGljYXRlIGJpbmRpbmcgYnkga2V5IG9yIHBhcnRpYWxseVxuICAgKiAgYXBwbHlpbmcgYXJndW1lbnRzIGZyb20gdGhlIHJpZ2h0LlxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBib3VuZCBmdW5jdGlvbi5cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZUJvdW5kKGZ1bmMsIHRoaXNBcmcsIHBhcnRpYWxBcmdzLCBpbmRpY2F0b3IpIHtcbiAgICB2YXIgaXNGdW5jID0gaXNGdW5jdGlvbihmdW5jKSxcbiAgICAgICAgaXNQYXJ0aWFsID0gIXBhcnRpYWxBcmdzLFxuICAgICAgICBrZXkgPSB0aGlzQXJnO1xuXG4gICAgLy8ganVnZ2xlIGFyZ3VtZW50c1xuICAgIGlmIChpc1BhcnRpYWwpIHtcbiAgICAgIHZhciByaWdodEluZGljYXRvciA9IGluZGljYXRvcjtcbiAgICAgIHBhcnRpYWxBcmdzID0gdGhpc0FyZztcbiAgICB9XG4gICAgZWxzZSBpZiAoIWlzRnVuYykge1xuICAgICAgaWYgKCFpbmRpY2F0b3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICAgIH1cbiAgICAgIHRoaXNBcmcgPSBmdW5jO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJvdW5kKCkge1xuICAgICAgLy8gYEZ1bmN0aW9uI2JpbmRgIHNwZWNcbiAgICAgIC8vIGh0dHA6Ly9lczUuZ2l0aHViLmNvbS8jeDE1LjMuNC41XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgICB0aGlzQmluZGluZyA9IGlzUGFydGlhbCA/IHRoaXMgOiB0aGlzQXJnO1xuXG4gICAgICBpZiAoIWlzRnVuYykge1xuICAgICAgICBmdW5jID0gdGhpc0FyZ1trZXldO1xuICAgICAgfVxuICAgICAgaWYgKHBhcnRpYWxBcmdzLmxlbmd0aCkge1xuICAgICAgICBhcmdzID0gYXJncy5sZW5ndGhcbiAgICAgICAgICA/IChhcmdzID0gbmF0aXZlU2xpY2UuY2FsbChhcmdzKSwgcmlnaHRJbmRpY2F0b3IgPyBhcmdzLmNvbmNhdChwYXJ0aWFsQXJncykgOiBwYXJ0aWFsQXJncy5jb25jYXQoYXJncykpXG4gICAgICAgICAgOiBwYXJ0aWFsQXJncztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzIGluc3RhbmNlb2YgYm91bmQpIHtcbiAgICAgICAgLy8gZW5zdXJlIGBuZXcgYm91bmRgIGlzIGFuIGluc3RhbmNlIG9mIGBmdW5jYFxuICAgICAgICB0aGlzQmluZGluZyA9IGNyZWF0ZU9iamVjdChmdW5jLnByb3RvdHlwZSk7XG5cbiAgICAgICAgLy8gbWltaWMgdGhlIGNvbnN0cnVjdG9yJ3MgYHJldHVybmAgYmVoYXZpb3JcbiAgICAgICAgLy8gaHR0cDovL2VzNS5naXRodWIuY29tLyN4MTMuMi4yXG4gICAgICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNCaW5kaW5nLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIGlzT2JqZWN0KHJlc3VsdCkgPyByZXN1bHQgOiB0aGlzQmluZGluZztcbiAgICAgIH1cbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXNCaW5kaW5nLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIGJvdW5kO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgb2JqZWN0IHdpdGggdGhlIHNwZWNpZmllZCBgcHJvdG90eXBlYC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IHByb3RvdHlwZSBUaGUgcHJvdG90eXBlIG9iamVjdC5cbiAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbmV3IG9iamVjdC5cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZU9iamVjdChwcm90b3R5cGUpIHtcbiAgICByZXR1cm4gaXNPYmplY3QocHJvdG90eXBlKSA/IG5hdGl2ZUNyZWF0ZShwcm90b3R5cGUpIDoge307XG4gIH1cblxuICAvKipcbiAgICogQSBmYWxsYmFjayBpbXBsZW1lbnRhdGlvbiBvZiBgaXNQbGFpbk9iamVjdGAgd2hpY2ggY2hlY2tzIGlmIGEgZ2l2ZW4gYHZhbHVlYFxuICAgKiBpcyBhbiBvYmplY3QgY3JlYXRlZCBieSB0aGUgYE9iamVjdGAgY29uc3RydWN0b3IsIGFzc3VtaW5nIG9iamVjdHMgY3JlYXRlZFxuICAgKiBieSB0aGUgYE9iamVjdGAgY29uc3RydWN0b3IgaGF2ZSBubyBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGFuZCB0aGF0XG4gICAqIHRoZXJlIGFyZSBubyBgT2JqZWN0LnByb3RvdHlwZWAgZXh0ZW5zaW9ucy5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAsIGlmIGB2YWx1ZWAgaXMgYSBwbGFpbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAgICovXG4gIGZ1bmN0aW9uIHNoaW1Jc1BsYWluT2JqZWN0KHZhbHVlKSB7XG4gICAgdmFyIGN0b3IsXG4gICAgICAgIHJlc3VsdDtcblxuICAgIC8vIGF2b2lkIG5vbiBPYmplY3Qgb2JqZWN0cywgYGFyZ3VtZW50c2Agb2JqZWN0cywgYW5kIERPTSBlbGVtZW50c1xuICAgIGlmICghKHZhbHVlICYmIHRvU3RyaW5nLmNhbGwodmFsdWUpID09IG9iamVjdENsYXNzKSB8fFxuICAgICAgICAoY3RvciA9IHZhbHVlLmNvbnN0cnVjdG9yLCBpc0Z1bmN0aW9uKGN0b3IpICYmICEoY3RvciBpbnN0YW5jZW9mIGN0b3IpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBJbiBtb3N0IGVudmlyb25tZW50cyBhbiBvYmplY3QncyBvd24gcHJvcGVydGllcyBhcmUgaXRlcmF0ZWQgYmVmb3JlXG4gICAgLy8gaXRzIGluaGVyaXRlZCBwcm9wZXJ0aWVzLiBJZiB0aGUgbGFzdCBpdGVyYXRlZCBwcm9wZXJ0eSBpcyBhbiBvYmplY3Qnc1xuICAgIC8vIG93biBwcm9wZXJ0eSB0aGVuIHRoZXJlIGFyZSBubyBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzLlxuICAgIGZvckluKHZhbHVlLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICByZXN1bHQgPSBrZXk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdCA9PT0gdW5kZWZpbmVkIHx8IGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIHJlc3VsdCk7XG4gIH1cblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYW4gYGFyZ3VtZW50c2Agb2JqZWN0LlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge0Jvb2xlYW59IFJldHVybnMgYHRydWVgLCBpZiB0aGUgYHZhbHVlYCBpcyBhbiBgYXJndW1lbnRzYCBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogKGZ1bmN0aW9uKCkgeyByZXR1cm4gXy5pc0FyZ3VtZW50cyhhcmd1bWVudHMpOyB9KSgxLCAyLCAzKTtcbiAgICogLy8gPT4gdHJ1ZVxuICAgKlxuICAgKiBfLmlzQXJndW1lbnRzKFsxLCAyLCAzXSk7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqL1xuICBmdW5jdGlvbiBpc0FyZ3VtZW50cyh2YWx1ZSkge1xuICAgIHJldHVybiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PSBhcmdzQ2xhc3M7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYW4gYXJyYXkuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAsIGlmIHRoZSBgdmFsdWVgIGlzIGFuIGFycmF5LCBlbHNlIGBmYWxzZWAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIChmdW5jdGlvbigpIHsgcmV0dXJuIF8uaXNBcnJheShhcmd1bWVudHMpOyB9KSgpO1xuICAgKiAvLyA9PiBmYWxzZVxuICAgKlxuICAgKiBfLmlzQXJyYXkoWzEsIDIsIDNdKTtcbiAgICogLy8gPT4gdHJ1ZVxuICAgKi9cbiAgdmFyIGlzQXJyYXkgPSBuYXRpdmVJc0FycmF5O1xuXG4gIC8qKlxuICAgKiBBIGZhbGxiYWNrIGltcGxlbWVudGF0aW9uIG9mIGBPYmplY3Qua2V5c2Agd2hpY2ggcHJvZHVjZXMgYW4gYXJyYXkgb2YgdGhlXG4gICAqIGdpdmVuIG9iamVjdCdzIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAdHlwZSBGdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICAgKi9cbiAgdmFyIHNoaW1LZXlzID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHZhciBpbmRleCwgaXRlcmFibGUgPSBvYmplY3QsIHJlc3VsdCA9IFtdO1xuICAgIGlmICghaXRlcmFibGUpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKCEob2JqZWN0VHlwZXNbdHlwZW9mIG9iamVjdF0pKSByZXR1cm4gcmVzdWx0OyAgICBcbiAgICAgIGZvciAoaW5kZXggaW4gaXRlcmFibGUpIHtcbiAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoaXRlcmFibGUsIGluZGV4KSkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKGluZGV4KTsgICAgXG4gICAgICAgIH1cbiAgICAgIH0gICAgXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFycmF5IGNvbXBvc2VkIG9mIHRoZSBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBvZiBgb2JqZWN0YC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGEgbmV3IGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiBfLmtleXMoeyAnb25lJzogMSwgJ3R3byc6IDIsICd0aHJlZSc6IDMgfSk7XG4gICAqIC8vID0+IFsnb25lJywgJ3R3bycsICd0aHJlZSddIChvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAgICovXG4gIHZhciBrZXlzID0gIW5hdGl2ZUtleXMgPyBzaGltS2V5cyA6IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIGlmICghaXNPYmplY3Qob2JqZWN0KSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICByZXR1cm4gbmF0aXZlS2V5cyhvYmplY3QpO1xuICB9O1xuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8qKlxuICAgKiBBc3NpZ25zIG93biBlbnVtZXJhYmxlIHByb3BlcnRpZXMgb2Ygc291cmNlIG9iamVjdChzKSB0byB0aGUgZGVzdGluYXRpb25cbiAgICogb2JqZWN0LiBTdWJzZXF1ZW50IHNvdXJjZXMgd2lsbCBvdmVyd3JpdGUgcHJvcGVydHkgYXNzaWdubWVudHMgb2YgcHJldmlvdXNcbiAgICogc291cmNlcy4gSWYgYSBgY2FsbGJhY2tgIGZ1bmN0aW9uIGlzIHBhc3NlZCwgaXQgd2lsbCBiZSBleGVjdXRlZCB0byBwcm9kdWNlXG4gICAqIHRoZSBhc3NpZ25lZCB2YWx1ZXMuIFRoZSBgY2FsbGJhY2tgIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoXG4gICAqIHR3byBhcmd1bWVudHM7IChvYmplY3RWYWx1ZSwgc291cmNlVmFsdWUpLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEB0eXBlIEZ1bmN0aW9uXG4gICAqIEBhbGlhcyBleHRlbmRcbiAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICAgKiBAcGFyYW0ge09iamVjdH0gW3NvdXJjZTEsIHNvdXJjZTIsIC4uLl0gVGhlIHNvdXJjZSBvYmplY3RzLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgYXNzaWduaW5nIHZhbHVlcy5cbiAgICogQHBhcmFtIHtNaXhlZH0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIF8uYXNzaWduKHsgJ25hbWUnOiAnbW9lJyB9LCB7ICdhZ2UnOiA0MCB9KTtcbiAgICogLy8gPT4geyAnbmFtZSc6ICdtb2UnLCAnYWdlJzogNDAgfVxuICAgKlxuICAgKiB2YXIgZGVmYXVsdHMgPSBfLnBhcnRpYWxSaWdodChfLmFzc2lnbiwgZnVuY3Rpb24oYSwgYikge1xuICAgKiAgIHJldHVybiB0eXBlb2YgYSA9PSAndW5kZWZpbmVkJyA/IGIgOiBhO1xuICAgKiB9KTtcbiAgICpcbiAgICogdmFyIGZvb2QgPSB7ICduYW1lJzogJ2FwcGxlJyB9O1xuICAgKiBkZWZhdWx0cyhmb29kLCB7ICduYW1lJzogJ2JhbmFuYScsICd0eXBlJzogJ2ZydWl0JyB9KTtcbiAgICogLy8gPT4geyAnbmFtZSc6ICdhcHBsZScsICd0eXBlJzogJ2ZydWl0JyB9XG4gICAqL1xuICB2YXIgYXNzaWduID0gZnVuY3Rpb24gKG9iamVjdCwgc291cmNlLCBndWFyZCkge1xuICAgIHZhciBpbmRleCwgaXRlcmFibGUgPSBvYmplY3QsIHJlc3VsdCA9IGl0ZXJhYmxlO1xuICAgIGlmICghaXRlcmFibGUpIHJldHVybiByZXN1bHQ7XG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgIGFyZ3NJbmRleCA9IDAsXG4gICAgICAgIGFyZ3NMZW5ndGggPSB0eXBlb2YgZ3VhcmQgPT0gJ251bWJlcicgPyAyIDogYXJncy5sZW5ndGg7XG4gICAgaWYgKGFyZ3NMZW5ndGggPiAzICYmIHR5cGVvZiBhcmdzW2FyZ3NMZW5ndGggLSAyXSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YXIgY2FsbGJhY2sgPSBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soYXJnc1stLWFyZ3NMZW5ndGggLSAxXSwgYXJnc1thcmdzTGVuZ3RoLS1dLCAyKTtcbiAgICB9IGVsc2UgaWYgKGFyZ3NMZW5ndGggPiAyICYmIHR5cGVvZiBhcmdzW2FyZ3NMZW5ndGggLSAxXSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IGFyZ3NbLS1hcmdzTGVuZ3RoXTtcbiAgICB9XG4gICAgd2hpbGUgKCsrYXJnc0luZGV4IDwgYXJnc0xlbmd0aCkge1xuICAgICAgaXRlcmFibGUgPSBhcmdzW2FyZ3NJbmRleF07XG4gICAgICBpZiAoaXRlcmFibGUgJiYgb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSkgeyAgICBcbiAgICAgIHZhciBvd25JbmRleCA9IC0xLFxuICAgICAgICAgIG93blByb3BzID0gb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSAmJiBrZXlzKGl0ZXJhYmxlKSxcbiAgICAgICAgICBsZW5ndGggPSBvd25Qcm9wcyA/IG93blByb3BzLmxlbmd0aCA6IDA7XG5cbiAgICAgIHdoaWxlICgrK293bkluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIGluZGV4ID0gb3duUHJvcHNbb3duSW5kZXhdO1xuICAgICAgICByZXN1bHRbaW5kZXhdID0gY2FsbGJhY2sgPyBjYWxsYmFjayhyZXN1bHRbaW5kZXhdLCBpdGVyYWJsZVtpbmRleF0pIDogaXRlcmFibGVbaW5kZXhdOyAgICBcbiAgICAgIH0gICAgXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRcbiAgfTtcblxuICAvKipcbiAgICogQXNzaWducyBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIHNvdXJjZSBvYmplY3QocykgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAqIG9iamVjdCBmb3IgYWxsIGRlc3RpbmF0aW9uIHByb3BlcnRpZXMgdGhhdCByZXNvbHZlIHRvIGB1bmRlZmluZWRgLiBPbmNlIGFcbiAgICogcHJvcGVydHkgaXMgc2V0LCBhZGRpdGlvbmFsIGRlZmF1bHRzIG9mIHRoZSBzYW1lIHByb3BlcnR5IHdpbGwgYmUgaWdub3JlZC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAdHlwZSBGdW5jdGlvblxuICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbc291cmNlMSwgc291cmNlMiwgLi4uXSBUaGUgc291cmNlIG9iamVjdHMuXG4gICAqIEBwYXJhbS0ge09iamVjdH0gW2d1YXJkXSBBbGxvd3Mgd29ya2luZyB3aXRoIGBfLnJlZHVjZWAgd2l0aG91dCB1c2luZyBpdHNcbiAgICogIGNhbGxiYWNrJ3MgYGtleWAgYW5kIGBvYmplY3RgIGFyZ3VtZW50cyBhcyBzb3VyY2VzLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHZhciBmb29kID0geyAnbmFtZSc6ICdhcHBsZScgfTtcbiAgICogXy5kZWZhdWx0cyhmb29kLCB7ICduYW1lJzogJ2JhbmFuYScsICd0eXBlJzogJ2ZydWl0JyB9KTtcbiAgICogLy8gPT4geyAnbmFtZSc6ICdhcHBsZScsICd0eXBlJzogJ2ZydWl0JyB9XG4gICAqL1xuICB2YXIgZGVmYXVsdHMgPSBmdW5jdGlvbiAob2JqZWN0LCBzb3VyY2UsIGd1YXJkKSB7XG4gICAgdmFyIGluZGV4LCBpdGVyYWJsZSA9IG9iamVjdCwgcmVzdWx0ID0gaXRlcmFibGU7XG4gICAgaWYgKCFpdGVyYWJsZSkgcmV0dXJuIHJlc3VsdDtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgYXJnc0luZGV4ID0gMCxcbiAgICAgICAgYXJnc0xlbmd0aCA9IHR5cGVvZiBndWFyZCA9PSAnbnVtYmVyJyA/IDIgOiBhcmdzLmxlbmd0aDtcbiAgICB3aGlsZSAoKythcmdzSW5kZXggPCBhcmdzTGVuZ3RoKSB7XG4gICAgICBpdGVyYWJsZSA9IGFyZ3NbYXJnc0luZGV4XTtcbiAgICAgIGlmIChpdGVyYWJsZSAmJiBvYmplY3RUeXBlc1t0eXBlb2YgaXRlcmFibGVdKSB7ICAgIFxuICAgICAgdmFyIG93bkluZGV4ID0gLTEsXG4gICAgICAgICAgb3duUHJvcHMgPSBvYmplY3RUeXBlc1t0eXBlb2YgaXRlcmFibGVdICYmIGtleXMoaXRlcmFibGUpLFxuICAgICAgICAgIGxlbmd0aCA9IG93blByb3BzID8gb3duUHJvcHMubGVuZ3RoIDogMDtcblxuICAgICAgd2hpbGUgKCsrb3duSW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgaW5kZXggPSBvd25Qcm9wc1tvd25JbmRleF07XG4gICAgICAgIGlmICh0eXBlb2YgcmVzdWx0W2luZGV4XSA9PSAndW5kZWZpbmVkJykgcmVzdWx0W2luZGV4XSA9IGl0ZXJhYmxlW2luZGV4XTsgICAgXG4gICAgICB9ICAgIFxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH07XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGVzIG92ZXIgYG9iamVjdGAncyBvd24gYW5kIGluaGVyaXRlZCBlbnVtZXJhYmxlIHByb3BlcnRpZXMsIGV4ZWN1dGluZ1xuICAgKiB0aGUgYGNhbGxiYWNrYCBmb3IgZWFjaCBwcm9wZXJ0eS4gVGhlIGBjYWxsYmFja2AgaXMgYm91bmQgdG8gYHRoaXNBcmdgIGFuZFxuICAgKiBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzOyAodmFsdWUsIGtleSwgb2JqZWN0KS4gQ2FsbGJhY2tzIG1heSBleGl0IGl0ZXJhdGlvblxuICAgKiBlYXJseSBieSBleHBsaWNpdGx5IHJldHVybmluZyBgZmFsc2VgLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEB0eXBlIEZ1bmN0aW9uXG4gICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFjaz1pZGVudGl0eV0gVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgKiBAcGFyYW0ge01peGVkfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBjYWxsYmFja2AuXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIGZ1bmN0aW9uIERvZyhuYW1lKSB7XG4gICAqICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICogfVxuICAgKlxuICAgKiBEb2cucHJvdG90eXBlLmJhcmsgPSBmdW5jdGlvbigpIHtcbiAgICogICBhbGVydCgnV29vZiwgd29vZiEnKTtcbiAgICogfTtcbiAgICpcbiAgICogXy5mb3JJbihuZXcgRG9nKCdEYWdueScpLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAqICAgYWxlcnQoa2V5KTtcbiAgICogfSk7XG4gICAqIC8vID0+IGFsZXJ0cyAnbmFtZScgYW5kICdiYXJrJyAob3JkZXIgaXMgbm90IGd1YXJhbnRlZWQpXG4gICAqL1xuICB2YXIgZm9ySW4gPSBmdW5jdGlvbiAoY29sbGVjdGlvbiwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICB2YXIgaW5kZXgsIGl0ZXJhYmxlID0gY29sbGVjdGlvbiwgcmVzdWx0ID0gaXRlcmFibGU7XG4gICAgaWYgKCFpdGVyYWJsZSkgcmV0dXJuIHJlc3VsdDtcbiAgICBpZiAoIW9iamVjdFR5cGVzW3R5cGVvZiBpdGVyYWJsZV0pIHJldHVybiByZXN1bHQ7XG4gICAgY2FsbGJhY2sgPSBjYWxsYmFjayAmJiB0eXBlb2YgdGhpc0FyZyA9PSAndW5kZWZpbmVkJyA/IGNhbGxiYWNrIDogbG9kYXNoLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnKTsgICAgXG4gICAgICBmb3IgKGluZGV4IGluIGl0ZXJhYmxlKSB7XG4gICAgICAgIGlmIChjYWxsYmFjayhpdGVyYWJsZVtpbmRleF0sIGluZGV4LCBjb2xsZWN0aW9uKSA9PT0gZmFsc2UpIHJldHVybiByZXN1bHQ7ICAgIFxuICAgICAgfSAgICBcbiAgICByZXR1cm4gcmVzdWx0XG4gIH07XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGVzIG92ZXIgYW4gb2JqZWN0J3Mgb3duIGVudW1lcmFibGUgcHJvcGVydGllcywgZXhlY3V0aW5nIHRoZSBgY2FsbGJhY2tgXG4gICAqIGZvciBlYWNoIHByb3BlcnR5LiBUaGUgYGNhbGxiYWNrYCBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZVxuICAgKiBhcmd1bWVudHM7ICh2YWx1ZSwga2V5LCBvYmplY3QpLiBDYWxsYmFja3MgbWF5IGV4aXQgaXRlcmF0aW9uIGVhcmx5IGJ5IGV4cGxpY2l0bHlcbiAgICogcmV0dXJuaW5nIGBmYWxzZWAuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQHR5cGUgRnVuY3Rpb25cbiAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrPWlkZW50aXR5XSBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAqIEBwYXJhbSB7TWl4ZWR9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogXy5mb3JPd24oeyAnMCc6ICd6ZXJvJywgJzEnOiAnb25lJywgJ2xlbmd0aCc6IDIgfSwgZnVuY3Rpb24obnVtLCBrZXkpIHtcbiAgICogICBhbGVydChrZXkpO1xuICAgKiB9KTtcbiAgICogLy8gPT4gYWxlcnRzICcwJywgJzEnLCBhbmQgJ2xlbmd0aCcgKG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICAgKi9cbiAgdmFyIGZvck93biA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIHZhciBpbmRleCwgaXRlcmFibGUgPSBjb2xsZWN0aW9uLCByZXN1bHQgPSBpdGVyYWJsZTtcbiAgICBpZiAoIWl0ZXJhYmxlKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmICghb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSkgcmV0dXJuIHJlc3VsdDtcbiAgICBjYWxsYmFjayA9IGNhbGxiYWNrICYmIHR5cGVvZiB0aGlzQXJnID09ICd1bmRlZmluZWQnID8gY2FsbGJhY2sgOiBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcpOyAgICBcbiAgICAgIHZhciBvd25JbmRleCA9IC0xLFxuICAgICAgICAgIG93blByb3BzID0gb2JqZWN0VHlwZXNbdHlwZW9mIGl0ZXJhYmxlXSAmJiBrZXlzKGl0ZXJhYmxlKSxcbiAgICAgICAgICBsZW5ndGggPSBvd25Qcm9wcyA/IG93blByb3BzLmxlbmd0aCA6IDA7XG5cbiAgICAgIHdoaWxlICgrK293bkluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIGluZGV4ID0gb3duUHJvcHNbb3duSW5kZXhdO1xuICAgICAgICBpZiAoY2FsbGJhY2soaXRlcmFibGVbaW5kZXhdLCBpbmRleCwgY29sbGVjdGlvbikgPT09IGZhbHNlKSByZXR1cm4gcmVzdWx0OyAgICBcbiAgICAgIH0gICAgXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc29ydGVkIGFycmF5IG9mIGFsbCBlbnVtZXJhYmxlIHByb3BlcnRpZXMsIG93biBhbmQgaW5oZXJpdGVkLFxuICAgKiBvZiBgb2JqZWN0YCB0aGF0IGhhdmUgZnVuY3Rpb24gdmFsdWVzLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBhbGlhcyBtZXRob2RzXG4gICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpbnNwZWN0LlxuICAgKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYSBuZXcgYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMgdGhhdCBoYXZlIGZ1bmN0aW9uIHZhbHVlcy5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogXy5mdW5jdGlvbnMoXyk7XG4gICAqIC8vID0+IFsnYWxsJywgJ2FueScsICdiaW5kJywgJ2JpbmRBbGwnLCAnY2xvbmUnLCAnY29tcGFjdCcsICdjb21wb3NlJywgLi4uXVxuICAgKi9cbiAgZnVuY3Rpb24gZnVuY3Rpb25zKG9iamVjdCkge1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICBmb3JJbihvYmplY3QsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICByZXN1bHQucHVzaChrZXkpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQuc29ydCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGEgZGVlcCBjb21wYXJpc29uIGJldHdlZW4gdHdvIHZhbHVlcyB0byBkZXRlcm1pbmUgaWYgdGhleSBhcmVcbiAgICogZXF1aXZhbGVudCB0byBlYWNoIG90aGVyLiBJZiBgY2FsbGJhY2tgIGlzIHBhc3NlZCwgaXQgd2lsbCBiZSBleGVjdXRlZCB0b1xuICAgKiBjb21wYXJlIHZhbHVlcy4gSWYgYGNhbGxiYWNrYCByZXR1cm5zIGB1bmRlZmluZWRgLCBjb21wYXJpc29ucyB3aWxsIGJlIGhhbmRsZWRcbiAgICogYnkgdGhlIG1ldGhvZCBpbnN0ZWFkLiBUaGUgYGNhbGxiYWNrYCBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aFxuICAgKiB0d28gYXJndW1lbnRzOyAoYSwgYikuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQGNhdGVnb3J5IE9iamVjdHNcbiAgICogQHBhcmFtIHtNaXhlZH0gYSBUaGUgdmFsdWUgdG8gY29tcGFyZS5cbiAgICogQHBhcmFtIHtNaXhlZH0gYiBUaGUgb3RoZXIgdmFsdWUgdG8gY29tcGFyZS5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGNvbXBhcmluZyB2YWx1ZXMuXG4gICAqIEBwYXJhbSB7TWl4ZWR9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGNhbGxiYWNrYC5cbiAgICogQHBhcmFtLSB7QXJyYXl9IFtzdGFja0E9W11dIFRyYWNrcyB0cmF2ZXJzZWQgYGFgIG9iamVjdHMuXG4gICAqIEBwYXJhbS0ge0FycmF5fSBbc3RhY2tCPVtdXSBUcmFja3MgdHJhdmVyc2VkIGBiYCBvYmplY3RzLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAsIGlmIHRoZSB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogdmFyIG1vZSA9IHsgJ25hbWUnOiAnbW9lJywgJ2FnZSc6IDQwIH07XG4gICAqIHZhciBjb3B5ID0geyAnbmFtZSc6ICdtb2UnLCAnYWdlJzogNDAgfTtcbiAgICpcbiAgICogbW9lID09IGNvcHk7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqXG4gICAqIF8uaXNFcXVhbChtb2UsIGNvcHkpO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqXG4gICAqIHZhciB3b3JkcyA9IFsnaGVsbG8nLCAnZ29vZGJ5ZSddO1xuICAgKiB2YXIgb3RoZXJXb3JkcyA9IFsnaGknLCAnZ29vZGJ5ZSddO1xuICAgKlxuICAgKiBfLmlzRXF1YWwod29yZHMsIG90aGVyV29yZHMsIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICogICB2YXIgcmVHcmVldCA9IC9eKD86aGVsbG98aGkpJC9pLFxuICAgKiAgICAgICBhR3JlZXQgPSBfLmlzU3RyaW5nKGEpICYmIHJlR3JlZXQudGVzdChhKSxcbiAgICogICAgICAgYkdyZWV0ID0gXy5pc1N0cmluZyhiKSAmJiByZUdyZWV0LnRlc3QoYik7XG4gICAqXG4gICAqICAgcmV0dXJuIChhR3JlZXQgfHwgYkdyZWV0KSA/IChhR3JlZXQgPT0gYkdyZWV0KSA6IHVuZGVmaW5lZDtcbiAgICogfSk7XG4gICAqIC8vID0+IHRydWVcbiAgICovXG4gIGZ1bmN0aW9uIGlzRXF1YWwoYSwgYiwgY2FsbGJhY2ssIHRoaXNBcmcsIHN0YWNrQSwgc3RhY2tCKSB7XG4gICAgLy8gdXNlZCB0byBpbmRpY2F0ZSB0aGF0IHdoZW4gY29tcGFyaW5nIG9iamVjdHMsIGBhYCBoYXMgYXQgbGVhc3QgdGhlIHByb3BlcnRpZXMgb2YgYGJgXG4gICAgdmFyIHdoZXJlSW5kaWNhdG9yID0gY2FsbGJhY2sgPT09IGluZGljYXRvck9iamVjdDtcbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicgJiYgIXdoZXJlSW5kaWNhdG9yKSB7XG4gICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhjYWxsYmFjaywgdGhpc0FyZywgMik7XG4gICAgICB2YXIgcmVzdWx0ID0gY2FsbGJhY2soYSwgYik7XG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gISFyZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGV4aXQgZWFybHkgZm9yIGlkZW50aWNhbCB2YWx1ZXNcbiAgICBpZiAoYSA9PT0gYikge1xuICAgICAgLy8gdHJlYXQgYCswYCB2cy4gYC0wYCBhcyBub3QgZXF1YWxcbiAgICAgIHJldHVybiBhICE9PSAwIHx8ICgxIC8gYSA9PSAxIC8gYik7XG4gICAgfVxuICAgIHZhciB0eXBlID0gdHlwZW9mIGEsXG4gICAgICAgIG90aGVyVHlwZSA9IHR5cGVvZiBiO1xuXG4gICAgLy8gZXhpdCBlYXJseSBmb3IgdW5saWtlIHByaW1pdGl2ZSB2YWx1ZXNcbiAgICBpZiAoYSA9PT0gYSAmJlxuICAgICAgICAoIWEgfHwgKHR5cGUgIT0gJ2Z1bmN0aW9uJyAmJiB0eXBlICE9ICdvYmplY3QnKSkgJiZcbiAgICAgICAgKCFiIHx8IChvdGhlclR5cGUgIT0gJ2Z1bmN0aW9uJyAmJiBvdGhlclR5cGUgIT0gJ29iamVjdCcpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBleGl0IGVhcmx5IGZvciBgbnVsbGAgYW5kIGB1bmRlZmluZWRgLCBhdm9pZGluZyBFUzMncyBGdW5jdGlvbiNjYWxsIGJlaGF2aW9yXG4gICAgLy8gaHR0cDovL2VzNS5naXRodWIuY29tLyN4MTUuMy40LjRcbiAgICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGEgPT09IGI7XG4gICAgfVxuICAgIC8vIGNvbXBhcmUgW1tDbGFzc11dIG5hbWVzXG4gICAgdmFyIGNsYXNzTmFtZSA9IHRvU3RyaW5nLmNhbGwoYSksXG4gICAgICAgIG90aGVyQ2xhc3MgPSB0b1N0cmluZy5jYWxsKGIpO1xuXG4gICAgaWYgKGNsYXNzTmFtZSA9PSBhcmdzQ2xhc3MpIHtcbiAgICAgIGNsYXNzTmFtZSA9IG9iamVjdENsYXNzO1xuICAgIH1cbiAgICBpZiAob3RoZXJDbGFzcyA9PSBhcmdzQ2xhc3MpIHtcbiAgICAgIG90aGVyQ2xhc3MgPSBvYmplY3RDbGFzcztcbiAgICB9XG4gICAgaWYgKGNsYXNzTmFtZSAhPSBvdGhlckNsYXNzKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHN3aXRjaCAoY2xhc3NOYW1lKSB7XG4gICAgICBjYXNlIGJvb2xDbGFzczpcbiAgICAgIGNhc2UgZGF0ZUNsYXNzOlxuICAgICAgICAvLyBjb2VyY2UgZGF0ZXMgYW5kIGJvb2xlYW5zIHRvIG51bWJlcnMsIGRhdGVzIHRvIG1pbGxpc2Vjb25kcyBhbmQgYm9vbGVhbnNcbiAgICAgICAgLy8gdG8gYDFgIG9yIGAwYCwgdHJlYXRpbmcgaW52YWxpZCBkYXRlcyBjb2VyY2VkIHRvIGBOYU5gIGFzIG5vdCBlcXVhbFxuICAgICAgICByZXR1cm4gK2EgPT0gK2I7XG5cbiAgICAgIGNhc2UgbnVtYmVyQ2xhc3M6XG4gICAgICAgIC8vIHRyZWF0IGBOYU5gIHZzLiBgTmFOYCBhcyBlcXVhbFxuICAgICAgICByZXR1cm4gKGEgIT0gK2EpXG4gICAgICAgICAgPyBiICE9ICtiXG4gICAgICAgICAgLy8gYnV0IHRyZWF0IGArMGAgdnMuIGAtMGAgYXMgbm90IGVxdWFsXG4gICAgICAgICAgOiAoYSA9PSAwID8gKDEgLyBhID09IDEgLyBiKSA6IGEgPT0gK2IpO1xuXG4gICAgICBjYXNlIHJlZ2V4cENsYXNzOlxuICAgICAgY2FzZSBzdHJpbmdDbGFzczpcbiAgICAgICAgLy8gY29lcmNlIHJlZ2V4ZXMgdG8gc3RyaW5ncyAoaHR0cDovL2VzNS5naXRodWIuY29tLyN4MTUuMTAuNi40KVxuICAgICAgICAvLyB0cmVhdCBzdHJpbmcgcHJpbWl0aXZlcyBhbmQgdGhlaXIgY29ycmVzcG9uZGluZyBvYmplY3QgaW5zdGFuY2VzIGFzIGVxdWFsXG4gICAgICAgIHJldHVybiBhID09IFN0cmluZyhiKTtcbiAgICB9XG4gICAgdmFyIGlzQXJyID0gY2xhc3NOYW1lID09IGFycmF5Q2xhc3M7XG4gICAgaWYgKCFpc0Fycikge1xuICAgICAgLy8gdW53cmFwIGFueSBgbG9kYXNoYCB3cmFwcGVkIHZhbHVlc1xuICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoYSwgJ19fd3JhcHBlZF9fICcpIHx8IGhhc093blByb3BlcnR5LmNhbGwoYiwgJ19fd3JhcHBlZF9fJykpIHtcbiAgICAgICAgcmV0dXJuIGlzRXF1YWwoYS5fX3dyYXBwZWRfXyB8fCBhLCBiLl9fd3JhcHBlZF9fIHx8IGIsIGNhbGxiYWNrLCB0aGlzQXJnLCBzdGFja0EsIHN0YWNrQik7XG4gICAgICB9XG4gICAgICAvLyBleGl0IGZvciBmdW5jdGlvbnMgYW5kIERPTSBub2Rlc1xuICAgICAgaWYgKGNsYXNzTmFtZSAhPSBvYmplY3RDbGFzcykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyBpbiBvbGRlciB2ZXJzaW9ucyBvZiBPcGVyYSwgYGFyZ3VtZW50c2Agb2JqZWN0cyBoYXZlIGBBcnJheWAgY29uc3RydWN0b3JzXG4gICAgICB2YXIgY3RvckEgPSBhLmNvbnN0cnVjdG9yLFxuICAgICAgICAgIGN0b3JCID0gYi5jb25zdHJ1Y3RvcjtcblxuICAgICAgLy8gbm9uIGBPYmplY3RgIG9iamVjdCBpbnN0YW5jZXMgd2l0aCBkaWZmZXJlbnQgY29uc3RydWN0b3JzIGFyZSBub3QgZXF1YWxcbiAgICAgIGlmIChjdG9yQSAhPSBjdG9yQiAmJiAhKFxuICAgICAgICAgICAgaXNGdW5jdGlvbihjdG9yQSkgJiYgY3RvckEgaW5zdGFuY2VvZiBjdG9yQSAmJlxuICAgICAgICAgICAgaXNGdW5jdGlvbihjdG9yQikgJiYgY3RvckIgaW5zdGFuY2VvZiBjdG9yQlxuICAgICAgICAgICkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBhc3N1bWUgY3ljbGljIHN0cnVjdHVyZXMgYXJlIGVxdWFsXG4gICAgLy8gdGhlIGFsZ29yaXRobSBmb3IgZGV0ZWN0aW5nIGN5Y2xpYyBzdHJ1Y3R1cmVzIGlzIGFkYXB0ZWQgZnJvbSBFUyA1LjFcbiAgICAvLyBzZWN0aW9uIDE1LjEyLjMsIGFic3RyYWN0IG9wZXJhdGlvbiBgSk9gIChodHRwOi8vZXM1LmdpdGh1Yi5jb20vI3gxNS4xMi4zKVxuICAgIHZhciBpbml0ZWRTdGFjayA9ICFzdGFja0E7XG4gICAgc3RhY2tBIHx8IChzdGFja0EgPSBnZXRBcnJheSgpKTtcbiAgICBzdGFja0IgfHwgKHN0YWNrQiA9IGdldEFycmF5KCkpO1xuXG4gICAgdmFyIGxlbmd0aCA9IHN0YWNrQS5sZW5ndGg7XG4gICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICBpZiAoc3RhY2tBW2xlbmd0aF0gPT0gYSkge1xuICAgICAgICByZXR1cm4gc3RhY2tCW2xlbmd0aF0gPT0gYjtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIHNpemUgPSAwO1xuICAgIHJlc3VsdCA9IHRydWU7XG5cbiAgICAvLyBhZGQgYGFgIGFuZCBgYmAgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzXG4gICAgc3RhY2tBLnB1c2goYSk7XG4gICAgc3RhY2tCLnB1c2goYik7XG5cbiAgICAvLyByZWN1cnNpdmVseSBjb21wYXJlIG9iamVjdHMgYW5kIGFycmF5cyAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpXG4gICAgaWYgKGlzQXJyKSB7XG4gICAgICBsZW5ndGggPSBhLmxlbmd0aDtcbiAgICAgIHNpemUgPSBiLmxlbmd0aDtcblxuICAgICAgLy8gY29tcGFyZSBsZW5ndGhzIHRvIGRldGVybWluZSBpZiBhIGRlZXAgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnlcbiAgICAgIHJlc3VsdCA9IHNpemUgPT0gYS5sZW5ndGg7XG4gICAgICBpZiAoIXJlc3VsdCAmJiAhd2hlcmVJbmRpY2F0b3IpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICAgIC8vIGRlZXAgY29tcGFyZSB0aGUgY29udGVudHMsIGlnbm9yaW5nIG5vbi1udW1lcmljIHByb3BlcnRpZXNcbiAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgdmFyIGluZGV4ID0gbGVuZ3RoLFxuICAgICAgICAgICAgdmFsdWUgPSBiW3NpemVdO1xuXG4gICAgICAgIGlmICh3aGVyZUluZGljYXRvcikge1xuICAgICAgICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICAgICAgICBpZiAoKHJlc3VsdCA9IGlzRXF1YWwoYVtpbmRleF0sIHZhbHVlLCBjYWxsYmFjaywgdGhpc0FyZywgc3RhY2tBLCBzdGFja0IpKSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIShyZXN1bHQgPSBpc0VxdWFsKGFbc2l6ZV0sIHZhbHVlLCBjYWxsYmFjaywgdGhpc0FyZywgc3RhY2tBLCBzdGFja0IpKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICAvLyBkZWVwIGNvbXBhcmUgb2JqZWN0cyB1c2luZyBgZm9ySW5gLCBpbnN0ZWFkIG9mIGBmb3JPd25gLCB0byBhdm9pZCBgT2JqZWN0LmtleXNgXG4gICAgLy8gd2hpY2gsIGluIHRoaXMgY2FzZSwgaXMgbW9yZSBjb3N0bHlcbiAgICBmb3JJbihiLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBiKSB7XG4gICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChiLCBrZXkpKSB7XG4gICAgICAgIC8vIGNvdW50IHRoZSBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgICAgc2l6ZSsrO1xuICAgICAgICAvLyBkZWVwIGNvbXBhcmUgZWFjaCBwcm9wZXJ0eSB2YWx1ZS5cbiAgICAgICAgcmV0dXJuIChyZXN1bHQgPSBoYXNPd25Qcm9wZXJ0eS5jYWxsKGEsIGtleSkgJiYgaXNFcXVhbChhW2tleV0sIHZhbHVlLCBjYWxsYmFjaywgdGhpc0FyZywgc3RhY2tBLCBzdGFja0IpKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChyZXN1bHQgJiYgIXdoZXJlSW5kaWNhdG9yKSB7XG4gICAgICAvLyBlbnN1cmUgYm90aCBvYmplY3RzIGhhdmUgdGhlIHNhbWUgbnVtYmVyIG9mIHByb3BlcnRpZXNcbiAgICAgIGZvckluKGEsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIGEpIHtcbiAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoYSwga2V5KSkge1xuICAgICAgICAgIC8vIGBzaXplYCB3aWxsIGJlIGAtMWAgaWYgYGFgIGhhcyBtb3JlIHByb3BlcnRpZXMgdGhhbiBgYmBcbiAgICAgICAgICByZXR1cm4gKHJlc3VsdCA9IC0tc2l6ZSA+IC0xKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChpbml0ZWRTdGFjaykge1xuICAgICAgcmVsZWFzZUFycmF5KHN0YWNrQSk7XG4gICAgICByZWxlYXNlQXJyYXkoc3RhY2tCKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge0Jvb2xlYW59IFJldHVybnMgYHRydWVgLCBpZiB0aGUgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIF8uaXNGdW5jdGlvbihfKTtcbiAgICogLy8gPT4gdHJ1ZVxuICAgKi9cbiAgZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGUgbGFuZ3VhZ2UgdHlwZSBvZiBPYmplY3QuXG4gICAqIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge0Jvb2xlYW59IFJldHVybnMgYHRydWVgLCBpZiB0aGUgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogXy5pc09iamVjdCh7fSk7XG4gICAqIC8vID0+IHRydWVcbiAgICpcbiAgICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqXG4gICAqIF8uaXNPYmplY3QoMSk7XG4gICAqIC8vID0+IGZhbHNlXG4gICAqL1xuICBmdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAgIC8vIGNoZWNrIGlmIHRoZSB2YWx1ZSBpcyB0aGUgRUNNQVNjcmlwdCBsYW5ndWFnZSB0eXBlIG9mIE9iamVjdFxuICAgIC8vIGh0dHA6Ly9lczUuZ2l0aHViLmNvbS8jeDhcbiAgICAvLyBhbmQgYXZvaWQgYSBWOCBidWdcbiAgICAvLyBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0yMjkxXG4gICAgcmV0dXJuICEhKHZhbHVlICYmIG9iamVjdFR5cGVzW3R5cGVvZiB2YWx1ZV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIGdpdmVuIGB2YWx1ZWAgaXMgYW4gb2JqZWN0IGNyZWF0ZWQgYnkgdGhlIGBPYmplY3RgIGNvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge0Jvb2xlYW59IFJldHVybnMgYHRydWVgLCBpZiBgdmFsdWVgIGlzIGEgcGxhaW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIGZ1bmN0aW9uIFN0b29nZShuYW1lLCBhZ2UpIHtcbiAgICogICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgKiAgIHRoaXMuYWdlID0gYWdlO1xuICAgKiB9XG4gICAqXG4gICAqIF8uaXNQbGFpbk9iamVjdChuZXcgU3Rvb2dlKCdtb2UnLCA0MCkpO1xuICAgKiAvLyA9PiBmYWxzZVxuICAgKlxuICAgKiBfLmlzUGxhaW5PYmplY3QoWzEsIDIsIDNdKTtcbiAgICogLy8gPT4gZmFsc2VcbiAgICpcbiAgICogXy5pc1BsYWluT2JqZWN0KHsgJ25hbWUnOiAnbW9lJywgJ2FnZSc6IDQwIH0pO1xuICAgKiAvLyA9PiB0cnVlXG4gICAqL1xuICB2YXIgaXNQbGFpbk9iamVjdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgaWYgKCEodmFsdWUgJiYgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gb2JqZWN0Q2xhc3MpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciB2YWx1ZU9mID0gdmFsdWUudmFsdWVPZixcbiAgICAgICAgb2JqUHJvdG8gPSB0eXBlb2YgdmFsdWVPZiA9PSAnZnVuY3Rpb24nICYmIChvYmpQcm90byA9IGdldFByb3RvdHlwZU9mKHZhbHVlT2YpKSAmJiBnZXRQcm90b3R5cGVPZihvYmpQcm90byk7XG5cbiAgICByZXR1cm4gb2JqUHJvdG9cbiAgICAgID8gKHZhbHVlID09IG9ialByb3RvIHx8IGdldFByb3RvdHlwZU9mKHZhbHVlKSA9PSBvYmpQcm90bylcbiAgICAgIDogc2hpbUlzUGxhaW5PYmplY3QodmFsdWUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHN0cmluZy5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBSZXR1cm5zIGB0cnVlYCwgaWYgdGhlIGB2YWx1ZWAgaXMgYSBzdHJpbmcsIGVsc2UgYGZhbHNlYC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogXy5pc1N0cmluZygnbW9lJyk7XG4gICAqIC8vID0+IHRydWVcbiAgICovXG4gIGZ1bmN0aW9uIGlzU3RyaW5nKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJyB8fCB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PSBzdHJpbmdDbGFzcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWN1cnNpdmVseSBtZXJnZXMgb3duIGVudW1lcmFibGUgcHJvcGVydGllcyBvZiB0aGUgc291cmNlIG9iamVjdChzKSwgdGhhdFxuICAgKiBkb24ndCByZXNvbHZlIHRvIGB1bmRlZmluZWRgLCBpbnRvIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuIFN1YnNlcXVlbnQgc291cmNlc1xuICAgKiB3aWxsIG92ZXJ3cml0ZSBwcm9wZXJ0eSBhc3NpZ25tZW50cyBvZiBwcmV2aW91cyBzb3VyY2VzLiBJZiBhIGBjYWxsYmFja2AgZnVuY3Rpb25cbiAgICogaXMgcGFzc2VkLCBpdCB3aWxsIGJlIGV4ZWN1dGVkIHRvIHByb2R1Y2UgdGhlIG1lcmdlZCB2YWx1ZXMgb2YgdGhlIGRlc3RpbmF0aW9uXG4gICAqIGFuZCBzb3VyY2UgcHJvcGVydGllcy4gSWYgYGNhbGxiYWNrYCByZXR1cm5zIGB1bmRlZmluZWRgLCBtZXJnaW5nIHdpbGwgYmVcbiAgICogaGFuZGxlZCBieSB0aGUgbWV0aG9kIGluc3RlYWQuIFRoZSBgY2FsbGJhY2tgIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmRcbiAgICogaW52b2tlZCB3aXRoIHR3byBhcmd1bWVudHM7IChvYmplY3RWYWx1ZSwgc291cmNlVmFsdWUpLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBPYmplY3RzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAgICogQHBhcmFtIHtPYmplY3R9IFtzb3VyY2UxLCBzb3VyY2UyLCAuLi5dIFRoZSBzb3VyY2Ugb2JqZWN0cy5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIG1lcmdpbmcgcHJvcGVydGllcy5cbiAgICogQHBhcmFtIHtNaXhlZH0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgKiBAcGFyYW0tIHtPYmplY3R9IFtkZWVwSW5kaWNhdG9yXSBJbmRpY2F0ZXMgdGhhdCBgc3RhY2tBYCBhbmQgYHN0YWNrQmAgYXJlXG4gICAqICBhcnJheXMgb2YgdHJhdmVyc2VkIG9iamVjdHMsIGluc3RlYWQgb2Ygc291cmNlIG9iamVjdHMuXG4gICAqIEBwYXJhbS0ge0FycmF5fSBbc3RhY2tBPVtdXSBUcmFja3MgdHJhdmVyc2VkIHNvdXJjZSBvYmplY3RzLlxuICAgKiBAcGFyYW0tIHtBcnJheX0gW3N0YWNrQj1bXV0gQXNzb2NpYXRlcyB2YWx1ZXMgd2l0aCBzb3VyY2UgY291bnRlcnBhcnRzLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHZhciBuYW1lcyA9IHtcbiAgICogICAnc3Rvb2dlcyc6IFtcbiAgICogICAgIHsgJ25hbWUnOiAnbW9lJyB9LFxuICAgKiAgICAgeyAnbmFtZSc6ICdsYXJyeScgfVxuICAgKiAgIF1cbiAgICogfTtcbiAgICpcbiAgICogdmFyIGFnZXMgPSB7XG4gICAqICAgJ3N0b29nZXMnOiBbXG4gICAqICAgICB7ICdhZ2UnOiA0MCB9LFxuICAgKiAgICAgeyAnYWdlJzogNTAgfVxuICAgKiAgIF1cbiAgICogfTtcbiAgICpcbiAgICogXy5tZXJnZShuYW1lcywgYWdlcyk7XG4gICAqIC8vID0+IHsgJ3N0b29nZXMnOiBbeyAnbmFtZSc6ICdtb2UnLCAnYWdlJzogNDAgfSwgeyAnbmFtZSc6ICdsYXJyeScsICdhZ2UnOiA1MCB9XSB9XG4gICAqXG4gICAqIHZhciBmb29kID0ge1xuICAgKiAgICdmcnVpdHMnOiBbJ2FwcGxlJ10sXG4gICAqICAgJ3ZlZ2V0YWJsZXMnOiBbJ2JlZXQnXVxuICAgKiB9O1xuICAgKlxuICAgKiB2YXIgb3RoZXJGb29kID0ge1xuICAgKiAgICdmcnVpdHMnOiBbJ2JhbmFuYSddLFxuICAgKiAgICd2ZWdldGFibGVzJzogWydjYXJyb3QnXVxuICAgKiB9O1xuICAgKlxuICAgKiBfLm1lcmdlKGZvb2QsIG90aGVyRm9vZCwgZnVuY3Rpb24oYSwgYikge1xuICAgKiAgIHJldHVybiBfLmlzQXJyYXkoYSkgPyBhLmNvbmNhdChiKSA6IHVuZGVmaW5lZDtcbiAgICogfSk7XG4gICAqIC8vID0+IHsgJ2ZydWl0cyc6IFsnYXBwbGUnLCAnYmFuYW5hJ10sICd2ZWdldGFibGVzJzogWydiZWV0JywgJ2NhcnJvdF0gfVxuICAgKi9cbiAgZnVuY3Rpb24gbWVyZ2Uob2JqZWN0LCBzb3VyY2UsIGRlZXBJbmRpY2F0b3IpIHtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcbiAgICAgICAgaW5kZXggPSAwLFxuICAgICAgICBsZW5ndGggPSAyO1xuXG4gICAgaWYgKCFpc09iamVjdChvYmplY3QpKSB7XG4gICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH1cbiAgICBpZiAoZGVlcEluZGljYXRvciA9PT0gaW5kaWNhdG9yT2JqZWN0KSB7XG4gICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzWzNdLFxuICAgICAgICAgIHN0YWNrQSA9IGFyZ3NbNF0sXG4gICAgICAgICAgc3RhY2tCID0gYXJnc1s1XTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGluaXRlZFN0YWNrID0gdHJ1ZTtcbiAgICAgIHN0YWNrQSA9IGdldEFycmF5KCk7XG4gICAgICBzdGFja0IgPSBnZXRBcnJheSgpO1xuXG4gICAgICAvLyBhbGxvd3Mgd29ya2luZyB3aXRoIGBfLnJlZHVjZWAgYW5kIGBfLnJlZHVjZVJpZ2h0YCB3aXRob3V0XG4gICAgICAvLyB1c2luZyB0aGVpciBgY2FsbGJhY2tgIGFyZ3VtZW50cywgYGluZGV4fGtleWAgYW5kIGBjb2xsZWN0aW9uYFxuICAgICAgaWYgKHR5cGVvZiBkZWVwSW5kaWNhdG9yICE9ICdudW1iZXInKSB7XG4gICAgICAgIGxlbmd0aCA9IGFyZ3MubGVuZ3RoO1xuICAgICAgfVxuICAgICAgaWYgKGxlbmd0aCA+IDMgJiYgdHlwZW9mIGFyZ3NbbGVuZ3RoIC0gMl0gPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjYWxsYmFjayA9IGxvZGFzaC5jcmVhdGVDYWxsYmFjayhhcmdzWy0tbGVuZ3RoIC0gMV0sIGFyZ3NbbGVuZ3RoLS1dLCAyKTtcbiAgICAgIH0gZWxzZSBpZiAobGVuZ3RoID4gMiAmJiB0eXBlb2YgYXJnc1tsZW5ndGggLSAxXSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNhbGxiYWNrID0gYXJnc1stLWxlbmd0aF07XG4gICAgICB9XG4gICAgfVxuICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAoaXNBcnJheShhcmdzW2luZGV4XSkgPyBmb3JFYWNoIDogZm9yT3duKShhcmdzW2luZGV4XSwgZnVuY3Rpb24oc291cmNlLCBrZXkpIHtcbiAgICAgICAgdmFyIGZvdW5kLFxuICAgICAgICAgICAgaXNBcnIsXG4gICAgICAgICAgICByZXN1bHQgPSBzb3VyY2UsXG4gICAgICAgICAgICB2YWx1ZSA9IG9iamVjdFtrZXldO1xuXG4gICAgICAgIGlmIChzb3VyY2UgJiYgKChpc0FyciA9IGlzQXJyYXkoc291cmNlKSkgfHwgaXNQbGFpbk9iamVjdChzb3VyY2UpKSkge1xuICAgICAgICAgIC8vIGF2b2lkIG1lcmdpbmcgcHJldmlvdXNseSBtZXJnZWQgY3ljbGljIHNvdXJjZXNcbiAgICAgICAgICB2YXIgc3RhY2tMZW5ndGggPSBzdGFja0EubGVuZ3RoO1xuICAgICAgICAgIHdoaWxlIChzdGFja0xlbmd0aC0tKSB7XG4gICAgICAgICAgICBpZiAoKGZvdW5kID0gc3RhY2tBW3N0YWNrTGVuZ3RoXSA9PSBzb3VyY2UpKSB7XG4gICAgICAgICAgICAgIHZhbHVlID0gc3RhY2tCW3N0YWNrTGVuZ3RoXTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgIHZhciBpc1NoYWxsb3c7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2sodmFsdWUsIHNvdXJjZSk7XG4gICAgICAgICAgICAgIGlmICgoaXNTaGFsbG93ID0gdHlwZW9mIHJlc3VsdCAhPSAndW5kZWZpbmVkJykpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHJlc3VsdDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFpc1NoYWxsb3cpIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSBpc0FyclxuICAgICAgICAgICAgICAgID8gKGlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiBbXSlcbiAgICAgICAgICAgICAgICA6IChpc1BsYWluT2JqZWN0KHZhbHVlKSA/IHZhbHVlIDoge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gYWRkIGBzb3VyY2VgIGFuZCBhc3NvY2lhdGVkIGB2YWx1ZWAgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzXG4gICAgICAgICAgICBzdGFja0EucHVzaChzb3VyY2UpO1xuICAgICAgICAgICAgc3RhY2tCLnB1c2godmFsdWUpO1xuXG4gICAgICAgICAgICAvLyByZWN1cnNpdmVseSBtZXJnZSBvYmplY3RzIGFuZCBhcnJheXMgKHN1c2NlcHRpYmxlIHRvIGNhbGwgc3RhY2sgbGltaXRzKVxuICAgICAgICAgICAgaWYgKCFpc1NoYWxsb3cpIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSBtZXJnZSh2YWx1ZSwgc291cmNlLCBpbmRpY2F0b3JPYmplY3QsIGNhbGxiYWNrLCBzdGFja0EsIHN0YWNrQik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2sodmFsdWUsIHNvdXJjZSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICByZXN1bHQgPSBzb3VyY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHJlc3VsdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgb2JqZWN0W2tleV0gPSB2YWx1ZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChpbml0ZWRTdGFjaykge1xuICAgICAgcmVsZWFzZUFycmF5KHN0YWNrQSk7XG4gICAgICByZWxlYXNlQXJyYXkoc3RhY2tCKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8qKlxuICAgKiBJdGVyYXRlcyBvdmVyIGEgYGNvbGxlY3Rpb25gLCBleGVjdXRpbmcgdGhlIGBjYWxsYmFja2AgZm9yIGVhY2ggZWxlbWVudCBpblxuICAgKiB0aGUgYGNvbGxlY3Rpb25gLiBUaGUgYGNhbGxiYWNrYCBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZVxuICAgKiBhcmd1bWVudHM7ICh2YWx1ZSwgaW5kZXh8a2V5LCBjb2xsZWN0aW9uKS4gQ2FsbGJhY2tzIG1heSBleGl0IGl0ZXJhdGlvbiBlYXJseVxuICAgKiBieSBleHBsaWNpdGx5IHJldHVybmluZyBgZmFsc2VgLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBhbGlhcyBlYWNoXG4gICAqIEBjYXRlZ29yeSBDb2xsZWN0aW9uc1xuICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdHxTdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2s9aWRlbnRpdHldIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICogQHBhcmFtIHtNaXhlZH0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgY2FsbGJhY2tgLlxuICAgKiBAcmV0dXJucyB7QXJyYXl8T2JqZWN0fFN0cmluZ30gUmV0dXJucyBgY29sbGVjdGlvbmAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIF8oWzEsIDIsIDNdKS5mb3JFYWNoKGFsZXJ0KS5qb2luKCcsJyk7XG4gICAqIC8vID0+IGFsZXJ0cyBlYWNoIG51bWJlciBhbmQgcmV0dXJucyAnMSwyLDMnXG4gICAqXG4gICAqIF8uZm9yRWFjaCh7ICdvbmUnOiAxLCAndHdvJzogMiwgJ3RocmVlJzogMyB9LCBhbGVydCk7XG4gICAqIC8vID0+IGFsZXJ0cyBlYWNoIG51bWJlciB2YWx1ZSAob3JkZXIgaXMgbm90IGd1YXJhbnRlZWQpXG4gICAqL1xuICBmdW5jdGlvbiBmb3JFYWNoKGNvbGxlY3Rpb24sIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IGNvbGxlY3Rpb24gPyBjb2xsZWN0aW9uLmxlbmd0aCA6IDA7XG5cbiAgICBjYWxsYmFjayA9IGNhbGxiYWNrICYmIHR5cGVvZiB0aGlzQXJnID09ICd1bmRlZmluZWQnID8gY2FsbGJhY2sgOiBsb2Rhc2guY3JlYXRlQ2FsbGJhY2soY2FsbGJhY2ssIHRoaXNBcmcpO1xuICAgIGlmICh0eXBlb2YgbGVuZ3RoID09ICdudW1iZXInKSB7XG4gICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICBpZiAoY2FsbGJhY2soY29sbGVjdGlvbltpbmRleF0sIGluZGV4LCBjb2xsZWN0aW9uKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3JPd24oY29sbGVjdGlvbiwgY2FsbGJhY2spO1xuICAgIH1cbiAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgfVxuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBjYWxsZWQsIGludm9rZXMgYGZ1bmNgIHdpdGggdGhlIGB0aGlzYFxuICAgKiBiaW5kaW5nIG9mIGB0aGlzQXJnYCBhbmQgcHJlcGVuZHMgYW55IGFkZGl0aW9uYWwgYGJpbmRgIGFyZ3VtZW50cyB0byB0aG9zZVxuICAgKiBwYXNzZWQgdG8gdGhlIGJvdW5kIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gYmluZC5cbiAgICogQHBhcmFtIHtNaXhlZH0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgZnVuY2AuXG4gICAqIEBwYXJhbSB7TWl4ZWR9IFthcmcxLCBhcmcyLCAuLi5dIEFyZ3VtZW50cyB0byBiZSBwYXJ0aWFsbHkgYXBwbGllZC5cbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYm91bmQgZnVuY3Rpb24uXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHZhciBmdW5jID0gZnVuY3Rpb24oZ3JlZXRpbmcpIHtcbiAgICogICByZXR1cm4gZ3JlZXRpbmcgKyAnICcgKyB0aGlzLm5hbWU7XG4gICAqIH07XG4gICAqXG4gICAqIGZ1bmMgPSBfLmJpbmQoZnVuYywgeyAnbmFtZSc6ICdtb2UnIH0sICdoaScpO1xuICAgKiBmdW5jKCk7XG4gICAqIC8vID0+ICdoaSBtb2UnXG4gICAqL1xuICBmdW5jdGlvbiBiaW5kKGZ1bmMsIHRoaXNBcmcpIHtcbiAgICAvLyB1c2UgYEZ1bmN0aW9uI2JpbmRgIGlmIGl0IGV4aXN0cyBhbmQgaXMgZmFzdFxuICAgIC8vIChpbiBWOCBgRnVuY3Rpb24jYmluZGAgaXMgc2xvd2VyIGV4Y2VwdCB3aGVuIHBhcnRpYWxseSBhcHBsaWVkKVxuICAgIHJldHVybiBzdXBwb3J0LmZhc3RCaW5kIHx8IChuYXRpdmVCaW5kICYmIGFyZ3VtZW50cy5sZW5ndGggPiAyKVxuICAgICAgPyBuYXRpdmVCaW5kLmNhbGwuYXBwbHkobmF0aXZlQmluZCwgYXJndW1lbnRzKVxuICAgICAgOiBjcmVhdGVCb3VuZChmdW5jLCB0aGlzQXJnLCBuYXRpdmVTbGljZS5jYWxsKGFyZ3VtZW50cywgMikpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJpbmRzIG1ldGhvZHMgb24gYG9iamVjdGAgdG8gYG9iamVjdGAsIG92ZXJ3cml0aW5nIHRoZSBleGlzdGluZyBtZXRob2QuXG4gICAqIE1ldGhvZCBuYW1lcyBtYXkgYmUgc3BlY2lmaWVkIGFzIGluZGl2aWR1YWwgYXJndW1lbnRzIG9yIGFzIGFycmF5cyBvZiBtZXRob2RcbiAgICogbmFtZXMuIElmIG5vIG1ldGhvZCBuYW1lcyBhcmUgcHJvdmlkZWQsIGFsbCB0aGUgZnVuY3Rpb24gcHJvcGVydGllcyBvZiBgb2JqZWN0YFxuICAgKiB3aWxsIGJlIGJvdW5kLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGJpbmQgYW5kIGFzc2lnbiB0aGUgYm91bmQgbWV0aG9kcyB0by5cbiAgICogQHBhcmFtIHtTdHJpbmd9IFttZXRob2ROYW1lMSwgbWV0aG9kTmFtZTIsIC4uLl0gTWV0aG9kIG5hbWVzIG9uIHRoZSBvYmplY3QgdG8gYmluZC5cbiAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyBgb2JqZWN0YC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogdmFyIHZpZXcgPSB7XG4gICAqICAnbGFiZWwnOiAnZG9jcycsXG4gICAqICAnb25DbGljayc6IGZ1bmN0aW9uKCkgeyBhbGVydCgnY2xpY2tlZCAnICsgdGhpcy5sYWJlbCk7IH1cbiAgICogfTtcbiAgICpcbiAgICogXy5iaW5kQWxsKHZpZXcpO1xuICAgKiBqUXVlcnkoJyNkb2NzJykub24oJ2NsaWNrJywgdmlldy5vbkNsaWNrKTtcbiAgICogLy8gPT4gYWxlcnRzICdjbGlja2VkIGRvY3MnLCB3aGVuIHRoZSBidXR0b24gaXMgY2xpY2tlZFxuICAgKi9cbiAgZnVuY3Rpb24gYmluZEFsbChvYmplY3QpIHtcbiAgICB2YXIgZnVuY3MgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGNvbmNhdC5hcHBseShhcnJheVJlZiwgbmF0aXZlU2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKSA6IGZ1bmN0aW9ucyhvYmplY3QpLFxuICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICBsZW5ndGggPSBmdW5jcy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgdmFyIGtleSA9IGZ1bmNzW2luZGV4XTtcbiAgICAgIG9iamVjdFtrZXldID0gYmluZChvYmplY3Rba2V5XSwgb2JqZWN0KTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9kdWNlcyBhIGNhbGxiYWNrIGJvdW5kIHRvIGFuIG9wdGlvbmFsIGB0aGlzQXJnYC4gSWYgYGZ1bmNgIGlzIGEgcHJvcGVydHlcbiAgICogbmFtZSwgdGhlIGNyZWF0ZWQgY2FsbGJhY2sgd2lsbCByZXR1cm4gdGhlIHByb3BlcnR5IHZhbHVlIGZvciBhIGdpdmVuIGVsZW1lbnQuXG4gICAqIElmIGBmdW5jYCBpcyBhbiBvYmplY3QsIHRoZSBjcmVhdGVkIGNhbGxiYWNrIHdpbGwgcmV0dXJuIGB0cnVlYCBmb3IgZWxlbWVudHNcbiAgICogdGhhdCBjb250YWluIHRoZSBlcXVpdmFsZW50IG9iamVjdCBwcm9wZXJ0aWVzLCBvdGhlcndpc2UgaXQgd2lsbCByZXR1cm4gYGZhbHNlYC5cbiAgICpcbiAgICogTm90ZTogQWxsIExvLURhc2ggbWV0aG9kcywgdGhhdCBhY2NlcHQgYSBgY2FsbGJhY2tgIGFyZ3VtZW50LCB1c2UgYF8uY3JlYXRlQ2FsbGJhY2tgLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAgICogQHBhcmFtIHtNaXhlZH0gW2Z1bmM9aWRlbnRpdHldIFRoZSB2YWx1ZSB0byBjb252ZXJ0IHRvIGEgY2FsbGJhY2suXG4gICAqIEBwYXJhbSB7TWl4ZWR9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgdGhlIGNyZWF0ZWQgY2FsbGJhY2suXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBbYXJnQ291bnQ9M10gVGhlIG51bWJlciBvZiBhcmd1bWVudHMgdGhlIGNhbGxiYWNrIGFjY2VwdHMuXG4gICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyBhIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiB2YXIgc3Rvb2dlcyA9IFtcbiAgICogICB7ICduYW1lJzogJ21vZScsICdhZ2UnOiA0MCB9LFxuICAgKiAgIHsgJ25hbWUnOiAnbGFycnknLCAnYWdlJzogNTAgfVxuICAgKiBdO1xuICAgKlxuICAgKiAvLyB3cmFwIHRvIGNyZWF0ZSBjdXN0b20gY2FsbGJhY2sgc2hvcnRoYW5kc1xuICAgKiBfLmNyZWF0ZUNhbGxiYWNrID0gXy53cmFwKF8uY3JlYXRlQ2FsbGJhY2ssIGZ1bmN0aW9uKGZ1bmMsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAqICAgdmFyIG1hdGNoID0gL14oLis/KV9fKFtnbF10KSguKykkLy5leGVjKGNhbGxiYWNrKTtcbiAgICogICByZXR1cm4gIW1hdGNoID8gZnVuYyhjYWxsYmFjaywgdGhpc0FyZykgOiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICogICAgIHJldHVybiBtYXRjaFsyXSA9PSAnZ3QnID8gb2JqZWN0W21hdGNoWzFdXSA+IG1hdGNoWzNdIDogb2JqZWN0W21hdGNoWzFdXSA8IG1hdGNoWzNdO1xuICAgKiAgIH07XG4gICAqIH0pO1xuICAgKlxuICAgKiBfLmZpbHRlcihzdG9vZ2VzLCAnYWdlX19ndDQ1Jyk7XG4gICAqIC8vID0+IFt7ICduYW1lJzogJ2xhcnJ5JywgJ2FnZSc6IDUwIH1dXG4gICAqXG4gICAqIC8vIGNyZWF0ZSBtaXhpbnMgd2l0aCBzdXBwb3J0IGZvciBcIl8ucGx1Y2tcIiBhbmQgXCJfLndoZXJlXCIgY2FsbGJhY2sgc2hvcnRoYW5kc1xuICAgKiBfLm1peGluKHtcbiAgICogICAndG9Mb29rdXAnOiBmdW5jdGlvbihjb2xsZWN0aW9uLCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgKiAgICAgY2FsbGJhY2sgPSBfLmNyZWF0ZUNhbGxiYWNrKGNhbGxiYWNrLCB0aGlzQXJnKTtcbiAgICogICAgIHJldHVybiBfLnJlZHVjZShjb2xsZWN0aW9uLCBmdW5jdGlvbihyZXN1bHQsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgKiAgICAgICByZXR1cm4gKHJlc3VsdFtjYWxsYmFjayh2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pXSA9IHZhbHVlLCByZXN1bHQpO1xuICAgKiAgICAgfSwge30pO1xuICAgKiAgIH1cbiAgICogfSk7XG4gICAqXG4gICAqIF8udG9Mb29rdXAoc3Rvb2dlcywgJ25hbWUnKTtcbiAgICogLy8gPT4geyAnbW9lJzogeyAnbmFtZSc6ICdtb2UnLCAnYWdlJzogNDAgfSwgJ2xhcnJ5JzogeyAnbmFtZSc6ICdsYXJyeScsICdhZ2UnOiA1MCB9IH1cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZUNhbGxiYWNrKGZ1bmMsIHRoaXNBcmcsIGFyZ0NvdW50KSB7XG4gICAgaWYgKGZ1bmMgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGlkZW50aXR5O1xuICAgIH1cbiAgICB2YXIgdHlwZSA9IHR5cGVvZiBmdW5jO1xuICAgIGlmICh0eXBlICE9ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmICh0eXBlICE9ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgICByZXR1cm4gb2JqZWN0W2Z1bmNdO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgdmFyIHByb3BzID0ga2V5cyhmdW5jKTtcbiAgICAgIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgdmFyIGxlbmd0aCA9IHByb3BzLmxlbmd0aCxcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgICBpZiAoIShyZXN1bHQgPSBpc0VxdWFsKG9iamVjdFtwcm9wc1tsZW5ndGhdXSwgZnVuY1twcm9wc1tsZW5ndGhdXSwgaW5kaWNhdG9yT2JqZWN0KSkpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB0aGlzQXJnID09ICd1bmRlZmluZWQnIHx8IChyZVRoaXMgJiYgIXJlVGhpcy50ZXN0KGZuVG9TdHJpbmcuY2FsbChmdW5jKSkpKSB7XG4gICAgICByZXR1cm4gZnVuYztcbiAgICB9XG4gICAgaWYgKGFyZ0NvdW50ID09PSAxKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCB2YWx1ZSk7XG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoYXJnQ291bnQgPT09IDIpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYSwgYik7XG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoYXJnQ291bnQgPT09IDQpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKSB7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKHRoaXNBcmcsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGRlbGF5IHRoZSBleGVjdXRpb24gb2YgYGZ1bmNgIHVudGlsIGFmdGVyXG4gICAqIGB3YWl0YCBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgaXQgd2FzIGludm9rZWQuIFBhc3NcbiAgICogYW4gYG9wdGlvbnNgIG9iamVjdCB0byBpbmRpY2F0ZSB0aGF0IGBmdW5jYCBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGUgbGVhZGluZ1xuICAgKiBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuIFN1YnNlcXVlbnQgY2FsbHMgdG8gdGhlIGRlYm91bmNlZFxuICAgKiBmdW5jdGlvbiB3aWxsIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGBmdW5jYCBjYWxsLlxuICAgKlxuICAgKiBOb3RlOiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgLCBgZnVuY2Agd2lsbCBiZSBjYWxsZWRcbiAgICogb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiBpc1xuICAgKiBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQGNhdGVnb3J5IEZ1bmN0aW9uc1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBkZWJvdW5jZS5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IHdhaXQgVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFRoZSBvcHRpb25zIG9iamVjdC5cbiAgICogIFtsZWFkaW5nPWZhbHNlXSBBIGJvb2xlYW4gdG8gc3BlY2lmeSBleGVjdXRpb24gb24gdGhlIGxlYWRpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAgICogIFttYXhXYWl0XSBUaGUgbWF4aW11bSB0aW1lIGBmdW5jYCBpcyBhbGxvd2VkIHRvIGJlIGRlbGF5ZWQgYmVmb3JlIGl0J3MgY2FsbGVkLlxuICAgKiAgW3RyYWlsaW5nPXRydWVdIEEgYm9vbGVhbiB0byBzcGVjaWZ5IGV4ZWN1dGlvbiBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZGVib3VuY2VkIGZ1bmN0aW9uLlxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiB2YXIgbGF6eUxheW91dCA9IF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAzMDApO1xuICAgKiBqUXVlcnkod2luZG93KS5vbigncmVzaXplJywgbGF6eUxheW91dCk7XG4gICAqXG4gICAqIGpRdWVyeSgnI3Bvc3Rib3gnKS5vbignY2xpY2snLCBfLmRlYm91bmNlKHNlbmRNYWlsLCAyMDAsIHtcbiAgICogICAnbGVhZGluZyc6IHRydWUsXG4gICAqICAgJ3RyYWlsaW5nJzogZmFsc2VcbiAgICogfSk7XG4gICAqL1xuICBmdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gICAgdmFyIGFyZ3MsXG4gICAgICAgIHJlc3VsdCxcbiAgICAgICAgdGhpc0FyZyxcbiAgICAgICAgY2FsbENvdW50ID0gMCxcbiAgICAgICAgbGFzdENhbGxlZCA9IDAsXG4gICAgICAgIG1heFdhaXQgPSBmYWxzZSxcbiAgICAgICAgbWF4VGltZW91dElkID0gbnVsbCxcbiAgICAgICAgdGltZW91dElkID0gbnVsbCxcbiAgICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gICAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgICBjbGVhclRpbWVvdXQobWF4VGltZW91dElkKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgY2FsbENvdW50ID0gMDtcbiAgICAgIG1heFRpbWVvdXRJZCA9IHRpbWVvdXRJZCA9IG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVsYXllZCgpIHtcbiAgICAgIHZhciBpc0NhbGxlZCA9IHRyYWlsaW5nICYmICghbGVhZGluZyB8fCBjYWxsQ291bnQgPiAxKTtcbiAgICAgIGNsZWFyKCk7XG4gICAgICBpZiAoaXNDYWxsZWQpIHtcbiAgICAgICAgaWYgKG1heFdhaXQgIT09IGZhbHNlKSB7XG4gICAgICAgICAgbGFzdENhbGxlZCA9IG5ldyBEYXRlO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF4RGVsYXllZCgpIHtcbiAgICAgIGNsZWFyKCk7XG4gICAgICBpZiAodHJhaWxpbmcgfHwgKG1heFdhaXQgIT09IHdhaXQpKSB7XG4gICAgICAgIGxhc3RDYWxsZWQgPSBuZXcgRGF0ZTtcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB3YWl0ID0gbmF0aXZlTWF4KDAsIHdhaXQgfHwgMCk7XG4gICAgaWYgKG9wdGlvbnMgPT09IHRydWUpIHtcbiAgICAgIHZhciBsZWFkaW5nID0gdHJ1ZTtcbiAgICAgIHRyYWlsaW5nID0gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgICAgbGVhZGluZyA9IG9wdGlvbnMubGVhZGluZztcbiAgICAgIG1heFdhaXQgPSAnbWF4V2FpdCcgaW4gb3B0aW9ucyAmJiBuYXRpdmVNYXgod2FpdCwgb3B0aW9ucy5tYXhXYWl0IHx8IDApO1xuICAgICAgdHJhaWxpbmcgPSAndHJhaWxpbmcnIGluIG9wdGlvbnMgPyBvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB0aGlzQXJnID0gdGhpcztcbiAgICAgIGNhbGxDb3VudCsrO1xuXG4gICAgICAvLyBhdm9pZCBpc3N1ZXMgd2l0aCBUaXRhbml1bSBhbmQgYHVuZGVmaW5lZGAgdGltZW91dCBpZHNcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hcHBjZWxlcmF0b3IvdGl0YW5pdW1fbW9iaWxlL2Jsb2IvM18xXzBfR0EvYW5kcm9pZC90aXRhbml1bS9zcmMvamF2YS90aS9tb2R1bGVzL3RpdGFuaXVtL1RpdGFuaXVtTW9kdWxlLmphdmEjTDE4NS1MMTkyXG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcblxuICAgICAgaWYgKG1heFdhaXQgPT09IGZhbHNlKSB7XG4gICAgICAgIGlmIChsZWFkaW5nICYmIGNhbGxDb3VudCA8IDIpIHtcbiAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbm93ID0gbmV3IERhdGU7XG4gICAgICAgIGlmICghbWF4VGltZW91dElkICYmICFsZWFkaW5nKSB7XG4gICAgICAgICAgbGFzdENhbGxlZCA9IG5vdztcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVtYWluaW5nID0gbWF4V2FpdCAtIChub3cgLSBsYXN0Q2FsbGVkKTtcbiAgICAgICAgaWYgKHJlbWFpbmluZyA8PSAwKSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KG1heFRpbWVvdXRJZCk7XG4gICAgICAgICAgbWF4VGltZW91dElkID0gbnVsbDtcbiAgICAgICAgICBsYXN0Q2FsbGVkID0gbm93O1xuICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIW1heFRpbWVvdXRJZCkge1xuICAgICAgICAgIG1heFRpbWVvdXRJZCA9IHNldFRpbWVvdXQobWF4RGVsYXllZCwgcmVtYWluaW5nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHdhaXQgIT09IG1heFdhaXQpIHtcbiAgICAgICAgdGltZW91dElkID0gc2V0VGltZW91dChkZWxheWVkLCB3YWl0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBleGVjdXRlZCwgd2lsbCBvbmx5IGNhbGwgdGhlIGBmdW5jYCBmdW5jdGlvblxuICAgKiBhdCBtb3N0IG9uY2UgcGVyIGV2ZXJ5IGB3YWl0YCBtaWxsaXNlY29uZHMuIFBhc3MgYW4gYG9wdGlvbnNgIG9iamVjdCB0b1xuICAgKiBpbmRpY2F0ZSB0aGF0IGBmdW5jYCBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZVxuICAgKiBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuIFN1YnNlcXVlbnQgY2FsbHMgdG8gdGhlIHRocm90dGxlZCBmdW5jdGlvbiB3aWxsXG4gICAqIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGBmdW5jYCBjYWxsLlxuICAgKlxuICAgKiBOb3RlOiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgLCBgZnVuY2Agd2lsbCBiZSBjYWxsZWRcbiAgICogb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgdGhlIHRocm90dGxlZCBmdW5jdGlvbiBpc1xuICAgKiBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIF9cbiAgICogQGNhdGVnb3J5IEZ1bmN0aW9uc1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byB0aHJvdHRsZS5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IHdhaXQgVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gdGhyb3R0bGUgZXhlY3V0aW9ucyB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgVGhlIG9wdGlvbnMgb2JqZWN0LlxuICAgKiAgW2xlYWRpbmc9dHJ1ZV0gQSBib29sZWFuIHRvIHNwZWNpZnkgZXhlY3V0aW9uIG9uIHRoZSBsZWFkaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gICAqICBbdHJhaWxpbmc9dHJ1ZV0gQSBib29sZWFuIHRvIHNwZWNpZnkgZXhlY3V0aW9uIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyB0aHJvdHRsZWQgZnVuY3Rpb24uXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHZhciB0aHJvdHRsZWQgPSBfLnRocm90dGxlKHVwZGF0ZVBvc2l0aW9uLCAxMDApO1xuICAgKiBqUXVlcnkod2luZG93KS5vbignc2Nyb2xsJywgdGhyb3R0bGVkKTtcbiAgICpcbiAgICogalF1ZXJ5KCcuaW50ZXJhY3RpdmUnKS5vbignY2xpY2snLCBfLnRocm90dGxlKHJlbmV3VG9rZW4sIDMwMDAwMCwge1xuICAgKiAgICd0cmFpbGluZyc6IGZhbHNlXG4gICAqIH0pKTtcbiAgICovXG4gIGZ1bmN0aW9uIHRocm90dGxlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgICB2YXIgbGVhZGluZyA9IHRydWUsXG4gICAgICAgIHRyYWlsaW5nID0gdHJ1ZTtcblxuICAgIGlmIChvcHRpb25zID09PSBmYWxzZSkge1xuICAgICAgbGVhZGluZyA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICAgIGxlYWRpbmcgPSAnbGVhZGluZycgaW4gb3B0aW9ucyA/IG9wdGlvbnMubGVhZGluZyA6IGxlYWRpbmc7XG4gICAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/IG9wdGlvbnMudHJhaWxpbmcgOiB0cmFpbGluZztcbiAgICB9XG4gICAgb3B0aW9ucyA9IGdldE9iamVjdCgpO1xuICAgIG9wdGlvbnMubGVhZGluZyA9IGxlYWRpbmc7XG4gICAgb3B0aW9ucy5tYXhXYWl0ID0gd2FpdDtcbiAgICBvcHRpb25zLnRyYWlsaW5nID0gdHJhaWxpbmc7XG5cbiAgICB2YXIgcmVzdWx0ID0gZGVib3VuY2UoZnVuYywgd2FpdCwgb3B0aW9ucyk7XG4gICAgcmVsZWFzZU9iamVjdChvcHRpb25zKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIHJldHVybnMgdGhlIGZpcnN0IGFyZ3VtZW50IHBhc3NlZCB0byBpdC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgX1xuICAgKiBAY2F0ZWdvcnkgVXRpbGl0aWVzXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIEFueSB2YWx1ZS5cbiAgICogQHJldHVybnMge01peGVkfSBSZXR1cm5zIGB2YWx1ZWAuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHZhciBtb2UgPSB7ICduYW1lJzogJ21vZScgfTtcbiAgICogbW9lID09PSBfLmlkZW50aXR5KG1vZSk7XG4gICAqIC8vID0+IHRydWVcbiAgICovXG4gIGZ1bmN0aW9uIGlkZW50aXR5KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgbG9kYXNoLmFzc2lnbiA9IGFzc2lnbjtcbiAgbG9kYXNoLmJpbmQgPSBiaW5kO1xuICBsb2Rhc2guYmluZEFsbCA9IGJpbmRBbGw7XG4gIGxvZGFzaC5jcmVhdGVDYWxsYmFjayA9IGNyZWF0ZUNhbGxiYWNrO1xuICBsb2Rhc2guZGVib3VuY2UgPSBkZWJvdW5jZTtcbiAgbG9kYXNoLmRlZmF1bHRzID0gZGVmYXVsdHM7XG4gIGxvZGFzaC5mb3JFYWNoID0gZm9yRWFjaDtcbiAgbG9kYXNoLmZvckluID0gZm9ySW47XG4gIGxvZGFzaC5mb3JPd24gPSBmb3JPd247XG4gIGxvZGFzaC5mdW5jdGlvbnMgPSBmdW5jdGlvbnM7XG4gIGxvZGFzaC5rZXlzID0ga2V5cztcbiAgbG9kYXNoLm1lcmdlID0gbWVyZ2U7XG4gIGxvZGFzaC50aHJvdHRsZSA9IHRocm90dGxlO1xuXG4gIGxvZGFzaC5lYWNoID0gZm9yRWFjaDtcbiAgbG9kYXNoLmV4dGVuZCA9IGFzc2lnbjtcbiAgbG9kYXNoLm1ldGhvZHMgPSBmdW5jdGlvbnM7XG5cbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgbG9kYXNoLmlkZW50aXR5ID0gaWRlbnRpdHk7XG4gIGxvZGFzaC5pc0FyZ3VtZW50cyA9IGlzQXJndW1lbnRzO1xuICBsb2Rhc2guaXNBcnJheSA9IGlzQXJyYXk7XG4gIGxvZGFzaC5pc0VxdWFsID0gaXNFcXVhbDtcbiAgbG9kYXNoLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuICBsb2Rhc2guaXNPYmplY3QgPSBpc09iamVjdDtcbiAgbG9kYXNoLmlzUGxhaW5PYmplY3QgPSBpc1BsYWluT2JqZWN0O1xuICBsb2Rhc2guaXNTdHJpbmcgPSBpc1N0cmluZztcblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogVGhlIHNlbWFudGljIHZlcnNpb24gbnVtYmVyLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBfXG4gICAqIEB0eXBlIFN0cmluZ1xuICAgKi9cbiAgbG9kYXNoLlZFUlNJT04gPSAnMS4zLjEnO1xuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8vIGV4cG9zZSBMby1EYXNoXG4gIC8vIHNvbWUgQU1EIGJ1aWxkIG9wdGltaXplcnMsIGxpa2Ugci5qcywgY2hlY2sgZm9yIHNwZWNpZmljIGNvbmRpdGlvbiBwYXR0ZXJucyBsaWtlIHRoZSBmb2xsb3dpbmc6XG4gIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEV4cG9zZSBMby1EYXNoIHRvIHRoZSBnbG9iYWwgb2JqZWN0IGV2ZW4gd2hlbiBhbiBBTUQgbG9hZGVyIGlzIHByZXNlbnQgaW5cbiAgICAvLyBjYXNlIExvLURhc2ggd2FzIGluamVjdGVkIGJ5IGEgdGhpcmQtcGFydHkgc2NyaXB0IGFuZCBub3QgaW50ZW5kZWQgdG8gYmVcbiAgICAvLyBsb2FkZWQgYXMgYSBtb2R1bGUuIFRoZSBnbG9iYWwgYXNzaWdubWVudCBjYW4gYmUgcmV2ZXJ0ZWQgaW4gdGhlIExvLURhc2hcbiAgICAvLyBtb2R1bGUgdmlhIGl0cyBgbm9Db25mbGljdCgpYCBtZXRob2QuXG4gICAgd2luZG93Ll8gPSBsb2Rhc2g7XG5cbiAgICAvLyBkZWZpbmUgYXMgYW4gYW5vbnltb3VzIG1vZHVsZSBzbywgdGhyb3VnaCBwYXRoIG1hcHBpbmcsIGl0IGNhbiBiZVxuICAgIC8vIHJlZmVyZW5jZWQgYXMgdGhlIFwidW5kZXJzY29yZVwiIG1vZHVsZVxuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBsb2Rhc2g7XG4gICAgfSk7XG4gIH1cbiAgLy8gY2hlY2sgZm9yIGBleHBvcnRzYCBhZnRlciBgZGVmaW5lYCBpbiBjYXNlIGEgYnVpbGQgb3B0aW1pemVyIGFkZHMgYW4gYGV4cG9ydHNgIG9iamVjdFxuICBlbHNlIGlmIChmcmVlRXhwb3J0cyAmJiAhZnJlZUV4cG9ydHMubm9kZVR5cGUpIHtcbiAgICAvLyBpbiBOb2RlLmpzIG9yIFJpbmdvSlMgdjAuOC4wK1xuICAgIGlmIChmcmVlTW9kdWxlKSB7XG4gICAgICAoZnJlZU1vZHVsZS5leHBvcnRzID0gbG9kYXNoKS5fID0gbG9kYXNoO1xuICAgIH1cbiAgICAvLyBpbiBOYXJ3aGFsIG9yIFJpbmdvSlMgdjAuNy4wLVxuICAgIGVsc2Uge1xuICAgICAgZnJlZUV4cG9ydHMuXyA9IGxvZGFzaDtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gaW4gYSBicm93c2VyIG9yIFJoaW5vXG4gICAgd2luZG93Ll8gPSBsb2Rhc2g7XG4gIH1cbn0odGhpcykpO1xuIl19
;