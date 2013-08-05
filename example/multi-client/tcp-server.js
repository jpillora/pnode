var multinode = require('../../');
var server = multinode.server({
  wait: 1000
});

server.expose({
  say: function(msg) {
    server.log('server recieved: ' + msg);
  }
});

server.net.listen(8000, function(){
  server.log('listening on 8000');
});

//0th client
server.client(0, function(remote) {
  client.say('hi!');
});

//client with id 'two'
server.client('two', function(remote) {
  client.say('hi!');
});