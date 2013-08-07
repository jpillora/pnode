var multinode = require('../../');
var client = multinode.client('one');

client.expose({
  say: function(msg) {
    console.log('server says: ' + msg);
  }
});

client.connect('tcp://localhost:8000');

client(function(remote) {
  remote.say('client one says hi');
});