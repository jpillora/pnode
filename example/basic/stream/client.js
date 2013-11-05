
//manually provide stream
var net = require('net');
var pnode = require('../../../');
var client = pnode.client();

//gets called whenever a connection is required
client.bind('stream', function createStream(emitter) {
  
  var sock = net.connect({port: 8124});

  sock.once('connect', function() {
    //notify client is up 
    emitter.emit('bound');
  });

  //handle unbind requests
  emitter.once('unbind', function() {
    sock.end();
  });

  sock.once('end', function() {
    //notify client is down
    emitter.emit('unbound');
  });

  //provide this stream
  emitter.emit('stream', sock);

});

client.server(function(remote) {
  remote.say(new Date());
});
