_ = require 'lodash'
Base = require './base'


# a connection can be over either: client<->server
class Connection extends Base
  constructor: ->


# a peer is 1 server and N clients 
class Peer extends Base

  name: 'Peer'

  defaults:
    hello: 42

  constructor: ->
    super

    @clients = {}
    @server = null

  expose: (obj) ->
    _.extend @exposed, obj

  handle: (read, write) ->
    #server.handle

  onRemote: (remote, conn) ->
    #handle remote

  client: (id) ->
    if _.isString id
      return @clients[id]?.remote
    else if _.isNumber id
      i = id
      for id, client of @clients
        return client.remote if i-- is 0 
    else
      @err "invalid arguments"

module.exports = (opts) ->
  new Peer opts


