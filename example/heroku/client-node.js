var pnode = require('../../');
var client = pnode.client({debug:true});

client.bind('http://pnode-demo.herokuapp.com:80');
// client.bind('http://localhost:3000');

client.server(function(remote) {

  remote.evaluate('require("os").hostname()', function(err, name) {
    console.log("HOST NAME");
    console.log(name);
  });

  remote.evaluate('process.env', function(err, env) {
    console.log("ENVIRONMENT VARIABLES");
    console.log(env);
  });

});
