//this is already running on heroku!
//see client.js

var pnode = require('pnode');
var server = pnode.server();

server.expose({
  evaluate: function(code, callback) {
    try {
      callback(null, eval(code));
    } catch(err) {
      callback(err);
    }
  }
});

var port = process.env.PORT || 3000;
server.bind('http', port, function(){
  console.log('bound to ' + port);
});