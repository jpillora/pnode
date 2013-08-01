
//API Prototype

var multinode = require('../../');
var peer = multinode.peer('one');

peer.https.listen(6000);
peer.https.join([7000,8000]);

