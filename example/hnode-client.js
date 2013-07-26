

var hnode = require('../');

var client = hnode.client({
  retries: 10,
  interval: 10000,
  timeout: 1000
});

client.expose({
  hi: function() {
    console.log('hi!');
  }
});

client.http.connect(8000);

client(function(remote) {
  remote.ho();
});