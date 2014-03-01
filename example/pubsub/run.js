var pnode = require('../../');

//client subscribes to updates
var client1 = pnode.client({id: 'c1', debug: true});

client1.bind('https://localhost:8000');

client1.subscribe('foos', function(obj) {
  client1.log('incoming foo', obj);
});

//client subscribes to updates
var client2 = pnode.client({id: 'c2', debug: true});

client2.bind('https://localhost:8000');

client2.subscribe('foos', function(obj) {
  client2.log('incoming foo', obj);
});

//server publishes updates to clients
var server = pnode.server({id: 's', debug: true});

server.bind('https://0.0.0.0:8000', function(){
  server.log('bound to all interfaces on port 8000');
});

setTimeout(function() {
  server.publish('foos', {foo:42});

  setTimeout(server.destroy)


}, 1500);

