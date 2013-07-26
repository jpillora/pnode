
var upnode = require('upnode');
var net = require('net');

var server = net.createServer(function(c) {

  var up = upnode(function (client, conn) {
    
    conn.on('remote', function() {
      console.log('client', client)

    });


    this.time = function (cb) { cb(new Date().toString()) };
  });

  up.pipe(c).pipe(up);
});

server.listen(7000, function() { //'listening' listener
  console.log('server bound');
});