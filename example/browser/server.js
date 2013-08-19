var http = require('http');
var fs = require('fs');
var pnode = require('../../');
var server = pnode.server();

server.expose({
  time: function(callback) {
    callback('the server\'s time is ' + new Date());
  }
});

//a mini-static file server, may swap out for express or similar
var httpServer = http.createServer(function(req, res) {
  var response = null;

  if(req.url === '/')
    response = fs.readFileSync('./index.html');
  else if (req.url === '/bundle.js')
    response = fs.readFileSync('../../browser/out/bundle.js');
  else if (req.url === '/client.js')
    response = fs.readFileSync('./client.js');

  res.writeHead(response ? 200 : 404);
  res.end(response);
}).listen(8000, '0.0.0.0', function(){
  console.log('bound to all interfaces on port 8000');
});

//bind to server object under the path '/pnode-ws'
server.bind('ws', httpServer, '/pnode-ws');