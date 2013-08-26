var http = require('http');
var fs = require('fs');
var pnode = require('../../../');

//a server on 8000
//a mini-static file server, may swap out for express or similar
var httpServer = http.createServer(function(req, res) {
  res.end(fs.readFileSync(
    req.url === '/pnode.js'  ? '../../../browser/dist/pnode.js' :
    req.url === '/client.js' ? './client.js' :
      '../index.html'
  ));
}).listen(8000, function(){
  console.log('file server running at http://localhost:8000');
});

//a server on 8001
var server = pnode.server();

server.expose({
  time: function(callback) {
    callback('the server\'s time is ' + new Date());
  }
});

//bind to a *new http* server on 8001 under the path '/pnode-ws'
server.bind('ws://0.0.0.0:8001/pnode-ws');