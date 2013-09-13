{expect} = require "chai"
_ = require "../vendor/lodash"
pnode = require "../"

LO = 10
HI = 20

describe "rpc timeout > ", ->

  server = null
  client = null

  beforeEach ->

    server = pnode.server {id:'server-1'}
    server.expose
      fast: (cb) ->
        setTimeout (-> cb true), LO
      slow: (cb) ->
        setTimeout (-> cb true), HI
    server.bind 'tcp://0.0.0.0:8000'
    
    client = pnode.client {id:'client-1'}
    client.bind 'tcp://localhost:8000'

  afterEach ->
    server.unbind()
    client.unbind()

  describe "server timeout > ", ->

    beforeEach ->
      server.options {timeout: (HI+LO)/2}

    it "should NOT timeout", (done) ->

      server.on 'timeout', -> done(new Error "server timeout")
      client.on 'timeout', -> done(new Error "client has no timeout")

      client.server (remote) ->
        remote.fast (callback) ->
          done()

    it "should timeout", (done) ->

      server.on 'timeout', -> done()
      client.on 'timeout', -> done(new Error "client has no timeout")

      client.server (remote) ->
        remote.slow (callback) ->
          done(new Error "timedin")

  describe "client timeout > ", ->

    beforeEach ->
      client.options {timeout: (HI+LO)/2}

    it "should NOT timeout", (done) ->

      server.on 'timeout', -> done(new Error "server has no timeout")
      client.on 'timeout', -> done(new Error "client timeout")

      client.server (remote) ->
        remote.fast (callback) ->
          done()

    it "should timeout", (done) ->

      server.on 'timeout', -> done(new Error "server has no timeout")
      client.on 'timeout', -> done()

      client.server (remote) ->
        remote.slow (callback) ->
          done(new Error "timedin")
