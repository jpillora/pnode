pnode = require "../../"

pnode.addTransport "ws", require "./transports/ws.coffee"

window.pnode = pnode
