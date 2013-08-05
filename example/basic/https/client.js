var multinode = require('../../../');
var client = multinode.client();

client.https.connect(8000);

// setInterval(function() {

  var d = new Date().toString();
  client(function(remote) {
    remote.say(d);
  });

// }, 1000);