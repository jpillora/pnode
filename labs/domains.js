var domain = require('domain');

var coolfn = function() {
  throw new Error('cool err');
};

var fancyfn = function() {
  setTimeout(function anonfancyfn() {
    throw new Error('fancy err');
  });
};

var d = domain.create();

d.on('error', function(err) {
  console.log("CAUGHT", err);
});

d.run(function() {

  console.log('running');

  setTimeout(function() {

    console.log('still running');

  }, 100);

  setTimeout(function() {

    fancyfn();

  }, 200);

});

setTimeout(function() {
  d.dispose();
}, 150);