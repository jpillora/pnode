
var tls       = require('tls');
var fs        = require('fs');
var dnode     = require('dnode');

tls.createServer({
  key: fs.readFileSync('certs/agent1-key.pem'),
  cert: fs.readFileSync('certs/agent1-cert.pem'),
  ca: fs.readFileSync('certs/ca1-cert.pem'),
  requestCert: false,
  rejectUnauthorized: false

}, function (stream) {
  console.log('server connection');

  var d = dnode({
    nested: {
      say: function(str) {
        console.log('server says', str);
      }
    }
  });

  d.on('remote', function(rem) {
    rem.say('bing!')
  })

  stream.pipe(d).pipe(stream);

}).listen(6789);

//connect!
var stream = tls.connect(6789, 'localhost', {
  // key: fs.readFileSync('certs/agent3-key.pem'),
  // cert: fs.readFileSync('certs/agent3-cert.pem'),
  // ca: fs.readFileSync('certs/ca2-cert.pem'),
  // requestCert: true,
  rejectUnauthorized: false
});

var d = dnode({
  say: function(str) {
    console.log('client says', str);
  }
});

stream.pipe(d).pipe(stream);

d.on('remote', function(rem) {
  console.log('remote', rem);

  rem.nested.say('boo!')
});


