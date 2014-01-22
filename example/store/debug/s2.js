var eg = require('../eg');

var store = eg.create();
var foo = store.bucket('foo');

var i = 0;

var t = setInterval(function() {
  i++;
  if(i>1e4) clearInterval(t);
  foo.set("s2-"+i, eg.val(50)+7);
});

// eg.after(1000, function() {
//   foo.set('s2-bar', eg.val(50)+7);
// });
