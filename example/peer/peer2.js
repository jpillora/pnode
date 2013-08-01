
//API Prototype

var multinode = require('../../');
var peer = multinode.peer('two');

peer.https.listen(7000);
peer.https.join([6000,8000]);

