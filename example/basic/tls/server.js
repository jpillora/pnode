var pnode = require('../../../');
var fs = require('fs');
var server = pnode.server();

server.expose({
  say: function(date) {
    console.log('client says ' + date);
  }
});

//Note: tls uses the last argument as the 'createServer' options
server.bind('tls://0.0.0.0:8000', function() {
  console.log('bound to all interfaces on port 8000');
});
