var pnode = require('../../../');

//START PEER 2
var peer2 = pnode.peer({
  id: 'peer-1',
  debug: true
});

peer2.subscribe('foos', function(obj) {
  peer2.log('incoming foo', obj);
});

peer2.bindOn("tcp://0.0.0.0:9000", function(){
  peer2.log('tcp bound to all interfaces on port 9000');
});

peer2.bindTo("tcp://localhost:8000");
