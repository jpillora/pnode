var pnode = require('../../');
var client = pnode.client();

client.bind('http://pnode-1.herokuapp.com:80');

client(function(remote) {

  remote.evaluate('process.env', function(err, ans) {
    console.log(ans);
  });

});
