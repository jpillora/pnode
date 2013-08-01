var multinode = require('../');
var client = multinode.client('2');

client.expose({
  hi: function() {
    client.log('hi!');
  }
});

client.net.connect(8000);

client(function(remote) {
  console.log('calling ho...');
  remote.ho(d);
});