
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

class Base extends Logger

  name: 'Base'

  constructor: (@opts = {})->
    if _.isString @opts
      @opts = { id:@opts }
    _.defaults @opts, @defaults

    pubsub = new EventEmitter
    
    @guid = guid()
    @id = @opts.id or @guid

    _.bindAll @

    log = @log

    @exposed =
      _pnode:
        id: @id
        guid: @guid
        ips: ips.filter (ip) -> ip isnt '127.0.0.1'
        subscribe: (event) ->
          @events[events] = 1
        unsubscribe: (event) ->
          @events[events] = 0
        subscriptions: (cb) ->
          cb Object.keys pubsub._events
        publish: (event, args...) ->
          pubsub.emit.apply pubsub, event, args
        ping: (cb) ->
          cb true

  expose: (obj) ->
    _.merge @exposed, obj

  #provide an interface which has all methods bound to this connection
  boundExposed: (target) ->
    unless target instanceof RemoteContext
      return @err "must bound remote to a context"
    _.merge {}, @exposed, (a,b) =>
      if typeof b is "function"
        return b.bind(target)
      return a

  #get all ip on the nic
  ips: -> ips

#publicise
Base.Logger = Logger
module.exports = Base
