var pnode = require("../../");

pnode.addTransport("ws", require("./transports/ws"));

if(typeof module === 'object' &&
   typeof exports === 'object' &&
   exports === module.exports)
  module.exports = pnode;

window.pnode = pnode;
