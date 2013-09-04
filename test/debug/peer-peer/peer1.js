var pnode = require('../../../');

//START PEER 1
var peer1 = pnode.peer({
  id: 'peer-1',
  debug: true
});

peer1.subscribe('foos', function(obj) {
  peer1.log('incoming foo', obj);
});

peer1.bindOn("tcp://0.0.0.0:8000", function(){
  peer1.log('tcp bound to all interfaces on port 8000');
});

setTimeout(function(){
  peer1.bindTo("tcp://localhost:9000");
}, 3000)
