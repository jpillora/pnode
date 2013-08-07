_ = require 'lodash'
createClient = require './client'
createServer = require './server'
Base = require './base'

# a connection can be over either: client<->server
class Connection extends Base
  
  constructor: ->
    #id
    #guid
    #ips
    #server remote OR a client


# a peer is 1 server and N clients 
class Peer extends Base

  name: 'Peer'

  defaults:
    hello: 42

  constructor: ->
    super

    @expose
      _multi:
        learn: @learn


    @addresses = []
    @clients = {}
    @servers = {}

  #peers can provide their peers to us
  learn: (peers) ->



  listen: ->
    args = _.toArray arguments

    transport = args[0]
    server = createServer @opts

    extractAddress = =>
      address = server.server.address()
      address.transport = transport
      @addresses.push address
      id = transport + "|" + address.port
      @servers[id] = server
      @log @addresses

    #splice in our own callback
    callback = args[args.length-1]
    if typeof callback is 'function'
      args[args.length-1] = =>
        extractAddress()
        callback()
    else
      args[args.length] = extractAddress

    #connect, store on success
    server.listen.apply server, args

  onRemote: (remote, conn) ->
    #handle remote


module.exports = (opts) ->
  new Peer opts


