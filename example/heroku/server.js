//this is already running on heroku!
//see client.js

var http = require('http');
var pnode = null;

try {
  pnode = require('pnode');
} catch(e) {
  pnode = require('../../');
}

var server = pnode.server();

server.expose({
  //do not do this IRL
  evaluate: function(code, callback) {
    try {
      callback(null, eval(code));
    } catch(err) {
      callback(err);
    }
  }
});

var port = process.env.PORT || 3000;
http.createServer(function(req, res) {

  if(/^pnode/.test(req.headers['user-agent'])) {
    //could also check 'Authorisation' header for security (use https though!)
    server.handle(req, res);
  } else {
    res.end('nothing to see here...');
  }

}).listen(port, function() {
  console.log('bound to ' + port);
});
