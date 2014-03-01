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

  //1. intercept random requests - very silly...
  // return Math.random() > 0.5;

  //2. or check cookies/auth headers etc...
  // return req.headers['cookies'] === 'my-secret-token'

  //3. or intercept for 'pnode/0.2.x' clients
  return (/^pnode\/0\.2\.\d+$/).test(req.headers['user-agent']);
});


//the above is equivalent to:
// server.bind('http://0.0.0.0:8000', function(){
//   console.log('bound to all interfaces on port 8000');
// });

//(save the hello world handler)

