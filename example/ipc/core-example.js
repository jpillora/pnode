var net = require('net');

var server = net.createServer(function(stream) {
  stream.on('data', function(c) {
    console.log('data:', c.toString());
  });
  stream.on('end', function() {
    server.close();
  });
});

server.listen('/tmp/test.sock');

var stream = net.connect('/tmp/test.sock');
stream.write('hello');
stream.end();