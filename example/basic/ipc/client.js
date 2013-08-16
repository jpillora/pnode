var multinode = require('../../../');
var client = multinode.client();

client.bind('ipc://multinode.sock');

client(function(remote) {
  remote.say(new Date());
});
