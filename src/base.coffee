
{EventEmitter2} = require 'eventemitter2'
util = require 'util'
_ = require '../vendor/lodash'
RemoteContext = require './context'

#base class of the base class
class Logger extends EventEmitter2
  name: 'Logger'
  #debugging
  log: ->
    if @opts?.debug
      # arguments[0] = util.inspect arguments[0]
      console.log @.toString() + ' ' + util.format.apply null, arguments
  warn: ->
    console.warn 'WARNING: ' + @.toString() + ' ' + util.format.apply null, arguments
  err: (str) ->
    @emit 'error', new Error "#{@} #{str}"
  toString: ->
    "#{@name}: #{@id}:"

#base class of client,server and peer
crypto = require "crypto"
guid = -> crypto.randomBytes(6).toString('hex')

os = require "os"
ips = []
#fill ips
for name, addrs of os.networkInterfaces?()
  for addr in addrs
    if addr.family is 'IPv4'
      ips.push addr.address

#used to eval properties at connection-time
class DynamicExposed
  constructor: (@fn) ->

class Base extends Logger

  name: 'Base'

  constructor: (incoming) ->

    #all instances have unique ids
    @guid = guid()

    if incoming?.name is 'LocalPeer'
      @opts = incoming.opts
      @id = incoming.id or @guid
      @pubsub = incoming.pubsub
      @exposed = incoming.exposed
    else
      @opts = incoming or {}
      @opts = { id:@opts } if _.isString @opts
      @id = @opts.id or @guid
      @pubsub = new EventEmitter2
      @exposed = @defaultExposed()

    #the class's apply defaults
    _.defaults @opts, @defaults

    _.bindAll @

  defaultExposed: ->
    pubsub = @pubsub

    return {
      _pnode:
        id: @id
        guid: @guid
        ips: ips.filter (ip) -> ip isnt '127.0.0.1'
        #remotes can push their list of events
        subscribe: (event) ->
          this.events[event] = 1
        unsubscribe: (event) ->
          delete this.events[event]
        #remotes can push events
        publish: (event, args...) ->
          pubsub.emit.apply pubsub, [event].concat args
        ping: (cb) ->
          cb true
        events: @exposeDynamic ->
          Object.keys pubsub._events
    }

  exposeDynamic: (fn) ->
    return new DynamicExposed fn

  expose: (obj) ->
    _.merge @exposed, obj

  #provide an interface which has all methods bound to this context
  exposeWith: (ctx) ->
    unless ctx instanceof RemoteContext
      return @err "must bound remote to a context"
    return _.merge {}, @exposed, (a,b) =>
      if b instanceof DynamicExposed
        return b.fn()
      if typeof b is "function"
        return _.bind(b,ctx)
      return a

  #get all ip on the nic
  ips: -> ips



#publicise
Base.Logger = Logger


module.exports = Base
