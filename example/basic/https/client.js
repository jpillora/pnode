var pnode = require('../../../');
var client = pnode.client();

client.bind('http://localhost:8000');

client.server(function(remote) {
  remote.say(new Date());
});
