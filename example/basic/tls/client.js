var multinode = require('../../../');
var fs = require('fs');
var client = multinode.client();

// client.connect('https://localhost:8000');
client.connect('tls', 8000,'localhost', {
  key: fs.readFileSync('./keys/key.pem'),
  cert: fs.readFileSync('./keys/cert.pem'),
  csr: fs.readFileSync('./keys/csr.pem')
});

setInterval(function() {

  var d = new Date().toString();
  client(function(remote) {
    remote.say(d);
  });

}, 1000);
