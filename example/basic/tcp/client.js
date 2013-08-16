var pnode = require('../../../');
var client = pnode.client();

client.bind('tcp://localhost:8000');

client(function(remote) {
  remote.say(new Date());
});
