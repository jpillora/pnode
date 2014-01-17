{expect} = require "chai"
_ = require "../vendor/lodash"
pnode = require "../"

describe "rpc timeout > ", ->

  server = null
  client = null

  beforeEach ->

    server = pnode.server {id:'server-1', debug:false}
    server.expose
      fast: (cb) ->
        setTimeout (-> cb true), 0
      slow: (cb) ->
        setTimeout (-> cb true), 1000
    server.bind 'tcp://0.0.0.0:8000'
    
    client = pnode.client {id:'client-1', debug:false}
    client.bind 'tcp://localhost:8000'

  afterEach ->
    server.unbind()
    client.unbind()

  describe "server timeout > ", ->

    beforeEach ->
      server.options {timeout: 50}

    it "should NOT timeout", (done) ->

      server.on 'timeout.fast', -> done(new Error "server timeout")
      client.on 'timeout.fast', -> done(new Error "client has no timeout")

      client.server (remote) ->
        remote.fast (callback) ->
          done()

    it "should timeout", (done) ->

      server.on 'timeout.slow', -> done()
      client.on 'timeout.slow', -> done(new Error "client has no timeout")

      client.server (remote) ->
        remote.slow (callback) ->
          done(new Error "server timedin")

  describe "client timeout > ", ->

    beforeEach ->
      client.options {timeout: 50}

    it "should NOT timeout", (done) ->

      server.on 'timeout.fast', -> done(new Error "server has no timeout")
      client.on 'timeout.fast', -> done(new Error "client timeout")

      client.server (remote) ->
        remote.fast (callback) ->
          done()

    it "should timeout", (done) ->

      server.on 'timeout.slow', -> done(new Error "server has no timeout")
      client.on 'timeout.slow', -> done()

      client.server (remote) ->
        remote.slow (callback) ->
          done(new Error "client timedin")
