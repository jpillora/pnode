var https = require('https');
var upnode = require('upnode');
var duplex = require('duplexer');
var stream = require('stream');

var options = {
  hostname: 'localhost',
  port: 8000,
  path: '/',
  method: 'PATCH',
  rejectUnauthorized: false,
  headers: {
    'transfer-encoding': 'chunked',
    'expect': '100-continue'
  }
};

var res = null;
var req = https.request(options, function(_res) {
  res = _res;
  console.log("statusCode: ", res.statusCode);
  console.log("headers: ", res.headers);
});

req.on('error', function(e) {
  console.error(e);
});

setTimeout(function() {

  var up = upnode.connect({
    createStream : function() {
      return duplex(req, res);
    }
  });

  setInterval(function () {
      console.log('connect...')
      up(function (remote) {
        console.log('remote', remote)
        remote.time(function (t) {
            console.log('time = ' + t);
        });
      });
  }, 1000);

}, 1000)



