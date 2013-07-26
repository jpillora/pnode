// curl -k https://localhost:8000/
var https = require('https');
var pem = require('pem');
var upnode = require('upnode');
var duplex = require('duplexer');


pem.createCertificate({days:1, selfSigned:true}, function(err, keys){

  var opts = {key: keys.serviceKey, cert: keys.certificate};

  https.createServer(opts, function(req, res){

    console.log('connection', req.url);

    var up = upnode(function (client, conn) {
      this.time = function (cb) {
        cb(new Date().toString());
      };
    });

    up.pipe(duplex(res, res)).pipe(up);

  }).listen(8000, function() {
    console.log("listening");
  });

});