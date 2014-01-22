{EventEmitter2:Emitter} = require 'eventemitter2'
util = require 'util'

#base class of the base class
module.exports = class Logger extends Emitter
  name: 'Logger'
  constructor: ->
    super {wildcard:true}
  
  #debugging
  log: ->
    if @opts?.debug
      # arguments[0] = util.inspect arguments[0]
      console.log @.toString() + ' ' + util.format.apply null, arguments
  warn: ->
    console.warn 'WARNING: ' + @.toString() + ' ' + util.format.apply null, arguments
  err: (e) ->
    if e instanceof Error
      e.message = "#{@} #{e.message}"
    else
      e = new Error e
    @emit 'error', e

  toString: ->
    "#{@name}: #{@id}#{if @subid then ' ('+@subid+')' else ''}:"