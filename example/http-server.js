var multinode = require('../');
var server = multinode.server();

server.expose({
  ho: function(date) {
    console.log('ho at ' + date);
  }
});

server.https.listen(8000, function(){
  console.log('listening on 8000');
});