
//API Prototype

var multinode = require('../../');
var peer = multinode.peer('two');

peer.https.listen(7000);
peer.https.join([6000,8000]);

peer.peer('one', function(remote) {
  remote.sum(1,2,3, function(err, result) {
    console.log(result); //6
  });
});

peer.all(function(remote) {
  remote.sum(1,2,3, function(err, results) {
    console.log(result); //[ 6, 6 ] 
  });
});
