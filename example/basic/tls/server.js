var multinode = require('../../../');
var fs = require('fs');
var server = multinode.server();

server.expose({
  say: function(date) {
    console.log('client says ' + date);
  }
});

server.listen('tls', {
  key:  fs.readFileSync('certs/agent1-key.pem'),
  cert: fs.readFileSync('certs/agent1-cert.pem'),
  ca:   fs.readFileSync('certs/ca1-cert.pem'),
  requestCert: true,
  rejectUnauthorized: false
}, 8000, function(){
  console.log('listening on 8000');
});