
//API Prototype

var pnode = require('../../');
var peer = pnode.peer('one');


peer.join('net', 6000);

peer.connect(['net://localhost:7000','net://localhost:8000']);
