
var pnode = require('../../');

//START SERVER
var server = pnode.server({
  id: 'server-1'
});

server.bind('tcp://0.0.0.0:8000', function(){
  console.log('bound to all interfaces on port 8000');
});

//START CLIENT 1
var client1 = pnode.client({
  id: 'client-1'
});

client1.bind('tcp://localhost:8000');

//START CLIENT 2
var client2 = pnode.client({
  id: 'client-2'
});

client2.bind('tcp://localhost:8000');

//CALL SERVER 
client1.server(function(remote) {
  remote.one(new Date());
});

client2.server(function(remote) {
  remote.two(new Date());
});
