
//API Prototype

var multinode = require('../../');

var peer = multinode.peer({
  id: 'two',
  autoShare: true,
  autoJoin: true
});

peer.listen('tcp', 7000, 'cas-dev.think.edu.au');
peer.listen('http', 7001);
// peer.connect(['tcp://localhost:8000','http://localhost:8000']);

//equivalent to:
// net.createServer(peer.handle).listen(7000);
// peer.createConnection(function(streamCallback) {
//   streamCallback(net.connect('myhost.com', 7000));
// });
// peer.createConnection(function(streamCallback) {
//   streamCallback(net.connect('myotherhost.com', 7000));
// });

// peer.peer('one', function(remote) {
//   remote.sum(1,2,3, function(err, result) {
//     console.log(result); //6
//   });
// });

// peer.all(function(remote) {
//   remote.sum(1,2,3, function(err, results) {
//     console.log(result); //[ 6, 6 ] 
//   });
// });
