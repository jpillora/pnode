
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
  
  #extract protocol, hostname, port from string
  parseOrigin: (str) ->
    if typeof str is 'string' and /^([a-z]+):\/\/([^\/]+?)(:(\d+))?$/.test str
      return { protocol: RegExp.$1, hostname: RegExp.$2, port: parseInt RegExp.$4, 10 }
    return null

  #get all ip on the nic
  ips: -> ips

  #debugging
  log: ->
    console.log.apply console, [@.toString()].concat([].slice.call(arguments))

  err: (str) ->
    throw new Error "#{@} #{str}"

  toString: ->
    "#{@name}: #{@id}:"


