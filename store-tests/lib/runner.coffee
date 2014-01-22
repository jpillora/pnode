
require "colors"
{fork} = require "child_process"
util = require "util"
_ = require "lodash"
colors = ["blue", "green", "cyan", "yellow"]

#compile child for forking
coffee = require "coffee-script"
fs = require "fs"
path = require "path"
childFile = path.join __dirname, 'child.js'
childCoffee = fs.readFileSync(path.join __dirname, 'child.coffee').toString()
fs.writeFileSync childFile, coffee.compile childCoffee

runServer = (i, name, actions, cb) ->
  
  color = colors[i]
  log = (str, c) ->
    console.log name, str.toString().replace(/\n$/, "")[c]

  log "Starting '#{name}'", color

  proc = fork(childFile, [], {silent:true})

  proc.stdout.on "data", (buffer) ->
    log buffer, color

  proc.stderr.on "data", (buffer) ->
    log buffer, 'red'

  #process returned a result
  proc.on 'message', (obj) ->
    cb obj.err, [name, obj.data]

  #send process all actions to execute
  proc.send {name, actions}

  return proc

exports.run = (test, callback) ->

  procs = []
  results = []
  #start test
  _.each test, (actions, serverName) ->
    p = runServer procs.length, serverName, actions, (err, data) ->
      #accumulate data
      results.push data
      p.kill()

      if err
        console.log "#{serverName} CRASH!"
        for proc in procs
          proc.kill()
      else if results.length < procs.length
        return

      #return results to test
      callback err, results

    procs.push p
  null
