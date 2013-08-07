var multinode = require('../../../');
var client = multinode.client();

// client.connect('https://localhost:8000');
client.connect('https',8000,'localhost');

setInterval(function() {

  var d = new Date().toString();
  client(function(remote) {
    remote.say(d);
  });

}, 1000);
