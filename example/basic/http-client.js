var multinode = require('../');
var client = multinode.client();

client.expose({
  hi: function() {
    console.log('hi!');
  }
});

client.https.connect(8000);

setInterval(function() {

  var d = new Date().toString();
  client(function(remote) {
    console.log('calling ho...');
    remote.ho(d);
  });

}, 1000);