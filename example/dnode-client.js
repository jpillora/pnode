var https = require('https');
var dnode = require('dnode');

var d = dnode({ ho: 'ho!' });

d.on('remote', function (remote, d) {
  console.log('remote', remote);
  remote.hi(console.log)
});

var options = {
  hostname: 'localhost',
  port: 8000,
  path: '/',
  method: 'PATCH',
  rejectUnauthorized: false,
  headers: {
    'transfer-encoding': 'chunked',
    'expect': '100-continue'
  }
};

var req = https.request(options, function(res) {
  console.log("statusCode: ", res.statusCode);
  console.log("headers: ", res.headers);
  res.pipe(d).pipe(req);
});

req.on('error', function(e) {
  console.error(e);
});

d.on('end', function() {
  console.log('dnode end');
})