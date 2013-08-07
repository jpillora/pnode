var multinode = require('../../../');
var client = multinode.client();

client.connect('https', 8000, 'localhost');
// OR
// client.connect('https://localhost:8000');

setInterval(function() {

  var d = new Date().toString();
  client(function(remote) {
    remote.say(d);
  });

}, 1000);