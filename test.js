! function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                throw new Error("Cannot find module '" + o + "'")
            }
            var f = n[o] = {
                exports: {}
            };
            t[o][0].call(f.exports, function (e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, f, f.exports, e, t, n, r)
        }
        return n[o].exports
    }
    var i = typeof require == "function" && require;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s
}({
    1: [
        function (require, module, exports) {
            var util = require("util");
            var Buffer = require("buffer")
                .Buffer;
            var pSlice = Array.prototype.slice;

            function objectKeys(object) {
                if (Object.keys) return Object.keys(object);
                var result = [];
                for (var name in object) {
                    if (Object.prototype.hasOwnProperty.call(object, name)) {
                        result.push(name)
                    }
                }
                return result
            }
            var assert = module.exports = ok;
            assert.AssertionError = function AssertionError(options) {
                this.name = "AssertionError";
                this.message = options.message;
                this.actual = options.actual;
                this.expected = options.expected;
                this.operator = options.operator;
                var stackStartFunction = options.stackStartFunction || fail;
                if (Error.captureStackTrace) {
                    Error.captureStackTrace(this, stackStartFunction)
                }
            };
            util.inherits(assert.AssertionError, Error);

            function replacer(key, value) {
                if (value === undefined) {
                    return "" + value
                }
                if (typeof value === "number" && (isNaN(value) || !isFinite(value))) {
                    return value.toString()
                }
                if (typeof value === "function" || value instanceof RegExp) {
                    return value.toString()
                }
                return value
            }

            function truncate(s, n) {
                if (typeof s == "string") {
                    return s.length < n ? s : s.slice(0, n)
                } else {
                    return s
                }
            }
            assert.AssertionError.prototype.toString = function () {
                if (this.message) {
                    return [this.name + ":", this.message].join(" ")
                } else {
                    return [this.name + ":", truncate(JSON.stringify(this.actual, replacer), 128), this.operator, truncate(JSON.stringify(this.expected, replacer), 128)].join(" ")
                }
            };

            function fail(actual, expected, message, operator, stackStartFunction) {
                throw new assert.AssertionError({
                    message: message,
                    actual: actual,
                    expected: expected,
                    operator: operator,
                    stackStartFunction: stackStartFunction
                })
            }
            assert.fail = fail;

            function ok(value, message) {
                if ( !! !value) fail(value, true, message, "==", assert.ok)
            }
            assert.ok = ok;
            assert.equal = function equal(actual, expected, message) {
                if (actual != expected) fail(actual, expected, message, "==", assert.equal)
            };
            assert.notEqual = function notEqual(actual, expected, message) {
                if (actual == expected) {
                    fail(actual, expected, message, "!=", assert.notEqual)
                }
            };
            assert.deepEqual = function deepEqual(actual, expected, message) {
                if (!_deepEqual(actual, expected)) {
                    fail(actual, expected, message, "deepEqual", assert.deepEqual)
                }
            };

            function _deepEqual(actual, expected) {
                if (actual === expected) {
                    return true
                } else if (Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
                    if (actual.length != expected.length) return false;
                    for (var i = 0; i < actual.length; i++) {
                        if (actual[i] !== expected[i]) return false
                    }
                    return true
                } else if (actual instanceof Date && expected instanceof Date) {
                    return actual.getTime() === expected.getTime()
                } else if (typeof actual != "object" && typeof expected != "object") {
                    return actual == expected
                } else {
                    return objEquiv(actual, expected)
                }
            }

            function isUndefinedOrNull(value) {
                return value === null || value === undefined
            }

            function isArguments(object) {
                return Object.prototype.toString.call(object) == "[object Arguments]"
            }

            function objEquiv(a, b) {
                if (isUndefinedOrNull(a) || isUndefinedOrNull(b)) return false;
                if (a.prototype !== b.prototype) return false;
                if (isArguments(a)) {
                    if (!isArguments(b)) {
                        return false
                    }
                    a = pSlice.call(a);
                    b = pSlice.call(b);
                    return _deepEqual(a, b)
                }
                try {
                    var ka = objectKeys(a),
                        kb = objectKeys(b),
                        key, i
                } catch (e) {
                    return false
                }
                if (ka.length != kb.length) return false;
                ka.sort();
                kb.sort();
                for (i = ka.length - 1; i >= 0; i--) {
                    if (ka[i] != kb[i]) return false
                }
                for (i = ka.length - 1; i >= 0; i--) {
                    key = ka[i];
                    if (!_deepEqual(a[key], b[key])) return false
                }
                return true
            }
            assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
                if (_deepEqual(actual, expected)) {
                    fail(actual, expected, message, "notDeepEqual", assert.notDeepEqual)
                }
            };
            assert.strictEqual = function strictEqual(actual, expected, message) {
                if (actual !== expected) {
                    fail(actual, expected, message, "===", assert.strictEqual)
                }
            };
            assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
                if (actual === expected) {
                    fail(actual, expected, message, "!==", assert.notStrictEqual)
                }
            };

            function expectedException(actual, expected) {
                if (!actual || !expected) {
                    return false
                }
                if (expected instanceof RegExp) {
                    return expected.test(actual)
                } else if (actual instanceof expected) {
                    return true
                } else if (expected.call({}, actual) === true) {
                    return true
                }
                return false
            }

            function _throws(shouldThrow, block, expected, message) {
                var actual;
                if (typeof expected === "string") {
                    message = expected;
                    expected = null
                }
                try {
                    block()
                } catch (e) {
                    actual = e
                }
                message = (expected && expected.name ? " (" + expected.name + ")." : ".") + (message ? " " + message : ".");
                if (shouldThrow && !actual) {
                    fail("Missing expected exception" + message)
                }
                if (!shouldThrow && expectedException(actual, expected)) {
                    fail("Got unwanted exception" + message)
                }
                if (shouldThrow && actual && expected && !expectedException(actual, expected) || !shouldThrow && actual) {
                    throw actual
                }
            }
            assert.throws = function (block, error, message) {
                _throws.apply(this, [true].concat(pSlice.call(arguments)))
            };
            assert.doesNotThrow = function (block, error, message) {
                _throws.apply(this, [false].concat(pSlice.call(arguments)))
            };
            assert.ifError = function (err) {
                if (err) {
                    throw err
                }
            }
        }, {
            buffer: 10,
            util: 8
        }
    ],
    2: [
        function (require, module, exports) {
            var process = require("__browserify_process");
            if (!process.EventEmitter) process.EventEmitter = function () {};
            var EventEmitter = exports.EventEmitter = process.EventEmitter;
            var isArray = typeof Array.isArray === "function" ? Array.isArray : function (xs) {
                    return Object.prototype.toString.call(xs) === "[object Array]"
                };

            function indexOf(xs, x) {
                if (xs.indexOf) return xs.indexOf(x);
                for (var i = 0; i < xs.length; i++) {
                    if (x === xs[i]) return i
                }
                return -1
            }
            var defaultMaxListeners = 10;
            EventEmitter.prototype.setMaxListeners = function (n) {
                if (!this._events) this._events = {};
                this._events.maxListeners = n
            };
            EventEmitter.prototype.emit = function (type) {
                if (type === "error") {
                    if (!this._events || !this._events.error || isArray(this._events.error) && !this._events.error.length) {
                        if (arguments[1] instanceof Error) {
                            throw arguments[1]
                        } else {
                            throw new Error("Uncaught, unspecified 'error' event.")
                        }
                        return false
                    }
                }
                if (!this._events) return false;
                var handler = this._events[type];
                if (!handler) return false;
                if (typeof handler == "function") {
                    switch (arguments.length) {
                    case 1:
                        handler.call(this);
                        break;
                    case 2:
                        handler.call(this, arguments[1]);
                        break;
                    case 3:
                        handler.call(this, arguments[1], arguments[2]);
                        break;
                    default:
                        var args = Array.prototype.slice.call(arguments, 1);
                        handler.apply(this, args)
                    }
                    return true
                } else if (isArray(handler)) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var listeners = handler.slice();
                    for (var i = 0, l = listeners.length; i < l; i++) {
                        listeners[i].apply(this, args)
                    }
                    return true
                } else {
                    return false
                }
            };
            EventEmitter.prototype.addListener = function (type, listener) {
                if ("function" !== typeof listener) {
                    throw new Error("addListener only takes instances of Function")
                }
                if (!this._events) this._events = {};
                this.emit("newListener", type, listener);
                if (!this._events[type]) {
                    this._events[type] = listener
                } else if (isArray(this._events[type])) {
                    if (!this._events[type].warned) {
                        var m;
                        if (this._events.maxListeners !== undefined) {
                            m = this._events.maxListeners
                        } else {
                            m = defaultMaxListeners
                        } if (m && m > 0 && this._events[type].length > m) {
                            this._events[type].warned = true;
                            console.error("(node) warning: possible EventEmitter memory " + "leak detected. %d listeners added. " + "Use emitter.setMaxListeners() to increase limit.", this._events[type].length);
                            console.trace()
                        }
                    }
                    this._events[type].push(listener)
                } else {
                    this._events[type] = [this._events[type], listener]
                }
                return this
            };
            EventEmitter.prototype.on = EventEmitter.prototype.addListener;
            EventEmitter.prototype.once = function (type, listener) {
                var self = this;
                self.on(type, function g() {
                    self.removeListener(type, g);
                    listener.apply(this, arguments)
                });
                return this
            };
            EventEmitter.prototype.removeListener = function (type, listener) {
                if ("function" !== typeof listener) {
                    throw new Error("removeListener only takes instances of Function")
                }
                if (!this._events || !this._events[type]) return this;
                var list = this._events[type];
                if (isArray(list)) {
                    var i = indexOf(list, listener);
                    if (i < 0) return this;
                    list.splice(i, 1);
                    if (list.length == 0) delete this._events[type]
                } else if (this._events[type] === listener) {
                    delete this._events[type]
                }
                return this
            };
            EventEmitter.prototype.removeAllListeners = function (type) {
                if (arguments.length === 0) {
                    this._events = {};
                    return this
                }
                if (type && this._events && this._events[type]) this._events[type] = null;
                return this
            };
            EventEmitter.prototype.listeners = function (type) {
                if (!this._events) this._events = {};
                if (!this._events[type]) this._events[type] = [];
                if (!isArray(this._events[type])) {
                    this._events[type] = [this._events[type]]
                }
                return this._events[type]
            };
            EventEmitter.listenerCount = function (emitter, type) {
                var ret;
                if (!emitter._events || !emitter._events[type]) ret = 0;
                else if (typeof emitter._events[type] === "function") ret = 1;
                else ret = emitter._events[type].length;
                return ret
            }
        }, {
            __browserify_process: 18
        }
    ],
    3: [
        function (require, module, exports) {}, {}
    ],
    4: [
        function (require, module, exports) {
            var process = require("__browserify_process");

            function filter(xs, fn) {
                var res = [];
                for (var i = 0; i < xs.length; i++) {
                    if (fn(xs[i], i, xs)) res.push(xs[i])
                }
                return res
            }

            function normalizeArray(parts, allowAboveRoot) {
                var up = 0;
                for (var i = parts.length; i >= 0; i--) {
                    var last = parts[i];
                    if (last == ".") {
                        parts.splice(i, 1)
                    } else if (last === "..") {
                        parts.splice(i, 1);
                        up++
                    } else if (up) {
                        parts.splice(i, 1);
                        up--
                    }
                }
                if (allowAboveRoot) {
                    for (; up--; up) {
                        parts.unshift("..")
                    }
                }
                return parts
            }
            var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;
            exports.resolve = function () {
                var resolvedPath = "",
                    resolvedAbsolute = false;
                for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
                    var path = i >= 0 ? arguments[i] : process.cwd();
                    if (typeof path !== "string" || !path) {
                        continue
                    }
                    resolvedPath = path + "/" + resolvedPath;
                    resolvedAbsolute = path.charAt(0) === "/"
                }
                resolvedPath = normalizeArray(filter(resolvedPath.split("/"), function (p) {
                    return !!p
                }), !resolvedAbsolute)
                    .join("/");
                return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
            };
            exports.normalize = function (path) {
                var isAbsolute = path.charAt(0) === "/",
                    trailingSlash = path.slice(-1) === "/";
                path = normalizeArray(filter(path.split("/"), function (p) {
                    return !!p
                }), !isAbsolute)
                    .join("/");
                if (!path && !isAbsolute) {
                    path = "."
                }
                if (path && trailingSlash) {
                    path += "/"
                }
                return (isAbsolute ? "/" : "") + path
            };
            exports.join = function () {
                var paths = Array.prototype.slice.call(arguments, 0);
                return exports.normalize(filter(paths, function (p, index) {
                        return p && typeof p === "string"
                    })
                    .join("/"))
            };
            exports.dirname = function (path) {
                var dir = splitPathRe.exec(path)[1] || "";
                var isWindows = false;
                if (!dir) {
                    return "."
                } else if (dir.length === 1 || isWindows && dir.length <= 3 && dir.charAt(1) === ":") {
                    return dir
                } else {
                    return dir.substring(0, dir.length - 1)
                }
            };
            exports.basename = function (path, ext) {
                var f = splitPathRe.exec(path)[2] || "";
                if (ext && f.substr(-1 * ext.length) === ext) {
                    f = f.substr(0, f.length - ext.length)
                }
                return f
            };
            exports.extname = function (path) {
                return splitPathRe.exec(path)[3] || ""
            };
            exports.relative = function (from, to) {
                from = exports.resolve(from)
                    .substr(1);
                to = exports.resolve(to)
                    .substr(1);

                function trim(arr) {
                    var start = 0;
                    for (; start < arr.length; start++) {
                        if (arr[start] !== "") break
                    }
                    var end = arr.length - 1;
                    for (; end >= 0; end--) {
                        if (arr[end] !== "") break
                    }
                    if (start > end) return [];
                    return arr.slice(start, end - start + 1)
                }
                var fromParts = trim(from.split("/"));
                var toParts = trim(to.split("/"));
                var length = Math.min(fromParts.length, toParts.length);
                var samePartsLength = length;
                for (var i = 0; i < length; i++) {
                    if (fromParts[i] !== toParts[i]) {
                        samePartsLength = i;
                        break
                    }
                }
                var outputParts = [];
                for (var i = samePartsLength; i < fromParts.length; i++) {
                    outputParts.push("..")
                }
                outputParts = outputParts.concat(toParts.slice(samePartsLength));
                return outputParts.join("/")
            };
            exports.sep = "/"
        }, {
            __browserify_process: 18
        }
    ],
    5: [
        function (require, module, exports) {
            var toString = Object.prototype.toString;
            var indexOf = typeof Array.prototype.indexOf === "function" ? function (arr, el) {
                    return arr.indexOf(el)
                } : function (arr, el) {
                    for (var i = 0; i < arr.length; i++) {
                        if (arr[i] === el) return i
                    }
                    return -1
                };
            var isArray = Array.isArray || function (arr) {
                    return toString.call(arr) == "[object Array]"
                };
            var objectKeys = Object.keys || function (obj) {
                    var ret = [];
                    for (var key in obj) ret.push(key);
                    return ret
                };
            var forEach = typeof Array.prototype.forEach === "function" ? function (arr, fn) {
                    return arr.forEach(fn)
                } : function (arr, fn) {
                    for (var i = 0; i < arr.length; i++) fn(arr[i])
                };
            var reduce = function (arr, fn, initial) {
                if (typeof arr.reduce === "function") return arr.reduce(fn, initial);
                var res = initial;
                for (var i = 0; i < arr.length; i++) res = fn(res, arr[i]);
                return res
            };
            var isint = /^[0-9]+$/;

            function promote(parent, key) {
                if (parent[key].length == 0) return parent[key] = {};
                var t = {};
                for (var i in parent[key]) t[i] = parent[key][i];
                parent[key] = t;
                return t
            }

            function parse(parts, parent, key, val) {
                var part = parts.shift();
                if (!part) {
                    if (isArray(parent[key])) {
                        parent[key].push(val)
                    } else if ("object" == typeof parent[key]) {
                        parent[key] = val
                    } else if ("undefined" == typeof parent[key]) {
                        parent[key] = val
                    } else {
                        parent[key] = [parent[key], val]
                    }
                } else {
                    var obj = parent[key] = parent[key] || [];
                    if ("]" == part) {
                        if (isArray(obj)) {
                            if ("" != val) obj.push(val)
                        } else if ("object" == typeof obj) {
                            obj[objectKeys(obj)
                                .length] = val
                        } else {
                            obj = parent[key] = [parent[key], val]
                        }
                    } else if (~indexOf(part, "]")) {
                        part = part.substr(0, part.length - 1);
                        if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
                        parse(parts, obj, part, val)
                    } else {
                        if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
                        parse(parts, obj, part, val)
                    }
                }
            }

            function merge(parent, key, val) {
                if (~indexOf(key, "]")) {
                    var parts = key.split("["),
                        len = parts.length,
                        last = len - 1;
                    parse(parts, parent, "base", val)
                } else {
                    if (!isint.test(key) && isArray(parent.base)) {
                        var t = {};
                        for (var k in parent.base) t[k] = parent.base[k];
                        parent.base = t
                    }
                    set(parent.base, key, val)
                }
                return parent
            }

            function parseObject(obj) {
                var ret = {
                    base: {}
                };
                forEach(objectKeys(obj), function (name) {
                    merge(ret, name, obj[name])
                });
                return ret.base
            }

            function parseString(str) {
                return reduce(String(str)
                    .split("&"), function (ret, pair) {
                        var eql = indexOf(pair, "="),
                            brace = lastBraceInKey(pair),
                            key = pair.substr(0, brace || eql),
                            val = pair.substr(brace || eql, pair.length),
                            val = val.substr(indexOf(val, "=") + 1, val.length);
                        if ("" == key) key = pair, val = "";
                        if ("" == key) return ret;
                        return merge(ret, decode(key), decode(val))
                    }, {
                        base: {}
                    })
                    .base
            }
            exports.parse = function (str) {
                if (null == str || "" == str) return {};
                return "object" == typeof str ? parseObject(str) : parseString(str)
            };
            var stringify = exports.stringify = function (obj, prefix) {
                if (isArray(obj)) {
                    return stringifyArray(obj, prefix)
                } else if ("[object Object]" == toString.call(obj)) {
                    return stringifyObject(obj, prefix)
                } else if ("string" == typeof obj) {
                    return stringifyString(obj, prefix)
                } else {
                    return prefix + "=" + encodeURIComponent(String(obj))
                }
            };

            function stringifyString(str, prefix) {
                if (!prefix) throw new TypeError("stringify expects an object");
                return prefix + "=" + encodeURIComponent(str)
            }

            function stringifyArray(arr, prefix) {
                var ret = [];
                if (!prefix) throw new TypeError("stringify expects an object");
                for (var i = 0; i < arr.length; i++) {
                    ret.push(stringify(arr[i], prefix + "[" + i + "]"))
                }
                return ret.join("&")
            }

            function stringifyObject(obj, prefix) {
                var ret = [],
                    keys = objectKeys(obj),
                    key;
                for (var i = 0, len = keys.length; i < len; ++i) {
                    key = keys[i];
                    if (null == obj[key]) {
                        ret.push(encodeURIComponent(key) + "=")
                    } else {
                        ret.push(stringify(obj[key], prefix ? prefix + "[" + encodeURIComponent(key) + "]" : encodeURIComponent(key)))
                    }
                }
                return ret.join("&")
            }

            function set(obj, key, val) {
                var v = obj[key];
                if (undefined === v) {
                    obj[key] = val
                } else if (isArray(v)) {
                    v.push(val)
                } else {
                    obj[key] = [v, val]
                }
            }

            function lastBraceInKey(str) {
                var len = str.length,
                    brace, c;
                for (var i = 0; i < len; ++i) {
                    c = str[i];
                    if ("]" == c) brace = false;
                    if ("[" == c) brace = true;
                    if ("=" == c && !brace) return i
                }
            }

            function decode(str) {
                try {
                    return decodeURIComponent(str.replace(/\+/g, " "))
                } catch (err) {
                    return str
                }
            }
        }, {}
    ],
    6: [
        function (require, module, exports) {
            var events = require("events");
            var util = require("util");

            function Stream() {
                events.EventEmitter.call(this)
            }
            util.inherits(Stream, events.EventEmitter);
            module.exports = Stream;
            Stream.Stream = Stream;
            Stream.prototype.pipe = function (dest, options) {
                var source = this;

                function ondata(chunk) {
                    if (dest.writable) {
                        if (false === dest.write(chunk) && source.pause) {
                            source.pause()
                        }
                    }
                }
                source.on("data", ondata);

                function ondrain() {
                    if (source.readable && source.resume) {
                        source.resume()
                    }
                }
                dest.on("drain", ondrain);
                if (!dest._isStdio && (!options || options.end !== false)) {
                    dest._pipeCount = dest._pipeCount || 0;
                    dest._pipeCount++;
                    source.on("end", onend);
                    source.on("close", onclose)
                }
                var didOnEnd = false;

                function onend() {
                    if (didOnEnd) return;
                    didOnEnd = true;
                    dest._pipeCount--;
                    cleanup();
                    if (dest._pipeCount > 0) {
                        return
                    }
                    dest.end()
                }

                function onclose() {
                    if (didOnEnd) return;
                    didOnEnd = true;
                    dest._pipeCount--;
                    cleanup();
                    if (dest._pipeCount > 0) {
                        return
                    }
                    dest.destroy()
                }

                function onerror(er) {
                    cleanup();
                    if (this.listeners("error")
                        .length === 0) {
                        throw er
                    }
                }
                source.on("error", onerror);
                dest.on("error", onerror);

                function cleanup() {
                    source.removeListener("data", ondata);
                    dest.removeListener("drain", ondrain);
                    source.removeListener("end", onend);
                    source.removeListener("close", onclose);
                    source.removeListener("error", onerror);
                    dest.removeListener("error", onerror);
                    source.removeListener("end", cleanup);
                    source.removeListener("close", cleanup);
                    dest.removeListener("end", cleanup);
                    dest.removeListener("close", cleanup)
                }
                source.on("end", cleanup);
                source.on("close", cleanup);
                dest.on("end", cleanup);
                dest.on("close", cleanup);
                dest.emit("pipe", source);
                return dest
            }
        }, {
            events: 2,
            util: 8
        }
    ],
    7: [
        function (require, module, exports) {
            var punycode = {
                encode: function (s) {
                    return s
                }
            };
            exports.parse = urlParse;
            exports.resolve = urlResolve;
            exports.resolveObject = urlResolveObject;
            exports.format = urlFormat;

            function arrayIndexOf(array, subject) {
                for (var i = 0, j = array.length; i < j; i++) {
                    if (array[i] == subject) return i
                }
                return -1
            }
            var objectKeys = Object.keys || function objectKeys(object) {
                    if (object !== Object(object)) throw new TypeError("Invalid object");
                    var keys = [];
                    for (var key in object)
                        if (object.hasOwnProperty(key)) keys[keys.length] = key;
                    return keys
                };
            var protocolPattern = /^([a-z0-9.+-]+:)/i,
                portPattern = /:[0-9]+$/,
                delims = ["<", ">", '"', "`", " ", "\r", "\n", "  "],
                unwise = ["{", "}", "|", "\\", "^", "~", "[", "]", "`"].concat(delims),
                autoEscape = ["'"],
                nonHostChars = ["%", "/", "?", ";", "#"].concat(unwise)
                    .concat(autoEscape),
                nonAuthChars = ["/", "@", "?", "#"].concat(delims),
                hostnameMaxLen = 255,
                hostnamePartPattern = /^[a-zA-Z0-9][a-z0-9A-Z_-]{0,62}$/,
                hostnamePartStart = /^([a-zA-Z0-9][a-z0-9A-Z_-]{0,62})(.*)$/,
                unsafeProtocol = {
                    javascript: true,
                    "javascript:": true
                }, hostlessProtocol = {
                    javascript: true,
                    "javascript:": true
                }, pathedProtocol = {
                    http: true,
                    https: true,
                    ftp: true,
                    gopher: true,
                    file: true,
                    "http:": true,
                    "ftp:": true,
                    "gopher:": true,
                    "file:": true
                }, slashedProtocol = {
                    http: true,
                    https: true,
                    ftp: true,
                    gopher: true,
                    file: true,
                    "http:": true,
                    "https:": true,
                    "ftp:": true,
                    "gopher:": true,
                    "file:": true
                }, querystring = require("querystring");

            function urlParse(url, parseQueryString, slashesDenoteHost) {
                if (url && typeof url === "object" && url.href) return url;
                if (typeof url !== "string") {
                    throw new TypeError("Parameter 'url' must be a string, not " + typeof url)
                }
                var out = {}, rest = url;
                for (var i = 0, l = rest.length; i < l; i++) {
                    if (arrayIndexOf(delims, rest.charAt(i)) === -1) break
                }
                if (i !== 0) rest = rest.substr(i);
                var proto = protocolPattern.exec(rest);
                if (proto) {
                    proto = proto[0];
                    var lowerProto = proto.toLowerCase();
                    out.protocol = lowerProto;
                    rest = rest.substr(proto.length)
                }
                if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
                    var slashes = rest.substr(0, 2) === "//";
                    if (slashes && !(proto && hostlessProtocol[proto])) {
                        rest = rest.substr(2);
                        out.slashes = true
                    }
                }
                if (!hostlessProtocol[proto] && (slashes || proto && !slashedProtocol[proto])) {
                    var atSign = arrayIndexOf(rest, "@");
                    if (atSign !== -1) {
                        var hasAuth = true;
                        for (var i = 0, l = nonAuthChars.length; i < l; i++) {
                            var index = arrayIndexOf(rest, nonAuthChars[i]);
                            if (index !== -1 && index < atSign) {
                                hasAuth = false;
                                break
                            }
                        }
                        if (hasAuth) {
                            out.auth = rest.substr(0, atSign);
                            rest = rest.substr(atSign + 1)
                        }
                    }
                    var firstNonHost = -1;
                    for (var i = 0, l = nonHostChars.length; i < l; i++) {
                        var index = arrayIndexOf(rest, nonHostChars[i]);
                        if (index !== -1 && (firstNonHost < 0 || index < firstNonHost)) firstNonHost = index
                    }
                    if (firstNonHost !== -1) {
                        out.host = rest.substr(0, firstNonHost);
                        rest = rest.substr(firstNonHost)
                    } else {
                        out.host = rest;
                        rest = ""
                    }
                    var p = parseHost(out.host);
                    var keys = objectKeys(p);
                    for (var i = 0, l = keys.length; i < l; i++) {
                        var key = keys[i];
                        out[key] = p[key]
                    }
                    out.hostname = out.hostname || "";
                    if (out.hostname.length > hostnameMaxLen) {
                        out.hostname = ""
                    } else {
                        var hostparts = out.hostname.split(/\./);
                        for (var i = 0, l = hostparts.length; i < l; i++) {
                            var part = hostparts[i];
                            if (!part) continue;
                            if (!part.match(hostnamePartPattern)) {
                                var newpart = "";
                                for (var j = 0, k = part.length; j < k; j++) {
                                    if (part.charCodeAt(j) > 127) {
                                        newpart += "x"
                                    } else {
                                        newpart += part[j]
                                    }
                                }
                                if (!newpart.match(hostnamePartPattern)) {
                                    var validParts = hostparts.slice(0, i);
                                    var notHost = hostparts.slice(i + 1);
                                    var bit = part.match(hostnamePartStart);
                                    if (bit) {
                                        validParts.push(bit[1]);
                                        notHost.unshift(bit[2])
                                    }
                                    if (notHost.length) {
                                        rest = "/" + notHost.join(".") + rest
                                    }
                                    out.hostname = validParts.join(".");
                                    break
                                }
                            }
                        }
                    }
                    out.hostname = out.hostname.toLowerCase();
                    var domainArray = out.hostname.split(".");
                    var newOut = [];
                    for (var i = 0; i < domainArray.length; ++i) {
                        var s = domainArray[i];
                        newOut.push(s.match(/[^A-Za-z0-9_-]/) ? "xn--" + punycode.encode(s) : s)
                    }
                    out.hostname = newOut.join(".");
                    out.host = (out.hostname || "") + (out.port ? ":" + out.port : "");
                    out.href += out.host
                }
                if (!unsafeProtocol[lowerProto]) {
                    for (var i = 0, l = autoEscape.length; i < l; i++) {
                        var ae = autoEscape[i];
                        var esc = encodeURIComponent(ae);
                        if (esc === ae) {
                            esc = escape(ae)
                        }
                        rest = rest.split(ae)
                            .join(esc)
                    }
                    var chop = rest.length;
                    for (var i = 0, l = delims.length; i < l; i++) {
                        var c = arrayIndexOf(rest, delims[i]);
                        if (c !== -1) {
                            chop = Math.min(c, chop)
                        }
                    }
                    rest = rest.substr(0, chop)
                }
                var hash = arrayIndexOf(rest, "#");
                if (hash !== -1) {
                    out.hash = rest.substr(hash);
                    rest = rest.slice(0, hash)
                }
                var qm = arrayIndexOf(rest, "?");
                if (qm !== -1) {
                    out.search = rest.substr(qm);
                    out.query = rest.substr(qm + 1);
                    if (parseQueryString) {
                        out.query = querystring.parse(out.query)
                    }
                    rest = rest.slice(0, qm)
                } else if (parseQueryString) {
                    out.search = "";
                    out.query = {}
                }
                if (rest) out.pathname = rest;
                if (slashedProtocol[proto] && out.hostname && !out.pathname) {
                    out.pathname = "/"
                }
                if (out.pathname || out.search) {
                    out.path = (out.pathname ? out.pathname : "") + (out.search ? out.search : "")
                }
                out.href = urlFormat(out);
                return out
            }

            function urlFormat(obj) {
                if (typeof obj === "string") obj = urlParse(obj);
                var auth = obj.auth || "";
                if (auth) {
                    auth = auth.split("@")
                        .join("%40");
                    for (var i = 0, l = nonAuthChars.length; i < l; i++) {
                        var nAC = nonAuthChars[i];
                        auth = auth.split(nAC)
                            .join(encodeURIComponent(nAC))
                    }
                    auth += "@"
                }
                var protocol = obj.protocol || "",
                    host = obj.host !== undefined ? auth + obj.host : obj.hostname !== undefined ? auth + obj.hostname + (obj.port ? ":" + obj.port : "") : false,
                    pathname = obj.pathname || "",
                    query = obj.query && (typeof obj.query === "object" && objectKeys(obj.query)
                        .length ? querystring.stringify(obj.query) : "") || "",
                    search = obj.search || query && "?" + query || "",
                    hash = obj.hash || "";
                if (protocol && protocol.substr(-1) !== ":") protocol += ":";
                if (obj.slashes || (!protocol || slashedProtocol[protocol]) && host !== false) {
                    host = "//" + (host || "");
                    if (pathname && pathname.charAt(0) !== "/") pathname = "/" + pathname
                } else if (!host) {
                    host = ""
                }
                if (hash && hash.charAt(0) !== "#") hash = "#" + hash;
                if (search && search.charAt(0) !== "?") search = "?" + search;
                return protocol + host + pathname + search + hash
            }

            function urlResolve(source, relative) {
                return urlFormat(urlResolveObject(source, relative))
            }

            function urlResolveObject(source, relative) {
                if (!source) return relative;
                source = urlParse(urlFormat(source), false, true);
                relative = urlParse(urlFormat(relative), false, true);
                source.hash = relative.hash;
                if (relative.href === "") {
                    source.href = urlFormat(source);
                    return source
                }
                if (relative.slashes && !relative.protocol) {
                    relative.protocol = source.protocol;
                    if (slashedProtocol[relative.protocol] && relative.hostname && !relative.pathname) {
                        relative.path = relative.pathname = "/"
                    }
                    relative.href = urlFormat(relative);
                    return relative
                }
                if (relative.protocol && relative.protocol !== source.protocol) {
                    if (!slashedProtocol[relative.protocol]) {
                        relative.href = urlFormat(relative);
                        return relative
                    }
                    source.protocol = relative.protocol;
                    if (!relative.host && !hostlessProtocol[relative.protocol]) {
                        var relPath = (relative.pathname || "")
                            .split("/");
                        while (relPath.length && !(relative.host = relPath.shift()));
                        if (!relative.host) relative.host = "";
                        if (!relative.hostname) relative.hostname = "";
                        if (relPath[0] !== "") relPath.unshift("");
                        if (relPath.length < 2) relPath.unshift("");
                        relative.pathname = relPath.join("/")
                    }
                    source.pathname = relative.pathname;
                    source.search = relative.search;
                    source.query = relative.query;
                    source.host = relative.host || "";
                    source.auth = relative.auth;
                    source.hostname = relative.hostname || relative.host;
                    source.port = relative.port;
                    if (source.pathname !== undefined || source.search !== undefined) {
                        source.path = (source.pathname ? source.pathname : "") + (source.search ? source.search : "")
                    }
                    source.slashes = source.slashes || relative.slashes;
                    source.href = urlFormat(source);
                    return source
                }
                var isSourceAbs = source.pathname && source.pathname.charAt(0) === "/",
                    isRelAbs = relative.host !== undefined || relative.pathname && relative.pathname.charAt(0) === "/",
                    mustEndAbs = isRelAbs || isSourceAbs || source.host && relative.pathname,
                    removeAllDots = mustEndAbs,
                    srcPath = source.pathname && source.pathname.split("/") || [],
                    relPath = relative.pathname && relative.pathname.split("/") || [],
                    psychotic = source.protocol && !slashedProtocol[source.protocol];
                if (psychotic) {
                    delete source.hostname;
                    delete source.port;
                    if (source.host) {
                        if (srcPath[0] === "") srcPath[0] = source.host;
                        else srcPath.unshift(source.host)
                    }
                    delete source.host;
                    if (relative.protocol) {
                        delete relative.hostname;
                        delete relative.port;
                        if (relative.host) {
                            if (relPath[0] === "") relPath[0] = relative.host;
                            else relPath.unshift(relative.host)
                        }
                        delete relative.host
                    }
                    mustEndAbs = mustEndAbs && (relPath[0] === "" || srcPath[0] === "")
                }
                if (isRelAbs) {
                    source.host = relative.host || relative.host === "" ? relative.host : source.host;
                    source.hostname = relative.hostname || relative.hostname === "" ? relative.hostname : source.hostname;
                    source.search = relative.search;
                    source.query = relative.query;
                    srcPath = relPath
                } else if (relPath.length) {
                    if (!srcPath) srcPath = [];
                    srcPath.pop();
                    srcPath = srcPath.concat(relPath);
                    source.search = relative.search;
                    source.query = relative.query
                } else if ("search" in relative) {
                    if (psychotic) {
                        source.hostname = source.host = srcPath.shift();
                        var authInHost = source.host && arrayIndexOf(source.host, "@") > 0 ? source.host.split("@") : false;
                        if (authInHost) {
                            source.auth = authInHost.shift();
                            source.host = source.hostname = authInHost.shift()
                        }
                    }
                    source.search = relative.search;
                    source.query = relative.query;
                    if (source.pathname !== undefined || source.search !== undefined) {
                        source.path = (source.pathname ? source.pathname : "") + (source.search ? source.search : "")
                    }
                    source.href = urlFormat(source);
                    return source
                }
                if (!srcPath.length) {
                    delete source.pathname;
                    if (!source.search) {
                        source.path = "/" + source.search
                    } else {
                        delete source.path
                    }
                    source.href = urlFormat(source);
                    return source
                }
                var last = srcPath.slice(-1)[0];
                var hasTrailingSlash = (source.host || relative.host) && (last === "." || last === "..") || last === "";
                var up = 0;
                for (var i = srcPath.length; i >= 0; i--) {
                    last = srcPath[i];
                    if (last == ".") {
                        srcPath.splice(i, 1)
                    } else if (last === "..") {
                        srcPath.splice(i, 1);
                        up++
                    } else if (up) {
                        srcPath.splice(i, 1);
                        up--
                    }
                }
                if (!mustEndAbs && !removeAllDots) {
                    for (; up--; up) {
                        srcPath.unshift("..")
                    }
                }
                if (mustEndAbs && srcPath[0] !== "" && (!srcPath[0] || srcPath[0].charAt(0) !== "/")) {
                    srcPath.unshift("")
                }
                if (hasTrailingSlash && srcPath.join("/")
                    .substr(-1) !== "/") {
                    srcPath.push("")
                }
                var isAbsolute = srcPath[0] === "" || srcPath[0] && srcPath[0].charAt(0) === "/";
                if (psychotic) {
                    source.hostname = source.host = isAbsolute ? "" : srcPath.length ? srcPath.shift() : "";
                    var authInHost = source.host && arrayIndexOf(source.host, "@") > 0 ? source.host.split("@") : false;
                    if (authInHost) {
                        source.auth = authInHost.shift();
                        source.host = source.hostname = authInHost.shift()
                    }
                }
                mustEndAbs = mustEndAbs || source.host && srcPath.length;
                if (mustEndAbs && !isAbsolute) {
                    srcPath.unshift("")
                }
                source.pathname = srcPath.join("/");
                if (source.pathname !== undefined || source.search !== undefined) {
                    source.path = (source.pathname ? source.pathname : "") + (source.search ? source.search : "")
                }
                source.auth = relative.auth || source.auth;
                source.slashes = source.slashes || relative.slashes;
                source.href = urlFormat(source);
                return source
            }

            function parseHost(host) {
                var out = {};
                var port = portPattern.exec(host);
                if (port) {
                    port = port[0];
                    out.port = port.substr(1);
                    host = host.substr(0, host.length - port.length)
                }
                if (host) out.hostname = host;
                return out
            }
        }, {
            querystring: 5
        }
    ],
    8: [
        function (require, module, exports) {
            var events = require("events");
            exports.isArray = isArray;
            exports.isDate = function (obj) {
                return Object.prototype.toString.call(obj) === "[object Date]"
            };
            exports.isRegExp = function (obj) {
                return Object.prototype.toString.call(obj) === "[object RegExp]"
            };
            exports.print = function () {};
            exports.puts = function () {};
            exports.debug = function () {};
            exports.inspect = function (obj, showHidden, depth, colors) {
                var seen = [];
                var stylize = function (str, styleType) {
                    var styles = {
                        bold: [1, 22],
                        italic: [3, 23],
                        underline: [4, 24],
                        inverse: [7, 27],
                        white: [37, 39],
                        grey: [90, 39],
                        black: [30, 39],
                        blue: [34, 39],
                        cyan: [36, 39],
                        green: [32, 39],
                        magenta: [35, 39],
                        red: [31, 39],
                        yellow: [33, 39]
                    };
                    var style = {
                        special: "cyan",
                        number: "blue",
                        "boolean": "yellow",
                        undefined: "grey",
                        "null": "bold",
                        string: "green",
                        date: "magenta",
                        regexp: "red"
                    }[styleType];
                    if (style) {
                        return "[" + styles[style][0] + "m" + str + "[" + styles[style][1] + "m"
                    } else {
                        return str
                    }
                };
                if (!colors) {
                    stylize = function (str, styleType) {
                        return str
                    }
                }

                function format(value, recurseTimes) {
                    if (value && typeof value.inspect === "function" && value !== exports && !(value.constructor && value.constructor.prototype === value)) {
                        return value.inspect(recurseTimes)
                    }
                    switch (typeof value) {
                    case "undefined":
                        return stylize("undefined", "undefined");
                    case "string":
                        var simple = "'" + JSON.stringify(value)
                            .replace(/^"|"$/g, "")
                            .replace(/'/g, "\\'")
                            .replace(/\\"/g, '"') + "'";
                        return stylize(simple, "string");
                    case "number":
                        return stylize("" + value, "number");
                    case "boolean":
                        return stylize("" + value, "boolean")
                    }
                    if (value === null) {
                        return stylize("null", "null")
                    }
                    var visible_keys = Object_keys(value);
                    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;
                    if (typeof value === "function" && keys.length === 0) {
                        if (isRegExp(value)) {
                            return stylize("" + value, "regexp")
                        } else {
                            var name = value.name ? ": " + value.name : "";
                            return stylize("[Function" + name + "]", "special")
                        }
                    }
                    if (isDate(value) && keys.length === 0) {
                        return stylize(value.toUTCString(), "date")
                    }
                    var base, type, braces;
                    if (isArray(value)) {
                        type = "Array";
                        braces = ["[", "]"]
                    } else {
                        type = "Object";
                        braces = ["{", "}"]
                    } if (typeof value === "function") {
                        var n = value.name ? ": " + value.name : "";
                        base = isRegExp(value) ? " " + value : " [Function" + n + "]"
                    } else {
                        base = ""
                    } if (isDate(value)) {
                        base = " " + value.toUTCString()
                    }
                    if (keys.length === 0) {
                        return braces[0] + base + braces[1]
                    }
                    if (recurseTimes < 0) {
                        if (isRegExp(value)) {
                            return stylize("" + value, "regexp")
                        } else {
                            return stylize("[Object]", "special")
                        }
                    }
                    seen.push(value);
                    var output = keys.map(function (key) {
                        var name, str;
                        if (value.__lookupGetter__) {
                            if (value.__lookupGetter__(key)) {
                                if (value.__lookupSetter__(key)) {
                                    str = stylize("[Getter/Setter]", "special")
                                } else {
                                    str = stylize("[Getter]", "special")
                                }
                            } else {
                                if (value.__lookupSetter__(key)) {
                                    str = stylize("[Setter]", "special")
                                }
                            }
                        }
                        if (visible_keys.indexOf(key) < 0) {
                            name = "[" + key + "]"
                        }
                        if (!str) {
                            if (seen.indexOf(value[key]) < 0) {
                                if (recurseTimes === null) {
                                    str = format(value[key])
                                } else {
                                    str = format(value[key], recurseTimes - 1)
                                } if (str.indexOf("\n") > -1) {
                                    if (isArray(value)) {
                                        str = str.split("\n")
                                            .map(function (line) {
                                                return "  " + line
                                            })
                                            .join("\n")
                                            .substr(2)
                                    } else {
                                        str = "\n" + str.split("\n")
                                            .map(function (line) {
                                                return "   " + line
                                            })
                                            .join("\n")
                                    }
                                }
                            } else {
                                str = stylize("[Circular]", "special")
                            }
                        }
                        if (typeof name === "undefined") {
                            if (type === "Array" && key.match(/^\d+$/)) {
                                return str
                            }
                            name = JSON.stringify("" + key);
                            if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
                                name = name.substr(1, name.length - 2);
                                name = stylize(name, "name")
                            } else {
                                name = name.replace(/'/g, "\\'")
                                    .replace(/\\"/g, '"')
                                    .replace(/(^"|"$)/g, "'");
                                name = stylize(name, "string")
                            }
                        }
                        return name + ": " + str
                    });
                    seen.pop();
                    var numLinesEst = 0;
                    var length = output.reduce(function (prev, cur) {
                        numLinesEst++;
                        if (cur.indexOf("\n") >= 0) numLinesEst++;
                        return prev + cur.length + 1
                    }, 0);
                    if (length > 50) {
                        output = braces[0] + (base === "" ? "" : base + "\n ") + " " + output.join(",\n  ") + " " + braces[1]
                    } else {
                        output = braces[0] + base + " " + output.join(", ") + " " + braces[1]
                    }
                    return output
                }
                return format(obj, typeof depth === "undefined" ? 2 : depth)
            };

            function isArray(ar) {
                return Array.isArray(ar) || typeof ar === "object" && Object.prototype.toString.call(ar) === "[object Array]"
            }

            function isRegExp(re) {
                typeof re === "object" && Object.prototype.toString.call(re) === "[object RegExp]"
            }

            function isDate(d) {
                return typeof d === "object" && Object.prototype.toString.call(d) === "[object Date]"
            }

            function pad(n) {
                return n < 10 ? "0" + n.toString(10) : n.toString(10)
            }
            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            function timestamp() {
                var d = new Date;
                var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(":");
                return [d.getDate(), months[d.getMonth()], time].join(" ")
            }
            exports.log = function (msg) {};
            exports.pump = null;
            var Object_keys = Object.keys || function (obj) {
                    var res = [];
                    for (var key in obj) res.push(key);
                    return res
                };
            var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
                    var res = [];
                    for (var key in obj) {
                        if (Object.hasOwnProperty.call(obj, key)) res.push(key)
                    }
                    return res
                };
            var Object_create = Object.create || function (prototype, properties) {
                    var object;
                    if (prototype === null) {
                        object = {
                            __proto__: null
                        }
                    } else {
                        if (typeof prototype !== "object") {
                            throw new TypeError("typeof prototype[" + typeof prototype + "] != 'object'")
                        }
                        var Type = function () {};
                        Type.prototype = prototype;
                        object = new Type;
                        object.__proto__ = prototype
                    } if (typeof properties !== "undefined" && Object.defineProperties) {
                        Object.defineProperties(object, properties)
                    }
                    return object
                };
            exports.inherits = function (ctor, superCtor) {
                ctor.super_ = superCtor;
                ctor.prototype = Object_create(superCtor.prototype, {
                    constructor: {
                        value: ctor,
                        enumerable: false,
                        writable: true,
                        configurable: true
                    }
                })
            };
            var formatRegExp = /%[sdj%]/g;
            exports.format = function (f) {
                if (typeof f !== "string") {
                    var objects = [];
                    for (var i = 0; i < arguments.length; i++) {
                        objects.push(exports.inspect(arguments[i]))
                    }
                    return objects.join(" ")
                }
                var i = 1;
                var args = arguments;
                var len = args.length;
                var str = String(f)
                    .replace(formatRegExp, function (x) {
                        if (x === "%%") return "%";
                        if (i >= len) return x;
                        switch (x) {
                        case "%s":
                            return String(args[i++]);
                        case "%d":
                            return Number(args[i++]);
                        case "%j":
                            return JSON.stringify(args[i++]);
                        default:
                            return x
                        }
                    });
                for (var x = args[i]; i < len; x = args[++i]) {
                    if (x === null || typeof x !== "object") {
                        str += " " + x
                    } else {
                        str += " " + exports.inspect(x)
                    }
                }
                return str
            }
        }, {
            events: 2
        }
    ],
    9: [
        function (require, module, exports) {
            exports.readIEEE754 = function (buffer, offset, isBE, mLen, nBytes) {
                var e, m, eLen = nBytes * 8 - mLen - 1,
                    eMax = (1 << eLen) - 1,
                    eBias = eMax >> 1,
                    nBits = -7,
                    i = isBE ? 0 : nBytes - 1,
                    d = isBE ? 1 : -1,
                    s = buffer[offset + i];
                i += d;
                e = s & (1 << -nBits) - 1;
                s >>= -nBits;
                nBits += eLen;
                for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);
                m = e & (1 << -nBits) - 1;
                e >>= -nBits;
                nBits += mLen;
                for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);
                if (e === 0) {
                    e = 1 - eBias
                } else if (e === eMax) {
                    return m ? NaN : (s ? -1 : 1) * Infinity
                } else {
                    m = m + Math.pow(2, mLen);
                    e = e - eBias
                }
                return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
            };
            exports.writeIEEE754 = function (buffer, value, offset, isBE, mLen, nBytes) {
                var e, m, c, eLen = nBytes * 8 - mLen - 1,
                    eMax = (1 << eLen) - 1,
                    eBias = eMax >> 1,
                    rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
                    i = isBE ? nBytes - 1 : 0,
                    d = isBE ? -1 : 1,
                    s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
                value = Math.abs(value);
                if (isNaN(value) || value === Infinity) {
                    m = isNaN(value) ? 1 : 0;
                    e = eMax
                } else {
                    e = Math.floor(Math.log(value) / Math.LN2);
                    if (value * (c = Math.pow(2, -e)) < 1) {
                        e--;
                        c *= 2
                    }
                    if (e + eBias >= 1) {
                        value += rt / c
                    } else {
                        value += rt * Math.pow(2, 1 - eBias)
                    } if (value * c >= 2) {
                        e++;
                        c /= 2
                    }
                    if (e + eBias >= eMax) {
                        m = 0;
                        e = eMax
                    } else if (e + eBias >= 1) {
                        m = (value * c - 1) * Math.pow(2, mLen);
                        e = e + eBias
                    } else {
                        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
                        e = 0
                    }
                }
                for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8);
                e = e << mLen | m;
                eLen += mLen;
                for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8);
                buffer[offset + i - d] |= s * 128
            }
        }, {}
    ],
    10: [
        function (require, module, exports) {
            var assert = require("assert");
            exports.Buffer = Buffer;
            exports.SlowBuffer = Buffer;
            Buffer.poolSize = 8192;
            exports.INSPECT_MAX_BYTES = 50;

            function Buffer(subject, encoding, offset) {
                if (!(this instanceof Buffer)) {
                    return new Buffer(subject, encoding, offset)
                }
                this.parent = this;
                this.offset = 0;
                var type;
                if (typeof offset === "number") {
                    this.length = coerce(encoding);
                    this.offset = offset
                } else {
                    switch (type = typeof subject) {
                    case "number":
                        this.length = coerce(subject);
                        break;
                    case "string":
                        this.length = Buffer.byteLength(subject, encoding);
                        break;
                    case "object":
                        this.length = coerce(subject.length);
                        break;
                    default:
                        throw new Error("First argument needs to be a number, " + "array or string.")
                    }
                    if (isArrayIsh(subject)) {
                        for (var i = 0; i < this.length; i++) {
                            if (subject instanceof Buffer) {
                                this[i] = subject.readUInt8(i)
                            } else {
                                this[i] = subject[i]
                            }
                        }
                    } else if (type == "string") {
                        this.length = this.write(subject, 0, encoding)
                    } else if (type === "number") {
                        for (var i = 0; i < this.length; i++) {
                            this[i] = 0
                        }
                    }
                }
            }
            Buffer.prototype.get = function get(i) {
                if (i < 0 || i >= this.length) throw new Error("oob");
                return this[i]
            };
            Buffer.prototype.set = function set(i, v) {
                if (i < 0 || i >= this.length) throw new Error("oob");
                return this[i] = v
            };
            Buffer.byteLength = function (str, encoding) {
                switch (encoding || "utf8") {
                case "hex":
                    return str.length / 2;
                case "utf8":
                case "utf-8":
                    return utf8ToBytes(str)
                        .length;
                case "ascii":
                case "binary":
                    return str.length;
                case "base64":
                    return base64ToBytes(str)
                        .length;
                default:
                    throw new Error("Unknown encoding")
                }
            };
            Buffer.prototype.utf8Write = function (string, offset, length) {
                var bytes, pos;
                return Buffer._charsWritten = blitBuffer(utf8ToBytes(string), this, offset, length)
            };
            Buffer.prototype.asciiWrite = function (string, offset, length) {
                var bytes, pos;
                return Buffer._charsWritten = blitBuffer(asciiToBytes(string), this, offset, length)
            };
            Buffer.prototype.binaryWrite = Buffer.prototype.asciiWrite;
            Buffer.prototype.base64Write = function (string, offset, length) {
                var bytes, pos;
                return Buffer._charsWritten = blitBuffer(base64ToBytes(string), this, offset, length)
            };
            Buffer.prototype.base64Slice = function (start, end) {
                var bytes = Array.prototype.slice.apply(this, arguments);
                return require("base64-js")
                    .fromByteArray(bytes)
            };
            Buffer.prototype.utf8Slice = function () {
                var bytes = Array.prototype.slice.apply(this, arguments);
                var res = "";
                var tmp = "";
                var i = 0;
                while (i < bytes.length) {
                    if (bytes[i] <= 127) {
                        res += decodeUtf8Char(tmp) + String.fromCharCode(bytes[i]);
                        tmp = ""
                    } else tmp += "%" + bytes[i].toString(16);
                    i++
                }
                return res + decodeUtf8Char(tmp)
            };
            Buffer.prototype.asciiSlice = function () {
                var bytes = Array.prototype.slice.apply(this, arguments);
                var ret = "";
                for (var i = 0; i < bytes.length; i++) ret += String.fromCharCode(bytes[i]);
                return ret
            };
            Buffer.prototype.binarySlice = Buffer.prototype.asciiSlice;
            Buffer.prototype.inspect = function () {
                var out = [],
                    len = this.length;
                for (var i = 0; i < len; i++) {
                    out[i] = toHex(this[i]);
                    if (i == exports.INSPECT_MAX_BYTES) {
                        out[i + 1] = "...";
                        break
                    }
                }
                return "<Buffer " + out.join(" ") + ">"
            };
            Buffer.prototype.hexSlice = function (start, end) {
                var len = this.length;
                if (!start || start < 0) start = 0;
                if (!end || end < 0 || end > len) end = len;
                var out = "";
                for (var i = start; i < end; i++) {
                    out += toHex(this[i])
                }
                return out
            };
            Buffer.prototype.toString = function (encoding, start, end) {
                encoding = String(encoding || "utf8")
                    .toLowerCase();
                start = +start || 0;
                if (typeof end == "undefined") end = this.length;
                if (+end == start) {
                    return ""
                }
                switch (encoding) {
                case "hex":
                    return this.hexSlice(start, end);
                case "utf8":
                case "utf-8":
                    return this.utf8Slice(start, end);
                case "ascii":
                    return this.asciiSlice(start, end);
                case "binary":
                    return this.binarySlice(start, end);
                case "base64":
                    return this.base64Slice(start, end);
                case "ucs2":
                case "ucs-2":
                    return this.ucs2Slice(start, end);
                default:
                    throw new Error("Unknown encoding")
                }
            };
            Buffer.prototype.hexWrite = function (string, offset, length) {
                offset = +offset || 0;
                var remaining = this.length - offset;
                if (!length) {
                    length = remaining
                } else {
                    length = +length;
                    if (length > remaining) {
                        length = remaining
                    }
                }
                var strLen = string.length;
                if (strLen % 2) {
                    throw new Error("Invalid hex string")
                }
                if (length > strLen / 2) {
                    length = strLen / 2
                }
                for (var i = 0; i < length; i++) {
                    var byte = parseInt(string.substr(i * 2, 2), 16);
                    if (isNaN(byte)) throw new Error("Invalid hex string");
                    this[offset + i] = byte
                }
                Buffer._charsWritten = i * 2;
                return i
            };
            Buffer.prototype.write = function (string, offset, length, encoding) {
                if (isFinite(offset)) {
                    if (!isFinite(length)) {
                        encoding = length;
                        length = undefined
                    }
                } else {
                    var swap = encoding;
                    encoding = offset;
                    offset = length;
                    length = swap
                }
                offset = +offset || 0;
                var remaining = this.length - offset;
                if (!length) {
                    length = remaining
                } else {
                    length = +length;
                    if (length > remaining) {
                        length = remaining
                    }
                }
                encoding = String(encoding || "utf8")
                    .toLowerCase();
                switch (encoding) {
                case "hex":
                    return this.hexWrite(string, offset, length);
                case "utf8":
                case "utf-8":
                    return this.utf8Write(string, offset, length);
                case "ascii":
                    return this.asciiWrite(string, offset, length);
                case "binary":
                    return this.binaryWrite(string, offset, length);
                case "base64":
                    return this.base64Write(string, offset, length);
                case "ucs2":
                case "ucs-2":
                    return this.ucs2Write(string, offset, length);
                default:
                    throw new Error("Unknown encoding")
                }
            };
            Buffer.prototype.slice = function (start, end) {
                if (end === undefined) end = this.length;
                if (end > this.length) {
                    throw new Error("oob")
                }
                if (start > end) {
                    throw new Error("oob")
                }
                return new Buffer(this, end - start, +start)
            };
            Buffer.prototype.copy = function (target, target_start, start, end) {
                var source = this;
                start || (start = 0);
                if (end === undefined || isNaN(end)) {
                    end = this.length
                }
                target_start || (target_start = 0);
                if (end < start) throw new Error("sourceEnd < sourceStart");
                if (end === start) return 0;
                if (target.length == 0 || source.length == 0) return 0;
                if (target_start < 0 || target_start >= target.length) {
                    throw new Error("targetStart out of bounds")
                }
                if (start < 0 || start >= source.length) {
                    throw new Error("sourceStart out of bounds")
                }
                if (end < 0 || end > source.length) {
                    throw new Error("sourceEnd out of bounds")
                }
                if (end > this.length) {
                    end = this.length
                }
                if (target.length - target_start < end - start) {
                    end = target.length - target_start + start
                }
                var temp = [];
                for (var i = start; i < end; i++) {
                    assert.ok(typeof this[i] !== "undefined", "copying undefined buffer bytes!");
                    temp.push(this[i])
                }
                for (var i = target_start; i < target_start + temp.length; i++) {
                    target[i] = temp[i - target_start]
                }
            };
            Buffer.prototype.fill = function fill(value, start, end) {
                value || (value = 0);
                start || (start = 0);
                end || (end = this.length);
                if (typeof value === "string") {
                    value = value.charCodeAt(0)
                }
                if (!(typeof value === "number") || isNaN(value)) {
                    throw new Error("value is not a number")
                }
                if (end < start) throw new Error("end < start");
                if (end === start) return 0;
                if (this.length == 0) return 0;
                if (start < 0 || start >= this.length) {
                    throw new Error("start out of bounds")
                }
                if (end < 0 || end > this.length) {
                    throw new Error("end out of bounds")
                }
                for (var i = start; i < end; i++) {
                    this[i] = value
                }
            };
            Buffer.isBuffer = function isBuffer(b) {
                return b instanceof Buffer || b instanceof Buffer
            };
            Buffer.concat = function (list, totalLength) {
                if (!isArray(list)) {
                    throw new Error("Usage: Buffer.concat(list, [totalLength])\n       list should be an Array.")
                }
                if (list.length === 0) {
                    return new Buffer(0)
                } else if (list.length === 1) {
                    return list[0]
                }
                if (typeof totalLength !== "number") {
                    totalLength = 0;
                    for (var i = 0; i < list.length; i++) {
                        var buf = list[i];
                        totalLength += buf.length
                    }
                }
                var buffer = new Buffer(totalLength);
                var pos = 0;
                for (var i = 0; i < list.length; i++) {
                    var buf = list[i];
                    buf.copy(buffer, pos);
                    pos += buf.length
                }
                return buffer
            };

            function coerce(length) {
                length = ~~Math.ceil(+length);
                return length < 0 ? 0 : length
            }

            function isArray(subject) {
                return (Array.isArray || function (subject) {
                    return {}.toString.apply(subject) == "[object Array]"
                })(subject)
            }

            function isArrayIsh(subject) {
                return isArray(subject) || Buffer.isBuffer(subject) || subject && typeof subject === "object" && typeof subject.length === "number"
            }

            function toHex(n) {
                if (n < 16) return "0" + n.toString(16);
                return n.toString(16)
            }

            function utf8ToBytes(str) {
                var byteArray = [];
                for (var i = 0; i < str.length; i++)
                    if (str.charCodeAt(i) <= 127) byteArray.push(str.charCodeAt(i));
                    else {
                        var h = encodeURIComponent(str.charAt(i))
                            .substr(1)
                            .split("%");
                        for (var j = 0; j < h.length; j++) byteArray.push(parseInt(h[j], 16))
                    }
                return byteArray
            }

            function asciiToBytes(str) {
                var byteArray = [];
                for (var i = 0; i < str.length; i++) byteArray.push(str.charCodeAt(i) & 255);
                return byteArray
            }

            function base64ToBytes(str) {
                return require("base64-js")
                    .toByteArray(str)
            }

            function blitBuffer(src, dst, offset, length) {
                var pos, i = 0;
                while (i < length) {
                    if (i + offset >= dst.length || i >= src.length) break;
                    dst[i + offset] = src[i];
                    i++
                }
                return i
            }

            function decodeUtf8Char(str) {
                try {
                    return decodeURIComponent(str)
                } catch (err) {
                    return String.fromCharCode(65533)
                }
            }
            Buffer.prototype.readUInt8 = function (offset, noAssert) {
                var buffer = this;
                if (!noAssert) {
                    assert.ok(offset !== undefined && offset !== null, "missing offset");
                    assert.ok(offset < buffer.length, "Trying to read beyond buffer length")
                }
                if (offset >= buffer.length) return;
                return buffer[offset]
            };

            function readUInt16(buffer, offset, isBigEndian, noAssert) {
                var val = 0;
                if (!noAssert) {
                    assert.ok(typeof isBigEndian === "boolean", "missing or invalid endian");
                    assert.ok(offset !== undefined && offset !== null, "missing offset");
                    assert.ok(offset + 1 < buffer.length, "Trying to read beyond buffer length")
                }
                if (offset >= buffer.length) return 0;
                if (isBigEndian) {
                    val = buffer[offset] << 8;
                    if (offset + 1 < buffer.length) {
                        val |= buffer[offset + 1]
                    }
                } else {
                    val = buffer[offset];
                    if (offset + 1 < buffer.length) {
                        val |= buffer[offset + 1] << 8
                    }
                }
                return val
            }
            Buffer.prototype.readUInt16LE = function (offset, noAssert) {
                return readUInt16(this, offset, false, noAssert)
            };
            Buffer.prototype.readUInt16BE = function (offset, noAssert) {
                return readUInt16(this, offset, true, noAssert)
            };

            function readUInt32(buffer, offset, isBigEndian, noAssert) {
                var val = 0;
                if (!noAssert) {
                    assert.ok(typeof isBigEndian === "boolean", "missing or invalid endian");
                    assert.ok(offset !== undefined && offset !== null, "missing offset");
                    assert.ok(offset + 3 < buffer.length, "Trying to read beyond buffer length")
                }
                if (offset >= buffer.length) return 0;
                if (isBigEndian) {
                    if (offset + 1 < buffer.length) val = buffer[offset + 1] << 16;
                    if (offset + 2 < buffer.length) val |= buffer[offset + 2] << 8;
                    if (offset + 3 < buffer.length) val |= buffer[offset + 3];
                    val = val + (buffer[offset] << 24 >>> 0)
                } else {
                    if (offset + 2 < buffer.length) val = buffer[offset + 2] << 16;
                    if (offset + 1 < buffer.length) val |= buffer[offset + 1] << 8;
                    val |= buffer[offset];
                    if (offset + 3 < buffer.length) val = val + (buffer[offset + 3] << 24 >>> 0)
                }
                return val
            }
            Buffer.prototype.readUInt32LE = function (offset, noAssert) {
                return readUInt32(this, offset, false, noAssert)
            };
            Buffer.prototype.readUInt32BE = function (offset, noAssert) {
                return readUInt32(this, offset, true, noAssert)
            };
            Buffer.prototype.readInt8 = function (offset, noAssert) {
                var buffer = this;
                var neg;
                if (!noAssert) {
                    assert.ok(offset !== undefined && offset !== null, "missing offset");
                    assert.ok(offset < buffer.length, "Trying to read beyond buffer length")
                }
                if (offset >= buffer.length) return;
                neg = buffer[offset] & 128;
                if (!neg) {
                    return buffer[offset]
                }
                return (255 - buffer[offset] + 1) * -1
            };

            function readInt16(buffer, offset, isBigEndian, noAssert) {
                var neg, val;
                if (!noAssert) {
                    assert.ok(typeof isBigEndian === "boolean", "missing or invalid endian");
                    assert.ok(offset !== undefined && offset !== null, "missing offset");
                    assert.ok(offset + 1 < buffer.length, "Trying to read beyond buffer length")
                }
                val = readUInt16(buffer, offset, isBigEndian, noAssert);
                neg = val & 32768;
                if (!neg) {
                    return val
                }
                return (65535 - val + 1) * -1
            }
            Buffer.prototype.readInt16LE = function (offset, noAssert) {
                return readInt16(this, offset, false, noAssert)
            };
            Buffer.prototype.readInt16BE = function (offset, noAssert) {
                return readInt16(this, offset, true, noAssert)
            };

            function readInt32(buffer, offset, isBigEndian, noAssert) {
                var neg, val;
                if (!noAssert) {
                    assert.ok(typeof isBigEndian === "boolean", "missing or invalid endian");
                    assert.ok(offset !== undefined && offset !== null, "missing offset");
                    assert.ok(offset + 3 < buffer.length, "Trying to read beyond buffer length")
                }
                val = readUInt32(buffer, offset, isBigEndian, noAssert);
                neg = val & 2147483648;
                if (!neg) {
                    return val
                }
                return (4294967295 - val + 1) * -1
            }
            Buffer.prototype.readInt32LE = function (offset, noAssert) {
                return readInt32(this, offset, false, noAssert)
            };
            Buffer.prototype.readInt32BE = function (offset, noAssert) {
                return readInt32(this, offset, true, noAssert)
            };

            function readFloat(buffer, offset, isBigEndian, noAssert) {
                if (!noAssert) {
                    assert.ok(typeof isBigEndian === "boolean", "missing or invalid endian");
                    assert.ok(offset + 3 < buffer.length, "Trying to read beyond buffer length")
                }
                return require("./buffer_ieee754")
                    .readIEEE754(buffer, offset, isBigEndian, 23, 4)
            }
            Buffer.prototype.readFloatLE = function (offset, noAssert) {
                return readFloat(this, offset, false, noAssert)
            };
            Buffer.prototype.readFloatBE = function (offset, noAssert) {
                return readFloat(this, offset, true, noAssert)
            };

            function readDouble(buffer, offset, isBigEndian, noAssert) {
                if (!noAssert) {
                    assert.ok(typeof isBigEndian === "boolean", "missing or invalid endian");
                    assert.ok(offset + 7 < buffer.length, "Trying to read beyond buffer length")
                }
                return require("./buffer_ieee754")
                    .readIEEE754(buffer, offset, isBigEndian, 52, 8)
            }
            Buffer.prototype.readDoubleLE = function (offset, noAssert) {
                return readDouble(this, offset, false, noAssert)
            };
            Buffer.prototype.readDoubleBE = function (offset, noAssert) {
                return readDouble(this, offset, true, noAssert)
            };

            function verifuint(value, max) {
                assert.ok(typeof value == "number", "cannot write a non-number as a number");
                assert.ok(value >= 0, "specified a negative value for writing an unsigned value");
                assert.ok(value <= max, "value is larger than maximum value for type");
                assert.ok(Math.floor(value) === value, "value has a fractional component")
            }
            Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
                var buffer = this;
                if (!noAssert) {
                    assert.ok(value !== undefined && value !== null, "missing value");
                    assert.ok(offset !== undefined && offset !== null, "missing offset");
                    assert.ok(offset < buffer.length, "trying to write beyond buffer length");
                    verifuint(value, 255)
                }
                if (offset < buffer.length) {
                    buffer[offset] = value
                }
            };

            function writeUInt16(buffer, value, offset, isBigEndian, noAssert) {
                if (!noAssert) {
                    assert.ok(value !== undefined && value !== null, "missing value");
                    assert.ok(typeof isBigEndian === "boolean", "missing or invalid endian");
                    assert.ok(offset !== undefined && offset !== null, "missing offset");
                    assert.ok(offset + 1 < buffer.length, "trying to write beyond buffer length");
                    verifuint(value, 65535)
                }
                for (var i = 0; i < Math.min(buffer.length - offset, 2); i++) {
                    buffer[offset + i] = (value & 255 << 8 * (isBigEndian ? 1 - i : i)) >>> (isBigEndian ? 1 - i : i) * 8
                }
            }
            Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
                writeUInt16(this, value, offset, false, noAssert)
            };
            Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
                writeUInt16(this, value, offset, true, noAssert)
            };

            function writeUInt32(buffer, value, offset, isBigEndian, noAssert) {
                if (!noAssert) {
                    assert.ok(value !== undefined && value !== null, "missing value");
                    assert.ok(typeof isBigEndian === "boolean", "missing or invalid endian");
                    assert.ok(offset !== undefined && offset !== null, "missing offset");
                    assert.ok(offset + 3 < buffer.length, "trying to write beyond buffer length");
                    verifuint(value, 4294967295)
                }
                for (var i = 0; i < Math.min(buffer.length - offset, 4); i++) {
                    buffer[offset + i] = value >>> (isBigEndian ? 3 - i : i) * 8 & 255
                }
            }
            Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
                writeUInt32(this, value, offset, false, noAssert)
            };
            Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
                writeUInt32(this, value, offset, true, noAssert)
            };

            function verifsint(value, max, min) {
                assert.ok(typeof value == "number", "cannot write a non-number as a number");
                assert.ok(value <= max, "value larger than maximum allowed value");
                assert.ok(value >= min, "value smaller than minimum allowed value");
                assert.ok(Math.floor(value) === value, "value has a fractional component")
            }

            function verifIEEE754(value, max, min) {
                assert.ok(typeof value == "number", "cannot write a non-number as a number");
                assert.ok(value <= max, "value larger than maximum allowed value");
                assert.ok(value >= min, "value smaller than minimum allowed value")
            }
            Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
                var buffer = this;
                if (!noAssert) {
                    assert.ok(value !== undefined && value !== null, "missing value");
                    assert.ok(offset !== undefined && offset !== null, "missing offset");
                    assert.ok(offset < buffer.length, "Trying to write beyond buffer length");
                    verifsint(value, 127, -128)
                }
                if (value >= 0) {
                    buffer.writeUInt8(value, offset, noAssert)
                } else {
                    buffer.writeUInt8(255 + value + 1, offset, noAssert)
                }
            };

            function writeInt16(buffer, value, offset, isBigEndian, noAssert) {
                if (!noAssert) {
                    assert.ok(value !== undefined && value !== null, "missing value");
                    assert.ok(typeof isBigEndian === "boolean", "missing or invalid endian");
                    assert.ok(offset !== undefined && offset !== null, "missing offset");
                    assert.ok(offset + 1 < buffer.length, "Trying to write beyond buffer length");
                    verifsint(value, 32767, -32768)
                }
                if (value >= 0) {
                    writeUInt16(buffer, value, offset, isBigEndian, noAssert)
                } else {
                    writeUInt16(buffer, 65535 + value + 1, offset, isBigEndian, noAssert)
                }
            }
            Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
                writeInt16(this, value, offset, false, noAssert)
            };
            Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
                writeInt16(this, value, offset, true, noAssert)
            };

            function writeInt32(buffer, value, offset, isBigEndian, noAssert) {
                if (!noAssert) {
                    assert.ok(value !== undefined && value !== null, "missing value");
                    assert.ok(typeof isBigEndian === "boolean", "missing or invalid endian");
                    assert.ok(offset !== undefined && offset !== null, "missing offset");
                    assert.ok(offset + 3 < buffer.length, "Trying to write beyond buffer length");
                    verifsint(value, 2147483647, -2147483648)
                }
                if (value >= 0) {
                    writeUInt32(buffer, value, offset, isBigEndian, noAssert)
                } else {
                    writeUInt32(buffer, 4294967295 + value + 1, offset, isBigEndian, noAssert)
                }
            }
            Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
                writeInt32(this, value, offset, false, noAssert)
            };
            Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
                writeInt32(this, value, offset, true, noAssert)
            };

            function writeFloat(buffer, value, offset, isBigEndian, noAssert) {
                if (!noAssert) {
                    assert.ok(value !== undefined && value !== null, "missing value");
                    assert.ok(typeof isBigEndian === "boolean", "missing or invalid endian");
                    assert.ok(offset !== undefined && offset !== null, "missing offset");
                    assert.ok(offset + 3 < buffer.length, "Trying to write beyond buffer length");
                    verifIEEE754(value, 3.4028234663852886e38, -3.4028234663852886e38)
                }
                require("./buffer_ieee754")
                    .writeIEEE754(buffer, value, offset, isBigEndian, 23, 4)
            }
            Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
                writeFloat(this, value, offset, false, noAssert)
            };
            Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
                writeFloat(this, value, offset, true, noAssert)
            };

            function writeDouble(buffer, value, offset, isBigEndian, noAssert) {
                if (!noAssert) {
                    assert.ok(value !== undefined && value !== null, "missing value");
                    assert.ok(typeof isBigEndian === "boolean", "missing or invalid endian");
                    assert.ok(offset !== undefined && offset !== null, "missing offset");
                    assert.ok(offset + 7 < buffer.length, "Trying to write beyond buffer length");
                    verifIEEE754(value, 1.7976931348623157e308, -1.7976931348623157e308)
                }
                require("./buffer_ieee754")
                    .writeIEEE754(buffer, value, offset, isBigEndian, 52, 8)
            }
            Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
                writeDouble(this, value, offset, false, noAssert)
            };
            Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
                writeDouble(this, value, offset, true, noAssert)
            }
        }, {
            "./buffer_ieee754": 9,
            assert: 1,
            "base64-js": 11
        }
    ],
    11: [
        function (require, module, exports) {
            ! function (exports) {
                "use strict";
                var lookup = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

                function b64ToByteArray(b64) {
                    var i, j, l, tmp, placeHolders, arr;
                    if (b64.length % 4 > 0) {
                        throw "Invalid string. Length must be a multiple of 4"
                    }
                    placeHolders = b64.indexOf("=");
                    placeHolders = placeHolders > 0 ? b64.length - placeHolders : 0;
                    arr = [];
                    l = placeHolders > 0 ? b64.length - 4 : b64.length;
                    for (i = 0, j = 0; i < l; i += 4, j += 3) {
                        tmp = lookup.indexOf(b64[i]) << 18 | lookup.indexOf(b64[i + 1]) << 12 | lookup.indexOf(b64[i + 2]) << 6 | lookup.indexOf(b64[i + 3]);
                        arr.push((tmp & 16711680) >> 16);
                        arr.push((tmp & 65280) >> 8);
                        arr.push(tmp & 255)
                    }
                    if (placeHolders === 2) {
                        tmp = lookup.indexOf(b64[i]) << 2 | lookup.indexOf(b64[i + 1]) >> 4;
                        arr.push(tmp & 255)
                    } else if (placeHolders === 1) {
                        tmp = lookup.indexOf(b64[i]) << 10 | lookup.indexOf(b64[i + 1]) << 4 | lookup.indexOf(b64[i + 2]) >> 2;
                        arr.push(tmp >> 8 & 255);
                        arr.push(tmp & 255)
                    }
                    return arr
                }

                function uint8ToBase64(uint8) {
                    var i, extraBytes = uint8.length % 3,
                        output = "",
                        temp, length;

                    function tripletToBase64(num) {
                        return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63]
                    }
                    for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
                        temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
                        output += tripletToBase64(temp)
                    }
                    switch (extraBytes) {
                    case 1:
                        temp = uint8[uint8.length - 1];
                        output += lookup[temp >> 2];
                        output += lookup[temp << 4 & 63];
                        output += "==";
                        break;
                    case 2:
                        temp = (uint8[uint8.length - 2] << 8) + uint8[uint8.length - 1];
                        output += lookup[temp >> 10];
                        output += lookup[temp >> 4 & 63];
                        output += lookup[temp << 2 & 63];
                        output += "=";
                        break
                    }
                    return output
                }
                module.exports.toByteArray = b64ToByteArray;
                module.exports.fromByteArray = uint8ToBase64
            }()
        }, {}
    ],
    12: [
        function (require, module, exports) {
            var Buffer = require("buffer")
                .Buffer;
            var sha = require("./sha");
            var sha256 = require("./sha256");
            var rng = require("./rng");
            var md5 = require("./md5");
            var algorithms = {
                sha1: {
                    hex: sha.hex_sha1,
                    base64: sha.b64_sha1,
                    binary: sha.str_sha1
                },
                sha256: {
                    hex: sha256.hex_sha256,
                    base64: sha256.b64_sha256,
                    binary: sha256.str_sha256
                },
                md5: {
                    hex: md5.hex_md5,
                    base64: md5.b64_md5,
                    binary: md5.bin_md5
                }
            };
            var algorithmsHmac = {
                sha1: {
                    hex: sha.hex_hmac_sha1,
                    base64: sha.b64_hmac_sha1,
                    binary: sha.str_hmac_sha1
                },
                sha256: {
                    hex: sha256.hex_hmac_sha256,
                    base64: sha256.b64_hmac_sha256,
                    binary: sha256.str_hmac_sha256
                },
                md5: {
                    hex: md5.hex_hmac_md5,
                    base64: md5.b64_hmac_md5,
                    binary: md5.bin_hmac_md5
                }
            };

            function error() {
                var m = [].slice.call(arguments)
                    .join(" ");
                throw new Error([m, "we accept pull requests", "http://github.com/dominictarr/crypto-browserify"].join("\n"))
            }
            exports.createHash = function (alg) {
                alg = alg || "sha1";
                if (!algorithms[alg]) error("algorithm:", alg, "is not yet supported");
                var s = "";
                var _alg = algorithms[alg];
                return {
                    update: function (data) {
                        s += data;
                        return this
                    },
                    digest: function (enc) {
                        enc = enc || "binary";
                        var fn;
                        if (!(fn = _alg[enc])) error("encoding:", enc, "is not yet supported for algorithm", alg);
                        var r = fn(s);
                        s = null;
                        return r
                    }
                }
            };
            exports.createHmac = function (alg, key) {
                if (!algorithmsHmac[alg]) error("algorithm:", alg, "is not yet supported");
                if (typeof key != "string") key = key.toString("binary");
                var s = "";
                var _alg = algorithmsHmac[alg];
                return {
                    update: function (data) {
                        s += data;
                        return this
                    },
                    digest: function (enc) {
                        enc = enc || "binary";
                        var fn;
                        if (!(fn = _alg[enc])) error("encoding:", enc, "is not yet support for algorithm", alg);
                        var r = fn(key, s);
                        s = null;
                        return r
                    }
                }
            };
            exports.randomBytes = function (size, callback) {
                if (callback && callback.call) {
                    try {
                        callback.call(this, undefined, new Buffer(rng(size)))
                    } catch (err) {
                        callback(err)
                    }
                } else {
                    return new Buffer(rng(size))
                }
            };

            function each(a, f) {
                for (var i in a) f(a[i], i)
            }
            each(["createCredentials", "createCipher", "createCipheriv", "createDecipher", "createDecipheriv", "createSign", "createVerify", "createDiffieHellman", "pbkdf2"], function (name) {
                exports[name] = function () {
                    error("sorry,", name, "is not implemented yet")
                }
            })
        }, {
            "./md5": 13,
            "./rng": 14,
            "./sha": 15,
            "./sha256": 16,
            buffer: 10
        }
    ],
    13: [
        function (require, module, exports) {
            var hexcase = 0;
            var b64pad = "=";
            var chrsz = 8;

            function hex_md5(s) {
                return binl2hex(core_md5(str2binl(s), s.length * chrsz))
            }

            function b64_md5(s) {
                return binl2b64(core_md5(str2binl(s), s.length * chrsz))
            }

            function str_md5(s) {
                return binl2str(core_md5(str2binl(s), s.length * chrsz))
            }

            function hex_hmac_md5(key, data) {
                return binl2hex(core_hmac_md5(key, data))
            }

            function b64_hmac_md5(key, data) {
                return binl2b64(core_hmac_md5(key, data))
            }

            function str_hmac_md5(key, data) {
                return binl2str(core_hmac_md5(key, data))
            }

            function md5_vm_test() {
                return hex_md5("abc") == "900150983cd24fb0d6963f7d28e17f72"
            }

            function core_md5(x, len) {
                x[len >> 5] |= 128 << len % 32;
                x[(len + 64 >>> 9 << 4) + 14] = len;
                var a = 1732584193;
                var b = -271733879;
                var c = -1732584194;
                var d = 271733878;
                for (var i = 0; i < x.length; i += 16) {
                    var olda = a;
                    var oldb = b;
                    var oldc = c;
                    var oldd = d;
                    a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
                    d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
                    c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
                    b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
                    a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
                    d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
                    c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
                    b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
                    a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
                    d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
                    c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
                    b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
                    a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
                    d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
                    c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
                    b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);
                    a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
                    d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
                    c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
                    b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
                    a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
                    d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
                    c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
                    b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
                    a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
                    d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
                    c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
                    b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
                    a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
                    d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
                    c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
                    b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);
                    a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
                    d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
                    c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
                    b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
                    a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
                    d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
                    c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
                    b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
                    a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
                    d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
                    c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
                    b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
                    a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
                    d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
                    c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
                    b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);
                    a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
                    d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
                    c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
                    b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
                    a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
                    d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
                    c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
                    b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
                    a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
                    d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
                    c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
                    b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
                    a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
                    d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
                    c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
                    b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);
                    a = safe_add(a, olda);
                    b = safe_add(b, oldb);
                    c = safe_add(c, oldc);
                    d = safe_add(d, oldd)
                }
                return Array(a, b, c, d)
            }

            function md5_cmn(q, a, b, x, s, t) {
                return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b)
            }

            function md5_ff(a, b, c, d, x, s, t) {
                return md5_cmn(b & c | ~b & d, a, b, x, s, t)
            }

            function md5_gg(a, b, c, d, x, s, t) {
                return md5_cmn(b & d | c & ~d, a, b, x, s, t)
            }

            function md5_hh(a, b, c, d, x, s, t) {
                return md5_cmn(b ^ c ^ d, a, b, x, s, t)
            }

            function md5_ii(a, b, c, d, x, s, t) {
                return md5_cmn(c ^ (b | ~d), a, b, x, s, t)
            }

            function core_hmac_md5(key, data) {
                var bkey = str2binl(key);
                if (bkey.length > 16) bkey = core_md5(bkey, key.length * chrsz);
                var ipad = Array(16),
                    opad = Array(16);
                for (var i = 0; i < 16; i++) {
                    ipad[i] = bkey[i] ^ 909522486;
                    opad[i] = bkey[i] ^ 1549556828
                }
                var hash = core_md5(ipad.concat(str2binl(data)), 512 + data.length * chrsz);
                return core_md5(opad.concat(hash), 512 + 128)
            }

            function safe_add(x, y) {
                var lsw = (x & 65535) + (y & 65535);
                var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                return msw << 16 | lsw & 65535
            }

            function bit_rol(num, cnt) {
                return num << cnt | num >>> 32 - cnt
            }

            function str2binl(str) {
                var bin = Array();
                var mask = (1 << chrsz) - 1;
                for (var i = 0; i < str.length * chrsz; i += chrsz) bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << i % 32;
                return bin
            }

            function binl2str(bin) {
                var str = "";
                var mask = (1 << chrsz) - 1;
                for (var i = 0; i < bin.length * 32; i += chrsz) str += String.fromCharCode(bin[i >> 5] >>> i % 32 & mask);
                return str
            }

            function binl2hex(binarray) {
                var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
                var str = "";
                for (var i = 0; i < binarray.length * 4; i++) {
                    str += hex_tab.charAt(binarray[i >> 2] >> i % 4 * 8 + 4 & 15) + hex_tab.charAt(binarray[i >> 2] >> i % 4 * 8 & 15)
                }
                return str
            }

            function binl2b64(binarray) {
                var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                var str = "";
                for (var i = 0; i < binarray.length * 4; i += 3) {
                    var triplet = (binarray[i >> 2] >> 8 * (i % 4) & 255) << 16 | (binarray[i + 1 >> 2] >> 8 * ((i + 1) % 4) & 255) << 8 | binarray[i + 2 >> 2] >> 8 * ((i + 2) % 4) & 255;
                    for (var j = 0; j < 4; j++) {
                        if (i * 8 + j * 6 > binarray.length * 32) str += b64pad;
                        else str += tab.charAt(triplet >> 6 * (3 - j) & 63)
                    }
                }
                return str
            }
            exports.hex_md5 = hex_md5;
            exports.b64_md5 = b64_md5;
            exports.bin_md5 = str_md5;
            exports.hex_hmac_md5 = hex_hmac_md5;
            exports.b64_hmac_md5 = b64_hmac_md5;
            exports.bin_hmac_md5 = str_hmac_md5
        }, {}
    ],
    14: [
        function (require, module, exports) {
            ! function () {
                var _global = this;
                var mathRNG, whatwgRNG;
                mathRNG = function (size) {
                    var bytes = new Array(size);
                    var r;
                    for (var i = 0, r; i < size; i++) {
                        if ((i & 3) == 0) r = Math.random() * 4294967296;
                        bytes[i] = r >>> ((i & 3) << 3) & 255
                    }
                    return bytes
                };
                if (_global.crypto && crypto.getRandomValues) {
                    var _rnds = new Uint32Array(4);
                    whatwgRNG = function (size) {
                        var bytes = new Array(size);
                        crypto.getRandomValues(_rnds);
                        for (var c = 0; c < size; c++) {
                            bytes[c] = _rnds[c >> 2] >>> (c & 3) * 8 & 255
                        }
                        return bytes
                    }
                }
                module.exports = whatwgRNG || mathRNG
            }()
        }, {}
    ],
    15: [
        function (require, module, exports) {
            exports.hex_sha1 = hex_sha1;
            exports.b64_sha1 = b64_sha1;
            exports.str_sha1 = str_sha1;
            exports.hex_hmac_sha1 = hex_hmac_sha1;
            exports.b64_hmac_sha1 = b64_hmac_sha1;
            exports.str_hmac_sha1 = str_hmac_sha1;
            var hexcase = 0;
            var b64pad = "=";
            var chrsz = 8;

            function hex_sha1(s) {
                return binb2hex(core_sha1(str2binb(s), s.length * chrsz))
            }

            function b64_sha1(s) {
                return binb2b64(core_sha1(str2binb(s), s.length * chrsz))
            }

            function str_sha1(s) {
                return binb2str(core_sha1(str2binb(s), s.length * chrsz))
            }

            function hex_hmac_sha1(key, data) {
                return binb2hex(core_hmac_sha1(key, data))
            }

            function b64_hmac_sha1(key, data) {
                return binb2b64(core_hmac_sha1(key, data))
            }

            function str_hmac_sha1(key, data) {
                return binb2str(core_hmac_sha1(key, data))
            }

            function sha1_vm_test() {
                return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d"
            }

            function core_sha1(x, len) {
                x[len >> 5] |= 128 << 24 - len % 32;
                x[(len + 64 >> 9 << 4) + 15] = len;
                var w = Array(80);
                var a = 1732584193;
                var b = -271733879;
                var c = -1732584194;
                var d = 271733878;
                var e = -1009589776;
                for (var i = 0; i < x.length; i += 16) {
                    var olda = a;
                    var oldb = b;
                    var oldc = c;
                    var oldd = d;
                    var olde = e;
                    for (var j = 0; j < 80; j++) {
                        if (j < 16) w[j] = x[i + j];
                        else w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
                        var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)), safe_add(safe_add(e, w[j]), sha1_kt(j)));
                        e = d;
                        d = c;
                        c = rol(b, 30);
                        b = a;
                        a = t
                    }
                    a = safe_add(a, olda);
                    b = safe_add(b, oldb);
                    c = safe_add(c, oldc);
                    d = safe_add(d, oldd);
                    e = safe_add(e, olde)
                }
                return Array(a, b, c, d, e)
            }

            function sha1_ft(t, b, c, d) {
                if (t < 20) return b & c | ~b & d;
                if (t < 40) return b ^ c ^ d;
                if (t < 60) return b & c | b & d | c & d;
                return b ^ c ^ d
            }

            function sha1_kt(t) {
                return t < 20 ? 1518500249 : t < 40 ? 1859775393 : t < 60 ? -1894007588 : -899497514
            }

            function core_hmac_sha1(key, data) {
                var bkey = str2binb(key);
                if (bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);
                var ipad = Array(16),
                    opad = Array(16);
                for (var i = 0; i < 16; i++) {
                    ipad[i] = bkey[i] ^ 909522486;
                    opad[i] = bkey[i] ^ 1549556828
                }
                var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
                return core_sha1(opad.concat(hash), 512 + 160)
            }

            function safe_add(x, y) {
                var lsw = (x & 65535) + (y & 65535);
                var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                return msw << 16 | lsw & 65535
            }

            function rol(num, cnt) {
                return num << cnt | num >>> 32 - cnt
            }

            function str2binb(str) {
                var bin = Array();
                var mask = (1 << chrsz) - 1;
                for (var i = 0; i < str.length * chrsz; i += chrsz) bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << 32 - chrsz - i % 32;
                return bin
            }

            function binb2str(bin) {
                var str = "";
                var mask = (1 << chrsz) - 1;
                for (var i = 0; i < bin.length * 32; i += chrsz) str += String.fromCharCode(bin[i >> 5] >>> 32 - chrsz - i % 32 & mask);
                return str
            }

            function binb2hex(binarray) {
                var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
                var str = "";
                for (var i = 0; i < binarray.length * 4; i++) {
                    str += hex_tab.charAt(binarray[i >> 2] >> (3 - i % 4) * 8 + 4 & 15) + hex_tab.charAt(binarray[i >> 2] >> (3 - i % 4) * 8 & 15)
                }
                return str
            }

            function binb2b64(binarray) {
                var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                var str = "";
                for (var i = 0; i < binarray.length * 4; i += 3) {
                    var triplet = (binarray[i >> 2] >> 8 * (3 - i % 4) & 255) << 16 | (binarray[i + 1 >> 2] >> 8 * (3 - (i + 1) % 4) & 255) << 8 | binarray[i + 2 >> 2] >> 8 * (3 - (i + 2) % 4) & 255;
                    for (var j = 0; j < 4; j++) {
                        if (i * 8 + j * 6 > binarray.length * 32) str += b64pad;
                        else str += tab.charAt(triplet >> 6 * (3 - j) & 63)
                    }
                }
                return str
            }
        }, {}
    ],
    16: [
        function (require, module, exports) {
            exports.hex_sha256 = hex_sha256;
            exports.b64_sha256 = b64_sha256;
            exports.str_sha256 = str_sha256;
            exports.hex_hmac_sha256 = hex_hmac_sha256;
            exports.b64_hmac_sha256 = b64_hmac_sha256;
            exports.str_hmac_sha256 = str_hmac_sha256;
            var hexcase = 0;
            var b64pad = "=";
            var chrsz = 8;

            function hex_sha256(s) {
                return binb2hex(core_sha256(str2binb(s), s.length * chrsz))
            }

            function b64_sha256(s) {
                return binb2b64(core_sha256(str2binb(s), s.length * chrsz))
            }

            function str_sha256(s) {
                return binb2str(core_sha256(str2binb(s), s.length * chrsz))
            }

            function hex_hmac_sha256(key, data) {
                return binb2hex(core_hmac_sha256(key, data))
            }

            function b64_hmac_sha256(key, data) {
                return binb2b64(core_hmac_sha256(key, data))
            }

            function str_hmac_sha256(key, data) {
                return binb2str(core_hmac_sha256(key, data))
            }
            var safe_add = function (x, y) {
                var lsw = (x & 65535) + (y & 65535);
                var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                return msw << 16 | lsw & 65535
            };
            var S = function (X, n) {
                return X >>> n | X << 32 - n
            };
            var R = function (X, n) {
                return X >>> n
            };
            var Ch = function (x, y, z) {
                return x & y ^ ~x & z
            };
            var Maj = function (x, y, z) {
                return x & y ^ x & z ^ y & z
            };
            var Sigma0256 = function (x) {
                return S(x, 2) ^ S(x, 13) ^ S(x, 22)
            };
            var Sigma1256 = function (x) {
                return S(x, 6) ^ S(x, 11) ^ S(x, 25)
            };
            var Gamma0256 = function (x) {
                return S(x, 7) ^ S(x, 18) ^ R(x, 3)
            };
            var Gamma1256 = function (x) {
                return S(x, 17) ^ S(x, 19) ^ R(x, 10)
            };
            var core_sha256 = function (m, l) {
                var K = new Array(1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298);
                var HASH = new Array(1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225);
                var W = new Array(64);
                var a, b, c, d, e, f, g, h, i, j;
                var T1, T2;
                m[l >> 5] |= 128 << 24 - l % 32;
                m[(l + 64 >> 9 << 4) + 15] = l;
                for (var i = 0; i < m.length; i += 16) {
                    a = HASH[0];
                    b = HASH[1];
                    c = HASH[2];
                    d = HASH[3];
                    e = HASH[4];
                    f = HASH[5];
                    g = HASH[6];
                    h = HASH[7];
                    for (var j = 0; j < 64; j++) {
                        if (j < 16) {
                            W[j] = m[j + i]
                        } else {
                            W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16])
                        }
                        T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
                        T2 = safe_add(Sigma0256(a), Maj(a, b, c));
                        h = g;
                        g = f;
                        f = e;
                        e = safe_add(d, T1);
                        d = c;
                        c = b;
                        b = a;
                        a = safe_add(T1, T2)
                    }
                    HASH[0] = safe_add(a, HASH[0]);
                    HASH[1] = safe_add(b, HASH[1]);
                    HASH[2] = safe_add(c, HASH[2]);
                    HASH[3] = safe_add(d, HASH[3]);
                    HASH[4] = safe_add(e, HASH[4]);
                    HASH[5] = safe_add(f, HASH[5]);
                    HASH[6] = safe_add(g, HASH[6]);
                    HASH[7] = safe_add(h, HASH[7])
                }
                return HASH
            };
            var str2binb = function (str) {
                var bin = Array();
                var mask = (1 << chrsz) - 1;
                for (var i = 0; i < str.length * chrsz; i += chrsz) {
                    bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << 24 - i % 32
                }
                return bin
            };

            function binb2str(bin) {
                var str = "";
                var mask = (1 << chrsz) - 1;
                for (var i = 0; i < bin.length * 32; i += chrsz) str += String.fromCharCode(bin[i >> 5] >>> 32 - chrsz - i % 32 & mask);
                return str
            }
            var hex2binb = function (a) {
                var b = [],
                    length = a.length,
                    i, num;
                for (i = 0; i < length; i += 2) {
                    num = parseInt(a.substr(i, 2), 16);
                    if (!isNaN(num)) {
                        b[i >> 3] |= num << 24 - 4 * (i % 8)
                    } else {
                        return "INVALID HEX STRING"
                    }
                }
                return b
            };
            var binb2hex = function (binarray) {
                var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
                var str = "";
                for (var i = 0; i < binarray.length * 4; i++) {
                    str += hex_tab.charAt(binarray[i >> 2] >> (3 - i % 4) * 8 + 4 & 15) + hex_tab.charAt(binarray[i >> 2] >> (3 - i % 4) * 8 & 15)
                }
                return str
            };
            var binb2b64 = function (a) {
                var b = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" + "0123456789+/",
                    str = "",
                    length = a.length * 4,
                    i, j, triplet;
                var b64pad = "=";
                for (i = 0; i < length; i += 3) {
                    triplet = (a[i >> 2] >> 8 * (3 - i % 4) & 255) << 16 | (a[i + 1 >> 2] >> 8 * (3 - (i + 1) % 4) & 255) << 8 | a[i + 2 >> 2] >> 8 * (3 - (i + 2) % 4) & 255;
                    for (j = 0; j < 4; j += 1) {
                        if (i * 8 + j * 6 <= a.length * 32) {
                            str += b.charAt(triplet >> 6 * (3 - j) & 63)
                        } else {
                            str += b64pad
                        }
                    }
                }
                return str
            };
            var core_hmac_sha256 = function (key, data) {
                var bkey = str2binb(key);
                if (bkey.length > 16) {
                    bkey = core_sha256(bkey, key.length * chrsz)
                }
                var ipad = Array(16),
                    opad = Array(16);
                for (var i = 0; i < 16; i++) {
                    ipad[i] = bkey[i] ^ 909522486;
                    opad[i] = bkey[i] ^ 1549556828
                }
                var hash = core_sha256(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
                return core_sha256(opad.concat(hash), 512 + 256)
            }
        }, {}
    ],
    17: [
        function (require, module, exports) {}, {}
    ],
    18: [
        function (require, module, exports) {
            var process = module.exports = {};
            process.nextTick = function () {
                var canSetImmediate = typeof window !== "undefined" && window.setImmediate;
                var canPost = typeof window !== "undefined" && window.postMessage && window.addEventListener;
                if (canSetImmediate) {
                    return function (f) {
                        return window.setImmediate(f)
                    }
                }
                if (canPost) {
                    var queue = [];
                    window.addEventListener("message", function (ev) {
                        if (ev.source === window && ev.data === "process-tick") {
                            ev.stopPropagation();
                            if (queue.length > 0) {
                                var fn = queue.shift();
                                fn()
                            }
                        }
                    }, true);
                    return function nextTick(fn) {
                        queue.push(fn);
                        window.postMessage("process-tick", "*")
                    }
                }
                return function nextTick(fn) {
                    setTimeout(fn, 0)
                }
            }();
            process.title = "browser";
            process.browser = true;
            process.env = {};
            process.argv = [];
            process.binding = function (name) {
                throw new Error("process.binding is not supported")
            };
            process.cwd = function () {
                return "/"
            };
            process.chdir = function (dir) {
                throw new Error("process.chdir is not supported")
            }
        }, {}
    ],
    19: [
        function (require, module, exports) {
            var Stream = require("stream");
            var sockjs = require("sockjs-client");
            var resolve = require("url")
                .resolve;
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
                    if (!ready || buffer.length) buffer.push(msg);
                    else sock.send(msg)
                };
                stream.end = function (msg) {
                    if (msg !== undefined) stream.write(msg);
                    if (!ready) {
                        stream._ended = true;
                        return
                    }
                    stream.writable = false;
                    sock.close()
                };
                stream.destroy = function () {
                    stream._ended = true;
                    stream.writable = stream.readable = false;
                    buffer.length = 0;
                    sock.close()
                };
                sock.onopen = function () {
                    if (typeof cb === "function") cb();
                    ready = true;
                    for (var i = 0; i < buffer.length; i++) {
                        sock.send(buffer[i])
                    }
                    buffer = [];
                    stream.emit("connect");
                    if (stream._ended) stream.end()
                };
                sock.onmessage = function (e) {
                    stream.emit("data", e.data)
                };
                sock.onclose = function () {
                    stream.emit("end");
                    stream.writable = false;
                    stream.readable = false
                };
                return stream
            }
        }, {
            "sockjs-client": 20,
            stream: 6,
            url: 7
        }
    ],
    20: [
        function (require, module, exports) {
            var JSON;
            JSON || (JSON = {}),
            function () {
                function str(a, b) {
                    var c, d, e, f, g = gap,
                        h, i = b[a];
                    i && typeof i == "object" && typeof i.toJSON == "function" && (i = i.toJSON(a)), typeof rep == "function" && (i = rep.call(b, a, i));
                    switch (typeof i) {
                    case "string":
                        return quote(i);
                    case "number":
                        return isFinite(i) ? String(i) : "null";
                    case "boolean":
                    case "null":
                        return String(i);
                    case "object":
                        if (!i) return "null";
                        gap += indent, h = [];
                        if (Object.prototype.toString.apply(i) === "[object Array]") {
                            f = i.length;
                            for (c = 0; c < f; c += 1) h[c] = str(c, i) || "null";
                            e = h.length === 0 ? "[]" : gap ? "[\n" + gap + h.join(",\n" + gap) + "\n" + g + "]" : "[" + h.join(",") + "]", gap = g;
                            return e
                        }
                        if (rep && typeof rep == "object") {
                            f = rep.length;
                            for (c = 0; c < f; c += 1) typeof rep[c] == "string" && (d = rep[c], e = str(d, i), e && h.push(quote(d) + (gap ? ": " : ":") + e))
                        } else
                            for (d in i) Object.prototype.hasOwnProperty.call(i, d) && (e = str(d, i), e && h.push(quote(d) + (gap ? ": " : ":") + e));
                        e = h.length === 0 ? "{}" : gap ? "{\n" + gap + h.join(",\n" + gap) + "\n" + g + "}" : "{" + h.join(",") + "}", gap = g;
                        return e
                    }
                }

                function quote(a) {
                    escapable.lastIndex = 0;
                    return escapable.test(a) ? '"' + a.replace(escapable, function (a) {
                        var b = meta[a];
                        return typeof b == "string" ? b : "\\u" + ("0000" + a.charCodeAt(0)
                            .toString(16))
                            .slice(-4)
                    }) + '"' : '"' + a + '"'
                }

                function f(a) {
                    return a < 10 ? "0" + a : a
                }
                "use strict", typeof Date.prototype.toJSON != "function" && (Date.prototype.toJSON = function (a) {
                    return isFinite(this.valueOf()) ? this.getUTCFullYear() + "-" + f(this.getUTCMonth() + 1) + "-" + f(this.getUTCDate()) + "T" + f(this.getUTCHours()) + ":" + f(this.getUTCMinutes()) + ":" + f(this.getUTCSeconds()) + "Z" : null
                }, String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function (a) {
                    return this.valueOf()
                });
                var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                    gap, indent, meta = {
                        "\b": "\\b",
                        " ": "\\t",
                        "\n": "\\n",
                        "\f": "\\f",
                        "\r": "\\r",
                        '"': '\\"',
                        "\\": "\\\\"
                    }, rep;
                typeof JSON.stringify != "function" && (JSON.stringify = function (a, b, c) {
                    var d;
                    gap = "", indent = "";
                    if (typeof c == "number")
                        for (d = 0; d < c; d += 1) indent += " ";
                    else typeof c == "string" && (indent = c);
                    rep = b;
                    if (!b || typeof b == "function" || typeof b == "object" && typeof b.length == "number") return str("", {
                        "": a
                    });
                    throw new Error("JSON.stringify")
                }), typeof JSON.parse != "function" && (JSON.parse = function (text, reviver) {
                    function walk(a, b) {
                        var c, d, e = a[b];
                        if (e && typeof e == "object")
                            for (c in e) Object.prototype.hasOwnProperty.call(e, c) && (d = walk(e, c), d !== undefined ? e[c] = d : delete e[c]);
                        return reviver.call(a, b, e)
                    }
                    var j;
                    text = String(text), cx.lastIndex = 0, cx.test(text) && (text = text.replace(cx, function (a) {
                        return "\\u" + ("0000" + a.charCodeAt(0)
                            .toString(16))
                            .slice(-4)
                    }));
                    if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
                        j = eval("(" + text + ")");
                        return typeof reviver == "function" ? walk({
                            "": j
                        }, "") : j
                    }
                    throw new SyntaxError("JSON.parse")
                })
            }();
            var SockJS = function () {
                var _document = document;
                var _window = window;
                var utils = {};
                var REventTarget = function () {};
                REventTarget.prototype.addEventListener = function (eventType, listener) {
                    if (!this._listeners) {
                        this._listeners = {}
                    }
                    if (!(eventType in this._listeners)) {
                        this._listeners[eventType] = []
                    }
                    var arr = this._listeners[eventType];
                    if (utils.arrIndexOf(arr, listener) === -1) {
                        arr.push(listener)
                    }
                    return
                };
                REventTarget.prototype.removeEventListener = function (eventType, listener) {
                    if (!(this._listeners && eventType in this._listeners)) {
                        return
                    }
                    var arr = this._listeners[eventType];
                    var idx = utils.arrIndexOf(arr, listener);
                    if (idx !== -1) {
                        if (arr.length > 1) {
                            this._listeners[eventType] = arr.slice(0, idx)
                                .concat(arr.slice(idx + 1))
                        } else {
                            delete this._listeners[eventType]
                        }
                        return
                    }
                    return
                };
                REventTarget.prototype.dispatchEvent = function (event) {
                    var t = event.type;
                    var args = Array.prototype.slice.call(arguments, 0);
                    if (this["on" + t]) {
                        this["on" + t].apply(this, args)
                    }
                    if (this._listeners && t in this._listeners) {
                        for (var i = 0; i < this._listeners[t].length; i++) {
                            this._listeners[t][i].apply(this, args)
                        }
                    }
                };
                var SimpleEvent = function (type, obj) {
                    this.type = type;
                    if (typeof obj !== "undefined") {
                        for (var k in obj) {
                            if (!obj.hasOwnProperty(k)) continue;
                            this[k] = obj[k]
                        }
                    }
                };
                SimpleEvent.prototype.toString = function () {
                    var r = [];
                    for (var k in this) {
                        if (!this.hasOwnProperty(k)) continue;
                        var v = this[k];
                        if (typeof v === "function") v = "[function]";
                        r.push(k + "=" + v)
                    }
                    return "SimpleEvent(" + r.join(", ") + ")"
                };
                var EventEmitter = function (events) {
                    this.events = events || []
                };
                EventEmitter.prototype.emit = function (type) {
                    var that = this;
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (!that.nuked && that["on" + type]) {
                        that["on" + type].apply(that, args)
                    }
                    if (utils.arrIndexOf(that.events, type) === -1) {
                        utils.log("Event " + JSON.stringify(type) + " not listed " + JSON.stringify(that.events) + " in " + that)
                    }
                };
                EventEmitter.prototype.nuke = function (type) {
                    var that = this;
                    that.nuked = true;
                    for (var i = 0; i < that.events.length; i++) {
                        delete that[that.events[i]]
                    }
                };
                var random_string_chars = "abcdefghijklmnopqrstuvwxyz0123456789_";
                utils.random_string = function (length, max) {
                    max = max || random_string_chars.length;
                    var i, ret = [];
                    for (i = 0; i < length; i++) {
                        ret.push(random_string_chars.substr(Math.floor(Math.random() * max), 1))
                    }
                    return ret.join("")
                };
                utils.random_number = function (max) {
                    return Math.floor(Math.random() * max)
                };
                utils.random_number_string = function (max) {
                    var t = ("" + (max - 1))
                        .length;
                    var p = Array(t + 1)
                        .join("0");
                    return (p + utils.random_number(max))
                        .slice(-t)
                };
                utils.getOrigin = function (url) {
                    url += "/";
                    var parts = url.split("/")
                        .slice(0, 3);
                    return parts.join("/")
                };
                utils.isSameOriginUrl = function (url_a, url_b) {
                    if (!url_b) url_b = _window.location.href;
                    return url_a.split("/")
                        .slice(0, 3)
                        .join("/") === url_b.split("/")
                        .slice(0, 3)
                        .join("/")
                };
                utils.getParentDomain = function (url) {
                    if (/^[0-9.]*$/.test(url)) return url;
                    if (/^\[/.test(url)) return url;
                    if (!/[.]/.test(url)) return url;
                    var parts = url.split(".")
                        .slice(1);
                    return parts.join(".")
                };
                utils.objectExtend = function (dst, src) {
                    for (var k in src) {
                        if (src.hasOwnProperty(k)) {
                            dst[k] = src[k]
                        }
                    }
                    return dst
                };
                var WPrefix = "_jp";
                utils.polluteGlobalNamespace = function () {
                    if (!(WPrefix in _window)) {
                        _window[WPrefix] = {}
                    }
                };
                utils.closeFrame = function (code, reason) {
                    return "c" + JSON.stringify([code, reason])
                };
                utils.userSetCode = function (code) {
                    return code === 1e3 || code >= 3e3 && code <= 4999
                };
                utils.countRTO = function (rtt) {
                    var rto;
                    if (rtt > 100) {
                        rto = 3 * rtt
                    } else {
                        rto = rtt + 200
                    }
                    return rto
                };
                utils.log = function () {
                    if (_window.console && console.log && console.log.apply) {
                        console.log.apply(console, arguments)
                    }
                };
                utils.bind = function (fun, that) {
                    if (fun.bind) {
                        return fun.bind(that)
                    } else {
                        return function () {
                            return fun.apply(that, arguments)
                        }
                    }
                };
                utils.flatUrl = function (url) {
                    return url.indexOf("?") === -1 && url.indexOf("#") === -1
                };
                utils.amendUrl = function (url) {
                    var dl = _document.location;
                    if (!url) {
                        throw new Error("Wrong url for SockJS")
                    }
                    if (!utils.flatUrl(url)) {
                        throw new Error("Only basic urls are supported in SockJS")
                    }
                    if (url.indexOf("//") === 0) {
                        url = dl.protocol + url
                    }
                    if (url.indexOf("/") === 0) {
                        url = dl.protocol + "//" + dl.host + url
                    }
                    url = url.replace(/[/]+$/, "");
                    return url
                };
                utils.arrIndexOf = function (arr, obj) {
                    for (var i = 0; i < arr.length; i++) {
                        if (arr[i] === obj) {
                            return i
                        }
                    }
                    return -1
                };
                utils.arrSkip = function (arr, obj) {
                    var idx = utils.arrIndexOf(arr, obj);
                    if (idx === -1) {
                        return arr.slice()
                    } else {
                        var dst = arr.slice(0, idx);
                        return dst.concat(arr.slice(idx + 1))
                    }
                };
                utils.isArray = Array.isArray || function (value) {
                    return {}.toString.call(value)
                        .indexOf("Array") >= 0
                };
                utils.delay = function (t, fun) {
                    if (typeof t === "function") {
                        fun = t;
                        t = 0
                    }
                    return setTimeout(fun, t)
                };
                var json_escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                    json_lookup = {
                        "\0": "\\u0000",
                        "": "\\u0001",
                        "": "\\u0002",
                        "": "\\u0003",
                        "": "\\u0004",
                        "": "\\u0005",
                        "": "\\u0006",
                        "": "\\u0007",
                        "\b": "\\b",
                        " ": "\\t",
                        "\n": "\\n",
                        "": "\\u000b",
                        "\f": "\\f",
                        "\r": "\\r",
                        "": "\\u000e",
                        "": "\\u000f",
                        "": "\\u0010",
                        "": "\\u0011",
                        "": "\\u0012",
                        "": "\\u0013",
                        "": "\\u0014",
                        "": "\\u0015",
                        "": "\\u0016",
                        "": "\\u0017",
                        "": "\\u0018",
                        "": "\\u0019",
                        "": "\\u001a",
                        "": "\\u001b",
                        "": "\\u001c",
                        "": "\\u001d",
                        "": "\\u001e",
                        "": "\\u001f",
                        '"': '\\"',
                        "\\": "\\\\",
                        "": "\\u007f",
                        "": "\\u0080",
                        "": "\\u0081",
                        "": "\\u0082",
                        "": "\\u0083",
                        "": "\\u0084",
                        "": "\\u0085",
                        "": "\\u0086",
                        "": "\\u0087",
                        "": "\\u0088",
                        "": "\\u0089",
                        "": "\\u008a",
                        "": "\\u008b",
                        "": "\\u008c",
                        "": "\\u008d",
                        "": "\\u008e",
                        "": "\\u008f",
                        "": "\\u0090",
                        "": "\\u0091",
                        "": "\\u0092",
                        "": "\\u0093",
                        "": "\\u0094",
                        "": "\\u0095",
                        "": "\\u0096",
                        "": "\\u0097",
                        "": "\\u0098",
                        "": "\\u0099",
                        "": "\\u009a",
                        "": "\\u009b",
                        "": "\\u009c",
                        "": "\\u009d",
                        "": "\\u009e",
                        "": "\\u009f",
                        "­": "\\u00ad",
                        "؀": "\\u0600",
                        "؁": "\\u0601",
                        "؂": "\\u0602",
                        "؃": "\\u0603",
                        "؄": "\\u0604",
                        "܏": "\\u070f",
                        "឴": "\\u17b4",
                        "឵": "\\u17b5",
                        "‌": "\\u200c",
                        "‍": "\\u200d",
                        "‎": "\\u200e",
                        "‏": "\\u200f",
                        "\u2028": "\\u2028",
                        "\u2029": "\\u2029",
                        "‪": "\\u202a",
                        "‫": "\\u202b",
                        "‬": "\\u202c",
                        "‭": "\\u202d",
                        "‮": "\\u202e",
                        " ": "\\u202f",
                        "⁠": "\\u2060",
                        "⁡": "\\u2061",
                        "⁢": "\\u2062",
                        "⁣": "\\u2063",
                        "⁤": "\\u2064",
                        "⁥": "\\u2065",
                        "⁦": "\\u2066",
                        "⁧": "\\u2067",
                        "⁨": "\\u2068",
                        "⁩": "\\u2069",
                        "⁪": "\\u206a",
                        "⁫": "\\u206b",
                        "⁬": "\\u206c",
                        "⁭": "\\u206d",
                        "⁮": "\\u206e",
                        "⁯": "\\u206f",
                        "﻿": "\\ufeff",
                        "￰": "\\ufff0",
                        "￱": "\\ufff1",
                        "￲": "\\ufff2",
                        "￳": "\\ufff3",
                        "￴": "\\ufff4",
                        "￵": "\\ufff5",
                        "￶": "\\ufff6",
                        "￷": "\\ufff7",
                        "￸": "\\ufff8",
                        "￹": "\\ufff9",
                        "￺": "\\ufffa",
                        "￻": "\\ufffb",
                        "￼": "\\ufffc",
                        "�": "\\ufffd",
                        "￾": "\\ufffe",
                        "￿": "\\uffff"
                    };
                var extra_escapable = /[\x00-\x1f\ud800-\udfff\ufffe\uffff\u0300-\u0333\u033d-\u0346\u034a-\u034c\u0350-\u0352\u0357-\u0358\u035c-\u0362\u0374\u037e\u0387\u0591-\u05af\u05c4\u0610-\u0617\u0653-\u0654\u0657-\u065b\u065d-\u065e\u06df-\u06e2\u06eb-\u06ec\u0730\u0732-\u0733\u0735-\u0736\u073a\u073d\u073f-\u0741\u0743\u0745\u0747\u07eb-\u07f1\u0951\u0958-\u095f\u09dc-\u09dd\u09df\u0a33\u0a36\u0a59-\u0a5b\u0a5e\u0b5c-\u0b5d\u0e38-\u0e39\u0f43\u0f4d\u0f52\u0f57\u0f5c\u0f69\u0f72-\u0f76\u0f78\u0f80-\u0f83\u0f93\u0f9d\u0fa2\u0fa7\u0fac\u0fb9\u1939-\u193a\u1a17\u1b6b\u1cda-\u1cdb\u1dc0-\u1dcf\u1dfc\u1dfe\u1f71\u1f73\u1f75\u1f77\u1f79\u1f7b\u1f7d\u1fbb\u1fbe\u1fc9\u1fcb\u1fd3\u1fdb\u1fe3\u1feb\u1fee-\u1fef\u1ff9\u1ffb\u1ffd\u2000-\u2001\u20d0-\u20d1\u20d4-\u20d7\u20e7-\u20e9\u2126\u212a-\u212b\u2329-\u232a\u2adc\u302b-\u302c\uaab2-\uaab3\uf900-\ufa0d\ufa10\ufa12\ufa15-\ufa1e\ufa20\ufa22\ufa25-\ufa26\ufa2a-\ufa2d\ufa30-\ufa6d\ufa70-\ufad9\ufb1d\ufb1f\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufb4e\ufff0-\uffff]/g,
                    extra_lookup;
                var JSONQuote = JSON && JSON.stringify || function (string) {
                        json_escapable.lastIndex = 0;
                        if (json_escapable.test(string)) {
                            string = string.replace(json_escapable, function (a) {
                                return json_lookup[a]
                            })
                        }
                        return '"' + string + '"'
                    };
                var unroll_lookup = function (escapable) {
                    var i;
                    var unrolled = {};
                    var c = [];
                    for (i = 0; i < 65536; i++) {
                        c.push(String.fromCharCode(i))
                    }
                    escapable.lastIndex = 0;
                    c.join("")
                        .replace(escapable, function (a) {
                            unrolled[a] = "\\u" + ("0000" + a.charCodeAt(0)
                                .toString(16))
                                .slice(-4);
                            return ""
                        });
                    escapable.lastIndex = 0;
                    return unrolled
                };
                utils.quote = function (string) {
                    var quoted = JSONQuote(string);
                    extra_escapable.lastIndex = 0;
                    if (!extra_escapable.test(quoted)) {
                        return quoted
                    }
                    if (!extra_lookup) extra_lookup = unroll_lookup(extra_escapable);
                    return quoted.replace(extra_escapable, function (a) {
                        return extra_lookup[a]
                    })
                };
                var _all_protocols = ["websocket", "xdr-streaming", "xhr-streaming", "iframe-eventsource", "iframe-htmlfile", "xdr-polling", "xhr-polling", "iframe-xhr-polling", "jsonp-polling"];
                utils.probeProtocols = function () {
                    var probed = {};
                    for (var i = 0; i < _all_protocols.length; i++) {
                        var protocol = _all_protocols[i];
                        probed[protocol] = SockJS[protocol] && SockJS[protocol].enabled()
                    }
                    return probed
                };
                utils.detectProtocols = function (probed, protocols_whitelist, info) {
                    var pe = {}, protocols = [];
                    if (!protocols_whitelist) protocols_whitelist = _all_protocols;
                    for (var i = 0; i < protocols_whitelist.length; i++) {
                        var protocol = protocols_whitelist[i];
                        pe[protocol] = probed[protocol]
                    }
                    var maybe_push = function (protos) {
                        var proto = protos.shift();
                        if (pe[proto]) {
                            protocols.push(proto)
                        } else {
                            if (protos.length > 0) {
                                maybe_push(protos)
                            }
                        }
                    };
                    if (info.websocket !== false) {
                        maybe_push(["websocket"])
                    }
                    if (pe["xhr-streaming"] && !info.null_origin) {
                        protocols.push("xhr-streaming")
                    } else {
                        if (pe["xdr-streaming"] && !info.cookie_needed && !info.null_origin) {
                            protocols.push("xdr-streaming")
                        } else {
                            maybe_push(["iframe-eventsource", "iframe-htmlfile"])
                        }
                    } if (pe["xhr-polling"] && !info.null_origin) {
                        protocols.push("xhr-polling")
                    } else {
                        if (pe["xdr-polling"] && !info.cookie_needed && !info.null_origin) {
                            protocols.push("xdr-polling")
                        } else {
                            maybe_push(["iframe-xhr-polling", "jsonp-polling"])
                        }
                    }
                    return protocols
                };
                var MPrefix = "_sockjs_global";
                utils.createHook = function () {
                    var window_id = "a" + utils.random_string(8);
                    if (!(MPrefix in _window)) {
                        var map = {};
                        _window[MPrefix] = function (window_id) {
                            if (!(window_id in map)) {
                                map[window_id] = {
                                    id: window_id,
                                    del: function () {
                                        delete map[window_id]
                                    }
                                }
                            }
                            return map[window_id]
                        }
                    }
                    return _window[MPrefix](window_id)
                };
                utils.attachMessage = function (listener) {
                    utils.attachEvent("message", listener)
                };
                utils.attachEvent = function (event, listener) {
                    if (typeof _window.addEventListener !== "undefined") {
                        _window.addEventListener(event, listener, false)
                    } else {
                        _document.attachEvent("on" + event, listener);
                        _window.attachEvent("on" + event, listener)
                    }
                };
                utils.detachMessage = function (listener) {
                    utils.detachEvent("message", listener)
                };
                utils.detachEvent = function (event, listener) {
                    if (typeof _window.addEventListener !== "undefined") {
                        _window.removeEventListener(event, listener, false)
                    } else {
                        _document.detachEvent("on" + event, listener);
                        _window.detachEvent("on" + event, listener)
                    }
                };
                var on_unload = {};
                var after_unload = false;
                var trigger_unload_callbacks = function () {
                    for (var ref in on_unload) {
                        on_unload[ref]();
                        delete on_unload[ref]
                    }
                };
                var unload_triggered = function () {
                    if (after_unload) return;
                    after_unload = true;
                    trigger_unload_callbacks()
                };
                utils.attachEvent("beforeunload", unload_triggered);
                utils.attachEvent("unload", unload_triggered);
                utils.unload_add = function (listener) {
                    var ref = utils.random_string(8);
                    on_unload[ref] = listener;
                    if (after_unload) {
                        utils.delay(trigger_unload_callbacks)
                    }
                    return ref
                };
                utils.unload_del = function (ref) {
                    if (ref in on_unload) delete on_unload[ref]
                };
                utils.createIframe = function (iframe_url, error_callback) {
                    var iframe = _document.createElement("iframe");
                    var tref, unload_ref;
                    var unattach = function () {
                        clearTimeout(tref);
                        try {
                            iframe.onload = null
                        } catch (x) {}
                        iframe.onerror = null
                    };
                    var cleanup = function () {
                        if (iframe) {
                            unattach();
                            setTimeout(function () {
                                if (iframe) {
                                    iframe.parentNode.removeChild(iframe)
                                }
                                iframe = null
                            }, 0);
                            utils.unload_del(unload_ref)
                        }
                    };
                    var onerror = function (r) {
                        if (iframe) {
                            cleanup();
                            error_callback(r)
                        }
                    };
                    var post = function (msg, origin) {
                        try {
                            if (iframe && iframe.contentWindow) {
                                iframe.contentWindow.postMessage(msg, origin)
                            }
                        } catch (x) {}
                    };
                    iframe.src = iframe_url;
                    iframe.style.display = "none";
                    iframe.style.position = "absolute";
                    iframe.onerror = function () {
                        onerror("onerror")
                    };
                    iframe.onload = function () {
                        clearTimeout(tref);
                        tref = setTimeout(function () {
                            onerror("onload timeout")
                        }, 2e3)
                    };
                    _document.body.appendChild(iframe);
                    tref = setTimeout(function () {
                        onerror("timeout")
                    }, 15e3);
                    unload_ref = utils.unload_add(cleanup);
                    return {
                        post: post,
                        cleanup: cleanup,
                        loaded: unattach
                    }
                };
                utils.createHtmlfile = function (iframe_url, error_callback) {
                    var doc = new ActiveXObject("htmlfile");
                    var tref, unload_ref;
                    var iframe;
                    var unattach = function () {
                        clearTimeout(tref)
                    };
                    var cleanup = function () {
                        if (doc) {
                            unattach();
                            utils.unload_del(unload_ref);
                            iframe.parentNode.removeChild(iframe);
                            iframe = doc = null;
                            CollectGarbage()
                        }
                    };
                    var onerror = function (r) {
                        if (doc) {
                            cleanup();
                            error_callback(r)
                        }
                    };
                    var post = function (msg, origin) {
                        try {
                            if (iframe && iframe.contentWindow) {
                                iframe.contentWindow.postMessage(msg, origin)
                            }
                        } catch (x) {}
                    };
                    doc.open();
                    doc.write("<html><s" + "cript>" + 'document.domain="' + document.domain + '";' + "</s" + "cript></html>");
                    doc.close();
                    doc.parentWindow[WPrefix] = _window[WPrefix];
                    var c = doc.createElement("div");
                    doc.body.appendChild(c);
                    iframe = doc.createElement("iframe");
                    c.appendChild(iframe);
                    iframe.src = iframe_url;
                    tref = setTimeout(function () {
                        onerror("timeout")
                    }, 15e3);
                    unload_ref = utils.unload_add(cleanup);
                    return {
                        post: post,
                        cleanup: cleanup,
                        loaded: unattach
                    }
                };
                var AbstractXHRObject = function () {};
                AbstractXHRObject.prototype = new EventEmitter(["chunk", "finish"]);
                AbstractXHRObject.prototype._start = function (method, url, payload, opts) {
                    var that = this;
                    try {
                        that.xhr = new XMLHttpRequest
                    } catch (x) {}
                    if (!that.xhr) {
                        try {
                            that.xhr = new _window.ActiveXObject("Microsoft.XMLHTTP")
                        } catch (x) {}
                    }
                    if (_window.ActiveXObject || _window.XDomainRequest) {
                        url += (url.indexOf("?") === -1 ? "?" : "&") + "t=" + +new Date
                    }
                    that.unload_ref = utils.unload_add(function () {
                        that._cleanup(true)
                    });
                    try {
                        that.xhr.open(method, url, true)
                    } catch (e) {
                        that.emit("finish", 0, "");
                        that._cleanup();
                        return
                    }
                    if (!opts || !opts.no_credentials) {
                        that.xhr.withCredentials = "true"
                    }
                    if (opts && opts.headers) {
                        for (var key in opts.headers) {
                            that.xhr.setRequestHeader(key, opts.headers[key])
                        }
                    }
                    that.xhr.onreadystatechange = function () {
                        if (that.xhr) {
                            var x = that.xhr;
                            switch (x.readyState) {
                            case 3:
                                try {
                                    var status = x.status;
                                    var text = x.responseText
                                } catch (x) {};
                                if (text && text.length > 0) {
                                    that.emit("chunk", status, text)
                                }
                                break;
                            case 4:
                                that.emit("finish", x.status, x.responseText);
                                that._cleanup(false);
                                break
                            }
                        }
                    };
                    that.xhr.send(payload)
                };
                AbstractXHRObject.prototype._cleanup = function (abort) {
                    var that = this;
                    if (!that.xhr) return;
                    utils.unload_del(that.unload_ref);
                    that.xhr.onreadystatechange = function () {};
                    if (abort) {
                        try {
                            that.xhr.abort()
                        } catch (x) {}
                    }
                    that.unload_ref = that.xhr = null
                };
                AbstractXHRObject.prototype.close = function () {
                    var that = this;
                    that.nuke();
                    that._cleanup(true)
                };
                var XHRCorsObject = utils.XHRCorsObject = function () {
                    var that = this,
                        args = arguments;
                    utils.delay(function () {
                        that._start.apply(that, args)
                    })
                };
                XHRCorsObject.prototype = new AbstractXHRObject;
                var XHRLocalObject = utils.XHRLocalObject = function (method, url, payload) {
                    var that = this;
                    utils.delay(function () {
                        that._start(method, url, payload, {
                            no_credentials: true
                        })
                    })
                };
                XHRLocalObject.prototype = new AbstractXHRObject;
                var XDRObject = utils.XDRObject = function (method, url, payload) {
                    var that = this;
                    utils.delay(function () {
                        that._start(method, url, payload)
                    })
                };
                XDRObject.prototype = new EventEmitter(["chunk", "finish"]);
                XDRObject.prototype._start = function (method, url, payload) {
                    var that = this;
                    var xdr = new XDomainRequest;
                    url += (url.indexOf("?") === -1 ? "?" : "&") + "t=" + +new Date;
                    var onerror = xdr.ontimeout = xdr.onerror = function () {
                        that.emit("finish", 0, "");
                        that._cleanup(false)
                    };
                    xdr.onprogress = function () {
                        that.emit("chunk", 200, xdr.responseText)
                    };
                    xdr.onload = function () {
                        that.emit("finish", 200, xdr.responseText);
                        that._cleanup(false)
                    };
                    that.xdr = xdr;
                    that.unload_ref = utils.unload_add(function () {
                        that._cleanup(true)
                    });
                    try {
                        that.xdr.open(method, url);
                        that.xdr.send(payload)
                    } catch (x) {
                        onerror()
                    }
                };
                XDRObject.prototype._cleanup = function (abort) {
                    var that = this;
                    if (!that.xdr) return;
                    utils.unload_del(that.unload_ref);
                    that.xdr.ontimeout = that.xdr.onerror = that.xdr.onprogress = that.xdr.onload = null;
                    if (abort) {
                        try {
                            that.xdr.abort()
                        } catch (x) {}
                    }
                    that.unload_ref = that.xdr = null
                };
                XDRObject.prototype.close = function () {
                    var that = this;
                    that.nuke();
                    that._cleanup(true)
                };
                utils.isXHRCorsCapable = function () {
                    if (_window.XMLHttpRequest && "withCredentials" in new XMLHttpRequest) {
                        return 1
                    }
                    if (_window.XDomainRequest && _document.domain) {
                        return 2
                    }
                    if (IframeTransport.enabled()) {
                        return 3
                    }
                    return 4
                };
                var SockJS = function (url, dep_protocols_whitelist, options) {
                    if (this === window) {
                        return new SockJS(url, dep_protocols_whitelist, options)
                    }
                    var that = this,
                        protocols_whitelist;
                    that._options = {
                        devel: false,
                        debug: false,
                        protocols_whitelist: [],
                        info: undefined,
                        rtt: undefined
                    };
                    if (options) {
                        utils.objectExtend(that._options, options)
                    }
                    that._base_url = utils.amendUrl(url);
                    that._server = that._options.server || utils.random_number_string(1e3);
                    if (that._options.protocols_whitelist && that._options.protocols_whitelist.length) {
                        protocols_whitelist = that._options.protocols_whitelist
                    } else {
                        if (typeof dep_protocols_whitelist === "string" && dep_protocols_whitelist.length > 0) {
                            protocols_whitelist = [dep_protocols_whitelist]
                        } else if (utils.isArray(dep_protocols_whitelist)) {
                            protocols_whitelist = dep_protocols_whitelist
                        } else {
                            protocols_whitelist = null
                        } if (protocols_whitelist) {
                            that._debug('Deprecated API: Use "protocols_whitelist" option ' + "instead of supplying protocol list as a second " + "parameter to SockJS constructor.")
                        }
                    }
                    that._protocols = [];
                    that.protocol = null;
                    that.readyState = SockJS.CONNECTING;
                    that._ir = createInfoReceiver(that._base_url);
                    that._ir.onfinish = function (info, rtt) {
                        that._ir = null;
                        if (info) {
                            if (that._options.info) {
                                info = utils.objectExtend(info, that._options.info)
                            }
                            if (that._options.rtt) {
                                rtt = that._options.rtt
                            }
                            that._applyInfo(info, rtt, protocols_whitelist);
                            that._didClose()
                        } else {
                            that._didClose(1002, "Can't connect to server", true)
                        }
                    }
                };
                SockJS.prototype = new REventTarget;
                SockJS.version = "0.3.1.7.ga67f.dirty";
                SockJS.CONNECTING = 0;
                SockJS.OPEN = 1;
                SockJS.CLOSING = 2;
                SockJS.CLOSED = 3;
                SockJS.prototype._debug = function () {
                    if (this._options.debug) utils.log.apply(utils, arguments)
                };
                SockJS.prototype._dispatchOpen = function () {
                    var that = this;
                    if (that.readyState === SockJS.CONNECTING) {
                        if (that._transport_tref) {
                            clearTimeout(that._transport_tref);
                            that._transport_tref = null
                        }
                        that.readyState = SockJS.OPEN;
                        that.dispatchEvent(new SimpleEvent("open"))
                    } else {
                        that._didClose(1006, "Server lost session")
                    }
                };
                SockJS.prototype._dispatchMessage = function (data) {
                    var that = this;
                    if (that.readyState !== SockJS.OPEN) return;
                    that.dispatchEvent(new SimpleEvent("message", {
                        data: data
                    }))
                };
                SockJS.prototype._dispatchHeartbeat = function (data) {
                    var that = this;
                    if (that.readyState !== SockJS.OPEN) return;
                    that.dispatchEvent(new SimpleEvent("heartbeat", {}))
                };
                SockJS.prototype._didClose = function (code, reason, force) {
                    var that = this;
                    if (that.readyState !== SockJS.CONNECTING && that.readyState !== SockJS.OPEN && that.readyState !== SockJS.CLOSING) throw new Error("INVALID_STATE_ERR");
                    if (that._ir) {
                        that._ir.nuke();
                        that._ir = null
                    }
                    if (that._transport) {
                        that._transport.doCleanup();
                        that._transport = null
                    }
                    var close_event = new SimpleEvent("close", {
                        code: code,
                        reason: reason,
                        wasClean: utils.userSetCode(code)
                    });
                    if (!utils.userSetCode(code) && that.readyState === SockJS.CONNECTING && !force) {
                        if (that._try_next_protocol(close_event)) {
                            return
                        }
                        close_event = new SimpleEvent("close", {
                            code: 2e3,
                            reason: "All transports failed",
                            wasClean: false,
                            last_event: close_event
                        })
                    }
                    that.readyState = SockJS.CLOSED;
                    utils.delay(function () {
                        that.dispatchEvent(close_event)
                    })
                };
                SockJS.prototype._didMessage = function (data) {
                    var that = this;
                    var type = data.slice(0, 1);
                    switch (type) {
                    case "o":
                        that._dispatchOpen();
                        break;
                    case "a":
                        var payload = JSON.parse(data.slice(1) || "[]");
                        for (var i = 0; i < payload.length; i++) {
                            that._dispatchMessage(payload[i])
                        }
                        break;
                    case "m":
                        var payload = JSON.parse(data.slice(1) || "null");
                        that._dispatchMessage(payload);
                        break;
                    case "c":
                        var payload = JSON.parse(data.slice(1) || "[]");
                        that._didClose(payload[0], payload[1]);
                        break;
                    case "h":
                        that._dispatchHeartbeat();
                        break
                    }
                };
                SockJS.prototype._try_next_protocol = function (close_event) {
                    var that = this;
                    if (that.protocol) {
                        that._debug("Closed transport:", that.protocol, "" + close_event);
                        that.protocol = null
                    }
                    if (that._transport_tref) {
                        clearTimeout(that._transport_tref);
                        that._transport_tref = null
                    }
                    while (1) {
                        var protocol = that.protocol = that._protocols.shift();
                        if (!protocol) {
                            return false
                        }
                        if (SockJS[protocol] && SockJS[protocol].need_body === true && (!_document.body || typeof _document.readyState !== "undefined" && _document.readyState !== "complete")) {
                            that._protocols.unshift(protocol);
                            that.protocol = "waiting-for-load";
                            utils.attachEvent("load", function () {
                                that._try_next_protocol()
                            });
                            return true
                        }
                        if (!SockJS[protocol] || !SockJS[protocol].enabled(that._options)) {
                            that._debug("Skipping transport:", protocol)
                        } else {
                            var roundTrips = SockJS[protocol].roundTrips || 1;
                            var to = (that._options.rto || 0) * roundTrips || 5e3;
                            that._transport_tref = utils.delay(to, function () {
                                if (that.readyState === SockJS.CONNECTING) {
                                    that._didClose(2007, "Transport timeouted")
                                }
                            });
                            var connid = utils.random_string(8);
                            var trans_url = that._base_url + "/" + that._server + "/" + connid;
                            that._debug("Opening transport:", protocol, " url:" + trans_url, " RTO:" + that._options.rto);
                            that._transport = new SockJS[protocol](that, trans_url, that._base_url);
                            return true
                        }
                    }
                };
                SockJS.prototype.close = function (code, reason) {
                    var that = this;
                    if (code && !utils.userSetCode(code)) throw new Error("INVALID_ACCESS_ERR");
                    if (that.readyState !== SockJS.CONNECTING && that.readyState !== SockJS.OPEN) {
                        return false
                    }
                    that.readyState = SockJS.CLOSING;
                    that._didClose(code || 1e3, reason || "Normal closure");
                    return true
                };
                SockJS.prototype.send = function (data) {
                    var that = this;
                    if (that.readyState === SockJS.CONNECTING) throw new Error("INVALID_STATE_ERR");
                    if (that.readyState === SockJS.OPEN) {
                        that._transport.doSend(utils.quote("" + data))
                    }
                    return true
                };
                SockJS.prototype._applyInfo = function (info, rtt, protocols_whitelist) {
                    var that = this;
                    that._options.info = info;
                    that._options.rtt = rtt;
                    that._options.rto = utils.countRTO(rtt);
                    that._options.info.null_origin = !_document.domain;
                    var probed = utils.probeProtocols();
                    that._protocols = utils.detectProtocols(probed, protocols_whitelist, info)
                };
                var WebSocketTransport = SockJS.websocket = function (ri, trans_url) {
                    var that = this;
                    var url = trans_url + "/websocket";
                    if (url.slice(0, 5) === "https") {
                        url = "wss" + url.slice(5)
                    } else {
                        url = "ws" + url.slice(4)
                    }
                    that.ri = ri;
                    that.url = url;
                    var Constructor = _window.WebSocket || _window.MozWebSocket;
                    that.ws = new Constructor(that.url);
                    that.ws.onmessage = function (e) {
                        that.ri._didMessage(e.data)
                    };
                    that.unload_ref = utils.unload_add(function () {
                        that.ws.close()
                    });
                    that.ws.onclose = function () {
                        that.ri._didMessage(utils.closeFrame(1006, "WebSocket connection broken"))
                    }
                };
                WebSocketTransport.prototype.doSend = function (data) {
                    this.ws.send("[" + data + "]")
                };
                WebSocketTransport.prototype.doCleanup = function () {
                    var that = this;
                    var ws = that.ws;
                    if (ws) {
                        ws.onmessage = ws.onclose = null;
                        ws.close();
                        utils.unload_del(that.unload_ref);
                        that.unload_ref = that.ri = that.ws = null
                    }
                };
                WebSocketTransport.enabled = function () {
                    return !!(_window.WebSocket || _window.MozWebSocket)
                };
                WebSocketTransport.roundTrips = 2;
                var BufferedSender = function () {};
                BufferedSender.prototype.send_constructor = function (sender) {
                    var that = this;
                    that.send_buffer = [];
                    that.sender = sender
                };
                BufferedSender.prototype.doSend = function (message) {
                    var that = this;
                    that.send_buffer.push(message);
                    if (!that.send_stop) {
                        that.send_schedule()
                    }
                };
                BufferedSender.prototype.send_schedule_wait = function () {
                    var that = this;
                    var tref;
                    that.send_stop = function () {
                        that.send_stop = null;
                        clearTimeout(tref)
                    };
                    tref = utils.delay(25, function () {
                        that.send_stop = null;
                        that.send_schedule()
                    })
                };
                BufferedSender.prototype.send_schedule = function () {
                    var that = this;
                    if (that.send_buffer.length > 0) {
                        var payload = "[" + that.send_buffer.join(",") + "]";
                        that.send_stop = that.sender(that.trans_url, payload, function () {
                            that.send_stop = null;
                            that.send_schedule_wait()
                        });
                        that.send_buffer = []
                    }
                };
                BufferedSender.prototype.send_destructor = function () {
                    var that = this;
                    if (that._send_stop) {
                        that._send_stop()
                    }
                    that._send_stop = null
                };
                var jsonPGenericSender = function (url, payload, callback) {
                    var that = this;
                    if (!("_send_form" in that)) {
                        var form = that._send_form = _document.createElement("form");
                        var area = that._send_area = _document.createElement("textarea");
                        area.name = "d";
                        form.style.display = "none";
                        form.style.position = "absolute";
                        form.method = "POST";
                        form.enctype = "application/x-www-form-urlencoded";
                        form.acceptCharset = "UTF-8";
                        form.appendChild(area);
                        _document.body.appendChild(form)
                    }
                    var form = that._send_form;
                    var area = that._send_area;
                    var id = "a" + utils.random_string(8);
                    form.target = id;
                    form.action = url + "/jsonp_send?i=" + id;
                    var iframe;
                    try {
                        iframe = _document.createElement('<iframe name="' + id + '">')
                    } catch (x) {
                        iframe = _document.createElement("iframe");
                        iframe.name = id
                    }
                    iframe.id = id;
                    form.appendChild(iframe);
                    iframe.style.display = "none";
                    try {
                        area.value = payload
                    } catch (e) {
                        utils.log("Your browser is seriously broken. Go home! " + e.message)
                    }
                    form.submit();
                    var completed = function (e) {
                        if (!iframe.onerror) return;
                        iframe.onreadystatechange = iframe.onerror = iframe.onload = null;
                        utils.delay(500, function () {
                            iframe.parentNode.removeChild(iframe);
                            iframe = null
                        });
                        area.value = "";
                        callback()
                    };
                    iframe.onerror = iframe.onload = completed;
                    iframe.onreadystatechange = function (e) {
                        if (iframe.readyState == "complete") completed()
                    };
                    return completed
                };
                var createAjaxSender = function (AjaxObject) {
                    return function (url, payload, callback) {
                        var xo = new AjaxObject("POST", url + "/xhr_send", payload);
                        xo.onfinish = function (status, text) {
                            callback(status)
                        };
                        return function (abort_reason) {
                            callback(0, abort_reason)
                        }
                    }
                };
                var jsonPGenericReceiver = function (url, callback) {
                    var tref;
                    var script = _document.createElement("script");
                    var script2;
                    var close_script = function (frame) {
                        if (script2) {
                            script2.parentNode.removeChild(script2);
                            script2 = null
                        }
                        if (script) {
                            clearTimeout(tref);
                            script.parentNode.removeChild(script);
                            script.onreadystatechange = script.onerror = script.onload = script.onclick = null;
                            script = null;
                            callback(frame);
                            callback = null
                        }
                    };
                    var loaded_okay = false;
                    var error_timer = null;
                    script.id = "a" + utils.random_string(8);
                    script.src = url;
                    script.type = "text/javascript";
                    script.charset = "UTF-8";
                    script.onerror = function (e) {
                        if (!error_timer) {
                            error_timer = setTimeout(function () {
                                if (!loaded_okay) {
                                    close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (onerror)"))
                                }
                            }, 1e3)
                        }
                    };
                    script.onload = function (e) {
                        close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (onload)"))
                    };
                    script.onreadystatechange = function (e) {
                        if (/loaded|closed/.test(script.readyState)) {
                            if (script && script.htmlFor && script.onclick) {
                                loaded_okay = true;
                                try {
                                    script.onclick()
                                } catch (x) {}
                            }
                            if (script) {
                                close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (onreadystatechange)"))
                            }
                        }
                    };
                    if (typeof script.async === "undefined" && _document.attachEvent) {
                        if (!/opera/i.test(navigator.userAgent)) {
                            try {
                                script.htmlFor = script.id;
                                script.event = "onclick"
                            } catch (x) {}
                            script.async = true
                        } else {
                            script2 = _document.createElement("script");
                            script2.text = "try{var a = document.getElementById('" + script.id + "'); if(a)a.onerror();}catch(x){};";
                            script.async = script2.async = false
                        }
                    }
                    if (typeof script.async !== "undefined") {
                        script.async = true
                    }
                    tref = setTimeout(function () {
                        close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (timeout)"))
                    }, 35e3);
                    var head = _document.getElementsByTagName("head")[0];
                    head.insertBefore(script, head.firstChild);
                    if (script2) {
                        head.insertBefore(script2, head.firstChild)
                    }
                    return close_script
                };
                var JsonPTransport = SockJS["jsonp-polling"] = function (ri, trans_url) {
                    utils.polluteGlobalNamespace();
                    var that = this;
                    that.ri = ri;
                    that.trans_url = trans_url;
                    that.send_constructor(jsonPGenericSender);
                    that._schedule_recv()
                };
                JsonPTransport.prototype = new BufferedSender;
                JsonPTransport.prototype._schedule_recv = function () {
                    var that = this;
                    var callback = function (data) {
                        that._recv_stop = null;
                        if (data) {
                            if (!that._is_closing) {
                                that.ri._didMessage(data)
                            }
                        }
                        if (!that._is_closing) {
                            that._schedule_recv()
                        }
                    };
                    that._recv_stop = jsonPReceiverWrapper(that.trans_url + "/jsonp", jsonPGenericReceiver, callback)
                };
                JsonPTransport.enabled = function () {
                    return true
                };
                JsonPTransport.need_body = true;
                JsonPTransport.prototype.doCleanup = function () {
                    var that = this;
                    that._is_closing = true;
                    if (that._recv_stop) {
                        that._recv_stop()
                    }
                    that.ri = that._recv_stop = null;
                    that.send_destructor()
                };
                var jsonPReceiverWrapper = function (url, constructReceiver, user_callback) {
                    var id = "a" + utils.random_string(6);
                    var url_id = url + "?c=" + escape(WPrefix + "." + id);
                    var callback = function (frame) {
                        delete _window[WPrefix][id];
                        user_callback(frame)
                    };
                    var close_script = constructReceiver(url_id, callback);
                    _window[WPrefix][id] = close_script;
                    var stop = function () {
                        if (_window[WPrefix][id]) {
                            _window[WPrefix][id](utils.closeFrame(1e3, "JSONP user aborted read"))
                        }
                    };
                    return stop
                };
                var AjaxBasedTransport = function () {};
                AjaxBasedTransport.prototype = new BufferedSender;
                AjaxBasedTransport.prototype.run = function (ri, trans_url, url_suffix, Receiver, AjaxObject) {
                    var that = this;
                    that.ri = ri;
                    that.trans_url = trans_url;
                    that.send_constructor(createAjaxSender(AjaxObject));
                    that.poll = new Polling(ri, Receiver, trans_url + url_suffix, AjaxObject)
                };
                AjaxBasedTransport.prototype.doCleanup = function () {
                    var that = this;
                    if (that.poll) {
                        that.poll.abort();
                        that.poll = null
                    }
                };
                var XhrStreamingTransport = SockJS["xhr-streaming"] = function (ri, trans_url) {
                    this.run(ri, trans_url, "/xhr_streaming", XhrReceiver, utils.XHRCorsObject)
                };
                XhrStreamingTransport.prototype = new AjaxBasedTransport;
                XhrStreamingTransport.enabled = function () {
                    return _window.XMLHttpRequest && "withCredentials" in new XMLHttpRequest && !/opera/i.test(navigator.userAgent)
                };
                XhrStreamingTransport.roundTrips = 2;
                XhrStreamingTransport.need_body = true;
                var XdrStreamingTransport = SockJS["xdr-streaming"] = function (ri, trans_url) {
                    this.run(ri, trans_url, "/xhr_streaming", XhrReceiver, utils.XDRObject)
                };
                XdrStreamingTransport.prototype = new AjaxBasedTransport;
                XdrStreamingTransport.enabled = function () {
                    return !!_window.XDomainRequest
                };
                XdrStreamingTransport.roundTrips = 2;
                var XhrPollingTransport = SockJS["xhr-polling"] = function (ri, trans_url) {
                    this.run(ri, trans_url, "/xhr", XhrReceiver, utils.XHRCorsObject)
                };
                XhrPollingTransport.prototype = new AjaxBasedTransport;
                XhrPollingTransport.enabled = XhrStreamingTransport.enabled;
                XhrPollingTransport.roundTrips = 2;
                var XdrPollingTransport = SockJS["xdr-polling"] = function (ri, trans_url) {
                    this.run(ri, trans_url, "/xhr", XhrReceiver, utils.XDRObject)
                };
                XdrPollingTransport.prototype = new AjaxBasedTransport;
                XdrPollingTransport.enabled = XdrStreamingTransport.enabled;
                XdrPollingTransport.roundTrips = 2;
                var IframeTransport = function () {};
                IframeTransport.prototype.i_constructor = function (ri, trans_url, base_url) {
                    var that = this;
                    that.ri = ri;
                    that.origin = utils.getOrigin(base_url);
                    that.base_url = base_url;
                    that.trans_url = trans_url;
                    var iframe_url = base_url + "/iframe.html";
                    if (that.ri._options.devel) {
                        iframe_url += "?t=" + +new Date
                    }
                    that.window_id = utils.random_string(8);
                    iframe_url += "#" + that.window_id;
                    that.iframeObj = utils.createIframe(iframe_url, function (r) {
                        that.ri._didClose(1006, "Unable to load an iframe (" + r + ")")
                    });
                    that.onmessage_cb = utils.bind(that.onmessage, that);
                    utils.attachMessage(that.onmessage_cb)
                };
                IframeTransport.prototype.doCleanup = function () {
                    var that = this;
                    if (that.iframeObj) {
                        utils.detachMessage(that.onmessage_cb);
                        try {
                            if (that.iframeObj.iframe.contentWindow) {
                                that.postMessage("c")
                            }
                        } catch (x) {}
                        that.iframeObj.cleanup();
                        that.iframeObj = null;
                        that.onmessage_cb = that.iframeObj = null
                    }
                };
                IframeTransport.prototype.onmessage = function (e) {
                    var that = this;
                    if (e.origin !== that.origin) return;
                    var window_id = e.data.slice(0, 8);
                    var type = e.data.slice(8, 9);
                    var data = e.data.slice(9);
                    if (window_id !== that.window_id) return;
                    switch (type) {
                    case "s":
                        that.iframeObj.loaded();
                        that.postMessage("s", JSON.stringify([SockJS.version, that.protocol, that.trans_url, that.base_url]));
                        break;
                    case "t":
                        that.ri._didMessage(data);
                        break
                    }
                };
                IframeTransport.prototype.postMessage = function (type, data) {
                    var that = this;
                    that.iframeObj.post(that.window_id + type + (data || ""), that.origin)
                };
                IframeTransport.prototype.doSend = function (message) {
                    this.postMessage("m", message)
                };
                IframeTransport.enabled = function () {
                    var konqueror = navigator && navigator.userAgent && navigator.userAgent.indexOf("Konqueror") !== -1;
                    return (typeof _window.postMessage === "function" || typeof _window.postMessage === "object") && !konqueror
                };
                var curr_window_id;
                var postMessage = function (type, data) {
                    if (parent !== _window) {
                        parent.postMessage(curr_window_id + type + (data || ""), "*")
                    } else {
                        utils.log("Can't postMessage, no parent window.", type, data)
                    }
                };
                var FacadeJS = function () {};
                FacadeJS.prototype._didClose = function (code, reason) {
                    postMessage("t", utils.closeFrame(code, reason))
                };
                FacadeJS.prototype._didMessage = function (frame) {
                    postMessage("t", frame)
                };
                FacadeJS.prototype._doSend = function (data) {
                    this._transport.doSend(data)
                };
                FacadeJS.prototype._doCleanup = function () {
                    this._transport.doCleanup()
                };
                utils.parent_origin = undefined;
                SockJS.bootstrap_iframe = function () {
                    var facade;
                    curr_window_id = _document.location.hash.slice(1);
                    var onMessage = function (e) {
                        if (e.source !== parent) return;
                        if (typeof utils.parent_origin === "undefined") utils.parent_origin = e.origin;
                        if (e.origin !== utils.parent_origin) return;
                        var window_id = e.data.slice(0, 8);
                        var type = e.data.slice(8, 9);
                        var data = e.data.slice(9);
                        if (window_id !== curr_window_id) return;
                        switch (type) {
                        case "s":
                            var p = JSON.parse(data);
                            var version = p[0];
                            var protocol = p[1];
                            var trans_url = p[2];
                            var base_url = p[3];
                            if (version !== SockJS.version) {
                                utils.log("Incompatibile SockJS! Main site uses:" + ' "' + version + '", the iframe:' + ' "' + SockJS.version + '".')
                            }
                            if (!utils.flatUrl(trans_url) || !utils.flatUrl(base_url)) {
                                utils.log("Only basic urls are supported in SockJS");
                                return
                            }
                            if (!utils.isSameOriginUrl(trans_url) || !utils.isSameOriginUrl(base_url)) {
                                utils.log("Can't connect to different domain from within an " + "iframe. (" + JSON.stringify([_window.location.href, trans_url, base_url]) + ")");
                                return
                            }
                            facade = new FacadeJS;
                            facade._transport = new FacadeJS[protocol](facade, trans_url, base_url);
                            break;
                        case "m":
                            facade._doSend(data);
                            break;
                        case "c":
                            if (facade) facade._doCleanup();
                            facade = null;
                            break
                        }
                    };
                    utils.attachMessage(onMessage);
                    postMessage("s")
                };
                var InfoReceiver = function (base_url, AjaxObject) {
                    var that = this;
                    utils.delay(function () {
                        that.doXhr(base_url, AjaxObject)
                    })
                };
                InfoReceiver.prototype = new EventEmitter(["finish"]);
                InfoReceiver.prototype.doXhr = function (base_url, AjaxObject) {
                    var that = this;
                    var t0 = (new Date)
                        .getTime();
                    var xo = new AjaxObject("GET", base_url + "/info");
                    var tref = utils.delay(8e3, function () {
                        xo.ontimeout()
                    });
                    xo.onfinish = function (status, text) {
                        clearTimeout(tref);
                        tref = null;
                        if (status === 200) {
                            var rtt = (new Date)
                                .getTime() - t0;
                            var info = JSON.parse(text);
                            if (typeof info !== "object") info = {};
                            that.emit("finish", info, rtt)
                        } else {
                            that.emit("finish")
                        }
                    };
                    xo.ontimeout = function () {
                        xo.close();
                        that.emit("finish")
                    }
                };
                var InfoReceiverIframe = function (base_url) {
                    var that = this;
                    var go = function () {
                        var ifr = new IframeTransport;
                        ifr.protocol = "w-iframe-info-receiver";
                        var fun = function (r) {
                            if (typeof r === "string" && r.substr(0, 1) === "m") {
                                var d = JSON.parse(r.substr(1));
                                var info = d[0],
                                    rtt = d[1];
                                that.emit("finish", info, rtt)
                            } else {
                                that.emit("finish")
                            }
                            ifr.doCleanup();
                            ifr = null
                        };
                        var mock_ri = {
                            _options: {},
                            _didClose: fun,
                            _didMessage: fun
                        };
                        ifr.i_constructor(mock_ri, base_url, base_url)
                    };
                    if (!_document.body) {
                        utils.attachEvent("load", go)
                    } else {
                        go()
                    }
                };
                InfoReceiverIframe.prototype = new EventEmitter(["finish"]);
                var InfoReceiverFake = function () {
                    var that = this;
                    utils.delay(function () {
                        that.emit("finish", {}, 2e3)
                    })
                };
                InfoReceiverFake.prototype = new EventEmitter(["finish"]);
                var createInfoReceiver = function (base_url) {
                    if (utils.isSameOriginUrl(base_url)) {
                        return new InfoReceiver(base_url, utils.XHRLocalObject)
                    }
                    switch (utils.isXHRCorsCapable()) {
                    case 1:
                        return new InfoReceiver(base_url, utils.XHRCorsObject);
                    case 2:
                        return new InfoReceiver(base_url, utils.XDRObject);
                    case 3:
                        return new InfoReceiverIframe(base_url);
                    default:
                        return new InfoReceiverFake
                    }
                };
                var WInfoReceiverIframe = FacadeJS["w-iframe-info-receiver"] = function (ri, _trans_url, base_url) {
                    var ir = new InfoReceiver(base_url, utils.XHRLocalObject);
                    ir.onfinish = function (info, rtt) {
                        ri._didMessage("m" + JSON.stringify([info, rtt]));
                        ri._didClose()
                    }
                };
                WInfoReceiverIframe.prototype.doCleanup = function () {};
                var EventSourceIframeTransport = SockJS["iframe-eventsource"] = function () {
                    var that = this;
                    that.protocol = "w-iframe-eventsource";
                    that.i_constructor.apply(that, arguments)
                };
                EventSourceIframeTransport.prototype = new IframeTransport;
                EventSourceIframeTransport.enabled = function () {
                    return "EventSource" in _window && IframeTransport.enabled()
                };
                EventSourceIframeTransport.need_body = true;
                EventSourceIframeTransport.roundTrips = 3;
                var EventSourceTransport = FacadeJS["w-iframe-eventsource"] = function (ri, trans_url) {
                    this.run(ri, trans_url, "/eventsource", EventSourceReceiver, utils.XHRLocalObject)
                };
                EventSourceTransport.prototype = new AjaxBasedTransport;
                var XhrPollingIframeTransport = SockJS["iframe-xhr-polling"] = function () {
                    var that = this;
                    that.protocol = "w-iframe-xhr-polling";
                    that.i_constructor.apply(that, arguments)
                };
                XhrPollingIframeTransport.prototype = new IframeTransport;
                XhrPollingIframeTransport.enabled = function () {
                    return _window.XMLHttpRequest && IframeTransport.enabled()
                };
                XhrPollingIframeTransport.need_body = true;
                XhrPollingIframeTransport.roundTrips = 3;
                var XhrPollingITransport = FacadeJS["w-iframe-xhr-polling"] = function (ri, trans_url) {
                    this.run(ri, trans_url, "/xhr", XhrReceiver, utils.XHRLocalObject)
                };
                XhrPollingITransport.prototype = new AjaxBasedTransport;
                var HtmlFileIframeTransport = SockJS["iframe-htmlfile"] = function () {
                    var that = this;
                    that.protocol = "w-iframe-htmlfile";
                    that.i_constructor.apply(that, arguments)
                };
                HtmlFileIframeTransport.prototype = new IframeTransport;
                HtmlFileIframeTransport.enabled = function () {
                    return IframeTransport.enabled()
                };
                HtmlFileIframeTransport.need_body = true;
                HtmlFileIframeTransport.roundTrips = 3;
                var HtmlFileTransport = FacadeJS["w-iframe-htmlfile"] = function (ri, trans_url) {
                    this.run(ri, trans_url, "/htmlfile", HtmlfileReceiver, utils.XHRLocalObject)
                };
                HtmlFileTransport.prototype = new AjaxBasedTransport;
                var Polling = function (ri, Receiver, recv_url, AjaxObject) {
                    var that = this;
                    that.ri = ri;
                    that.Receiver = Receiver;
                    that.recv_url = recv_url;
                    that.AjaxObject = AjaxObject;
                    that._scheduleRecv()
                };
                Polling.prototype._scheduleRecv = function () {
                    var that = this;
                    var poll = that.poll = new that.Receiver(that.recv_url, that.AjaxObject);
                    var msg_counter = 0;
                    poll.onmessage = function (e) {
                        msg_counter += 1;
                        that.ri._didMessage(e.data)
                    };
                    poll.onclose = function (e) {
                        that.poll = poll = poll.onmessage = poll.onclose = null;
                        if (!that.poll_is_closing) {
                            if (e.reason === "permanent") {
                                that.ri._didClose(1006, "Polling error (" + e.reason + ")")
                            } else {
                                that._scheduleRecv()
                            }
                        }
                    }
                };
                Polling.prototype.abort = function () {
                    var that = this;
                    that.poll_is_closing = true;
                    if (that.poll) {
                        that.poll.abort()
                    }
                };
                var EventSourceReceiver = function (url) {
                    var that = this;
                    var es = new EventSource(url);
                    es.onmessage = function (e) {
                        that.dispatchEvent(new SimpleEvent("message", {
                            data: unescape(e.data)
                        }))
                    };
                    that.es_close = es.onerror = function (e, abort_reason) {
                        var reason = abort_reason ? "user" : es.readyState !== 2 ? "network" : "permanent";
                        that.es_close = es.onmessage = es.onerror = null;
                        es.close();
                        es = null;
                        utils.delay(200, function () {
                            that.dispatchEvent(new SimpleEvent("close", {
                                reason: reason
                            }))
                        })
                    }
                };
                EventSourceReceiver.prototype = new REventTarget;
                EventSourceReceiver.prototype.abort = function () {
                    var that = this;
                    if (that.es_close) {
                        that.es_close({}, true)
                    }
                };
                var _is_ie_htmlfile_capable;
                var isIeHtmlfileCapable = function () {
                    if (_is_ie_htmlfile_capable === undefined) {
                        if ("ActiveXObject" in _window) {
                            try {
                                _is_ie_htmlfile_capable = !! new ActiveXObject("htmlfile")
                            } catch (x) {}
                        } else {
                            _is_ie_htmlfile_capable = false
                        }
                    }
                    return _is_ie_htmlfile_capable
                };
                var HtmlfileReceiver = function (url) {
                    var that = this;
                    utils.polluteGlobalNamespace();
                    that.id = "a" + utils.random_string(6, 26);
                    url += (url.indexOf("?") === -1 ? "?" : "&") + "c=" + escape(WPrefix + "." + that.id);
                    var constructor = isIeHtmlfileCapable() ? utils.createHtmlfile : utils.createIframe;
                    var iframeObj;
                    _window[WPrefix][that.id] = {
                        start: function () {
                            iframeObj.loaded()
                        },
                        message: function (data) {
                            that.dispatchEvent(new SimpleEvent("message", {
                                data: data
                            }))
                        },
                        stop: function () {
                            that.iframe_close({}, "network")
                        }
                    };
                    that.iframe_close = function (e, abort_reason) {
                        iframeObj.cleanup();
                        that.iframe_close = iframeObj = null;
                        delete _window[WPrefix][that.id];
                        that.dispatchEvent(new SimpleEvent("close", {
                            reason: abort_reason
                        }))
                    };
                    iframeObj = constructor(url, function (e) {
                        that.iframe_close({}, "permanent")
                    })
                };
                HtmlfileReceiver.prototype = new REventTarget;
                HtmlfileReceiver.prototype.abort = function () {
                    var that = this;
                    if (that.iframe_close) {
                        that.iframe_close({}, "user")
                    }
                };
                var XhrReceiver = function (url, AjaxObject) {
                    var that = this;
                    var buf_pos = 0;
                    that.xo = new AjaxObject("POST", url, null);
                    that.xo.onchunk = function (status, text) {
                        if (status !== 200) return;
                        while (1) {
                            var buf = text.slice(buf_pos);
                            var p = buf.indexOf("\n");
                            if (p === -1) break;
                            buf_pos += p + 1;
                            var msg = buf.slice(0, p);
                            that.dispatchEvent(new SimpleEvent("message", {
                                data: msg
                            }))
                        }
                    };
                    that.xo.onfinish = function (status, text) {
                        that.xo.onchunk(status, text);
                        that.xo = null;
                        var reason = status === 200 ? "network" : "permanent";
                        that.dispatchEvent(new SimpleEvent("close", {
                            reason: reason
                        }))
                    }
                };
                XhrReceiver.prototype = new REventTarget;
                XhrReceiver.prototype.abort = function () {
                    var that = this;
                    if (that.xo) {
                        that.xo.close();
                        that.dispatchEvent(new SimpleEvent("close", {
                            reason: "user"
                        }));
                        that.xo = null
                    }
                };
                SockJS.getUtils = function () {
                    return utils
                };
                SockJS.getIframeTransport = function () {
                    return IframeTransport
                };
                return SockJS
            }();
            if ("_sockjs_onload" in window) setTimeout(_sockjs_onload, 1);
            if (typeof define === "function" && define.amd) {
                define("sockjs", [], function () {
                    return SockJS
                })
            }
            if (typeof module === "object" && module && module.exports) {
                module.exports = SockJS
            }
        }, {}
    ],
    21: [
        function (require, module, exports) {
            var pnode = require("../../");
            pnode.addTransport("ws", require("./transports/ws"));
            window.pnode = pnode
        }, {
            "../../": 37,
            "./transports/ws": 22
        }
    ],
    22: [
        function (require, module, exports) {
            var shoe = require("shoe");
            exports.parse = function (str) {
                if (typeof str === "string" && /^.+\/.+$/.test(str)) {
                    str = "http://" + str
                }
                return [str]
            };
            exports.bindServer = function () {
                throw "bind server not supported in the browser"
            };
            exports.bindClient = function () {
                var args = arguments,
                    pclient = this;
                pclient.createConnection(function (callback) {
                    callback(shoe.apply(null, args))
                })
            }
        }, {
            shoe: 19
        }
    ],
    23: [
        function (require, module, exports) {
            var dnode = require("./lib/dnode");
            module.exports = function (cons, opts) {
                return new dnode(cons, opts)
            }
        }, {
            "./lib/dnode": 24
        }
    ],
    24: [
        function (require, module, exports) {
            var process = require("__browserify_process");
            var protocol = require("dnode-protocol");
            var Stream = require("stream");
            var json = typeof JSON === "object" ? JSON : require("jsonify");
            module.exports = dnode;
            dnode.prototype = {};
            ! function () {
                for (var key in Stream.prototype) {
                    dnode.prototype[key] = Stream.prototype[key]
                }
            }();

            function dnode(cons, opts) {
                Stream.call(this);
                var self = this;
                self.opts = opts || {};
                self.cons = typeof cons === "function" ? cons : function () {
                    return cons || {}
                };
                self.readable = true;
                self.writable = true;
                process.nextTick(function () {
                    if (self._ended) return;
                    self.proto = self._createProto();
                    self.proto.start();
                    if (!self._handleQueue) return;
                    for (var i = 0; i < self._handleQueue.length; i++) {
                        self.handle(self._handleQueue[i])
                    }
                })
            }
            dnode.prototype._createProto = function () {
                var self = this;
                var proto = protocol(function (remote) {
                    if (self._ended) return;
                    var ref = self.cons.call(this, remote, self);
                    if (typeof ref !== "object") ref = this;
                    self.emit("local", ref, self);
                    return ref
                }, self.opts.proto);
                proto.on("remote", function (remote) {
                    self.emit("remote", remote, self);
                    self.emit("ready")
                });
                proto.on("request", function (req) {
                    if (!self.readable) return;
                    if (self.opts.emit === "object") {
                        self.emit("data", req)
                    } else self.emit("data", json.stringify(req) + "\n")
                });
                proto.on("fail", function (err) {
                    self.emit("fail", err)
                });
                proto.on("error", function (err) {
                    self.emit("error", err)
                });
                return proto
            };
            dnode.prototype.write = function (buf) {
                if (this._ended) return;
                var self = this;
                var row;
                if (buf && typeof buf === "object" && buf.constructor && buf.constructor.name === "Buffer" && buf.length && typeof buf.slice === "function") {
                    if (!self._bufs) self._bufs = [];
                    for (var i = 0, j = 0; i < buf.length; i++) {
                        if (buf[i] === 10) {
                            self._bufs.push(buf.slice(j, i));
                            var line = "";
                            for (var k = 0; k < self._bufs.length; k++) {
                                line += String(self._bufs[k])
                            }
                            try {
                                row = json.parse(line)
                            } catch (err) {
                                return self.end()
                            }
                            j = i + 1;
                            self.handle(row);
                            self._bufs = []
                        }
                    }
                    if (j < buf.length) self._bufs.push(buf.slice(j, buf.length))
                } else if (buf && typeof buf === "object") {
                    self.handle(buf)
                } else {
                    if (typeof buf !== "string") buf = String(buf);
                    if (!self._line) self._line = "";
                    for (var i = 0; i < buf.length; i++) {
                        if (buf.charCodeAt(i) === 10) {
                            try {
                                row = json.parse(self._line)
                            } catch (err) {
                                return self.end()
                            }
                            self._line = "";
                            self.handle(row)
                        } else self._line += buf.charAt(i)
                    }
                }
            };
            dnode.prototype.handle = function (row) {
                if (!this.proto) {
                    if (!this._handleQueue) this._handleQueue = [];
                    this._handleQueue.push(row)
                } else this.proto.handle(row)
            };
            dnode.prototype.end = function () {
                if (this._ended) return;
                this._ended = true;
                this.writable = false;
                this.readable = false;
                this.emit("end")
            };
            dnode.prototype.destroy = function () {
                this.end()
            }
        }, {
            __browserify_process: 18,
            "dnode-protocol": 25,
            jsonify: 31,
            stream: 6
        }
    ],
    25: [
        function (require, module, exports) {
            var EventEmitter = require("events")
                .EventEmitter;
            var scrubber = require("./lib/scrub");
            var objectKeys = require("./lib/keys");
            var forEach = require("./lib/foreach");
            var isEnumerable = require("./lib/is_enum");
            module.exports = function (cons, opts) {
                return new Proto(cons, opts)
            };
            ! function () {
                for (var key in EventEmitter.prototype) {
                    Proto.prototype[key] = EventEmitter.prototype[key]
                }
            }();

            function Proto(cons, opts) {
                var self = this;
                EventEmitter.call(self);
                if (!opts) opts = {};
                self.remote = {};
                self.callbacks = {
                    local: [],
                    remote: []
                };
                self.wrap = opts.wrap;
                self.unwrap = opts.unwrap;
                self.scrubber = scrubber(self.callbacks.local);
                if (typeof cons === "function") {
                    self.instance = new cons(self.remote, self)
                } else self.instance = cons || {}
            }
            Proto.prototype.start = function () {
                this.request("methods", [this.instance])
            };
            Proto.prototype.cull = function (id) {
                delete this.callbacks.remote[id];
                this.emit("request", {
                    method: "cull",
                    arguments: [id]
                })
            };
            Proto.prototype.request = function (method, args) {
                var scrub = this.scrubber.scrub(args);
                this.emit("request", {
                    method: method,
                    arguments: scrub.arguments,
                    callbacks: scrub.callbacks,
                    links: scrub.links
                })
            };
            Proto.prototype.handle = function (req) {
                var self = this;
                var args = self.scrubber.unscrub(req, function (id) {
                    if (self.callbacks.remote[id] === undefined) {
                        var cb = function () {
                            self.request(id, [].slice.apply(arguments))
                        };
                        self.callbacks.remote[id] = self.wrap ? self.wrap(cb, id) : cb;
                        return cb
                    }
                    return self.unwrap ? self.unwrap(self.callbacks.remote[id], id) : self.callbacks.remote[id]
                });
                if (req.method === "methods") {
                    self.handleMethods(args[0])
                } else if (req.method === "cull") {
                    forEach(args, function (id) {
                        delete self.callbacks.local[id]
                    })
                } else if (typeof req.method === "string") {
                    if (isEnumerable(self.instance, req.method)) {
                        self.apply(self.instance[req.method], args)
                    } else {
                        self.emit("fail", new Error("request for non-enumerable method: " + req.method))
                    }
                } else if (typeof req.method == "number") {
                    var fn = self.callbacks.local[req.method];
                    if (!fn) {
                        self.emit("fail", new Error("no such method"))
                    } else self.apply(fn, args)
                }
            };
            Proto.prototype.handleMethods = function (methods) {
                var self = this;
                if (typeof methods != "object") {
                    methods = {}
                }
                forEach(objectKeys(self.remote), function (key) {
                    delete self.remote[key]
                });
                forEach(objectKeys(methods), function (key) {
                    self.remote[key] = methods[key]
                });
                self.emit("remote", self.remote);
                self.emit("ready")
            };
            Proto.prototype.apply = function (f, args) {
                try {
                    f.apply(undefined, args)
                } catch (err) {
                    this.emit("error", err)
                }
            }
        }, {
            "./lib/foreach": 26,
            "./lib/is_enum": 27,
            "./lib/keys": 28,
            "./lib/scrub": 29,
            events: 2
        }
    ],
    26: [
        function (require, module, exports) {
            module.exports = function forEach(xs, f) {
                if (xs.forEach) return xs.forEach(f);
                for (var i = 0; i < xs.length; i++) {
                    f.call(xs, xs[i], i)
                }
            }
        }, {}
    ],
    27: [
        function (require, module, exports) {
            var objectKeys = require("./keys");
            module.exports = function (obj, key) {
                if (Object.prototype.propertyIsEnumerable) {
                    return Object.prototype.propertyIsEnumerable.call(obj, key)
                }
                var keys = objectKeys(obj);
                for (var i = 0; i < keys.length; i++) {
                    if (key === keys[i]) return true
                }
                return false
            }
        }, {
            "./keys": 28
        }
    ],
    28: [
        function (require, module, exports) {
            module.exports = Object.keys || function (obj) {
                var keys = [];
                for (var key in obj) keys.push(key);
                return keys
            }
        }, {}
    ],
    29: [
        function (require, module, exports) {
            var traverse = require("traverse");
            var objectKeys = require("./keys");
            var forEach = require("./foreach");

            function indexOf(xs, x) {
                if (xs.indexOf) return xs.indexOf(x);
                for (var i = 0; i < xs.length; i++)
                    if (xs[i] === x) return i;
                return -1
            }
            module.exports = function (callbacks) {
                return new Scrubber(callbacks)
            };

            function Scrubber(callbacks) {
                this.callbacks = callbacks
            }
            Scrubber.prototype.scrub = function (obj) {
                var self = this;
                var paths = {};
                var links = [];
                var args = traverse(obj)
                    .map(function (node) {
                        if (typeof node === "function") {
                            var i = indexOf(self.callbacks, node);
                            if (i >= 0 && !(i in paths)) {
                                paths[i] = this.path
                            } else {
                                var id = self.callbacks.length;
                                self.callbacks.push(node);
                                paths[id] = this.path
                            }
                            this.update("[Function]")
                        } else if (this.circular) {
                            links.push({
                                from: this.circular.path,
                                to: this.path
                            });
                            this.update("[Circular]")
                        }
                    });
                return {
                    arguments: args,
                    callbacks: paths,
                    links: links
                }
            };
            Scrubber.prototype.unscrub = function (msg, f) {
                var args = msg.arguments || [];
                forEach(objectKeys(msg.callbacks || {}), function (sid) {
                    var id = parseInt(sid, 10);
                    var path = msg.callbacks[id];
                    traverse.set(args, path, f(id))
                });
                forEach(msg.links || [], function (link) {
                    var value = traverse.get(args, link.from);
                    traverse.set(args, link.to, value)
                });
                return args
            }
        }, {
            "./foreach": 26,
            "./keys": 28,
            traverse: 30
        }
    ],
    30: [
        function (require, module, exports) {
            var traverse = module.exports = function (obj) {
                return new Traverse(obj)
            };

            function Traverse(obj) {
                this.value = obj
            }
            Traverse.prototype.get = function (ps) {
                var node = this.value;
                for (var i = 0; i < ps.length; i++) {
                    var key = ps[i];
                    if (!Object.hasOwnProperty.call(node, key)) {
                        node = undefined;
                        break
                    }
                    node = node[key]
                }
                return node
            };
            Traverse.prototype.has = function (ps) {
                var node = this.value;
                for (var i = 0; i < ps.length; i++) {
                    var key = ps[i];
                    if (!Object.hasOwnProperty.call(node, key)) {
                        return false
                    }
                    node = node[key]
                }
                return true
            };
            Traverse.prototype.set = function (ps, value) {
                var node = this.value;
                for (var i = 0; i < ps.length - 1; i++) {
                    var key = ps[i];
                    if (!Object.hasOwnProperty.call(node, key)) node[key] = {};
                    node = node[key]
                }
                node[ps[i]] = value;
                return value
            };
            Traverse.prototype.map = function (cb) {
                return walk(this.value, cb, true)
            };
            Traverse.prototype.forEach = function (cb) {
                this.value = walk(this.value, cb, false);
                return this.value
            };
            Traverse.prototype.reduce = function (cb, init) {
                var skip = arguments.length === 1;
                var acc = skip ? this.value : init;
                this.forEach(function (x) {
                    if (!this.isRoot || !skip) {
                        acc = cb.call(this, acc, x)
                    }
                });
                return acc
            };
            Traverse.prototype.paths = function () {
                var acc = [];
                this.forEach(function (x) {
                    acc.push(this.path)
                });
                return acc
            };
            Traverse.prototype.nodes = function () {
                var acc = [];
                this.forEach(function (x) {
                    acc.push(this.node)
                });
                return acc
            };
            Traverse.prototype.clone = function () {
                var parents = [],
                    nodes = [];
                return function clone(src) {
                    for (var i = 0; i < parents.length; i++) {
                        if (parents[i] === src) {
                            return nodes[i]
                        }
                    }
                    if (typeof src === "object" && src !== null) {
                        var dst = copy(src);
                        parents.push(src);
                        nodes.push(dst);
                        forEach(objectKeys(src), function (key) {
                            dst[key] = clone(src[key])
                        });
                        parents.pop();
                        nodes.pop();
                        return dst
                    } else {
                        return src
                    }
                }(this.value)
            };

            function walk(root, cb, immutable) {
                var path = [];
                var parents = [];
                var alive = true;
                return function walker(node_) {
                    var node = immutable ? copy(node_) : node_;
                    var modifiers = {};
                    var keepGoing = true;
                    var state = {
                        node: node,
                        node_: node_,
                        path: [].concat(path),
                        parent: parents[parents.length - 1],
                        parents: parents,
                        key: path.slice(-1)[0],
                        isRoot: path.length === 0,
                        level: path.length,
                        circular: null,
                        update: function (x, stopHere) {
                            if (!state.isRoot) {
                                state.parent.node[state.key] = x
                            }
                            state.node = x;
                            if (stopHere) keepGoing = false
                        },
                        "delete": function (stopHere) {
                            delete state.parent.node[state.key];
                            if (stopHere) keepGoing = false
                        },
                        remove: function (stopHere) {
                            if (isArray(state.parent.node)) {
                                state.parent.node.splice(state.key, 1)
                            } else {
                                delete state.parent.node[state.key]
                            } if (stopHere) keepGoing = false
                        },
                        keys: null,
                        before: function (f) {
                            modifiers.before = f
                        },
                        after: function (f) {
                            modifiers.after = f
                        },
                        pre: function (f) {
                            modifiers.pre = f
                        },
                        post: function (f) {
                            modifiers.post = f
                        },
                        stop: function () {
                            alive = false
                        },
                        block: function () {
                            keepGoing = false
                        }
                    };
                    if (!alive) return state;

                    function updateState() {
                        if (typeof state.node === "object" && state.node !== null) {
                            if (!state.keys || state.node_ !== state.node) {
                                state.keys = objectKeys(state.node)
                            }
                            state.isLeaf = state.keys.length == 0;
                            for (var i = 0; i < parents.length; i++) {
                                if (parents[i].node_ === node_) {
                                    state.circular = parents[i];
                                    break
                                }
                            }
                        } else {
                            state.isLeaf = true;
                            state.keys = null
                        }
                        state.notLeaf = !state.isLeaf;
                        state.notRoot = !state.isRoot
                    }
                    updateState();
                    var ret = cb.call(state, state.node);
                    if (ret !== undefined && state.update) state.update(ret);
                    if (modifiers.before) modifiers.before.call(state, state.node);
                    if (!keepGoing) return state;
                    if (typeof state.node == "object" && state.node !== null && !state.circular) {
                        parents.push(state);
                        updateState();
                        forEach(state.keys, function (key, i) {
                            path.push(key);
                            if (modifiers.pre) modifiers.pre.call(state, state.node[key], key);
                            var child = walker(state.node[key]);
                            if (immutable && Object.hasOwnProperty.call(state.node, key)) {
                                state.node[key] = child.node
                            }
                            child.isLast = i == state.keys.length - 1;
                            child.isFirst = i == 0;
                            if (modifiers.post) modifiers.post.call(state, child);
                            path.pop()
                        });
                        parents.pop()
                    }
                    if (modifiers.after) modifiers.after.call(state, state.node);
                    return state
                }(root)
                    .node
            }

            function copy(src) {
                if (typeof src === "object" && src !== null) {
                    var dst;
                    if (isArray(src)) {
                        dst = []
                    } else if (isDate(src)) {
                        dst = new Date(src)
                    } else if (isRegExp(src)) {
                        dst = new RegExp(src)
                    } else if (isError(src)) {
                        dst = {
                            message: src.message
                        }
                    } else if (isBoolean(src)) {
                        dst = new Boolean(src)
                    } else if (isNumber(src)) {
                        dst = new Number(src)
                    } else if (isString(src)) {
                        dst = new String(src)
                    } else if (Object.create && Object.getPrototypeOf) {
                        dst = Object.create(Object.getPrototypeOf(src))
                    } else if (src.constructor === Object) {
                        dst = {}
                    } else {
                        var proto = src.constructor && src.constructor.prototype || src.__proto__ || {};
                        var T = function () {};
                        T.prototype = proto;
                        dst = new T
                    }
                    forEach(objectKeys(src), function (key) {
                        dst[key] = src[key]
                    });
                    return dst
                } else return src
            }
            var objectKeys = Object.keys || function keys(obj) {
                    var res = [];
                    for (var key in obj) res.push(key);
                    return res
                };

            function toS(obj) {
                return Object.prototype.toString.call(obj)
            }

            function isDate(obj) {
                return toS(obj) === "[object Date]"
            }

            function isRegExp(obj) {
                return toS(obj) === "[object RegExp]"
            }

            function isError(obj) {
                return toS(obj) === "[object Error]"
            }

            function isBoolean(obj) {
                return toS(obj) === "[object Boolean]"
            }

            function isNumber(obj) {
                return toS(obj) === "[object Number]"
            }

            function isString(obj) {
                return toS(obj) === "[object String]"
            }
            var isArray = Array.isArray || function isArray(xs) {
                    return Object.prototype.toString.call(xs) === "[object Array]"
                };
            var forEach = function (xs, fn) {
                if (xs.forEach) return xs.forEach(fn);
                else
                    for (var i = 0; i < xs.length; i++) {
                        fn(xs[i], i, xs)
                    }
            };
            forEach(objectKeys(Traverse.prototype), function (key) {
                traverse[key] = function (obj) {
                    var args = [].slice.call(arguments, 1);
                    var t = new Traverse(obj);
                    return t[key].apply(t, args)
                }
            })
        }, {}
    ],
    31: [
        function (require, module, exports) {
            exports.parse = require("./lib/parse");
            exports.stringify = require("./lib/stringify")
        }, {
            "./lib/parse": 32,
            "./lib/stringify": 33
        }
    ],
    32: [
        function (require, module, exports) {
            var at, ch, escapee = {
                    '"': '"',
                    "\\": "\\",
                    "/": "/",
                    b: "\b",
                    f: "\f",
                    n: "\n",
                    r: "\r",
                    t: "  "
                }, text, error = function (m) {
                    throw {
                        name: "SyntaxError",
                        message: m,
                        at: at,
                        text: text
                    }
                }, next = function (c) {
                    if (c && c !== ch) {
                        error("Expected '" + c + "' instead of '" + ch + "'")
                    }
                    ch = text.charAt(at);
                    at += 1;
                    return ch
                }, number = function () {
                    var number, string = "";
                    if (ch === "-") {
                        string = "-";
                        next("-")
                    }
                    while (ch >= "0" && ch <= "9") {
                        string += ch;
                        next()
                    }
                    if (ch === ".") {
                        string += ".";
                        while (next() && ch >= "0" && ch <= "9") {
                            string += ch
                        }
                    }
                    if (ch === "e" || ch === "E") {
                        string += ch;
                        next();
                        if (ch === "-" || ch === "+") {
                            string += ch;
                            next()
                        }
                        while (ch >= "0" && ch <= "9") {
                            string += ch;
                            next()
                        }
                    }
                    number = +string;
                    if (!isFinite(number)) {
                        error("Bad number")
                    } else {
                        return number
                    }
                }, string = function () {
                    var hex, i, string = "",
                        uffff;
                    if (ch === '"') {
                        while (next()) {
                            if (ch === '"') {
                                next();
                                return string
                            } else if (ch === "\\") {
                                next();
                                if (ch === "u") {
                                    uffff = 0;
                                    for (i = 0; i < 4; i += 1) {
                                        hex = parseInt(next(), 16);
                                        if (!isFinite(hex)) {
                                            break
                                        }
                                        uffff = uffff * 16 + hex
                                    }
                                    string += String.fromCharCode(uffff)
                                } else if (typeof escapee[ch] === "string") {
                                    string += escapee[ch]
                                } else {
                                    break
                                }
                            } else {
                                string += ch
                            }
                        }
                    }
                    error("Bad string")
                }, white = function () {
                    while (ch && ch <= " ") {
                        next()
                    }
                }, word = function () {
                    switch (ch) {
                    case "t":
                        next("t");
                        next("r");
                        next("u");
                        next("e");
                        return true;
                    case "f":
                        next("f");
                        next("a");
                        next("l");
                        next("s");
                        next("e");
                        return false;
                    case "n":
                        next("n");
                        next("u");
                        next("l");
                        next("l");
                        return null
                    }
                    error("Unexpected '" + ch + "'")
                }, value, array = function () {
                    var array = [];
                    if (ch === "[") {
                        next("[");
                        white();
                        if (ch === "]") {
                            next("]");
                            return array
                        }
                        while (ch) {
                            array.push(value());
                            white();
                            if (ch === "]") {
                                next("]");
                                return array
                            }
                            next(",");
                            white()
                        }
                    }
                    error("Bad array")
                }, object = function () {
                    var key, object = {};
                    if (ch === "{") {
                        next("{");
                        white();
                        if (ch === "}") {
                            next("}");
                            return object
                        }
                        while (ch) {
                            key = string();
                            white();
                            next(":");
                            if (Object.hasOwnProperty.call(object, key)) {
                                error('Duplicate key "' + key + '"')
                            }
                            object[key] = value();
                            white();
                            if (ch === "}") {
                                next("}");
                                return object
                            }
                            next(",");
                            white()
                        }
                    }
                    error("Bad object")
                };
            value = function () {
                white();
                switch (ch) {
                case "{":
                    return object();
                case "[":
                    return array();
                case '"':
                    return string();
                case "-":
                    return number();
                default:
                    return ch >= "0" && ch <= "9" ? number() : word()
                }
            };
            module.exports = function (source, reviver) {
                var result;
                text = source;
                at = 0;
                ch = " ";
                result = value();
                white();
                if (ch) {
                    error("Syntax error")
                }
                return typeof reviver === "function" ? function walk(holder, key) {
                    var k, v, value = holder[key];
                    if (value && typeof value === "object") {
                        for (k in value) {
                            if (Object.prototype.hasOwnProperty.call(value, k)) {
                                v = walk(value, k);
                                if (v !== undefined) {
                                    value[k] = v
                                } else {
                                    delete value[k]
                                }
                            }
                        }
                    }
                    return reviver.call(holder, key, value)
                }({
                    "": result
                }, "") : result
            }
        }, {}
    ],
    33: [
        function (require, module, exports) {
            var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                gap, indent, meta = {
                    "\b": "\\b",
                    " ": "\\t",
                    "\n": "\\n",
                    "\f": "\\f",
                    "\r": "\\r",
                    '"': '\\"',
                    "\\": "\\\\"
                }, rep;

            function quote(string) {
                escapable.lastIndex = 0;
                return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
                    var c = meta[a];
                    return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0)
                        .toString(16))
                        .slice(-4)
                }) + '"' : '"' + string + '"'
            }

            function str(key, holder) {
                var i, k, v, length, mind = gap,
                    partial, value = holder[key];
                if (value && typeof value === "object" && typeof value.toJSON === "function") {
                    value = value.toJSON(key)
                }
                if (typeof rep === "function") {
                    value = rep.call(holder, key, value)
                }
                switch (typeof value) {
                case "string":
                    return quote(value);
                case "number":
                    return isFinite(value) ? String(value) : "null";
                case "boolean":
                case "null":
                    return String(value);
                case "object":
                    if (!value) return "null";
                    gap += indent;
                    partial = [];
                    if (Object.prototype.toString.apply(value) === "[object Array]") {
                        length = value.length;
                        for (i = 0; i < length; i += 1) {
                            partial[i] = str(i, value) || "null"
                        }
                        v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
                        gap = mind;
                        return v
                    }
                    if (rep && typeof rep === "object") {
                        length = rep.length;
                        for (i = 0; i < length; i += 1) {
                            k = rep[i];
                            if (typeof k === "string") {
                                v = str(k, value);
                                if (v) {
                                    partial.push(quote(k) + (gap ? ": " : ":") + v)
                                }
                            }
                        }
                    } else {
                        for (k in value) {
                            if (Object.prototype.hasOwnProperty.call(value, k)) {
                                v = str(k, value);
                                if (v) {
                                    partial.push(quote(k) + (gap ? ": " : ":") + v)
                                }
                            }
                        }
                    }
                    v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
                    gap = mind;
                    return v
                }
            }
            module.exports = function (value, replacer, space) {
                var i;
                gap = "";
                indent = "";
                if (typeof space === "number") {
                    for (i = 0; i < space; i += 1) {
                        indent += " "
                    }
                } else if (typeof space === "string") {
                    indent = space
                }
                rep = replacer;
                if (replacer && typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number")) {
                    throw new Error("JSON.stringify")
                }
                return str("", {
                    "": value
                })
            }
        }, {}
    ],
    34: [
        function (require, module, exports) {
            var Base, EventEmitter, Logger, addr, addrs, crypto, guid, ips, name, os, _, _i, _len, _ref, _ref1, __hasProp = {}.hasOwnProperty,
                __extends = function (child, parent) {
                    for (var key in parent) {
                        if (__hasProp.call(parent, key)) child[key] = parent[key]
                    }

                    function ctor() {
                        this.constructor = child
                    }
                    ctor.prototype = parent.prototype;
                    child.prototype = new ctor;
                    child.__super__ = parent.prototype;
                    return child
                };
            EventEmitter = require("events")
                .EventEmitter;
            _ = require("../vendor/lodash");
            Logger = function (_super) {
                __extends(Logger, _super);

                function Logger() {
                    _ref = Logger.__super__.constructor.apply(this, arguments);
                    return _ref
                }
                Logger.prototype.name = "Logger";
                Logger.prototype.log = function () {
                    var _ref1;
                    if ((_ref1 = this.opts) != null ? _ref1.debug : void 0) {
                        return console.log.apply(console, [this.toString()].concat([].slice.call(arguments)))
                    }
                };
                Logger.prototype.err = function (str) {
                    return this.emit("error", new Error("" + this + " " + str))
                };
                Logger.prototype.toString = function () {
                    return "" + this.name + ": " + this.id + ":"
                };
                return Logger
            }(EventEmitter);
            os = require("os");
            crypto = require("crypto");
            guid = function () {
                return crypto.randomBytes(6)
                    .toString("hex")
            };
            ips = [];
            _ref1 = typeof os.networkInterfaces === "function" ? os.networkInterfaces() : void 0;
            for (name in _ref1) {
                addrs = _ref1[name];
                for (_i = 0, _len = addrs.length; _i < _len; _i++) {
                    addr = addrs[_i];
                    if (addr.family === "IPv4") {
                        ips.push(addr.address)
                    }
                }
            }
            Base = function (_super) {
                __extends(Base, _super);
                Base.prototype.name = "Base";

                function Base(opts) {
                    this.opts = opts != null ? opts : {};
                    if (_.isString(this.opts)) {
                        this.opts = {
                            id: this.opts
                        }
                    }
                    _.defaults(this.opts, this.defaults);
                    this.guid = guid();
                    this.id = this.opts.id || this.guid;
                    this.exposed = {
                        _pnode: {
                            id: this.id,
                            guid: this.guid,
                            ips: ips.filter(function (ip) {
                                return ip !== "127.0.0.1"
                            }),
                            ping: function (cb) {
                                return cb(true)
                            }
                        }
                    };
                    _.bindAll(this)
                }
                Base.prototype.expose = function (obj) {
                    return _.merge(this.exposed, obj)
                };
                Base.prototype.ips = function () {
                    return ips
                };
                return Base
            }(Logger);
            Base.Logger = Logger;
            module.exports = Base
        }, {
            "../vendor/lodash": 41,
            crypto: 12,
            events: 2,
            os: 17
        }
    ],
    35: [
        function (require, module, exports) {
            var Base, Client, dnode, helper, transports, _, __hasProp = {}.hasOwnProperty,
                __extends = function (child, parent) {
                    for (var key in parent) {
                        if (__hasProp.call(parent, key)) child[key] = parent[key]
                    }

                    function ctor() {
                        this.constructor = child
                    }
                    ctor.prototype = parent.prototype;
                    child.prototype = new ctor;
                    child.__super__ = parent.prototype;
                    return child
                };
            _ = require("../vendor/lodash");
            dnode = require("dnode");
            Base = require("./base");
            helper = require("./helper");
            transports = require("./transports");
            Client = function (_super) {
                __extends(Client, _super);
                Client.prototype.name = "Client";
                Client.prototype.defaults = {
                    debug: false,
                    maxRetries: 5,
                    timeout: 5e3,
                    interval: 1e3,
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
                    this.status = "down";
                    this.reconnect = _.throttle(this.reconnect, this.opts.interval, {
                        leading: true
                    });
                    this.ping = _.throttle(this.ping, this.opts.interval);
                    this.bindTo = this.bind
                }
                Client.prototype.bind = function () {
                    this.count.attempt = 0;
                    transports.bind(this, arguments)
                };
                Client.prototype.unbind = function () {
                    this.count.attempt = 0;
                    this.reset();
                    this.ci = null
                };
                Client.prototype.createConnection = function (fn) {
                    if (typeof fn !== "function") {
                        this.err("must be a function")
                    }
                    if (!(fn.length === 1 || fn.length === 2)) {
                        this.err("must have arity 1 or 2")
                    }
                    this.getConnectionFn = fn;
                    this.reconnect()
                };
                Client.prototype.server = function (callback) {
                    if (!this.getConnectionFn) {
                        return this.err("no create connection method defined")
                    }
                    if (this.status === "up") {
                        return callback(this.remote)
                    } else if (this.status === "down" && !this.connecting) {
                        this.count.attempt = 0;
                        this.reconnect()
                    }
                    this.once("remote", callback)
                };
                Client.prototype.unget = function (callback) {
                    return this.removeListener("remote", callback)
                };
                Client.prototype.reconnect = function () {
                    var _this = this;
                    if (this.status === "up" || this.connecting || this.count.attempt >= this.opts.maxRetries) {
                        return
                    }
                    this.count.attempt++;
                    this.connecting = true;
                    this.reset();
                    this.d = dnode(this.exposed);
                    this.d.once("remote", this.onRemote);
                    this.d.once("end", this.onEnd);
                    this.d.once("error", this.onError);
                    this.d.once("fail", this.onStreamError);
                    this.timeout(function () {
                        _this.reset();
                        return _this.reconnect()
                    });
                    this.emit("connecting");
                    switch (this.getConnectionFn.length) {
                    case 1:
                        this.getConnectionFn(function (stream) {
                            if (!helper.isReadable(stream)) {
                                _this.err("Invalid duplex stream (not readable)")
                            }
                            if (!helper.isWritable(stream)) {
                                _this.err("Invalid duplex stream (not writable)")
                            }
                            stream.on("error", _this.onStreamError);
                            return stream.pipe(_this.d)
                                .pipe(stream)
                        });
                        break;
                    case 2:
                        this.getConnectionFn(function (read) {
                            if (!helper.isReadable(read)) {
                                _this.err("Invalid read stream")
                            }
                            read.on("error", _this.onStreamError);
                            return read.pipe(_this.d)
                        }, function (write) {
                            if (!helper.isWritable(write)) {
                                _this.err("Invalid write stream")
                            }
                            write.on("error", _this.onStreamError);
                            return _this.d.pipe(write)
                        })
                    }
                };
                Client.prototype.onStreamError = function (err) {
                    this.setStatus("down");
                    this.reconnect()
                };
                Client.prototype.onError = function (err) {
                    this.log("error: " + err);
                    return this.err(err)
                };
                Client.prototype.onRemote = function (remote) {
                    var _ref;
                    this.timeout(false);
                    if (!((_ref = remote._pnode) != null ? _ref.ping : void 0)) {
                        return this.err("Invalid pnode host")
                    }
                    this.remote = remote;
                    this.emit("remote", this.remote, this);
                    this.setStatus("up");
                    return this.ping()
                };
                Client.prototype.ping = function () {
                    var _this = this;
                    if (this.status === "down") {
                        return
                    }
                    this.count.ping++;
                    this.timeout(true);
                    return this.remote._pnode.ping(function (ok) {
                        if (ok === true) {
                            _this.count.pong++
                        }
                        _this.timeout(false);
                        return _this.ping()
                    })
                };
                Client.prototype.timeout = function (cb) {
                    var _this = this;
                    clearTimeout(this.timeout.t);
                    if (cb === false) {
                        return
                    }
                    return this.timeout.t = setTimeout(function () {
                        _this.setStatus("down");
                        if (typeof cb === "function") {
                            return cb()
                        }
                    }, this.opts.timeout)
                };
                Client.prototype.onEnd = function () {
                    this.log("server closed connection");
                    this.setStatus("down");
                    return this.reconnect()
                };
                Client.prototype.setStatus = function (s) {
                    this.connecting = false;
                    if (!((s === "up" || s === "down") && s !== this.status)) {
                        return
                    }
                    this.log(s);
                    this.status = s;
                    return this.emit(s)
                };
                Client.prototype.reset = function () {
                    this.setStatus("down");
                    if (this.d) {
                        this.d.removeAllListeners()
                            .end();
                        return this.d = null
                    }
                };
                Client.prototype.setInterface = function (obj) {
                    return this.si = obj
                };
                Client.prototype.uri = function () {
                    var _ref;
                    return (_ref = this.ci) != null ? _ref.uri : void 0
                };
                Client.prototype.serialize = function () {
                    return this.uri()
                };
                return Client
            }(Base);
            module.exports = function (opts) {
                return new Client(opts)
            }
        }, {
            "../vendor/lodash": 41,
            "./base": 34,
            "./helper": 36,
            "./transports": 40,
            dnode: 23
        }
    ],
    36: [
        function (require, module, exports) {
            var __slice = [].slice;
            exports.isReadable = function (stream) {
                return stream.readable === true || typeof stream.read === "function"
            };
            exports.isWritable = function (stream) {
                return stream.writable === true || typeof stream.write === "function"
            };
            exports.serialize = function (obj) {
                var key, newobj, o;
                newobj = {};
                for (key in obj) {
                    o = obj[key];
                    if (o.serialize) {
                        newobj[key] = o.serialize()
                    }
                }
                return newobj
            };
            exports.proxyEvents = function () {
                var dest, events, src;
                src = arguments[0], dest = arguments[1], events = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
                return events.forEach(function (e) {
                    return src.on(e, function (a1, a2, a3) {
                        return dest.emit(e, a1, a2, a3)
                    })
                })
            }
        }, {}
    ],
    37: [
        function (require, module, exports) {
            exports.addTransport = require("./transports")
                .add;
            exports.client = require("./client");
            exports.server = require("./server");
            exports.peer = require("./peer")
        }, {
            "./client": 35,
            "./peer": 38,
            "./server": 39,
            "./transports": 40
        }
    ],
    38: [
        function (require, module, exports) {
            var Base, LocalPeer, RemotePeer, helper, locals, pnode, _, __hasProp = {}.hasOwnProperty,
                __extends = function (child, parent) {
                    for (var key in parent) {
                        if (__hasProp.call(parent, key)) child[key] = parent[key]
                    }

                    function ctor() {
                        this.constructor = child
                    }
                    ctor.prototype = parent.prototype;
                    child.prototype = new ctor;
                    child.__super__ = parent.prototype;
                    return child
                };
            _ = require("../vendor/lodash");
            pnode = require("./index");
            Base = require("./base");
            helper = require("./helper");
            locals = [];
            RemotePeer = function (_super) {
                __extends(RemotePeer, _super);
                RemotePeer.prototype.name = "RemotePeer";

                function RemotePeer(local) {
                    this.local = local;
                    this.opts = this.local.opts;
                    this.clients = {};
                    this.connections = {};
                    this.addresses = {}
                }
                RemotePeer.prototype.addPeer = function (peer) {
                    var meta;
                    meta = peer.remote._pnode;
                    this.guid = meta.guid, this.id = meta.id, this.ips = meta.ips;
                    switch (peer.name) {
                    case "Client":
                        return this.addClient(peer);
                    case "Connection":
                        return this.addConnection(peer)
                    }
                };
                RemotePeer.prototype.addClient = function (client) {
                    var _this = this;
                    this.addresses[client.uri()] = true;
                    this.clients[client.guid] = client;
                    return client.once("down", function () {
                        return delete _this.clients[client.guid]
                    })
                };
                RemotePeer.prototype.addConnection = function (conn) {
                    var _this = this;
                    this.connections[conn.guid] = conn;
                    return conn.once("disconnect", function () {
                        return delete _this.connections[conn.guid]
                    })
                };
                RemotePeer.prototype.getRemote = function () {
                    var client, conn, guid, _ref, _ref1;
                    _ref = this.clients;
                    for (guid in _ref) {
                        client = _ref[guid];
                        return client.remote
                    }
                    _ref1 = this.connections;
                    for (guid in _ref1) {
                        conn = _ref1[guid];
                        return conn.remote
                    }
                    return null
                };
                RemotePeer.prototype.serialize = function () {
                    return {
                        id: this.id,
                        guid: this.guid,
                        ips: this.ips,
                        clients: helper.serialize(this.clients)
                    }
                };
                return RemotePeer
            }(Base.Logger);
            LocalPeer = function (_super) {
                __extends(LocalPeer, _super);
                LocalPeer.prototype.name = "LocalPeer";
                LocalPeer.prototype.defaults = {
                    debug: false,
                    wait: 1e3,
                    providePeers: true,
                    extractPeers: true
                };

                function LocalPeer() {
                    var _this = this;
                    LocalPeer.__super__.constructor.apply(this, arguments);
                    this.servers = {};
                    this.peers = {};
                    if (this.opts.providePeers) {
                        this.expose({
                            _pnode: {
                                serialize: function (cb) {
                                    return cb(_this.serialize())
                                }
                            }
                        })
                    }
                }
                LocalPeer.prototype.bindOn = function () {
                    var server, _this = this;
                    server = pnode.server(this.opts);
                    server.on("error", function (err) {
                        return _this.emit("error", err)
                    });
                    server.on("connection", this.onPeer);
                    server.exposed = this.exposed;
                    server.bindOn.apply(server, arguments);
                    this.servers[server.guid] = server;
                    return server.once("unbind", function () {
                        return delete _this.servers[server.guid]
                    })
                };
                LocalPeer.prototype.bindTo = function () {
                    var client, _this = this;
                    client = pnode.client(this.opts);
                    client.on("error", function (err) {
                        return _this.emit("error", err)
                    });
                    client.on("remote", function () {
                        return _this.onPeer(client)
                    });
                    client.exposed = this.exposed;
                    return client.bindTo.apply(client, arguments)
                };
                LocalPeer.prototype.onPeer = function (peer) {
                    var guid, remote, _ref;
                    remote = peer.remote;
                    if (!remote) {
                        return this.log("peer missing remote")
                    }
                    guid = remote != null ? (_ref = remote._pnode) != null ? _ref.guid : void 0 : void 0;
                    if (!guid) {
                        return this.log("peer missing guid")
                    }
                    if (!this.peers[guid]) {
                        this.peers[guid] = new RemotePeer(this)
                    }
                    this.peers[guid].addPeer(peer);
                    return this.emit("remote", remote)
                };
                LocalPeer.prototype.serialize = function () {
                    return {
                        servers: helper.serialize(this.servers),
                        peers: helper.serialize(this.peers)
                    }
                };
                LocalPeer.prototype.all = function (callback) {
                    var guid, missing, peer, rem, rems, _ref;
                    missing = 0;
                    rems = [];
                    _ref = this.peers;
                    for (guid in _ref) {
                        peer = _ref[guid];
                        rem = peer.getRemote();
                        if (rem) {
                            rems.push(rem)
                        } else {
                            missing++
                        }
                    }
                    console.log(this.toString(), "all()", missing);
                    return callback(rems)
                };
                LocalPeer.prototype.peer = function (id, callback) {
                    var guid, p, peer, rem, _ref;
                    console.log(this.toString(), "peer()", id);
                    peer = this.peers[id];
                    if (!peer) {
                        _ref = this.peers;
                        for (guid in _ref) {
                            p = _ref[guid];
                            if (p.id === id) {
                                peer = p;
                                break
                            }
                        }
                    }
                    if (!peer) {
                        return null
                    }
                    rem = peer.getRemote();
                    if (rem) {
                        callback(rem)
                    }
                    return null
                };
                return LocalPeer
            }(Base);
            module.exports = function (opts) {
                var peer;
                peer = new LocalPeer(opts);
                locals.push(peer);
                return peer
            }
        }, {
            "../vendor/lodash": 41,
            "./base": 34,
            "./helper": 36,
            "./index": 37
        }
    ],
    39: [
        function (require, module, exports) {
            var process = require("__browserify_process");
            var Base, Connection, Server, dnode, helper, servers, transports, _, __hasProp = {}.hasOwnProperty,
                __extends = function (child, parent) {
                    for (var key in parent) {
                        if (__hasProp.call(parent, key)) child[key] = parent[key]
                    }

                    function ctor() {
                        this.constructor = child
                    }
                    ctor.prototype = parent.prototype;
                    child.prototype = new ctor;
                    child.__super__ = parent.prototype;
                    return child
                };
            dnode = require("dnode");
            Base = require("./base");
            transports = require("./transports");
            helper = require("./helper");
            _ = require("../vendor/lodash");
            servers = [];
            Connection = function (_super) {
                __extends(Connection, _super);
                Connection.prototype.name = "Connection";

                function Connection(server, meta, remote, d) {
                    this.server = server;
                    this.remote = remote;
                    this.d = d;
                    this.id = meta.id, this.guid = meta.guid
                }
                return Connection
            }(Base.Logger);
            Server = function (_super) {
                __extends(Server, _super);
                Server.prototype.name = "Server";
                Server.prototype.defaults = {
                    debug: false,
                    wait: 5e3
                };

                function Server() {
                    Server.__super__.constructor.apply(this, arguments);
                    this.clients = [];
                    this.bindOn = this.bind
                }
                Server.prototype.bind = function () {
                    this.unbind();
                    transports.bind(this, arguments)
                };
                Server.prototype.unbind = function () {
                    var client, _i, _len, _ref, _ref1, _ref2;
                    _ref = this.clients;
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                        client = _ref[_i];
                        if (client != null) {
                            if ((_ref1 = client.d) != null) {
                                _ref1.end()
                            }
                        }
                    }
                    try {
                        if (typeof ((_ref2 = this.si) != null ? _ref2.unbind : void 0) === "function") {
                            this.si.unbind();
                            this.emit("unbind")
                        }
                    } catch (_error) {}
                    this.si = null
                };
                Server.prototype.handle = function (read, write) {
                    var d;
                    if (read.write && !(write != null ? write.write : void 0)) {
                        write = read
                    }
                    if (!helper.isReadable(read)) {
                        this.err("Invalid read stream")
                    }
                    if (!helper.isWritable(write)) {
                        this.err("Invalid write stream")
                    }
                    d = dnode(this.exposed);
                    helper.proxyEvents(d, this, "error", "fail");
                    d.once("remote", this.onRemote);
                    read.once("close", d.end);
                    return read.pipe(d)
                        .pipe(write)
                };
                Server.prototype.onRemote = function (remote, d) {
                    var client, meta, _this = this;
                    meta = remote._pnode;
                    if (!meta) {
                        this.log("closing connection, not a pnode client");
                        d.end();
                        return
                    }
                    client = new Connection(this, meta, remote, d);
                    this.clients.push(client);
                    this.emit("connection", client);
                    this.emit("remote", remote, this);
                    d.once("end", function () {
                        var i;
                        i = _this.clients.indexOf(client);
                        _this.log("removing client ", i);
                        _this.clients.splice(i, 1);
                        _this.emit("disconnection", client);
                        return client.emit("disconnect")
                    })
                };
                Server.prototype.client = function (id, callback) {
                    var cb, rem, t, _this = this;
                    rem = this.clientSync(id);
                    if (rem) {
                        return callback(rem)
                    }
                    t = setTimeout(function () {
                        return _this.removeListener("remote", cb)
                    }, this.opts.wait);
                    cb = function () {
                        rem = _this.clientSync(id);
                        if (!rem) {
                            return
                        }
                        clearTimeout(t);
                        _this.removeListener("remote", cb);
                        return callback(rem)
                    };
                    this.once("remote", cb)
                };
                Server.prototype.clientSync = function (id) {
                    var client, _i, _len, _ref, _ref1;
                    if (typeof id === "string") {
                        _ref = this.clients;
                        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                            client = _ref[_i];
                            if (client.id === id || client.guid === id) {
                                return client.remote
                            }
                        }
                        return null
                    } else if (typeof id === "number") {
                        return (_ref1 = this.clients[id]) != null ? _ref1.remote : void 0
                    } else {
                        return this.err("invalid arguments")
                    }
                };
                Server.prototype.setInterface = function (obj) {
                    return this.si = obj
                };
                Server.prototype.uri = function () {
                    var _ref;
                    return (_ref = this.si) != null ? _ref.uri : void 0
                };
                Server.prototype.serialize = function () {
                    return this.uri()
                };
                return Server
            }(Base);
            module.exports = function (opts) {
                var server;
                server = new Server(opts);
                servers.push(server);
                return server
            };
            if (typeof process.on === "function") {
                process.on("exit", function () {
                    var server, _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = servers.length; _i < _len; _i++) {
                        server = servers[_i];
                        _results.push(server.unbind())
                    }
                    return _results
                })
            }
            if (typeof process.on === "function") {
                process.on("SIGINT", function () {
                    return process.exit()
                })
            }
        }, {
            "../vendor/lodash": 41,
            "./base": 34,
            "./helper": 36,
            "./transports": 40,
            __browserify_process: 18,
            dnode: 23
        }
    ],
    40: [
        function (require, module, exports) {
            var __dirname = "/../../out/transports";
            var fs, helper, path, re, transports;
            fs = require("fs");
            path = require("path");
            helper = require("../helper");
            re = /^([a-z]+):\/\//;
            transports = {};
            exports.parse = function (str) {
                var args, hostname, port;
                args = [];
                if (typeof str === "string" && /^(.+?)(:(\d+))?$/.test(str)) {
                    hostname = RegExp.$1;
                    port = parseInt(RegExp.$3, 10);
                    if (port) {
                        args.push(port)
                    }
                    args.push(hostname)
                }
                return args
            };
            exports.bind = function (context, args) {
                var fn, name, obj, parseFn, transport, uri;
                args = Array.prototype.slice.call(args);
                transport = args.shift();
                if (!transport) {
                    context.err("Transport argument missing")
                }
                if (re.test(transport)) {
                    name = RegExp.$1;
                    obj = exports.get(name);
                    uri = transport.replace(re, "")
                } else {
                    name = transport;
                    obj = exports.get(name)
                } if (!obj) {
                    context.err("Transport: '" + transport + "' not found")
                }
                parseFn = obj.parse || exports.parse;
                args = parseFn(uri)
                    .concat(args);
                fn = obj["bind" + context.name];
                return fn.apply(context, args)
            };
            exports.add = function (name, obj) {
                if (typeof obj.bindServer !== "function" || typeof obj.bindClient !== "function") {
                    throw "Transport '" + name + "' cannot be added, bind methods are missing"
                }
                if (/[^a-z]/.test(name)) {
                    throw "Transport name must be lowercase letters only"
                }
                if (exports.get(name)) {
                    throw "Transport '" + name + "' already exists"
                }
                transports[name] = obj;
                return true
            };
            exports.get = function (name) {
                return transports[name]
            };
            if (typeof fs.readdirSync === "function") {
                fs.readdirSync(__dirname)
                    .forEach(function (file) {
                        if (file !== "index.js") {
                            return exports.add(file.replace(".js", ""), require("./" + file))
                        }
                    })
            }
        }, {
            "../helper": 36,
            fs: 3,
            path: 4
        }
    ],
    41: [
        function (require, module, exports) {
            var global = self;
            ! function (window) {
                var undefined;
                var arrayPool = [],
                    objectPool = [];
                var idCounter = 0;
                var indicatorObject = {};
                var keyPrefix = +new Date + "";
                var largeArraySize = 75;
                var maxPoolSize = 40;
                var reEmptyStringLeading = /\b__p \+= '';/g,
                    reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
                    reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;
                var reEscapedHtml = /&(?:amp|lt|gt|quot|#39);/g;
                var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;
                var reFlags = /\w*$/;
                var reInterpolate = /<%=([\s\S]+?)%>/g;
                var reThis = (reThis = /\bthis\b/) && reThis.test(function () {
                    return this
                }) && reThis;
                var reNoMatch = /($^)/;
                var reUnescapedHtml = /[&<>"']/g;
                var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;
                var templateCounter = 0;
                var argsClass = "[object Arguments]",
                    arrayClass = "[object Array]",
                    boolClass = "[object Boolean]",
                    dateClass = "[object Date]",
                    errorClass = "[object Error]",
                    funcClass = "[object Function]",
                    numberClass = "[object Number]",
                    objectClass = "[object Object]",
                    regexpClass = "[object RegExp]",
                    stringClass = "[object String]";
                var objectTypes = {
                    "boolean": false,
                    "function": true,
                    object: true,
                    number: false,
                    string: false,
                    undefined: false
                };
                var stringEscapes = {
                    "\\": "\\",
                    "'": "'",
                    "\n": "n",
                    "\r": "r",
                    " ": "t",
                    "\u2028": "u2028",
                    "\u2029": "u2029"
                };
                var freeExports = objectTypes[typeof exports] && exports;
                var freeModule = objectTypes[typeof module] && module && module.exports == freeExports && module;
                var freeGlobal = objectTypes[typeof global] && global;
                if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
                    window = freeGlobal
                }

                function getArray() {
                    return arrayPool.pop() || []
                }

                function getObject() {
                    return objectPool.pop() || {
                        array: null,
                        cache: null,
                        "false": false,
                        leading: false,
                        maxWait: 0,
                        "null": false,
                        number: null,
                        object: null,
                        push: null,
                        string: null,
                        trailing: false,
                        "true": false,
                        undefined: false
                    }
                }

                function noop() {}

                function releaseArray(array) {
                    array.length = 0;
                    if (arrayPool.length < maxPoolSize) {
                        arrayPool.push(array)
                    }
                }

                function releaseObject(object) {
                    var cache = object.cache;
                    if (cache) {
                        releaseObject(cache)
                    }
                    object.array = object.cache = object.object = object.number = object.string = null;
                    if (objectPool.length < maxPoolSize) {
                        objectPool.push(object)
                    }
                }
                var arrayRef = [];
                var objectProto = Object.prototype,
                    stringProto = String.prototype;
                var oldDash = window._;
                var reNative = RegExp("^" + String(objectProto.valueOf)
                    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                    .replace(/valueOf|for [^\]]+/g, ".+?") + "$");
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
                var nativeBind = reNative.test(nativeBind = toString.bind) && nativeBind,
                    nativeCreate = reNative.test(nativeCreate = Object.create) && nativeCreate,
                    nativeIsArray = reNative.test(nativeIsArray = Array.isArray) && nativeIsArray,
                    nativeIsFinite = window.isFinite,
                    nativeIsNaN = window.isNaN,
                    nativeKeys = reNative.test(nativeKeys = Object.keys) && nativeKeys,
                    nativeMax = Math.max,
                    nativeMin = Math.min,
                    nativeRandom = Math.random,
                    nativeSlice = arrayRef.slice;
                var isIeOpera = reNative.test(window.attachEvent),
                    isV8 = nativeBind && !/\n|true/.test(nativeBind + isIeOpera);

                function lodash() {}
                var support = lodash.support = {};
                support.fastBind = nativeBind && !isV8;

                function createBound(func, thisArg, partialArgs, indicator) {
                    var isFunc = isFunction(func),
                        isPartial = !partialArgs,
                        key = thisArg;
                    if (isPartial) {
                        var rightIndicator = indicator;
                        partialArgs = thisArg
                    } else if (!isFunc) {
                        if (!indicator) {
                            throw new TypeError
                        }
                        thisArg = func
                    }

                    function bound() {
                        var args = arguments,
                            thisBinding = isPartial ? this : thisArg;
                        if (!isFunc) {
                            func = thisArg[key]
                        }
                        if (partialArgs.length) {
                            args = args.length ? (args = nativeSlice.call(args), rightIndicator ? args.concat(partialArgs) : partialArgs.concat(args)) : partialArgs
                        }
                        if (this instanceof bound) {
                            thisBinding = createObject(func.prototype);
                            var result = func.apply(thisBinding, args);
                            return isObject(result) ? result : thisBinding
                        }
                        return func.apply(thisBinding, args)
                    }
                    return bound
                }

                function createObject(prototype) {
                    return isObject(prototype) ? nativeCreate(prototype) : {}
                }

                function shimIsPlainObject(value) {
                    var ctor, result;
                    if (!(value && toString.call(value) == objectClass) || (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
                        return false
                    }
                    forIn(value, function (value, key) {
                        result = key
                    });
                    return result === undefined || hasOwnProperty.call(value, result)
                }

                function isArguments(value) {
                    return toString.call(value) == argsClass
                }
                var isArray = nativeIsArray;
                var shimKeys = function (object) {
                    var index, iterable = object,
                        result = [];
                    if (!iterable) return result;
                    if (!objectTypes[typeof object]) return result;
                    for (index in iterable) {
                        if (hasOwnProperty.call(iterable, index)) {
                            result.push(index)
                        }
                    }
                    return result
                };
                var keys = !nativeKeys ? shimKeys : function (object) {
                        if (!isObject(object)) {
                            return []
                        }
                        return nativeKeys(object)
                    };
                var assign = function (object, source, guard) {
                    var index, iterable = object,
                        result = iterable;
                    if (!iterable) return result;
                    var args = arguments,
                        argsIndex = 0,
                        argsLength = typeof guard == "number" ? 2 : args.length;
                    if (argsLength > 3 && typeof args[argsLength - 2] == "function") {
                        var callback = lodash.createCallback(args[--argsLength - 1], args[argsLength--], 2)
                    } else if (argsLength > 2 && typeof args[argsLength - 1] == "function") {
                        callback = args[--argsLength]
                    }
                    while (++argsIndex < argsLength) {
                        iterable = args[argsIndex];
                        if (iterable && objectTypes[typeof iterable]) {
                            var ownIndex = -1,
                                ownProps = objectTypes[typeof iterable] && keys(iterable),
                                length = ownProps ? ownProps.length : 0;
                            while (++ownIndex < length) {
                                index = ownProps[ownIndex];
                                result[index] = callback ? callback(result[index], iterable[index]) : iterable[index]
                            }
                        }
                    }
                    return result
                };
                var defaults = function (object, source, guard) {
                    var index, iterable = object,
                        result = iterable;
                    if (!iterable) return result;
                    var args = arguments,
                        argsIndex = 0,
                        argsLength = typeof guard == "number" ? 2 : args.length;
                    while (++argsIndex < argsLength) {
                        iterable = args[argsIndex];
                        if (iterable && objectTypes[typeof iterable]) {
                            var ownIndex = -1,
                                ownProps = objectTypes[typeof iterable] && keys(iterable),
                                length = ownProps ? ownProps.length : 0;
                            while (++ownIndex < length) {
                                index = ownProps[ownIndex];
                                if (typeof result[index] == "undefined") result[index] = iterable[index]
                            }
                        }
                    }
                    return result
                };
                var forIn = function (collection, callback, thisArg) {
                    var index, iterable = collection,
                        result = iterable;
                    if (!iterable) return result;
                    if (!objectTypes[typeof iterable]) return result;
                    callback = callback && typeof thisArg == "undefined" ? callback : lodash.createCallback(callback, thisArg);
                    for (index in iterable) {
                        if (callback(iterable[index], index, collection) === false) return result
                    }
                    return result
                };
                var forOwn = function (collection, callback, thisArg) {
                    var index, iterable = collection,
                        result = iterable;
                    if (!iterable) return result;
                    if (!objectTypes[typeof iterable]) return result;
                    callback = callback && typeof thisArg == "undefined" ? callback : lodash.createCallback(callback, thisArg);
                    var ownIndex = -1,
                        ownProps = objectTypes[typeof iterable] && keys(iterable),
                        length = ownProps ? ownProps.length : 0;
                    while (++ownIndex < length) {
                        index = ownProps[ownIndex];
                        if (callback(iterable[index], index, collection) === false) return result
                    }
                    return result
                };

                function functions(object) {
                    var result = [];
                    forIn(object, function (value, key) {
                        if (isFunction(value)) {
                            result.push(key)
                        }
                    });
                    return result.sort()
                }

                function isEqual(a, b, callback, thisArg, stackA, stackB) {
                    var whereIndicator = callback === indicatorObject;
                    if (typeof callback == "function" && !whereIndicator) {
                        callback = lodash.createCallback(callback, thisArg, 2);
                        var result = callback(a, b);
                        if (typeof result != "undefined") {
                            return !!result
                        }
                    }
                    if (a === b) {
                        return a !== 0 || 1 / a == 1 / b
                    }
                    var type = typeof a,
                        otherType = typeof b;
                    if (a === a && (!a || type != "function" && type != "object") && (!b || otherType != "function" && otherType != "object")) {
                        return false
                    }
                    if (a == null || b == null) {
                        return a === b
                    }
                    var className = toString.call(a),
                        otherClass = toString.call(b);
                    if (className == argsClass) {
                        className = objectClass
                    }
                    if (otherClass == argsClass) {
                        otherClass = objectClass
                    }
                    if (className != otherClass) {
                        return false
                    }
                    switch (className) {
                    case boolClass:
                    case dateClass:
                        return +a == +b;
                    case numberClass:
                        return a != +a ? b != +b : a == 0 ? 1 / a == 1 / b : a == +b;
                    case regexpClass:
                    case stringClass:
                        return a == String(b)
                    }
                    var isArr = className == arrayClass;
                    if (!isArr) {
                        if (hasOwnProperty.call(a, "__wrapped__ ") || hasOwnProperty.call(b, "__wrapped__")) {
                            return isEqual(a.__wrapped__ || a, b.__wrapped__ || b, callback, thisArg, stackA, stackB)
                        }
                        if (className != objectClass) {
                            return false
                        }
                        var ctorA = a.constructor,
                            ctorB = b.constructor;
                        if (ctorA != ctorB && !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB)) {
                            return false
                        }
                    }
                    var initedStack = !stackA;
                    stackA || (stackA = getArray());
                    stackB || (stackB = getArray());
                    var length = stackA.length;
                    while (length--) {
                        if (stackA[length] == a) {
                            return stackB[length] == b
                        }
                    }
                    var size = 0;
                    result = true;
                    stackA.push(a);
                    stackB.push(b);
                    if (isArr) {
                        length = a.length;
                        size = b.length;
                        result = size == a.length;
                        if (!result && !whereIndicator) {
                            return result
                        }
                        while (size--) {
                            var index = length,
                                value = b[size];
                            if (whereIndicator) {
                                while (index--) {
                                    if (result = isEqual(a[index], value, callback, thisArg, stackA, stackB)) {
                                        break
                                    }
                                }
                            } else if (!(result = isEqual(a[size], value, callback, thisArg, stackA, stackB))) {
                                break
                            }
                        }
                        return result
                    }
                    forIn(b, function (value, key, b) {
                        if (hasOwnProperty.call(b, key)) {
                            size++;
                            return result = hasOwnProperty.call(a, key) && isEqual(a[key], value, callback, thisArg, stackA, stackB)
                        }
                    });
                    if (result && !whereIndicator) {
                        forIn(a, function (value, key, a) {
                            if (hasOwnProperty.call(a, key)) {
                                return result = --size > -1
                            }
                        })
                    }
                    if (initedStack) {
                        releaseArray(stackA);
                        releaseArray(stackB)
                    }
                    return result
                }

                function isFunction(value) {
                    return typeof value == "function"
                }

                function isObject(value) {
                    return !!(value && objectTypes[typeof value])
                }
                var isPlainObject = function (value) {
                    if (!(value && toString.call(value) == objectClass)) {
                        return false
                    }
                    var valueOf = value.valueOf,
                        objProto = typeof valueOf == "function" && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);
                    return objProto ? value == objProto || getPrototypeOf(value) == objProto : shimIsPlainObject(value)
                };

                function isString(value) {
                    return typeof value == "string" || toString.call(value) == stringClass
                }

                function merge(object, source, deepIndicator) {
                    var args = arguments,
                        index = 0,
                        length = 2;
                    if (!isObject(object)) {
                        return object
                    }
                    if (deepIndicator === indicatorObject) {
                        var callback = args[3],
                            stackA = args[4],
                            stackB = args[5]
                    } else {
                        var initedStack = true;
                        stackA = getArray();
                        stackB = getArray();
                        if (typeof deepIndicator != "number") {
                            length = args.length
                        }
                        if (length > 3 && typeof args[length - 2] == "function") {
                            callback = lodash.createCallback(args[--length - 1], args[length--], 2)
                        } else if (length > 2 && typeof args[length - 1] == "function") {
                            callback = args[--length]
                        }
                    }
                    while (++index < length) {
                        (isArray(args[index]) ? forEach : forOwn)(args[index], function (source, key) {
                            var found, isArr, result = source,
                                value = object[key];
                            if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
                                var stackLength = stackA.length;
                                while (stackLength--) {
                                    if (found = stackA[stackLength] == source) {
                                        value = stackB[stackLength];
                                        break
                                    }
                                }
                                if (!found) {
                                    var isShallow;
                                    if (callback) {
                                        result = callback(value, source);
                                        if (isShallow = typeof result != "undefined") {
                                            value = result
                                        }
                                    }
                                    if (!isShallow) {
                                        value = isArr ? isArray(value) ? value : [] : isPlainObject(value) ? value : {}
                                    }
                                    stackA.push(source);
                                    stackB.push(value);
                                    if (!isShallow) {
                                        value = merge(value, source, indicatorObject, callback, stackA, stackB)
                                    }
                                }
                            } else {
                                if (callback) {
                                    result = callback(value, source);
                                    if (typeof result == "undefined") {
                                        result = source
                                    }
                                }
                                if (typeof result != "undefined") {
                                    value = result
                                }
                            }
                            object[key] = value
                        })
                    }
                    if (initedStack) {
                        releaseArray(stackA);
                        releaseArray(stackB)
                    }
                    return object
                }

                function forEach(collection, callback, thisArg) {
                    var index = -1,
                        length = collection ? collection.length : 0;
                    callback = callback && typeof thisArg == "undefined" ? callback : lodash.createCallback(callback, thisArg);
                    if (typeof length == "number") {
                        while (++index < length) {
                            if (callback(collection[index], index, collection) === false) {
                                break
                            }
                        }
                    } else {
                        forOwn(collection, callback)
                    }
                    return collection
                }

                function bind(func, thisArg) {
                    return support.fastBind || nativeBind && arguments.length > 2 ? nativeBind.call.apply(nativeBind, arguments) : createBound(func, thisArg, nativeSlice.call(arguments, 2))
                }

                function bindAll(object) {
                    var funcs = arguments.length > 1 ? concat.apply(arrayRef, nativeSlice.call(arguments, 1)) : functions(object),
                        index = -1,
                        length = funcs.length;
                    while (++index < length) {
                        var key = funcs[index];
                        object[key] = bind(object[key], object)
                    }
                    return object
                }

                function createCallback(func, thisArg, argCount) {
                    if (func == null) {
                        return identity
                    }
                    var type = typeof func;
                    if (type != "function") {
                        if (type != "object") {
                            return function (object) {
                                return object[func]
                            }
                        }
                        var props = keys(func);
                        return function (object) {
                            var length = props.length,
                                result = false;
                            while (length--) {
                                if (!(result = isEqual(object[props[length]], func[props[length]], indicatorObject))) {
                                    break
                                }
                            }
                            return result
                        }
                    }
                    if (typeof thisArg == "undefined" || reThis && !reThis.test(fnToString.call(func))) {
                        return func
                    }
                    if (argCount === 1) {
                        return function (value) {
                            return func.call(thisArg, value)
                        }
                    }
                    if (argCount === 2) {
                        return function (a, b) {
                            return func.call(thisArg, a, b)
                        }
                    }
                    if (argCount === 4) {
                        return function (accumulator, value, index, collection) {
                            return func.call(thisArg, accumulator, value, index, collection)
                        }
                    }
                    return function (value, index, collection) {
                        return func.call(thisArg, value, index, collection)
                    }
                }

                function debounce(func, wait, options) {
                    var args, result, thisArg, callCount = 0,
                        lastCalled = 0,
                        maxWait = false,
                        maxTimeoutId = null,
                        timeoutId = null,
                        trailing = true;

                    function clear() {
                        clearTimeout(maxTimeoutId);
                        clearTimeout(timeoutId);
                        callCount = 0;
                        maxTimeoutId = timeoutId = null
                    }

                    function delayed() {
                        var isCalled = trailing && (!leading || callCount > 1);
                        clear();
                        if (isCalled) {
                            if (maxWait !== false) {
                                lastCalled = new Date
                            }
                            result = func.apply(thisArg, args)
                        }
                    }

                    function maxDelayed() {
                        clear();
                        if (trailing || maxWait !== wait) {
                            lastCalled = new Date;
                            result = func.apply(thisArg, args)
                        }
                    }
                    wait = nativeMax(0, wait || 0);
                    if (options === true) {
                        var leading = true;
                        trailing = false
                    } else if (isObject(options)) {
                        leading = options.leading;
                        maxWait = "maxWait" in options && nativeMax(wait, options.maxWait || 0);
                        trailing = "trailing" in options ? options.trailing : trailing
                    }
                    return function () {
                        args = arguments;
                        thisArg = this;
                        callCount++;
                        clearTimeout(timeoutId);
                        if (maxWait === false) {
                            if (leading && callCount < 2) {
                                result = func.apply(thisArg, args)
                            }
                        } else {
                            var now = new Date;
                            if (!maxTimeoutId && !leading) {
                                lastCalled = now
                            }
                            var remaining = maxWait - (now - lastCalled);
                            if (remaining <= 0) {
                                clearTimeout(maxTimeoutId);
                                maxTimeoutId = null;
                                lastCalled = now;
                                result = func.apply(thisArg, args)
                            } else if (!maxTimeoutId) {
                                maxTimeoutId = setTimeout(maxDelayed, remaining)
                            }
                        } if (wait !== maxWait) {
                            timeoutId = setTimeout(delayed, wait)
                        }
                        return result
                    }
                }

                function throttle(func, wait, options) {
                    var leading = true,
                        trailing = true;
                    if (options === false) {
                        leading = false
                    } else if (isObject(options)) {
                        leading = "leading" in options ? options.leading : leading;
                        trailing = "trailing" in options ? options.trailing : trailing
                    }
                    options = getObject();
                    options.leading = leading;
                    options.maxWait = wait;
                    options.trailing = trailing;
                    var result = debounce(func, wait, options);
                    releaseObject(options);
                    return result
                }

                function identity(value) {
                    return value
                }
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
                lodash.identity = identity;
                lodash.isArguments = isArguments;
                lodash.isArray = isArray;
                lodash.isEqual = isEqual;
                lodash.isFunction = isFunction;
                lodash.isObject = isObject;
                lodash.isPlainObject = isPlainObject;
                lodash.isString = isString;
                lodash.VERSION = "1.3.1";
                if (typeof define == "function" && typeof define.amd == "object" && define.amd) {
                    window._ = lodash;
                    define(function () {
                        return lodash
                    })
                } else if (freeExports && !freeExports.nodeType) {
                    if (freeModule) {
                        (freeModule.exports = lodash)
                            ._ = lodash
                    } else {
                        freeExports._ = lodash
                    }
                } else {
                    window._ = lodash
                }
            }(this)
        }, {}
    ]
}, {}, [21]);