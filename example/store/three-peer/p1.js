var pnode = require('../../../');

var peer1 = pnode.peer({
  id: 'peer1',
  debug: false
});

peer1.bindOn('tcp://0.0.0.0:8000', function(){
  console.log('bound to all interfaces on port 8000');
});

var peer1Store = peer1.store({id:'foo', read:true, write:true });

peer1Store.set('foo', 24);

setTimeout(function() {
  console.log('peer1 has:',peer1Store.object());
  process.exit(1);
}, 1000);