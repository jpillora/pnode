
var tls       = require('tls');
var fs        = require('fs');

tls.createServer({
  key: fs.readFileSync('certs/agent1-key.pem'),
  cert: fs.readFileSync('certs/agent1-cert.pem'),
  ca: fs.readFileSync('certs/ca1-cert.pem'),
  requestCert: false,
  rejectUnauthorized: false
}, function (stream) {
  console.log('server connection');
  var i = 0;
  stream.on('data', function (data) {
    console.log('server data', i, data.toString());
    stream.write(new Date() + '\n');
    if(i++ > 3) stream.destroy(), console.log('hang up on client');
  });

}).listen(6789);

//connect!
var stream = tls.connect(6789, 'localhost', {
  // key: fs.readFileSync('certs/agent3-key.pem'),
  // cert: fs.readFileSync('certs/agent3-cert.pem'),
  // ca: fs.readFileSync('certs/ca2-cert.pem'),
  // requestCert: true,
  rejectUnauthorized: false
});

var t = setInterval(function () {
  stream.write(new Date() + '\n');
}, 1000);
stream.write(new Date() + '\n');

stream.on('data', function (data) {
  console.log('client data', data.toString());
});
stream.on('close', function () {
  console.log('disconnect');
  clearInterval(t);
});



