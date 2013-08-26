var pnode = require('../../');

//START PEER1
var peer1 = pnode.peer({ id:'peer-1', debug: true});

peer1.expose({
  say: function(str) {
    console.log('peer-1 hears ' + str);
  }
});

peer1.bindTo('tcp://127.0.0.1:10002');

//START PEER2
var peer2 = pnode.peer({ id:'peer-2', debug: true});

peer2.expose({
  say: function(str) {
    console.log('peer-2 hears ' + str);
  }
});

peer2.bindOn('tcp://0.0.0.0:10002', function() {
  peer2.log('listening...')
});

//SEND
peer1.peer('peer-2', function(remote) {
  remote.say('hi peer-2 from peer-1');
});
