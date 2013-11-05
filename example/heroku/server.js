//this is already running on heroku!
//see client.js

var http = require('http');
var pnode = null;

try {
  pnode = require('pnode');
} catch(e) {
  pnode = require('../../');
}

var server = pnode.peer();

server.expose({
  //do not do this IRL
  evaluate: function(code, callback) {
    try {
      callback(null, eval(code));
    } catch(err) {
      callback(err);
    }
  },
  //transform text
  transform: function(text, callback) {
    if(typeof text !== "string")
      callback('gimme a string');
    else
      callback(text.replace(/[aeiou]/g, 'z'));
  }
});

var port = process.env.PORT || 3000;

//standard http server
var s = http.createServer(function(req, res) {
  res.writeHead(200);
  res.end('this is a pnode server running over HTTP on port 80, '+
          'to connect to this server, please see: https://github.com/jpillora/pnode/');
});

s.listen(port, function(){
  console.log('bound to all interfaces on port '+port);
});

//bind to existing server
server.bindOn('http', s);
server.bindOn('ws', s, '/pnode-ws');





