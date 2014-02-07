var pnode = require('../../../');

var peer2 = pnode.peer({
  id: 'peer2',
  debug: false
});

peer2.bindTo('tcp://localhost:8000');

var store = peer2.store({
  id:'forums',
  subscribe: true,
  publish: true,
  debug: false
});

//on forums 'f1', post 'p002': listen for changes to all comments 
store.on(["f1","post","p002","comment","*"], function(commentId, comment) {
  console.log("p002 %s comment: %s:", comment ? "add" : "remove", commentId, comment||'-');
});

setTimeout(function() {
  console.log('peer2 store is: %s', JSON.stringify(store.object(), null, 2));
  process.exit(1);
}, 1000);



