{expect} = require "chai"
multinode = require "../"

port = 5000

run = (transport, done) ->

  server = multinode.server()
  client = multinode.client()

  server.expose
    foo: (callback) -> callback 42

  server.listen(transport, port)
  client.connect(transport, port, 'localhost')

  client (remote) ->
    expect(remote).to.be.defined
    expect(remote.foo).to.be.a('function')
    remote.foo (result) ->

      client.disconnect()
      server.disconnect()

      expect(result).to.equal(42)
      done()


describe "basic", ->

  it "tcp", (done) ->
    run "tcp", done

  it "http", (done) ->
    run "http", done

  it "https", (done) ->
    run "https", done