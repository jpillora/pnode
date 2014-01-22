var pnode = require('../../');

var peer1 = pnode.peer({
  id: 'peer1',
  debug: false
});

peer1.bindOn('tcp://0.0.0.0:8000', function(){
  console.log('bound to all interfaces on port 8000');
});

//store
var peer1Store = peer1.store({
  id:'foo',
  read:true,
  write:true,
  debug: false
});

//calculate stuff
var NUM_MESSAGES = 1e3;
var MESSAGE_SIZE = 1e4;
var value = "", v = MESSAGE_SIZE;
while(v--) value += "v";
var key = "my-key-";
var inserts = 0;
var t;

peer1.on('peer', function() {
  console.log("start");
  t = Date.now();
  while(inserts < NUM_MESSAGES)
    peer1Store.set(["test","arr",inserts++], value);
});

var peer2 = pnode.peer({
  id: 'peer2',
  debug: false
});

//store
var peer2Store = peer2.store({
  id:'foo',
  read:true,
  write:true,
  debug: false
});

var obj = peer2Store.object();

setInterval(function() {
  if(obj.test) console.log("received %s messages...", obj.test.arr.length);
}, 500);

peer2.bindTo('tcp://localhost:8000');

peer2Store.on('set', function(path, val) {
  if(obj.test && obj.test.arr.length === NUM_MESSAGES) {
    console.log("end (%sms for %s messages at %s bytes)", Date.now()-t, NUM_MESSAGES, MESSAGE_SIZE);
    process.exit(1);
  }
});



