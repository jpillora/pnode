Server = require './server/server'
Client = require './client/client'
LocalPeer = require './peer/local-peer'

#source map support
# try
#   require('source-map-support').install()

exports.addTransport = require('./transport-mgr').add

exports.client = (opts) -> new Client opts
exports.server = (opts) -> new Server opts
exports.peer   = (opts) -> new LocalPeer opts

exports.helper = require './helper'