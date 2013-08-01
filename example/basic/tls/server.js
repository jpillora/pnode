console.log("TLS ISN'T WORKING YET...");

var multinode = require('../../../');
var fs = require('fs');
var server = multinode.server();

server.expose({
  say: function(date) {
    console.log('client says ' + date);
  }
});

server.tls.listen(8000, function(){
  console.log('listening on 8000');
});