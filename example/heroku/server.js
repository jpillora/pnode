//this is already running on heroku!
//see client.js

var http = require('http');
var pnode = null;

try {
  pnode = require('pnode');
} catch(e) {
  pnode = require('../../');
}

var pserver = pnode.server();

pserver.expose({
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
//create a plain http server
http.createServer(function(req, res) {

  //only handle pnodes clients
  if(/^pnode/.test(req.headers['user-agent'])) {
    //could also check 'Authorisation' header for security (use https though!)
    pserver.handle(req, res);

  //otherwise assume browser...
  } else {
    res.end('this is a pnode server running over HTTP on port 80, '+
            'to connect to this server, please see: ' +
            'https://github.com/jpillora/pnode/blob/gh-pages/example/heroku/client.js');
  }

}).listen(port, function() {
  console.log('bound to ' + port);
});
//note: you could equivalently do
//pserver.bind('http', port);
//although we wouldn't be able to conditionally handle requests







