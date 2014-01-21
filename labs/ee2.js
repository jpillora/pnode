var Emitter = require('eventemitter2').EventEmitter2;

var e1 = new Emitter({wildcard:true});

e1.on('event', function() {
  console.log('event context', this);
})

e1.emit.call(e1,"event")

// var e1 = new Emitter({wildcard:true});

// e1.on('foo', function() {
//   console.log('foo str');
// })

// e1.on('foo.*', function() {
//   console.log('foo star');
// })

// e1.on(['foo'], function() {
//   console.log('foo arr');
// })

// e1.on(['foo','*', 'bar'], function() {
//   console.log('foo arr star BAR');
// })

// e1.on('*.test', function() {
//   console.log('test arr star');
// })

// e1.emit('foo.test');
// e1.emit(['foo','test']);
// e1.emit(['foo','test','bar']);
// e1.emit('foo.testasdasdasdasdasdasd.bar');