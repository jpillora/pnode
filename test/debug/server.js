var pnode = require('../../');

//START SERVER
var server = pnode.server({
  id: "server-1",
  debug: true
});

server.expose({
  show: function(msg) {
    server.log('recieved "%s" from client "%s"', msg, this.id);
  }
});

server.bind('http://0.0.0.0:8000', function(){
  server.log('bound to all interfaces on port 8000');
});

server.client('client-2', function(remote) {
  remote.show(new Date());
});