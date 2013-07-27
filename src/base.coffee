
{EventEmitter} = require 'events'
fs = require 'fs'
path = require 'path'
_ = require 'lodash'

transports = {}
fs.readdirSync(path.join(__dirname,'transports')).forEach (file) ->
  transports[file.replace('.js','')] = require("./transports/#{file}")

module.exports = class Base extends EventEmitter

  name: 'Base'
  
  transports: transports

  constructor: (@opts = {})->
    _.defaults @opts, @defaults
    _.bindAll @

    @exposed = {
      _ping: @ping
    }

  ping: (cb) ->
    cb true

  log: ->
    console.log.apply console, [@.toString()].concat([].slice.call(arguments))

  err: (str) ->
    throw new Error "#{@}: #{str}"

  toString: ->
    "#{@name}: "


