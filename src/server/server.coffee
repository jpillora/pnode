dnode = require 'dnode'
Base = require '../base'
helper = require '../helper'
ObjectIndex = require 'object-index'
Connection = require './connection'
servers = []

module.exports = class Server extends Base

  name: 'Server'

  defaults:
    debug: false
    wait: 5000
    timeout: 5000

  constructor: ->
    servers.push @
    super
    @connections = helper.set()
    @connections.findBy = (field, val) ->
      return @find (conn) -> conn[field] is val

    #alias
    @bindOn = @bind

    @on 'unbinding', =>
      #unbind requested - close all client connections
      for conn in @connections.copy()
        conn.unbind()
      return

    #store URI
    @on 'uri', (@uri) => 
    
    #new connection
    @on 'stream', @handle
    return

  handle: (read, write) ->

    if read.write and not write?.write
      write = read

    @err new Error "Invalid read stream" unless helper.isReadable read
    @err new Error "Invalid write stream" unless helper.isWritable write

    conn = new Connection @, read, write

    #add to all
    @connections.add conn
    @emit 'connection', conn, @

    conn.once 'up', =>
      #check for existing id or guid
      if @connections.findBy('id', conn.id) or
         @connections.findBy('guid', conn.guid)
        @warn "rejected duplicate conn with id #{conn.id} (#{conn.guid})"
        conn.unbind()
        return
      @emit 'remote', conn.remote
      return

    conn.once 'down', =>
      if @connections.remove conn
        @emit 'disconnection', conn
      return

    return

  client: (id, callback) ->

    @err "callback missing" unless callback

    get = =>
      conn = @connections.findBy('id', id)
      conn = @connections.findBy('guid', id) unless conn
      return false unless conn
      callback conn.remote
      return true

    return if get()

    check = ->
      return unless get()
      @off 'remote', check
      clearTimeout t

    t = setTimeout =>
      @off 'remote', check
      @emit 'timeout', id
    , @opts.wait

    @on 'remote', check
    return

  #pubsub to ALL conn remotes
  publish: ->
    args = arguments
    for conn in @connections
      conn.publish.apply conn, args
    return

  subscribe: (event, fn) ->
    @pubsub.on event, fn
    if @pubsub.listeners(event).length is 1
      for conn in @connections
        conn.subscribe event
    return

  serialize: -> @uri

#unbind all servers on exit
process.on? 'exit', ->
  for server in servers
    server.unbind()

process.on? 'SIGINT', ->
  process.exit()

