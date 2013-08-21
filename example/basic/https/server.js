var pnode = require('../../../');
var server = pnode.server();

server.expose({
  say: function(date) {
    console.log('client says ' + date);
  }
});

server.bind('http://0.0.0.0:8000', function(){
  console.log('bound to all interfaces on port 8000');
});