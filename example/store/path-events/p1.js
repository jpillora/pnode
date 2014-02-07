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
  subscribe: true,
  publish: true,
  debug: false
});

//insert 3 comments in batch
store.set(["f1"], {
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

setTimeout(function() {
  //insert 2 comments individually
  store.set(["f1",  "post",  "p002",  "comment", "c004"], { body:  "hello"});
  store.set(["f1",  "post",  "p002",  "comment", "c005"], { body:  "world"});
  store.set(["f1",  "post",  "p003",  "comment", "c001"], { body:  "?????"});
}, 500);

setTimeout(function() {
  store.set(["f1",  "post",  "p002",  "comment", "c002"], undefined);
}, 750);

setTimeout(function() {
  process.exit(1);
}, 1000);
