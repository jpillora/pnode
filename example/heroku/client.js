var multinode = require('../../');
var client = multinode.client();

client.bind('http://multinode-1.herokuapp.com:80');

client(function(remote) {

  remote.evaluate('process.env', function(err, ans) {
    console.log(ans);
  });

});
