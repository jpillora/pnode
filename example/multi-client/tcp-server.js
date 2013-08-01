var multinode = require('../../');
var server = multinode.server();

server.expose({
  say: function(msg) {
    server.log('server recieved: ' + msg);
  }
});

server.net.listen(8000, function(){
  server.log('listening on 8000');
});


setTimeout(function() {

  //0th client
  client = server.client(0);
  if(client)
    client.say('hi!');

  //client with id 'two'
  client = server.client('two');
  if(client)
    client.say('hi!');

}, 5000);
