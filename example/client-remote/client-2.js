var multinode = require('../../');
var client = multinode.client('two');

client.expose({
  say: function(msg) {
    console.log('server says: ' + msg);
  }
});

client.connect('tcp://localhost:8000');

client(function(remote) {
  remote.say('client two says hi');
});