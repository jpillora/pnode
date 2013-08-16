
var pnode = require('../../');

//START SERVER
var server = pnode.server();

server.bind('tcp://0.0.0.0:8000', function(){
  console.log('bound to all interfaces on port 8000');
});

//START CLIENT 1
var client1 = pnode.client({
  id: 'client-1'
});

client1.expose({
  one: function(date) {
    console.log('client1: server says ' + date);
  }
});

client1.bind('tcp://localhost:8000');

//START CLIENT 2
var client2 = pnode.client({
  id: 'client-2'
});

client2.expose({
  two: function(date) {
    console.log('client2: server says ' + date);
  }
});

client2.bind('tcp://localhost:8000');

//CALL CLIENTS 
server.client('client-1', function(remote) {
  remote.one(new Date());
});

server.client('client-2', function(remote) {
  remote.two(new Date());
});
