

runner = require './lib/runner'
{expect,assert} = require "chai"
_ = require 'lodash'

check = (err, results, numServers, nameBucket, numEntries) ->

  if err isnt null
    throw new Error "Error returned...\n\n"+ err
    
  expect(results).to.have.length(numServers)

  first = null
  #check each server
  for result, i in results
    bucketObj = result.pop()
    serverName = result.pop()
    expect(bucketObj).to.be.an('object')
    bucket = bucketObj[nameBucket]
    expect(bucket).to.be.an('object')

    actualEntries = Object.keys(bucket).length
    assert(actualEntries is numEntries, 
      "#{serverName}'s '#{nameBucket}' bucket has #{actualEntries} and it should have #{numEntries}")

    if first is null
      first = result
    else
      expect(result).to.deep.equal(first)

# describe '0. debugging >', ->
#   it.only '0. experiment >', (done) ->
#     @timeout 5*1000
#     runner.run {
#       s1:
#         start: [51000, []]
#         create: ['foo']
#         wait: '2s'
#         insert: ['foo', 5]
#         wait: '2s'
#         report: []
#       s2: 
#         wait: '1s'
#         start: [52000, [51000]],
#         create: ['foo']
#         wait: '3s'
#         report: []
#     }, (err, results) ->
#       check err, results, 2, 'foo', 5
#       done()

describe '1. simple >', ->

  it '1. low volume >', (done) ->
    @timeout 5*1000
    runner.run {
      s1:[
        ['start', 51000, [52000]]
        ['create','foo']
        ['wait',1.5]
        ['insert','number','foo', 50]
        ['wait',1]
        ['report']
      ]
      s2: [
        ['start', 52000, [51000]]
        ['create','foo']
        ['wait',1.5]
        ['insert','number','foo', 50]
        ['wait',1]
        ['report']
      ]
    }, (err, results) ->
      check err, results, 2, 'foo', 100
      done()

  it '2. faster, medium volume >', (done) ->
    @timeout 5*1000
    runner.run {
      s1:[
        ['start', 51000, [52000]]
        ['create','bar']
        ['wait',0.2]
        ['insert','number','bar', 500]
        ['wait',0.2]
        ['report']
      ]
      s2: [
        ['start', 52000, [51000]]
        ['create','bar']
        ['wait',0.2]
        ['insert','number','bar', 500]
        ['wait',0.2]
        ['report']
      ]
    }, (err, results) ->
      check err, results, 2, 'bar', 1000
      done()

  it '3. high volume, 2 server, number values >', (done) ->
    @timeout 15*1000
    runner.run {
      s1:[
        ['start', 51000, []]
        ['create','bar']
        ['wait',0.5]
        ['insert','number','bar', 7600]
        ['wait',1]
        ['report']
      ]
      s2: [
        ['start', 52000, [51000]]
        ['create','bar']
        ['wait',0.5]
        ['insert','number','bar', 6400]
        ['wait',1]
        ['report']
      ]
    }, (err, results) ->
      check err, results, 2, 'bar', 14000
      done()

  it '3. high volume, 2 server, object values >', (done) ->
    @timeout 15*1000
    runner.run {
      s1:[
        ['start', 51000, []]
        ['create','bar']
        ['wait',0.5]
        ['insert','object','bar', 650]
        ['wait',1]
        ['report']
      ]
      s2: [
        ['start', 52000, [51000]]
        ['create','bar']
        ['wait',0.5]
        ['insert','object','bar', 650]
        ['wait',1]
        ['report']
      ]
    }, (err, results) ->
      check err, results, 2, 'bar', 1300
      done()

  it '3. high volume, 4 server, object values >', (done) ->
    @timeout 15*1000
    runner.run {
      s1:[
        ['start', 51000, []]
        ['create','bar']
        ['wait',0.5]
        ['insert','object','bar', 200]
        ['wait',1]
        ['report']
      ]
      s2: [
        ['start', 52000, [51000]]
        ['create','bar']
        ['wait',0.5]
        ['insert','object','bar', 200]
        ['wait',1]
        ['report']
      ]
      s3: [
        ['start', 53000, [51000]]
        ['create','bar']
        ['wait',0.5]
        ['insert','object','bar', 200]
        ['wait',1]
        ['report']
      ]
      s4: [
        ['start', 54000, [51000]]
        ['create','bar']
        ['wait',0.5]
        ['insert','object','bar', 200]
        ['wait',1]
        ['report']
      ]
    }, (err, results) ->
      check err, results, 4, 'bar', 800
      done()


describe '2. restore history >', ->

  #start one, insert 50, start other, check
  it '1. simple >', (done) ->
    @timeout 5*1000
    runner.run {
      s1:[
        ['start', 51000, [52000]]
        ['create','bar']
        ['insert','number','bar', 1000]
        ['wait',2.5]
        ['report']
      ]
      s2: [
        ['wait',1]
        ['start', 52000, [51000]]
        ['create','bar']
        ['wait',1]
        ['insert','number','bar', 500]
        ['wait',1]
        ['report']
      ]
    }, (err, results) ->
      check err, results, 2, 'bar', 1500
      done()

  #start one, insert 50, start other, check
  it '2. 3 server >', (done) ->
    @timeout 5*1000
    runner.run {
      s1:[
        ['start', 51000, [52000]]
        ['create','bar']
        ['insert','number','bar', 1000]
        ['wait',2.5]
        ['report']
      ]
      s2: [
        ['wait',1]
        ['start', 52000, [51000]]
        ['create','bar']
        ['wait',1]
        ['insert','number','bar', 500]
        ['wait',1]
        ['report']
      ]
      s3: [
        ['wait',2.2]
        ['start', 53000, [52000]]
        ['create','bar']
        ['wait',0.8]
        ['report']
      ]
    }, (err, results) ->
      check err, results, 3, 'bar', 1500
      done()


