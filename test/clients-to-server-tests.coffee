{expect} = require "chai"
_ = require "../vendor/lodash"
pnode = require "../"

describe "clients to server > ", ->

  server = null
  client1 = null
  client2 = null

  before ->
    server = pnode.server('server-1')
    server.expose
      foo: (n, cb) -> cb n + 7
    server.bind 'tcp://0.0.0.0:8000'

    client1 = pnode.client('client-1')
    client1.bind 'tcp://localhost:8000'

    client2 = pnode.client('client-2')
    client2.bind 'tcp://localhost:8000'

  after ->
    server.unbind()

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
