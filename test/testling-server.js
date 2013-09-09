
var http = require('http');
var fs = require('fs');
var pnode = require('../');

var server = pnode.server({ id: 'server-1', debug: false });

server.expose({
  sum: function(a,b,callback) {
    callback(a+b);
  }
});

//a mini-static file server, may swap out for express or similar
var httpServer = http.createServer(function(req, res) {
  res.end("hello");
}).listen(parseInt(process.env.PORT,10), function(){
  console.log('server running at http://localhost:8000');
});

//bind to server object under the path '/pnode-ws'
server.bind('ws', httpServer, '/pnode-ws');
