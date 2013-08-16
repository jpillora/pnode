
var pnode = require('../../');

//START SERVER
var server = pnode.server();

server.expose({
  one: function(date) {
    console.log('server: "one" says ' + date);
  },
  two: function(date) {
    console.log('server: "two" says ' + date);
  }
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
client1(function(remote) {
  remote.one(new Date());
});

client2(function(remote) {
  remote.two(new Date());
});
