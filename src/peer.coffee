_ = require '../vendor/lodash'
pnode = require './index'
Base = require './base'
locals = []

# a remote peer contains all connections to and from it 
class RemotePeer extends Base

  name: 'RemotePeer'

  defaults:
    hello: 42

  constructor: (@local, @remote) ->
    #id
    #guid
    #ips
    #server remote OR a client

  toJSON: ->
    @log 'toJSON', @remote
    @remote._multi.ips

  add: ->
    @log 'add!'


# a peer is 1 server and N clients 
class LocalPeer extends Base

  name: 'LocalPeer'

  defaults:
    debug: true
    hello: 42

  constructor: ->
    super

    @peers = {}

    @expose
      _multi:
        guid: @guid
        peers: (cb) -> cb @peers

    _.extend @one, @
    return @one

  bindOn: ->
    server = pnode.server @opts
    server.expose @exposed
    server.bind.apply server, arguments
    server.on 'remote', @onPeer

  bindTo: ->
    client = pnode.client @opts
    client.expose @exposed
    client.bind.apply client, arguments

  #new peer connection
  onPeer: (remote) ->
    @log 'new peer! ', remote._multi.guid

    remote._multi.peers (p) => @log p

    guid = remote?._multi?.guid

    return unless guid
    if @peers[guid]
      @peers[guid].add remote
    else
      @peers[guid] = new RemotePeer @, remote

  #peers can provide their peers to us
  # learn: (peers) ->

  all: ->
    @log 'all!'

  one: ->
    @log 'one!'

module.exports = (opts) ->
  peer = new LocalPeer opts
  locals.push peer
  return peer
