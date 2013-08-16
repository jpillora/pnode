var pnode = require('../../');

//START PEER1
var peer1 = pnode.peer('peer-1');

peer1.expose({
  say: function(str) {
    console.log('peer-1 hears ' + str);
  }
});

peer1.bindOn('https://0.0.0.0:10001');
peer1.bindTo('https://127.0.0.1:10002');
peer1.bindTo('https://127.0.0.1:10003');

//START PEER2
var peer2 = pnode.peer('peer-2');

peer2.expose({
  say: function(str) {
    console.log('peer-2 hears ' + str);
  }
});

peer2.bindOn('https://0.0.0.0:10002');
peer2.bindTo('https://127.0.0.1:10001');
peer2.bindTo('https://127.0.0.1:10003');

//START PEER3
setTimeout(function() {

  var peer3 = pnode.peer('peer-3');

  peer3.expose({
    say: function(str) {
      console.log('peer-3 hears ' + str);
    }
  });

  peer3.bindOn('https://0.0.0.0:10003');
  peer3.bindTo('https://127.0.0.1:10001');
  peer3.bindTo('https://127.0.0.1:10002');

}, 3000);

//SEND TO ALL
peer1.all(function(remote) {
  remote.say('hi from peer-1');
});

//SEND TO ONE
peer1('peer-3', function(remote) {
  remote.say('hi peer-3 from peer-1');
});
