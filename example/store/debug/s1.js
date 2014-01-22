var pnode = require('../../../');

var peer1 = pnode.peer({
  id: 'peer1',
  debug: false
});

peer1.bindOn('tcp://0.0.0.0:8000', function(){
  console.log('bound to all interfaces on port 8000');
});

peer1.on("peer", function(peer) {
  peer1.log("peer connected: %s", peer.id);
});

var peer1Store = peer1.store({
  id:'foo',
  read:true,
  write:true,
  debug: false
});

peer1Store.set('foo', 24);
peer1Store.set(['ping','pong'], 0);
peer1Store.set('bazz', { zip: { zap: "!" } });
peer1Store.set(["x",0,"y"], { a:"b" });
peer1Store.set(["x",1], { c:"d" });

setTimeout(function() {
  console.log('peer1 has:',peer1Store.object());
  process.exit(1);
}, 1000);
