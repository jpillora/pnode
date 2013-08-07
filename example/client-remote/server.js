var multinode = require('../../');
var server = multinode.server({
  wait: 5000
});

server.expose({
  say: function(msg) {
    server.log('server recieved: ' + msg);
  }
});

server.listen('net', 8000, function(){
  server.log('listening on 8000');
});

//0th client
server.client(0, function(remote) {
  remote.say('hi!');
});

//client with id 'two'
server.client('two', function(remote) {
  remote.say('hi!');
});