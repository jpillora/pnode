var https = require('https');
var duplex = require('duplexer');
var stream = require('stream');

var upnode = require('upnode');
var net = require('net');

var upStub = upnode({
  id: '!'
});


var up = upStub.connect({
    createStream : net.connect.bind(null, 7000)
});

setInterval(function () {
    up(function (remote) {
        remote.time(function (t) {
            console.log('time = ' + t);
        });
    });
}, 1000);
