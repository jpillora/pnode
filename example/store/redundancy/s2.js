
var eg = require('../eg');
var fs = require('fs');

var store = null;
var i = 0;


eg.after(5000, function() {
  store = eg.create(12000, [eg.helper.getIp()+':11000']);

  while(i < 100)
    store.set('s2-'+(++i), '#');

});

eg.after(8000, function() {
  var arr = store.defaultBucket.history.map(function(h) { return h.key; }).sort();
  fs.writeFileSync("./history-s2.txt", JSON.stringify(arr, null, 2));
  console.log(store.defaultBucket.history.length);
  process.exit(1);
});
