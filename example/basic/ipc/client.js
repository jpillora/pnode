var pnode = require('../../../');
var client = pnode.client();

client.bind('ipc://pnode.sock');

client(function(remote) {
  remote.say(new Date());
});
