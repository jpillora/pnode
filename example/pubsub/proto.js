var pnode = require('../../../');

//client subscribes to updates
var client1 = pnode.client('1');

client1.bind('https://localhost:8000');

client1.subscribe('foos', function(obj) {
  client1.log('incoming foo', obj);
});

//client subscribes to updates
var client2 = pnode.client('2');

client2.bind('https://localhost:8000');

client2.subscribe('foos', function(obj) {
  client2.log('incoming foo', obj);
});

//server publishes updates to clients
var server = pnode.server('s');

server.bind('https://0.0.0.0:8000', function(){
  console.log('bound to all interfaces on port 8000');
});

server.publish('foos', {foo:42});
