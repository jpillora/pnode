var pnode = require('../../../');
var http = require('http');
var server = pnode.server('s1');

server.expose({
  say: function(date) {
    console.log('client says ' + date);
  }
});

//standard http server
var s = http.createServer(function(req, res) {
  res.writeHead(200);
  res.end('hello world');
});
s.listen(8000, function(){
  console.log('bound to all interfaces on port 8000');
});

//bind to existing server
server.bind('http', s, function filter(req) {

  //intercept random requests - very silly...
  // return Math.random() > 0.5;

  //could check cookies/auth headers etc...

  //intercept for 'pnode/0.1.x' clients
  return (/^pnode\/0\.1\.\d+$/).test(req.headers['user-agent']);
});


//equivalent to (minus the hello world handler)
// server.bind('http://0.0.0.0:8000', function(){
//   console.log('bound to all interfaces on port 8000');
// });

