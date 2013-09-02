var t0 = false;
var total = 0;
//1kb of data
var size = 10e3;
var done = false;
var pnode = require('../');

if(process.argv.indexOf('server') > 0) {
  var server = pnode.server();
  server.expose({
    inc: function(data) {
      server.client(0, function(remote) {
        total++;
        remote.inc(data);
      });
    }
  });

  server.bind('tcp://0.0.0.0:8000', function(){
    console.log('bound to all interfaces on port 8000');
  });
}

if(process.argv.indexOf('client') > 0) {
  var client = pnode.client();
  client.expose({
    inc: function(data) {
      client.server(function(remote) {
        if(done) process.exit(0);
        total++;
        remote.inc(data);
      });
    }
  });

  var addr = process.argv[process.argv.indexOf('client')+1] || 'localhost';

  client.bind('tcp://' + addr + ':8000');

  client.server(function(remote) {
    var d = "", s = size;
    while(s--) d += "d";
    //start timers
    t0 = Date.now();
    setTimeout(function() {
      done = true;
      console.log('sent ' + total + ' messages ('+size+' bytes) in ' + (Date.now() - t0) + 'ms');
    }, 1e3);
    //init
    remote.inc(0, d);
  });
}

if(!server && !client)
  console("usage: simple-tcp server | client [host]");
