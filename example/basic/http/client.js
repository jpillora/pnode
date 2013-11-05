var pnode = require('../../../');
var client = pnode.client('c1');

client.bind('http://localhost:8000');

client.server(function(remote) {
  remote.say(new Date());
});
