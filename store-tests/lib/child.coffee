#directable store process
PeerStore = require "../../"
async = require "async"
name = null
store = null
buckets = {}
inserts = 0


send = (err, data) ->
  if err
    err = err + "\n" + (new Error).stack
  process.send {err, data}

#caught error
process.on 'uncaughtException', (e) ->
  send e.stack

#call a function
process.on 'message', (obj) ->
  name = obj.name
  parseActions obj.actions 

# get sample obj
fs = require "fs"

sampleJson = fs.readFileSync "./test/data/sample.json"
unless sampleJson
  send "missing sample.json"
try
  sampleObj = JSON.parse sampleJson
catch e
  send "invalid sample.json"

#helpers
guid = ->
  (Math.random() * Math.pow(2, 32)).toString(16)
rand = (max) ->
  (Math.floor(Math.random()*max))


getItem = (type) ->
  if type is 'object'
    return sampleObj
  else if type is 'number'
    return rand(100)
  else
    send "invalid type: #{type}"

insertItem = (type, n) ->
  send "bucket #{n} does not exist" unless buckets[n] 
  buckets[n].set "#{name}-#{n}-#{++inserts}", getItem(type)

insertItemTimes = (type, n, i) ->
  send "Invalid number" unless i > 0
  insertItem(type, n) while i-- > 0


# test fns
fns =
  start: (port, peers) ->
    if typeof port isnt 'number'
      send "port #{port} must be a number"

    peers = peers.map (p) ->
      if typeof p is 'number'
        return PeerStore.helper.getIp() + ':' + p
      return p

    store = new PeerStore
      debug: false
      port: port
      peers: peers

  create: (n) ->
    send "store not started" unless store
    buckets[n] = store.bucket n

  insert: (type, n, i) ->
    insertItemTimes type, n, i

  insertOver: (type, n, i, sec) ->
    send "Invalid number" unless i > 0 and sec > 0

    ms = sec*1000
    
    itemN = 1
    itemI = ms/i

    while itemI < 15
      itemI *= 10
      itemN *= 10

    if i%itemN isnt 0
      send "#{i} isnt a multiple of #{itemN}"

    add = ->
      insertItemTimes type, n, itemN
      i -= itemN
      clearTimeout(int) if i is 0

    add()
    int = setInterval add, itemI

  report: () ->
    throw "store not started" unless store
    data = {}

    getAll = (n, callback) ->
      store.bucket(n).getAll (err, results) ->
        data[n] = results
        callback err

    async.map store.buckets.keys(), getAll, (err) ->
      send err, data




callAction = (action, args, ms) ->

  fn = fns[action]
  unless fn
    send "missing action: '#{action}'"

  unless fn.length is args.length
    send "action: '#{action}' expects #{fn.length} args"

  # console.log "+#{ms}ms", action
  setTimeout ->
    try
      console.log "+++ #{ms}ms - CALLING #{action}(#{args.join(',')})"
      fn.apply null, args
    catch e
      send e.stack
  , ms

  null

parseActions = (actions) ->
  # console.log "+++", actions
  delay = 0
  for action in actions
    fnName = action.shift()
    args = action
    if fnName is 'wait'
      delay += args[0]
    else
      callAction fnName, args, delay*1000


