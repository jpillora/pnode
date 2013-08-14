var multinode = require('../../../');
var cluster = require('cluster');
var server = multinode.server();

server.expose({
  say: function(date) {
    console.log('client says ' + date);
  }
});

//=====================
//method 1
//ISSUE: how to callbacks work if 4 processes
//recieve the message?
if(cluster.isMaster) {
  //master binds to remote port
  //then forwards to all cluster workers
  server.listen('tcp', 8000, function(){
    console.log('listening on 8000');
  });
} else if(cluster.isWorker) {
  server.listen('cluster');
}
//=====================
//method 2
//master will create a list of multinode servers
//so other workers can auto-join
if(cluster.isWorker) {
  server.listen('tcp', 8000 + cluster.worker.id, function(){
    console.log('listening on ...');
  });
}


