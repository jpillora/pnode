
{EventEmitter} = require 'events'
util = require 'util'
_ = require '../vendor/lodash'
RemoteContext = require './context'

#base class of the base class
class Logger extends EventEmitter
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

class Exposed
  constructor: (@fn) ->

class Base extends Logger

  name: 'Base'

  constructor: (@opts = {}, parent)->

    @opts = { id:@opts } if _.isString @opts
    _.defaults @opts, @defaults
    
    @guid = guid()
    @id = @opts.id or @guid

    _.bindAll @

    log = @log    
    @pubsub = if parent then parent.pubsub else new EventEmitter
    @exposed = if parent then parent.exposed else @defaultExposed()

  defaultExposed: ->

    @log "CREATE EXPOSED"

    pubsub = @pubsub
    return {
      _pnode:
        id: @id
        guid: @guid
        ips: ips.filter (ip) -> ip isnt '127.0.0.1'
        #remotes can push their own event list
        subscribe: (event) ->
          this.events[event] = 1
        unsubscribe: (event) ->
          this.events[event] = 0
        #remotes can push events
        publish: (event, args...) ->
          pubsub.emit.apply pubsub, [event].concat args
        ping: (cb) ->
          cb true
        events: new Exposed ->
          Object.keys pubsub._events
    }

  expose: (obj) ->
    _.merge @exposed, obj

  #provide an interface which has all methods bound to this connection
  exposeWith: (ctx) ->
    unless ctx instanceof RemoteContext
      return @err "must bound remote to a context"
    return _.merge {}, @exposed, (a,b) =>
      if b instanceof Exposed
        return b.fn()
      if typeof b is "function"
        return b.bind(ctx)
      return a

  #get all ip on the nic
  ips: -> ips

#publicise
Base.Exposed = Exposed
Base.Logger = Logger
module.exports = Base
