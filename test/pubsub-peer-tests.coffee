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

    spy1 = null
    spy2 = null
    spy3 = null

    beforeEach (done) ->

      spy1 = sinon.spy()
      spy2 = sinon.spy()
      spy3 = sinon.spy()

      peer1 = pnode.peer {id:'peer1', debug:false}
      peer1.bindOn 'tcp://localhost:8001'
      setTimeout ->
        peer1.bindTo 'tcp://localhost:8002'
      peer1.subscribe 'foo', spy1

      peer2 = pnode.peer {id:'peer2', debug:true}
      peer2.bindOn 'tcp://localhost:8002'
      setTimeout ->
        peer2.bindTo 'tcp://localhost:8003'
      peer2.subscribe 'foo', spy2

      peer3 = pnode.peer {id:'peer3', debug:false}
      peer3.bindOn 'tcp://localhost:8003'
      peer3.subscribe 'foo', spy3

      #publish when theyre up
      peer2.on 'peer', ->
        if peer2.peers.length is 2
          done()

    it.only "should have called peer1 and pee3", (done) ->
      debugger
      peer2.publish 'foo', {}
      setTimeout ->
        expect(spy1.called, 'spy1').to.be.true
        expect(spy2.called, 'spy2').to.be.false
        expect(spy3.called, 'spy3').to.be.true
        done()
      , 100

    it "should have called all peers n times", (done) ->
      peer1.publish 'foo', {}
      peer2.publish 'foo', {}
      peer3.publish 'foo', {}
      setTimeout ->
        expect(spy1.callCount, 'spy1').to.equal(1)
        expect(spy2.callCount, 'spy2').to.equal(2)
        expect(spy3.callCount, 'spy3').to.equal(1)
        done()
      , 50




