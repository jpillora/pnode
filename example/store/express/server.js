throw "OLD VERSION !"

//start with node server <http-port> <peer-store> <other-peer-stores...>

var express = require('express');
var PeerStore = require('../../');
var peers = process.argv.slice(2);
var httpPort = Number(peers.shift());
var port = Number(peers.shift());

if(!port || !httpPort) {
  console.log('invalid args');
  process.exit(1);
}

var app = express();
var store = new PeerStore({
  port: port,
  peers: peers
});

app.use(express.bodyParser());
app.use(express.cookieParser(false));

app.use(express.session({
  store: store.sessionStore(),
  secret: 'secr3t'
}));

app.get('/', function(req, res) {
  res.send({ user: req.session.user });
});
app.get('/login', function(req, res) {
  req.session.user = { foo: "bar" };
  res.send("login!");
});
app.get('/logout', function(req, res) {
  req.session.destroy();
  res.send("logout!");
});

app.listen(httpPort, function() {
  console.log("listening on: " + httpPort);
});
