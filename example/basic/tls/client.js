var pnode = require('../../../');
var client = pnode.client();

client.bind('tls://127.0.0.1:8000');

client(function(remote) {
  remote.say(new Date());
});
