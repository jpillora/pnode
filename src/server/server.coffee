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

    conn.on 'error', @onError
    conn.on 'fail', @onFail

    conn.once 'up', =>
      @log "CONN UP #{conn.id}"
      #check for existing id or guid
      if @connections.findAllBy('id', conn.id).length >= 2 or
         @connections.findAllBy('guid', conn.guid).length >= 2
        @warn "rejected duplicate conn with id #{conn.id} (#{conn.guid})"
        conn.unbind()
        return
      conn.accepted = true
      @emit 'remote', conn.remote
      return

    conn.once 'down', =>
      @log "CONN DOWN #{conn.id}"
      if @connections.remove conn
        @emit 'disconnection', conn
      return

    #add to all
    @connections.add conn
    @emit 'connection', conn, @

    return

  onError: (err) ->
    @emit 'error', err

  onFail: (err) ->
    @emit 'fail', err

  client: (id, callback) ->

    get = =>
      conn = @connections.findBy('id', id) or
             @connections.findBy('guid', id)
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
      @emit 'waitout', id
    , @opts.wait

    @on 'remote', check
    return

  all: (callback) ->
    rems = []
    for conn in @connections
      rems.push conn.remote
    callback rems

  #pubsub to ALL conn remotes
  publish: ->
    args = arguments
    for conn in @connections
      conn.publish.apply conn, args
    return

  subscribe: (event, fn) ->
    #if we are not yet subscribed, notify clients
    if @pubsub.listeners(event).length is 0
      #loop through UP connections
      for conn in @connections
        conn.subscribe event
    super
    return

  unsubscribe: (event, fn) ->
    #if we are subscribed, notify server
    if @pubsub.listeners(event).length > 0
      #loop through UP connections
      for conn in @connections
        conn.unsubscribe event
    super
    return
  serialize: -> @uri

#unbind all servers on exit
process.on? 'exit', ->
  for server in servers
    server.destroy()

process.on? 'SIGINT', ->
  process.exit()

