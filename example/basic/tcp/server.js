var multinode = require('../../../');
var server = multinode.server();

server.expose({
  say: function(date) {
    console.log('client says ' + date);
  }
});

server.listen('tcp', 8000, function(){
  console.log('listening on 8000');
});