var multinode = require('../../../');
var client = multinode.client();

client.bind('https://localhost:8000');

client(function(remote) {
  remote.say(new Date());
});
