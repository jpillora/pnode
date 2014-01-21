{expect} = require "chai"
_ = require "../vendor/lodash"
async = require "async"
pnode = require "../"
helper = require "./helper"

describe "shared peer contexts > ", ->

  peer1 = null
  peer2 = null
  peer3 = null

  afterEach (done) ->
    helper.unbindAfter peer1,peer2,peer3,done

  it "should maintain context across channels", (done) ->

    #server (peer1) to on two endpoints
    #client (peer2) swaps endpoints midconversation

    peer1 = pnode.peer({id:'peer1',debug:false})

    #peer1 maintains the same context for all clients
    peer1.expose
      set: (n, cb) ->
        #requester id should be correct
        try
          expect(@id).to.equal('peer2')
        catch e
          return done e
        @set 'foo', n
        cb(true)
      get: (cb) ->
        cb @get 'foo'

    peer1.bindOn 'tcp://0.0.0.0:8000'
    peer1.bindOn 'http://0.0.0.0:8001'

    peer2 = pnode.peer({id:'peer2',debug:false})

    peer1remote1 = null

    setContext = ->
      peer2.bindTo 'tcp://localhost:8000'
      peer2.peer 'peer1', (remote) ->

        peer1remote1 = remote

        remote.set 7, (res) ->
          try
            expect(res).to.equal(true)
          catch e
            return done e
          peer2.unbind getContext

    getContext = ->
      peer2.bindTo 'http://localhost:8001'

      peer2.peer 'peer1', (remote) ->

        #remote1 will NOT work, ensure that we have actually recieved a new one
        try expect(peer1remote1, '2nd connection should have new remote').not.to.equal(remote)
        catch e
          return done e

        remote.get (res) ->
          try expect(res).to.equal(7)
          catch e
            return done e
          done()

    #kick off
    setContext()


  it "should report correct sender", (done) ->

    peer1 = pnode.peer({id:'peer1',debug:false})
    peer2 = pnode.peer({id:'peer2',debug:false})
    peer3 = pnode.peer({id:'peer3',debug:false})

    #peer1 maintains the same context for all clients
    peer1.expose
      test: (id, guid, cb) ->
        #requester id should be correct
        try
          expect(@id).to.equal(id)
          expect(@guid).to.equal(guid)
        catch e
          return done e
        cb()

    peer1.bindOn 'tcp://0.0.0.0:8000'
    peer2.bindTo 'tcp://localhost:8000'
    peer3.bindTo 'tcp://localhost:8000'

    mkCb = helper.callbacker 2, done

    peer2.peer 'peer1', (remote) ->
      remote.test peer2.id, peer2.guid, mkCb()

    peer3.peer 'peer1', (remote) ->
      remote.test peer3.id, peer3.guid, mkCb()
        
