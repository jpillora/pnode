{expect} = require "chai"
_ = require "../vendor/lodash"
pnode = require "../"

describe "shared peer contexts > ", ->

  peer1 = null
  peer2 = null
  peer3 = null

  afterEach ->
    peer1.unbind()
    peer2.unbind()
    peer3?.unbind()

  it.only "should maintain context across channels", (done) ->

    peer1 = pnode.peer({id:'peer1',debug:true})

    #peer1 maintains the same context for all clients
    peer1.expose
      set: (n, cb) ->
        #requester id should be correct
        try
          expect(@id).to.equal('peer2')
        catch e
          return done e
        @set 'foo', n
        cb true
      get: (cb) ->
        cb @get 'foo'

    peer1.bindOn 'tcp://0.0.0.0:8000'
    peer1.bindOn 'http://0.0.0.0:8001'

    peer2 = pnode.peer({id:'peer2',debug:true})

    setContext = ->
      peer2.bindTo 'tcp://localhost:8000'
      peer2.peer 'peer1', (remote) ->
        remote.set 7, ->
          peer2.unbind getContext

    getContext = ->
      
      peer2.bindTo 'http://localhost:8001'
      peer2.peer 'peer1', (remote) ->
        remote.get (n) ->
          try
            expect(n).to.equal(7)
          catch e
            return done e
          done()

    #kick off
    setContext()


  it "should report correct sender", (done) ->

    peer1 = pnode.peer({id:'peer1',debug:false})

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

    peer2 = pnode.peer({id:'peer2',debug:false})
    peer2.bindTo 'tcp://localhost:8000'

    peer3 = pnode.peer({id:'peer3',debug:false})
    peer3.bindTo 'tcp://localhost:8000'

    peer2.peer 'peer1', (remote) ->
      remote.test peer2.id, peer2.guid, ->
        peer3.peer 'peer1', (remote) ->
          remote.test peer3.id, peer3.guid, ->
            done()
