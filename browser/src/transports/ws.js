var shoe = require('shoe');

exports.parse = function(str) {
  if (typeof str === 'string' && /^.+\/.+$/.test(str)) {
    str = "http://" + str;
  }
  return [str];
};

exports.bindServer = function() {
  throw "bind server not supported in the browser";
};

exports.bindClient = function() {
  var args = arguments, pclient = this;

  pclient.createConnection(function(callback) {
    callback(shoe.apply(null, args));
  });
};
