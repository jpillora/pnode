var dnode = require('dnode');
var net = require('net');
// var upnode = require('./upnode');

var id = process.argv[2];
if(!id) console.log("choose an id") || process.exit(1);

var d = dnode(function(remote, conn) {
  this.id = id;
  this.c = function () {
    console.log("client %s hit.", id);
  };
});

d.on('remote', function (remote) {
  console.log("found server...");
  remote.s();
});


d.on('error', function(e) {
  console.log("connection error!");
});

d.on('end', function() {
  console.log("lost connection to server");
});

console.log("connecting...");



var c = net.connect(5004);

c.pipe(d).pipe(c);

// var https = require('https');
// var dnode = require('dnode');

// var d = dnode(function(remote, conn) {
//   this.c = 'C!';
// });

// d.on('remote', function (remote, d) {
//   console.log('SERVER', remote);
// });

// var options = {
//   hostname: 'localhost',
//   port: 7000,
//   path: '/',
//   method: 'PATCH',
//   rejectUnauthorized: false,
//   headers: {
//     'transfer-encoding': 'chunked',
//     'expect': '100-continue'
//   }
// };

// var req = https.request(options, function(res) {
//   console.log("statusCode: ", res.statusCode);
//   res.pipe(d).pipe(req);
// });

// req.on('error', function(e) {
//   console.error(e);
// });

// d.on('end', function() {
//   console.log('dnode end');
// })