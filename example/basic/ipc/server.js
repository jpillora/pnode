var pnode = require('../../../');
var server = pnode.server();

server.expose({
  say: function(date) {
    console.log('client says ' + date);
  }
});

server.bind('ipc://pnode.sock', function(){
  console.log('bound to ./pnode.sock');
});