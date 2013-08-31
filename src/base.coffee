
{EventEmitter} = require 'events'
_ = require '../vendor/lodash'

#base class of the base class
class Logger extends EventEmitter

  name: 'Logger'

  #debugging
  log: ->
    if @opts?.debug
      console.log.apply console, [@.toString()].concat([].slice.call(arguments))

  err: (str) ->
    @emit 'error', new Error "#{@} #{str}"

  toString: ->
    "#{@name}: #{@id}:"

#base class of client,server and peer
os = require "os"
crypto = require "crypto"
guid = -> crypto.randomBytes(6).toString('hex')

ips = []
#fill ips
for name, addrs of os.networkInterfaces?()
  for addr in addrs
    if addr.family is 'IPv4'
      ips.push addr.address

class Base extends Logger

  name: 'Base'

  constructor: (@opts = {})->
    if _.isString @opts
      @opts = { id:@opts }
    _.defaults @opts, @defaults

    @pubsub = new EventEmitter
    @pubsub.remotes = {}

    @guid = guid()
    @id = @opts.id or @guid

    @exposed =
      _pnode:
        id: @id
        guid: @guid
        ips: ips.filter (ip) -> ip isnt '127.0.0.1'
        subscribe: ->
        unsubscribe: ->
        subscriptions: (cb) -> cb Object.keys @pubsub._events
        publish: (event, args...) -> @pubsub.emit.apply @pubsub, event, args
        ping: (cb) -> cb true

    _.bindAll @

  expose: (obj) ->
    _.merge @exposed, obj

  #get all ip on the nic
  ips: -> ips

#publicise
Base.Logger = Logger
module.exports = Base
