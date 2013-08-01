
{EventEmitter} = require 'events'
fs = require 'fs'
path = require 'path'
_ = require 'lodash'
guid = -> (Math.random()*Math.pow(2,32)).toString(16)

transports = {}
fs.readdirSync(path.join(__dirname,'transports')).forEach (file) ->
  transports[file.replace('.js','')] = require("./transports/#{file}")

module.exports = class Base extends EventEmitter

  name: 'Base'
  
  transports: transports

  constructor: (@opts = {})->
    if _.isString @opts
      @opts = { id:@opts }
    _.defaults @opts, @defaults

    if @opts.id
      @id = @opts.id
    else
      @id = guid()

    _.bindAll @

    @exposed =
      _multi:
        id: @id
        ping: (cb) -> cb true

  log: ->
    console.log.apply console, [@.toString()].concat([].slice.call(arguments))

  err: (str) ->
    throw new Error "#{@} #{str}"

  toString: ->
    "#{@name}: #{@id}:"


