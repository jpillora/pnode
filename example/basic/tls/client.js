var multinode = require('../../../');
var fs = require('fs');
var client = multinode.client();

client.connect('tls://localhost:8000', {
  key:  fs.readFileSync('certs/agent3-key.pem'),
  cert: fs.readFileSync('certs/agent3-cert.pem'),
  ca:   fs.readFileSync('certs/ca2-cert.pem'),
  requestCert: true,
  rejectUnauthorized: false
});

setInterval(function() {

  var d = new Date().toString();
  client(function(remote) {
    remote.say(d);
  });

}, 1000);
