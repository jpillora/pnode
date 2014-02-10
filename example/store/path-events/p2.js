var pnode = require('../../../');

var peer2 = pnode.peer({
  id: 'peer2',
  debug: false
});

peer2.bindTo('tcp://localhost:8000');

var store = peer2.store({
  id:'forums',
  subscribe: true,
  debug: false
});


store.on([], function(action, val) {
  console.log(">>> all:", val);
});

//on forums 'f1', post 'p002': listen for changes to all comments 
// store.on("update", ["f001","post","p002","comment","*","body"], function(cid, str) {
//   console.log(">>> p002 %s *%s* body: '%s'", cid, "update", str);
// });

//on forums 'f1', post 'p002': listen for changes to all comments 
// store.on(["f001","post","users","*"], function(action, index, val) {
//   console.log(">>> users: %s: %s: %j", action, index, val);
// });


// var type = "remove";
// store.on(type, ["f001","post","p002","comment","*","body"], function(cid, str) {
//   console.log(">-- p002 %s *%s* body: '%s'", cid, type, str);
// });

// // on forums 'f1', post 'p002': listen for changes to all comments 
// store.on(["f001","post","p002","comment","*"], function(action, commentId, comment) {
//   console.log(">>> p002 %s comment: %s:", action, commentId, comment||'-');
// });

// store.on(["f001"], function(action, obj) {
//   console.log(">>> f001 %s",action);
// });

setTimeout(function() {
  console.log('peer2 store is: %s', JSON.stringify(store.object(), null, 2));
  process.exit(1);
}, 1000);



