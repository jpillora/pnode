
_ = require '../vendor/lodash'
transportMgr = require './transport-mgr'
RemoteContext = require './context'
Logger = require './logger'
{EventEmitter2:Emitter} = require 'eventemitter2'
Store = null

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

module.exports = class Base extends Logger

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
    _pnode:
      id: @id
      guid: @guid
      ips: ips.filter (ip) -> ip isnt '127.0.0.1'
      #remotes can push their list of events
      subscribe: (event) ->
        this.events[event] = 1
      unsubscribe: (event) ->
        this.events[event] = 0
      #remotes can push events
      publish: (args...) ->
        if typeof args[0] is 'function'
          cb = args.shift()
        if typeof args[0] isnt 'string'
          return self.warn "Invalid 'publish': missing event"
        event = args.shift()
        self.pubsub.emit.apply self.pubsub, [event, @].concat args
        cb true if cb
      ping: (cb) ->
        cb true
      events: [->
        e = Object.keys self.pubsub._events
        self.log "share events: %j", e
        e
      ]

  expose: (obj) ->
    _.merge @exposed, obj

  # setups up custom function to catch events
  # calls handler in the correct remote context
  subscribe: (event, fn) ->
    return unless fn
    #proxy through to handler
    @pubsub.on event, (ctx, args...)->
      fn.apply ctx, args
    return

  unsubscribe: (event, fn) ->
    @pubsub[if fn then 'off' else 'removeAllListeners'](event, fn)
    return

  bind: (args...) ->

    if @bound
      @warn 'unbind in progress' if @unbinding
      return

    #reset emitter
    if @tEmitter
      @tEmitter.emit('unbind')
      @tEmitter.removeAllListeners()

    @tEmitter = new Emitter
    #finite states
    events = ['binding','bound','unbinding','unbound']
    
    self = @
    #bubble up all events
    @tEmitter.onAny (args...) ->
      self.log 'T-EVENT', @event, if typeof args[0] is 'string' then args[0] else ''
      #set appropriate state
      if @event in events
        for e in events
          self[e] = e is @event
      self.emit.apply null, [@event].concat(args)
      return

    #get transport (POTENTIAL USER CODE)
    try
      trans = transportMgr.get args
      #prepend emitter
      args.unshift @tEmitter
      #bind server/client
      @tEmitter.emit 'binding'
      trans["bind#{@name}"].apply null, args
    catch err
      err.message = "Transport: #{err.message}"
      @err err
    return

  unbind: (callback) ->
    if @unbound
      @warn 'bind in progress' if @binding
      return
    @once 'unbound', callback if callback
    @tEmitter.emit 'unbinding'
    @tEmitter.emit 'unbind' #trigger user code
    return

  #recursively timeoutify functions and eval dynamic values
  wrapObject: (input, ctx) ->
    @wrapObjectAcc 'root', input, ctx

  wrapObjectAcc: (name, input, ctx) ->

    #array [function] is a dynamic value
    if input instanceof Array
      if input.length is 1 and typeof input[0] is "function"
        return input[0].call(ctx)
      return input

    type = typeof input

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
    # self.timeoutify.id or= 0
    # splice in an interceptor function to the first
    # function argument (presumes a callback)

    # type = if ctx instanceof RemoteContext then 'local' else 'remote'

    return (args...) =>
      t = null
      timedout = false
      # id = self.timeoutify.id++

      # place timeout on first function parameter
      for a, i in args
        if typeof a is 'function'
          args[i] = ->
            # self.log "returned %s %s (%s) at %s", type, name, id, Date.now()
            clearTimeout t
            return if timedout
            self.emit ['timein',name], args, ctx
            a.apply @, arguments
            return
          t = setTimeout ->
            timedout = true
            return unless self.bound
            # self.log "timeout %s %s (%s) at %s", type, name, id, Date.now()
            self.emit ['timeout',name], args, ctx
            return
          , self.opts.timeout
          break

      # self.log "calling %s %s (%s) at %s %s", type, name, id, Date.now(), if t is null then '' else ' (with timer)'
      # call original fn
      fn.apply ctx, args

  #create a synchronized object
  store: (opts) ->
    unless Store
      Store = require './store/store'  
    s = new Store @, opts
    return s

  destroy: (callback) ->
    @log "destroy"
    @emit 'destroy'
    @unbind =>
      @removeAllListeners()
      callback() if callback

  #get all ip on the nic
  ips: ips
