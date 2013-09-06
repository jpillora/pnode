
Server = require './server/server'
Client = require './client/client'
LocalPeer = require './peer/local-peer'

#source map support
try
  require('source-map-support').install()

exports.addTransport = require('./transport-mgr').add

exports.client = (opts) -> return new Client opts
exports.server = (opts) -> return new Server opts
exports.peer   = (opts) -> return new LocalPeer opts