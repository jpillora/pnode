var multinode = require('../../../');
var server = multinode.server();

server.expose({
  say: function(date) {
    console.log('client says ' + date);
  }
});

server.bind('https://0.0.0.0:8000', function(){
  console.log('bound to all interfaces on port 8000');
});