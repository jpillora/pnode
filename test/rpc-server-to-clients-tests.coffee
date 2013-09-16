{expect} = require "chai"
_ = require "../vendor/lodash"
pnode = require "../"

describe "server to clients > ", ->

  server = null
  client1 = null
  client2 = null

  beforeEach (done) ->
    server = pnode.server('server-1')
    server.bind 'tcp://0.0.0.0:8000'

    client1 = pnode.client('client-1')
    client1.expose
      one: (n, cb) -> cb n + 7
    client1.bind 'tcp://localhost:8000'

    client2 = pnode.client('client-2')
    client2.expose
      two: (n, cb) -> cb n + 14
    client2.bind 'tcp://localhost:8000'

    setTimeout done, 10

  afterEach (done) ->
    server.unbind()
    client1.unbind()
    client2.unbind()
    setTimeout done, 10

  it "should connect to client-1", (done) ->
    server.client 'client-1', (remote) ->
      remote.one 42, (result) ->
        expect(result).to.equal 49
        done()
    
  it "should connect to client-2", (done) ->
    server.client 'client-2', (remote) ->
      remote.two 36, (result) ->
        expect(result).to.equal 50
        done()

  it "'three' should be missing", (done) ->
    server.client 'client-2', (remote) ->    
      expect(remote.three).not.to.be.defined
      done()


    


