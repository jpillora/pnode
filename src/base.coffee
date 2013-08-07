
{EventEmitter} = require 'events'
_ = require 'lodash'
guid = -> (Math.random()*Math.pow(2,32)).toString(16)

module.exports = class Base extends EventEmitter

  name: 'Base'

  constructor: (@opts = {})->
    if _.isString @opts
      @opts = { id:@opts }
    _.defaults @opts, @defaults

    @id = @opts.id or guid()
    _.bindAll @

    @exposed =
      _multi:
        id: @id
        ping: (cb) -> cb true

  #extract protocol, hostname, port from string
  parseOrigin: (str) ->
    if typeof str is 'string' and /^([a-z]+):\/\/([^\/]+?)(:(\d+))?$/.test str
      return { protocol: RegExp.$1, hostname: RegExp.$2, port: parseInt RegExp.$4, 10 }
    return null

  log: ->
    console.log.apply console, [@.toString()].concat([].slice.call(arguments))

  err: (str) ->
    throw new Error "#{@} #{str}"

  toString: ->
    "#{@name}: #{@id}:"


