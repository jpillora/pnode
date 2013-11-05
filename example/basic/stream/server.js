
//manually provide stream
var net = require('net');
var pnode = require('../../../');
var server = pnode.server();

server.expose({
  say: function(date) {
    console.log('client says ' + date);
  }
});

//gets called once, emit multiple streams
server.bind('stream', function handleStreams(emitter) {

  var server = net.createServer();

  server.on('connection', function(sock) {
    //provide a client stream
    emitter.emit('stream', sock);
  });

  server.listen(8124, function() {
    console.log('listening on 8124');
    //notify server is up
    emitter.emit('bound');
  });

  //handle unbind requests
  emitter.on('unbind', function() {
    server.close();
  });

  //notify server is down
  server.on('close', function() {
    emitter.emit('unbound');
  });

});

