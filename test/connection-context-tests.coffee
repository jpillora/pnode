{expect} = require "chai"
_ = require "../vendor/lodash"
pnode = require "../"

describe "shared peer contexts > ", ->

  peer1 = null
  peer2 = null

  beforeEach ->
    peer1 = pnode.peer({id:'peer-1',debug:false})

    peer1.expose
      set: (n, cb) ->
        @set 'foo', n
        cb true
      get: (cb) ->
        cb @get 'foo'

    peer1.bindOn 'tcp://0.0.0.0:8000'
    peer1.bindOn 'http://0.0.0.0:8001'

  afterEach ->
    peer1.unbind()
    peer2.unbind()

  it "should maintain context across channels", (done) ->

    peer2 = pnode.peer({id:'peer-2',debug:false})

    setContext = ->
      peer2.bindTo 'tcp://localhost:8000'
      peer2.peer 'peer-1', (remote) ->

        peer2.log "GOT P1 REM"

        remote.set 7, ->
          getContext()

    getContext = ->
      peer2.unbind()
      peer2.bindTo 'http://localhost:8001'
      peer2.peer 'peer-1', (remote) ->
        remote.get (n) ->
          expect(n).to.equal(7)
          done()

    #kick off
    setContext()
