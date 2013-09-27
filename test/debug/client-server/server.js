var pnode = require('../../../');

//START SERVER
var server = pnode.server({
  id: "server-1",
  debug: true
});

// server.subscribe('bars', function(obj) {
//   server.log('incoming bar', obj);
// });

server.bind('tcp://0.0.0.0:8000', function(){
  server.log('bound to all interfaces on port 8000');
});

// server.subscribe('bazzes', function(obj) {
//   server.log('incoming bazz', obj);
// });

setTimeout(function() {
  server.publish('foos', {foo:42});
}, 5000);
