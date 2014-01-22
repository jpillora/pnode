var eg = require('../eg');
var PeerStore = require('../../');

//calculate stuff
var receives = 0;

//store
var store = eg.create('http://localhost:8000',[], 'foo');

//receive!
store.on('set', function(k) {
  receives++;
});

var mult = 1;
setInterval(function() {
  console.log(receives*mult);
  receives = 0;
}, 1000/mult);

