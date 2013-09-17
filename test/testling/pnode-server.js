
var http = require('http');
var fs = require('fs');
var port = parseInt(process.env.PORT,10) || 8000;

var pnode = require('../../');

var server = pnode.server({ id: 'server-1', debug: false });

server.expose({
  sum: function(a,b,callback) {
    callback(a+b);
  }
});

//a mini-static file server, may swap out for express or similar
var httpServer = http.createServer(function(req, res) {
  res.end(req.url === '/pnode.js' ? fs.readFileSync('browser/dist/pnode.js') : '');
}).listen(port, function(){
  console.log('server running on ' + port);
});

//bind to server object under the path '/pnode-ws'
server.bind('ws', httpServer, '/pnode-ws');
