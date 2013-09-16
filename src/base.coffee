
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
      @opts = if _.isString incoming then { id:incoming } else incoming or {}
      @id = @opts.id or @guid
      @pubsub = new EventEmitter2
      @exposed = @defaultExposed()

    #the class's apply defaults
    _.defaults @opts, @defaults

    _.bindAll @

  options: (opts) ->
    _.extend @opts, opts

  defaultExposed: ->
    pubsub = @pubsub

    id = @id
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
        publish: (args...) ->
          if typeof args[0] is 'function'
            cb = args.shift()
          pubsub.emit.apply pubsub, args
          cb true if cb
        ping: (cb) ->
          cb true
        events: @exposeDynamic ->
          Object.keys pubsub._events
    }

  exposeDynamic: (fn) ->
    return new DynamicExposed fn

  expose: (obj) ->
    _.merge @exposed, obj

  #recursively timeoutify functions and eval dynamic values
  wrapObject: (input, ctx) ->
    @wrapObjectAcc 'root', input, {}, ctx

  wrapObjectAcc: (name, input, output, ctx) ->

    if input instanceof DynamicExposed
      return input.fn()

    type = typeof input

    if input instanceof Array
      return input

    if input and type is 'object'
      for k,v of input
        output[k] = @wrapObjectAcc k, v, {}, ctx
      return output

    if type isnt 'function'
      return input

    inst = @
    return (args...) ->
      timedout = false
      # place timeout on first function parameter
      for a, i in args
        if typeof a is 'function'
          args[i] = ->
            clearTimeout t
            return if timedout
            inst.emit 'timein', name, args, ctx
            a.apply @, arguments
            return
          t = setTimeout ->
            timedout = false
            inst.emit 'timeout', name, args, ctx
            return
          , inst.opts.timeout
          break
      # call original fn
      input.apply ctx, args

  #get all ip on the nic
  ips: -> ips

#publicise
Base.Logger = Logger


module.exports = Base
