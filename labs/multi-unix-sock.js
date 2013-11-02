
var pnode = require('../');

//START SERVER
var server = pnode.peer({id:'s1',debug:false});

server.bindOn('tcp://s1.sock', function(){
  console.log('bound to all interfaces on port 8000');
});

//START CLIENT 1
var client1 = pnode.peer({id:'c1',debug:true});

client1.expose({
  one: function(date) {
    client1.log('"one" says ' + date);
  }
});

// client1.bindTo('tcp://s1.sock');
client1.bindOn('tcp://c1.sock', function() {
  client1.log('bound')
  client2.bindTo('tcp://c1.sock');
});

//START CLIENT 2
var client2 = pnode.peer({id:'c2',debug:true});

client2.expose({
  two: function(date) {
    client2.log('"two" says ' + date);
  }
});

// client2.bindOn('tcp://c2.sock');


setTimeout(function() {

  client1.peer('c2',function(remote) {
    remote.two(new Date());
  });

  client2.peer('c1',function(remote) {
    remote.one(new Date());
  });

}, 1000);
