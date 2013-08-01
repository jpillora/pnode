var multinode = require('../../');
var client = multinode.client('1');

client.expose({
  hi: function() {
    console.log('hi!');
  }
});

client.net.connect(8000);

client(function(remote) {
  remote.ho('client 1 says hi');
});