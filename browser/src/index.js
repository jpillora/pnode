var pnode = require("../../");
pnode.addTransport("ws", require("./transports/ws"));
window.pnode = pnode;
