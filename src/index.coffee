
Base = require './base'
Server = require './server/server'
Client = require './client/client'
LocalPeer = require './peer/local-peer'

#source map support
try
  require('source-map-support').install()

exports.addTransport = require('./transport-mgr').add

exports.client = (opts) -> new Client opts
exports.server = (opts) -> new Server opts
exports.peer   = (opts) -> new LocalPeer opts

exports.install = (plugin) ->
  err = (msg) ->
    console.warn "pnode: Cannot install plugin: #{msg}"
  if typeof plugin isnt 'object'
    return err "must be an object"
  if typeof plugin.name isnt 'string'
    return err "must have a string 'name' property"
  if typeof plugin.fn isnt 'function'
    return err "must have a function 'fn' property"
  if Base::[plugin.name] isnt undefined
    return err "property '#{plugin.name}' already exists on the prototype"
  Base::[plugin.name] = plugin.fn
  return true

exports.helper = require './helper'