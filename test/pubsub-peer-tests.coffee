{expect} = require "chai"
sinon = require "sinon"
_ = require "../vendor/lodash"
pnode = require "../"

describe "peers pubsub > ", ->

  peer1 = null
  peer2 = null
  peer3 = null

  afterEach (done) ->
    peer1?.unbind()
    peer2?.unbind()
    peer3?.unbind()
    setTimeout done, 10

  describe "counts >", (done) ->

    spys = null

    expectedHits = (done, expects) ->

      count = 0
      total = 0
      for num, result of expects
        total += result

      tick = ->
        if ++count is total
          setTimeout verify, 15
        return

      verify = ->
        expect(count).to.equal(total)

        peer1.unsubscribe 'foo', tick
        peer2.unsubscribe 'foo', tick
        peer3.unsubscribe 'foo', tick

        for num,result of expects
          expect(spys[num].callCount, 'spy'+num).to.equal(result)

        done()

      peer1.subscribe 'foo', tick
      peer2.subscribe 'foo', tick
      peer3.subscribe 'foo', tick

      return

    beforeEach (done) ->

      spys =
        '1': sinon.spy()
        '2': sinon.spy()
        '3': sinon.spy()

      peer1 = pnode.peer {id:'peer1', debug:false}
      peer1.bindOn 'tcp://localhost:8001'
      setTimeout ->
        peer1.bindTo 'tcp://localhost:8002'
      peer1.subscribe 'foo', spys['1']

      peer2 = pnode.peer {id:'peer2', debug:false}
      peer2.bindOn 'tcp://localhost:8002'
      setTimeout ->
        peer2.bindTo 'tcp://localhost:8003'
      peer2.subscribe 'foo', spys['2']

      peer3 = pnode.peer {id:'peer3', debug:false}
      peer3.bindOn 'tcp://localhost:8003'
      peer3.subscribe 'foo', spys['3']

      #publish when theyre up
      start = ->
        if peer1.peers.length is 1 and
           peer2.peers.length is 2 and
           peer3.peers.length is 1
          setTimeout done, 100

      peer1.on 'peer', start
      peer2.on 'peer', start
      peer3.on 'peer', start

    it "should have called peer1 and pee3", (done) ->

      expectedHits done,
        '1': 1
        '2': 0
        '3': 1

      peer2.publish 'foo', {}

    it "should have called all peers n times", (done) ->

      expectedHits done,
        '1': 2
        '2': 3
        '3': 2

      peer1.publish 'foo', {f:1}
      peer1.publish 'foo', {f:2}

      peer2.publish 'foo', {f:3}
      peer2.publish 'foo', {f:4}

      peer3.publish 'foo', {f:5}

