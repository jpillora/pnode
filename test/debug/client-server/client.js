var pnode = require('../../../');

//START CLIENT 1
var client1 = pnode.client({
  id: 'client-1',
  debug: true
});

//subscribe THEN bind
client1.subscribe('foos', function(obj) {
  client1.log('incoming foo', obj);
});
setTimeout(function(){
  client1.bind('http://localhost:8000');
}, 500);

//START CLIENT 2
// var client2 = pnode.client({
//   id: 'client-2',
//   debug: true
// });

//bind THEN subscribe
// client2.bind('http://localhost:8000');
// setTimeout(function(){
//   client2.subscribe('foos', function(obj) {
//     client2.log('incoming foo', obj);
//   });
// }, 500);

//START CLIENT 3
// setTimeout(function() {
//   //delayed bind AND subscribe
//   var client3 = pnode.client({
//     id: 'client-3',
//     debug: true
//   });
//   client3.subscribe('foos', function(obj) {
//     client3.log('incoming foo', obj);
//   });
//   client3.bind('http://localhost:8000');
// }, 2000);