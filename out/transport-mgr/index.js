// Generated by CoffeeScript 1.6.3
var files, fs, helper, path, prebind, re, transports;

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

prebind = function(context, args, callback) {
  var name, obj, parseFn, transport, uri;
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
  args = [callback].concat(parseFn(uri)).concat(args);
  context.log("bind args", args);
  return obj;
};

exports.bindClient = function(context, args, callback) {
  var e;
  try {

  } catch (_error) {
    e = _error;
  }
};

exports.bindServer = function(context, args, callback) {};

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
