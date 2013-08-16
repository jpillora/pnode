var multinode = require('../../../');
var server = multinode.server();

server.expose({
  say: function(date) {
    console.log('client says ' + date);
  }
});

server.bind('ipc://multinode.sock', function(){
  console.log('bound to ./multinode.sock');
});