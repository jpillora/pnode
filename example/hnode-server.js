

var hnode = require('hnode');

var server = hnode.server({

});

server.expose({
  hi: function() {}
});


https.createServer(opts, function(req, res){

  server.handle(req, res);
  server.handle(stream);

});


server.http(80);

server.https(80);

server.tls(80);