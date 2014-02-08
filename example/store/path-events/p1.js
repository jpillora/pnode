var pnode = require('../../../');

var peer1 = pnode.peer({
  id: 'peer1',
  debug: false
});

peer1.bindOn('tcp://0.0.0.0:8000', function(){
  console.log('bound to all interfaces on port 8000');
});

peer1.on("peer", function(peer) {
  console.log("peer connected: %s", peer.id);
});

var store = peer1.store({
  id:'forums',
  publish: true,
  publishInterval: 50,
  debug: false
});

setTimeout(function() {
  //insert 3 comments in batch
  store.set(["f001"], {
    post:{
      "p002": {
        comment: {
          "c001":  { body:  "!"},
          "c002":  { body:  "!!"},
          "c003":  { body:  "!!!"}
        }
      }
    }
  });
}, 100);

setTimeout(function() {
  //insert 2 comments individually
  store.set(["f001",  "post",  "p002",  "comment", "c004"], { body:  "hello"});
  store.set(["f001",  "post",  "p002",  "comment", "c005"], { body:  "world"});
  store.set(["f001",  "post",  "p003",  "comment", "c001"], { body:  "?????"});
}, 200);

setTimeout(function() {
  store.set(["f001",  "post",  "p002"], undefined);
}, 700);

setTimeout(function() {
  // console.log('peer1 store is: %s', JSON.stringify(store.object(), null, 2));
  process.exit(1);
}, 1000);
