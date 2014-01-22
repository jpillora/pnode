

var eg = require('../eg');
var PeerStore = require('../../');

//calculate stuff
var valueSize = 1e3;
var value = "";
while(valueSize--) value += "v";
var key = "my-key-";
var receives = 0;
var inserts = 0;
var batch = 500;

//store
var store = eg.create();
var foo = store.bucket('foo');

function incRec() { receives++; }

//send!
setInterval(function insert() {

  console.log("inserted", inserts, " receives", receives, " batch", batch);


  if(receives === inserts) {
    batch += 10;
  } else {
    batch -= 10;
  }

  receives = 0;
  inserts = 0;

  var i = batch;
  while(i--) foo.set(key + (++inserts), value, incRec);

}, 1000);

