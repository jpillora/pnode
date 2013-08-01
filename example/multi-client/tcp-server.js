var multinode = require('../../');
var server = multinode.server();

server.expose({
  ho: function(msg) {
    server.log('server recieved: ' + msg);
  }
});

server.net.listen(8000, function(){
  server.log('listening on 8000');
});