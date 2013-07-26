// curl -k https://localhost:8000/
var https = require('https');
var pem = require('pem');
var dnode = require('dnode');


pem.createCertificate({days:1, selfSigned:true}, function(err, keys){

  var opts = {key: keys.serviceKey, cert: keys.certificate};

  https.createServer(opts, function(req, res){

    console.log('connection', req.url);

    var d = dnode({
      hi: function(cb) { cb("HI FROM DA SERVER"); }
    });

    d.on('remote', function (remote, d) {
      console.log('remote', remote);
    });

    req.pipe(d).pipe(res);

  }).listen(8000, function() {
    console.log("listening");
  });

});