{expect} = require "chai"
_ = require "../lib/lodash"
pnode = require "../"

#list of client and server configurations that *should* work 
tests =
  tcp:
    client: ['tcp://127.0.0.1:8000']
    server: ['tcp://0.0.0.0:8000']
  ipc:
    client: ['ipc://pnode.sock']
    server: ['ipc://pnode.sock']
  tls:
    client: ['tls://127.0.0.1:8000']
    server: ['tls://0.0.0.0:8000']
  http:
    client: ['http://127.0.0.1:8000']
    server: ['http://0.0.0.0:8000']
  https:
    client: ['https://127.0.0.1:8000']
    server: ['https://0.0.0.0:8000']

run = (name, test, done) ->

  server = pnode.server("#{name}-server")
  server.expose
    foo: (callback) -> callback 42
  server.bind.apply server, test.server

  client = pnode.client("#{name}-client")
  client.bind.apply client, test.client

  client (remote) ->
    expect(remote).to.be.defined
    expect(remote.foo).to.be.a('function')
    remote.foo (result) ->
      expect(result).to.equal(42)
      server.unbind()
      done()

describe "basic", ->
  _.each tests, (obj, name) ->
    it name, (done) ->
      run name, obj, done





