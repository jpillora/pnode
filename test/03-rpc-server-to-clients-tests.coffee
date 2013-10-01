{expect} = require "chai"
_ = require "../vendor/lodash"
pnode = require "../"
helper = require "./helper"

describe "server to clients > ", ->

  server = null
  client1 = null
  client2 = null

  before (done) ->
    server = pnode.server({id:'server-1',debug:false})
    server.bind 'tcp://0.0.0.0:8000'

    client1 = pnode.client({id:'client-1',debug:false})
    client1.expose
      one: (n, cb) -> cb n + 7
    client1.bind 'tcp://localhost:8000'

    client2 = pnode.client({id:'client-2',debug:false})
    client2.expose
      two: (n, cb) -> cb n + 14
    client2.bind 'tcp://localhost:8000'

    setTimeout done, 10

  after (done) ->
    helper.unbindAfter server,client1,client2,done

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


    


