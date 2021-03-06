var http = require('http');
var fs = require('fs');
var pnode = require('../../../');

var server = pnode.server({ id: 'server-1', debug: true });

server.expose({
  time: function(callback) {
    callback('the server\'s time is ' + new Date());
  }
});

//a mini-static file server, may swap out for express or similar
var httpServer = http.createServer(function(req, res) {
  res.end(fs.readFileSync(
    req.url === '/pnode.js'  ? '../../../browser/dist/pnode.js' :
    req.url === '/client.js' ? './client.js' :
      '../index.html'
  ));
}).listen(8000, function(){
  console.log('server running at http://localhost:8000');
});

//bind to server object under the path '/pnode-ws'
server.bind('ws', httpServer, '/pnode-ws');
