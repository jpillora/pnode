
var tls       = require('tls');
var fs        = require('fs');
var multinode     = require('../../../');

var server = multinode.server();

server.expose({
  say: function(str) {
    console.log('server says', str);
  }
});

var client = multinode.client();

client.expose({
  say: function(str) {
    console.log('client says', str);
  }
});

///=================
/// HANDLE
///=================

tls.createServer({
  key: fs.readFileSync('certs/agent1-key.pem'),
  cert: fs.readFileSync('certs/agent1-cert.pem'),
  ca: fs.readFileSync('certs/ca1-cert.pem'),
  requestCert: false,
  rejectUnauthorized: false

}, function (stream) {

  console.log('server connection');
  server.handle(stream);

}).listen(6789);

///=================
/// CONNECT
///=================

client.createConnection(function(streamCallback) {

  console.log('create client connection');

  var stream = tls.connect(6789, 'localhost', {
    rejectUnauthorized: false
  });

  streamCallback(stream);
});

