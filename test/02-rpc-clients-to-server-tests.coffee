{expect} = require "chai"
_ = require "../vendor/lodash"
pnode = require "../"
helper = require "./helper"

describe "clients to server > ", ->

  server = null
  client1 = null
  client2 = null

  beforeEach (done) ->
    server = pnode.server({id:'server-1', debug: false})
    server.expose
      foo: (n, cb) -> cb n + 7
    server.bind 'tcp://0.0.0.0:8000'

    client1 = pnode.client({id:'client-ONE', debug: false})
    client2 = pnode.client('client-TWO')

    setTimeout ->
      client1.bind 'tcp://localhost:8000'
      client2.bind 'tcp://localhost:8000'
      done()
    , 10

  afterEach (done) ->
    helper.unbindAfter server,client1,client2,done

  it "should connect to server from client-1", (done) ->
    client1.server (remote) ->
      remote.foo 42, (result) ->
        expect(result).to.equal 49
        done()
    
  it "should connect to server from client-2", (done) ->
    client2.server (remote) ->
      remote.foo 43, (result) ->
        expect(result).to.equal 50
        done()
    
  it "'bar' should be missing", (done) ->
    client1.server (remote) ->
      expect(remote).to.defined
      expect(remote.bar).to.undefined
      done()
