var Emitter = require('eventemitter2').EventEmitter2;

var e1 = new Emitter({wildcard:true});

e1.on('foo', function() {
  console.log('foo str');
})

e1.on('foo.*', function() {
  console.log('foo star');
})

e1.on(['foo'], function() {
  console.log('foo arr');
})

e1.on(['foo','*'], function() {
  console.log('foo arr star');
})

e1.on('*.test', function() {
  console.log('test arr star');
})

e1.emit('foo.test');
e1.emit(['foo','test']);