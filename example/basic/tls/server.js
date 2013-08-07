var multinode = require('../../../');
var fs = require('fs');
var server = multinode.server();

server.expose({
  say: function(date) {
    console.log('client says ' + date);
  }
});

server.listen('tls', {
  key: fs.readFileSync('./keys/key.pem'),
  cert: fs.readFileSync('./keys/cert.pem'),
  csr: fs.readFileSync('./keys/csr.pem')
}, 8000, function(){
  console.log('listening on 8000');
});