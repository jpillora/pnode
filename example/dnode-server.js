var dnode = require('dnode');
var net = require('net');
// var upnode = require('./upnode');

var server = net.createServer(function(c) {

  var d = dnode(function(remote, conn) {

    conn.on('remote', function() {
      console.log("found client...");
    });

    conn.on('end', function() {
      console.log("server lost connection to '%s'", remote.id);
    });

    return {
      s: function () {
        console.log("server hit, hitting '%s' back!", remote.id);
        remote.c();
      }
    };
  });

  c.pipe(d).pipe(c);

}).listen(5004);

console.log("listening...");


// var https = require('https');
// var pem = require('pem');
// var tap = require('./tap');
// var dnode = require('dnode');
// var duplex = require('duplexer');


// pem.createCertificate({days:1, selfSigned:true}, function(err, keys){

//   var opts = {key: keys.serviceKey, cert: keys.certificate};

//   https.createServer(opts, function(req, res){

//     var d = dnode(function(remote, d) {

//       this.s = 'S!';
//       setInterval(function() {
//         console.log(remote);
//       }, 1000)
//     });

//     req.pipe(d).pipe(res);

//   }).listen(7000, function() {
//     console.log("listening");
//   });

// });

