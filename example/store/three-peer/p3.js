var pnode = require('../../../');

var peer3 = pnode.peer({
  id: 'peer3',
  debug: false
});

peer3.bindTo('tcp://localhost:8000');

var peer3Store = peer3.store({
  id:'foo',
  read:true,
  write:true,
  debug: false
});

setTimeout(function() {
  console.log('peer3 has:',peer3Store.object());
  process.exit(1);
}, 1000);
