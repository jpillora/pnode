// Generated by CoffeeScript 1.6.3
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
