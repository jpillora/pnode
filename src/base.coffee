
{EventEmitter} = require 'events'
fs = require 'fs'
path = require 'path'

transports = {}
fs.readdirSync(path.join(__dirname,'transports')).forEach (file) ->
  transports[file.replace('.js','')] = require("./transports/#{file}")

module.exports = class Base extends EventEmitter

  name: 'Base'
  
  transports: transports
  
  checkStreams: (read, write) ->
    @log "read (#{read.readable}, #{read.writable}) write (#{write.readable}, #{write.writable})"
    # if read.readable isnt true
    #   @err "Invalid 'read' stream (#{read.readable})"
    # if write.writable isnt true
    #   @err "Invalid 'write' stream (#{write.writable})"

  log: ->
    console.log.apply console, [@.toString()].concat([].slice.call(arguments))

  err: (str) ->
    throw new Error "#{@}: #{str}"

  toString: ->
    "#{@name}: "


