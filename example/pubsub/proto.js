var pnode = require('../../../');

//client subscribes to updates
var client = pnode.client('1');

client.bind('https://localhost:8000');

client.subscribe('foos', function(obj) {
  client.log('incoming foo', obj);
});

//client subscribes to updates
var client = pnode.client('2');

client.bind('https://localhost:8000');

client.subscribe('foos', function(obj) {
  client.log('incoming foo', obj);
});

//server publishes updates to clients
var server = pnode.server('s');

server.bind('https://0.0.0.0:8000', function(){
  console.log('bound to all interfaces on port 8000');
});

server.publish('foos', {foo:42});
