{expect} = require "chai"
_ = require "../vendor/lodash"
pnode = require "../"

describe "server clients pubsub > ", ->

  server = null
  client1 = null
  client2 = null
  client3 = null

  beforeEach ->
    server = pnode.server('server-1')
    server.bind 'tcp://0.0.0.0:8000'

  afterEach (done) ->
    server.unbind()
    client1?.unbind()
    client2?.unbind()
    client3?.unbind()
    setTimeout done, 10

  it "should publish to server", (done) ->

    count = 0
    check = ->
      if ++count is 2
        done()

    server.subscribe 'bars', (bar) ->
      expect(bar).to.deep.equal({bazz: 13})
      check()

    server.subscribe 'foos', (foo) ->
      expect(foo).to.deep.equal({bar: 42})
      check()

    client1 = pnode.client('client-P1')
    client1.bind 'tcp://localhost:8000'
    client1.publish('bars', {bazz: 13})

    client2 = pnode.client('client-P2')
    client2.bind 'tcp://localhost:8000'
    client2.publish('foos', {bar: 42})
  
  it "should publish to all clients", (done) ->

    count = 0
    checkFoo = (foo) ->
      expect(foo).to.deep.equal({bar: 42})
      if ++count is 3
        done()

    #subscribe then bind
    client1 = pnode.client({id:'client-P1',debug:false})
    client1.subscribe 'foos', checkFoo
    setTimeout ->
      client1.bind 'tcp://localhost:8000'

    #bind then subscribe
    client2 = pnode.client('client-P2')
    client2.bind 'tcp://localhost:8000'
    setTimeout ->
      client2.subscribe 'foos', checkFoo

    #delay both
    client3 = pnode.client('client-P3')
    setTimeout ->
      client3.subscribe 'foos', checkFoo
      client3.bind 'tcp://localhost:8000'

    #publish to all 3 clients when theyre up
    server.on 'remote', ->
      if server.connections.length is 3
        server.publish('foos', {bar: 42})

