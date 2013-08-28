var exec = require('child_process').exec;
var http = require('http');
var fs = require('fs');
var pnode;
try {
  pnode = require('pnode');
} catch(e) {
  pnode = require('../../../');
}

var server = pnode.server();

//expose the server API
server.expose({
  transform: function(text, callback) {
    if(typeof text !== "string")
      callback('gimme a string');
    else
      callback(text.replace(/[aeiou]/g, 'z'));
  }
});

var index = fs.readFileSync('heroku.html');

//a mini-static file server, may swap out for express or similar
var httpServer = http.createServer(function(req, res) {
  res.end(index);
}).listen(process.env.PORT || 3000, function(){
  console.log('server running...');
});

//bind to server object under the path '/pnode-ws'
server.bind('ws', httpServer, '/pnode-ws');
