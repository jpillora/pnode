

var hnode = require('../');

var server = hnode.server({});

server.expose({
  ho: function(remote) {
    console.log('ho!', remote.hi());
  }
});

server.http.listen(8000);


// var https = require('https');
// var pem = require('pem');
// pem.createCertificate({days:1, selfSigned:true}, function(err, keys){
//   var opts = {key: keys.serviceKey, cert: keys.certificate};
  // https.createServer(opts, function(req, res) {
  //   console.log("connection");
  //   server.handle(req, res);
  // }).listen(8000, function() {
  //   console.log("listening");
  // });
// });