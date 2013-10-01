{EventEmitter2:Emitter} = require 'eventemitter2'
util = require 'util'
_ = require '../vendor/lodash'
transportMgr = require './transport-mgr'
RemoteContext = require './context'

#base class of the base class
class Logger extends Emitter
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

    super()

    #all instances have unique ids
    @guid = guid()

    if incoming?.name is 'LocalPeer'
      @parent = incoming
      @opts = @parent.opts
      @id = (@parent.id or @guid)
      @subid = (if @name is "Server" then "s" else "c") +
               (@parent.count[if @name is "Server" then "server" else "client"])
      @pubsub = @parent.pubsub
      @exposed = @parent.exposed
    else
      @opts = if _.isString incoming then { id:incoming } else incoming or {}
      @id = @opts.id or @guid
      @subid = null
      @pubsub = new Emitter
      @exposed = @defaultExposed()

    #the class's apply defaults
    _.defaults @opts, @defaults

    #error printer
    if @opts.debug
      @on 'error', (err) =>
        console.error "ERROR EMITTED: #{err.stack or err}"

    _.bindAll @
    @unbound = true
    
  options: (opts) ->
    _.extend @opts, opts

  defaultExposed: ->
    self = @
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
          self.pubsub.emit.apply self.pubsub, args
          cb true if cb
        ping: (cb) ->
          self.log 'ping %s -> %s', @id, self.id
          cb true
        events: @exposeDynamic ->
          Object.keys self.pubsub._events
    }

  exposeDynamic: (fn) ->
    return new DynamicExposed fn

  expose: (obj) ->
    _.merge @exposed, obj

  bind: (args...) ->

    @log "bind", args

    if @bound
      @warn 'unbind in progress' if @unbinding
      return

    #reset emitter
    @tEmitter.removeAllListeners() if @tEmitter
    @tEmitter = new Emitter
    #finite states
    events = ['binding','bound','unbinding','unbound']
    
    inst = @
    #bubble up all events
    @tEmitter.onAny (args...) ->
      inst.log 'T-EVENT', @event
      #set appropriate state
      if @event in events
        for e in events
          inst[e] = e is @event
      inst.emit.apply null, [@event].concat(args)
      return

    #get transport (POTENTIAL USER CODE)
    try
      trans = transportMgr.get args
      #prepend emitter
      args.unshift @tEmitter
      #bind server/client
      trans["bind#{@name}"].apply null, args
    catch err
      err.message = "Transport: #{err.message}"
      @err err
    return

  unbind: (callback) ->

    if @unbound
      @warn 'bind in progress' if @binding
      return
    @log 'unbind'
    @once 'unbound', callback if callback
    @tEmitter.emit 'unbind'
    return

  #recursively timeoutify functions and eval dynamic values
  wrapObject: (input, ctx) ->
    @wrapObjectAcc 'root', input, ctx

  wrapObjectAcc: (name, input, ctx) ->

    if input instanceof DynamicExposed
      return input.fn()

    type = typeof input

    if input instanceof Array
      return input

    if input and type is 'object'
      #copy
      output = {}
      for k,v of input
        output[k] = @wrapObjectAcc k, v, ctx
      return output

    if type is 'function'
      return @timeoutify name, input, ctx

    return input

  timeoutify: (name, fn, ctx = @) ->
    self = @
    self.timeoutify.id or= 0
    # splice in an interceptor function to the first
    # function argument (presumes a callback)

    type = if ctx instanceof RemoteContext then 'local' else 'remote'

    return (args...) =>
      t = null
      timedout = false
      id = self.timeoutify.id++

      # place timeout on first function parameter
      for a, i in args
        if typeof a is 'function'
          args[i] = ->
            self.log "returned %s %s (%s) at %s", type, name, id, Date.now()
            clearTimeout t
            return if timedout
            self.emit ['timein',name], args, ctx
            a.apply @, arguments
            return
          t = setTimeout ->
            timedout = true
            return unless self.bound
            self.log "timeout %s %s (%s) at %s", type, name, id, Date.now()
            self.emit ['timeout',name], args, ctx
            return
          , self.opts.timeout
          break

      self.log "calling %s %s (%s) at %s %s", type, name, id, Date.now(), if t is null then '' else ' (with timer)'
      # call original fn
      fn.apply ctx, args

  #get all ip on the nic
  ips: ips

#publicise
Base.Logger = Logger


module.exports = Base
