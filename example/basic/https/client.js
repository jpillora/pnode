var pnode = require('../../../');
var client = pnode.client();

client.bind('https://localhost:8000');

client(function(remote) {
  remote.say(new Date());
});
