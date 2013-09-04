var pnode = require('../../');

//START CLIENT 1
var client1 = pnode.client({
  id: 'client-1',
  debug: true
});

client1.bind('http://localhost:8000');

//START CLIENT 2
var client2 = pnode.client({
  id: 'client-2',
  debug: true
});

client2.expose({
  foo: 42,
  show: function(msg) {
    client2.log('recieved "%s" from server "%s"', msg, this.id);
  }
});

client2.bind('http://localhost:8000');

//CALL SERVER 
client1.server(function(remote) {
  remote.show(new Date());
});

client2.server(function(remote) {
  remote.show(new Date());
});


// setTimeout(function() {
//   //START CLIENT 3 as 2
//   var client3 = pnode.client({
//     id: 'client-2',
//     debug: true
//   });

//   client3.bind('tcp://localhost:8000');
// }, 2000);