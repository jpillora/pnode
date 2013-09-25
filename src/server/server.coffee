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
    @connections = ObjectIndex "id", "guid"

    #alias
    @bindOn = @bind

    @on 'unbinding', @unbinding

  unbinding: ->
    #unbind requested - close all client connections
    for conn in Array::slice.call @connections
      conn.unbind()
    return

  handle: (read, write) ->

    if read.write and not write?.write
      write = read

    @err "Invalid read stream" unless helper.isReadable read
    @err "Invalid write stream" unless helper.isWritable write

    conn = new Connection @, read, write

    conn.once 'up', =>
      #check for existing id or guid
      if @connections.getBy("id",  conn.id) or
         @connections.getBy("guid",conn.guid)
        @warn "rejected duplicate conn with id #{conn.id} (#{conn.guid})"
        conn.unbind()
        return
      #add to all
      @connections.add conn

      @emit 'remote', conn.remote
      @emit 'connection', conn, @

    conn.once 'down', =>
      return unless @connections.remove conn
      @emit 'disconnection', conn

  client: (id, callback) ->
    conn = @connections.get id
    return conn unless callback
    return callback(conn.remote) if conn

    t = setTimeout =>
      @log "timeout waiting for #{id}"
      @removeListener 'remote', cb
    , @opts.wait

    cb = =>
      @log "new remote! looking for #{id}"
      conn = @connections.get id
      return unless conn
      clearTimeout t
      @removeListener 'remote', cb
      callback conn.remote

    @on 'remote', cb
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

  serialize: ->
    @uri()

#unbind all servers on exit
process.on? 'exit', ->
  for server in servers
    server.unbind()

process.on? 'SIGINT', ->
  process.exit()

