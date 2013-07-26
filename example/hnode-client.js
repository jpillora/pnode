

var hnode = require('hnode');

var client = hnode.client({
  retries: 10,
  interval: 10000,
  timeout: 1000
});

client.expose({
  hi: function() {}
});

client.connect(function(callback) {
  //read-write
  callback(req, res);
  //duplex
  callback(stream);
});

client.http(80);
client.http('host', 80);

client.https(80);
client.https('host', 80);

client.tls(80);
client.tls('host', 80);


client(function(server) {

  server.hi();

});