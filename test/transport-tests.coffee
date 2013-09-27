{expect} = require "chai"
_ = require "../vendor/lodash"
pnode = require "../"
sinon = require "sinon"

#use static certs to speed up tests
certs =
  key: '-----BEGIN RSA PRIVATE KEY-----\nMIICXAIBAAKBgQDUanwpKPOFRiRC64vq4q3NOmMA1XzvowMsHSsQJJiIwh4dMLc2\npkq2vZ6NXASCdNoKw84xgSKWnqD3MuLSEb9mPdSx/zYIXfqwJCGhEu7klcuKbxiM\nroeF//4VGJlrfy6TP47ayk7R60HJWYfkmZWUi7PI20Adlx/6/di3OPLffQIDAQAB\nAoGBAJ8p5z0kPUzo4PTv8JihH+A+1r5iOcqKWC8u7/yZn14iLlRrE220rxk8/lgn\n0g06p8MXMyKvA47e7/gqvgDwYXxKW4B/TN5ScuXjCP+lqEbFbHAqcIQKCYGXKqKd\nko9ly1kHs8fgzwnyuoYSvGIt1cmVmxTkZ348XPhsgZ3W9S8BAkEA7o4+7eFQwoIz\nlYy8aVadSHuoijkFZIyTOulqMV3cjVG7albSc60ohnI4VFlYaLYpCaj3JCHU8V0h\nvzrobF+mwQJBAOPy565CV83tWiqcSCa0XqXZsBKxW9Rj/o2csxOJtU0L4xfKjefR\nIi1t9RLz1TWx7Z6t+fU8VCtR4GJSH0QAg70CQBn5oyCDyCdlxfgiuuE9bSLXVCK4\n0r2AEQf5Inb9oWZB4AZULdYqpJ7/EOMeV2IPc6h5nW9xv54IZgRMhcJHKAECQDzk\nb5VybYg6JoMJepC0UDBXxZxIurIzABYOTRwkBkWNrl11o5DQoiOmovgsIMGWRVbF\nPOeQ9R8ZYSqCq4174bUCQEoyIByinhilSSphHGM1yA+6m62WBypu9HV1i878hma8\nxHhFmikjaMsiHmU9j35fwGMtyT3bQK0D0Vzxd0FnAU4=\n-----END RSA PRIVATE KEY-----'
  cert: '-----BEGIN CERTIFICATE-----\nMIIBnzCCAQgCCQC2x5ckbttrzzANBgkqhkiG9w0BAQUFADAUMRIwEAYDVQQDEwls\nb2NhbGhvc3QwHhcNMTMwOTA1MjMyNzE0WhcNMTQwOTA1MjMyNzE0WjAUMRIwEAYD\nVQQDEwlsb2NhbGhvc3QwgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBANRqfCko\n84VGJELri+rirc06YwDVfO+jAywdKxAkmIjCHh0wtzamSra9no1cBIJ02grDzjGB\nIpaeoPcy4tIRv2Y91LH/Nghd+rAkIaES7uSVy4pvGIyuh4X//hUYmWt/LpM/jtrK\nTtHrQclZh+SZlZSLs8jbQB2XH/r92Lc48t99AgMBAAEwDQYJKoZIhvcNAQEFBQAD\ngYEAzf+S+tOqw+9AUQruoVRn1ECnrIaDYbtu1FvF41OwEJaifts9KEQmlrTU2asb\n4y89afF6CWrkxmJhPqRPyvtyuDPBuH5mjSoZfOxgtWspi0UvcZqWEamLmHKd4XSn\nb3VMUIgRwjuMEklGj+KYCtD4tLcGGYsLv0vQHEwVnnEeZDE=\n-----END CERTIFICATE-----',
  rejectUnauthorized: false

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
    server: ['tls://0.0.0.0:8000', certs]
  http:
    client: ['http://127.0.0.1:8000']
    server: ['http://0.0.0.0:8000']
  https:
    client: ['https://127.0.0.1:8000']
    server: ['https://0.0.0.0:8000', certs]


# =======================
# basic bind+unbind server test using each transport

bindTest = (name, test, done) ->

  #spies (named fns for sinon debugging)
  spyFns = [
    `function bindingServer(){}`
    `function boundServer(){}`
    `function bindingClient(){}`
    `function boundClient(){}`
    `function unbindingClient(){}`
    `function unboundClient(){}`
    `function unbindingServer(){}`
    `function unboundServer(){}`
  ]
  spies = {}
  spies[fn.name] = sinon.spy(fn) for fn in spyFns

  server = pnode.server({id:"bind-#{name}-server", debug:false})

  #listen for server events
  server.once 'bound', spies.boundServer
  server.once 'binding', spies.bindingServer
  server.once 'unbound', spies.unboundServer
  server.once 'unbinding', spies.unbindingServer

  server.once 'bound', ->
    #server up
    client = pnode.client({id:"bind-#{name}-client", debug:false})

    #listen for client events
    client.once 'bound', spies.boundClient
    client.once 'binding', spies.bindingClient
    client.once 'unbound', spies.unboundClient
    client.once 'unbinding', spies.unbindingClient

    client.once 'bound', ->
      client.unbind ->
        server.unbind ->
          #pull in spies in order
          order = []
          for name,spy of spies
            order.push spy
          #assert sequence
          sinon.assert.callOrder.apply null, order
          done()

    #kick off client
    client.bind.apply client, test.client

  #kick off server
  server.bind.apply server, test.server


describe "basic bind/unbind client and server > ", ->
  _.each tests, (obj, name) ->
    # obj = tests.http
    # name = 'http'
    it "bind/unbind #{name} should work", (done) ->
      bindTest name, obj, done

# =======================
# basic rpc test using each transport
rpcTest = (name, test, done) ->

  server = pnode.server("rpc-#{name}-server")
  server.expose
    foo: (callback) -> callback 42

  #insert callback at 2nd position
  test.server.splice 1, 0, ->
    #server up
    client = pnode.client("rpc-#{name}-client")
    client.bind.apply client, test.client

    client.server (remote) ->
      expect(remote).to.be.defined
      expect(remote.foo).to.be.a('function')
      remote.foo (result) ->
        expect(result).to.equal(42)
        server.unbind -> done()
  
  server.bind.apply server, test.server

describe "basic rpc > ", ->
  _.each tests, (obj, name) ->
    it "rpc #{name} should work", (done) ->
      rpcTest name, obj, done





