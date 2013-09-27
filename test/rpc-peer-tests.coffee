{expect} = require "chai"
async = require "async"
_ = require "../vendor/lodash"
pnode = require "../"

describe.only "rpc peer to peer > ", ->

  peer1 = null
  peer2 = null
  peer3 = null
  log = null
  updated = null

  beforeEach (done) ->

    log = {total:0}
    logCall = (str) ->
      console.log "LOG ", str
      log.total++
      log[str] or= 0
      log[str]++
      updated() if updated

    peer1 = pnode.peer {id:'peer1', debug:false}
    peer1.expose
      log: ->
        logCall "#{@id}->peer1"
    peer1.bindOn 'tcp://localhost:8001'

    peer2 = pnode.peer {id:'peer2', debug:true}
    peer2.expose
      log: -> 
        logCall "#{@id}->peer2"
    peer2.bindOn 'tcp://localhost:8002'

    peer3 = pnode.peer {id:'peer3', debug:true}
    peer3.expose
      log: ->
        logCall "#{@id}->peer3"
    peer3.bindOn 'tcp://localhost:8003'

    peer2.once '*.bound', ->
      peer1.bindTo 'tcp://localhost:8002'

    peer3.once '*.bound', ->
      peer2.bindTo 'tcp://localhost:8003'

    peer3.once 's1.remote', ->
      console.log "SETUP!"
      done()


  afterEach (done) ->
    console.log "TEAR DOWN!"
    async.parallel [
      peer1.unbind
      peer2.unbind
      peer3.unbind
    ], done

  it "should call other peers", (done) ->

    updated = ->
      if log.total is 4
        if log['peer1->peer2'] is 1 and
           log['peer2->peer1'] is 1 and
           log['peer2->peer3'] is 1 and
           log['peer3->peer2'] is 1
          done()
        else
          done new Error "Invalid call log"

    #should call peer2
    peer1.all (remotes) ->
      for remote in remotes
        remote.log()

    #should call peer1 and peer3
    peer2.all (remotes) ->
      for remote in remotes
        remote.log()

    #should call peer2
    peer3.all (remotes) ->
      for remote in remotes
        remote.log()

