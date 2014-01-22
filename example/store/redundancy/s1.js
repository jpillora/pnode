
var eg = require('../eg');
var fs = require('fs');

var store = eg.create(11000, []);
var i = 0;

eg.every(10, function() {
  store.set('s1-'+(++i), '!');
});

eg.after(8000, function() {

  var arr = store.defaultBucket.history.map(function(h) { return h.key; }).sort();
  fs.writeFileSync("./history-s1.txt", JSON.stringify(arr, null, 2));
  console.log(store.defaultBucket.history.length);
  process.exit(1);
});
