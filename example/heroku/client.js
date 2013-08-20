var pnode = require('../../');
var client = pnode.client();

client.bind('http://pnode-demo.herokuapp.com:80');
// client.bind('http://localhost:3000');

client.server(function(remote) {

  remote.evaluate('process.env', function(err, env) {
    console.log(env);
  });

});
