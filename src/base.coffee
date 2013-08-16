
{EventEmitter} = require 'events'
_ = require 'lodash'
os = require "os"

guid = -> (Math.random()*Math.pow(2,32)).toString(16)
ips = []
#fill ips
for name, addrs of os.networkInterfaces()
  for addr in addrs
    if addr.family is 'IPv4'
      ips.push addr.address

#base class of client,server and peer
module.exports = class Base extends EventEmitter

  name: 'Base'

  constructor: (@opts = {})->
    if _.isString @opts
      @opts = { id:@opts }
    _.defaults @opts, @defaults

    @guid = guid()
    @id = @opts.id or @guid
    _.bindAll @

    @exposed =
      _multi:
        id: @id
        ips: ips
        ping: (cb) -> cb true

  expose: (obj) ->
    _.merge @exposed, obj


  #get all ip on the nic
  ips: -> ips

  #debugging
  log: ->
    if @debug
      console.log.apply console, [@.toString()].concat([].slice.call(arguments))

  err: (str) ->
    throw new Error "#{@} #{str}"

  toString: ->
    "#{@name}: #{@id}:"


