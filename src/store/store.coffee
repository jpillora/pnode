#creates a synchronized object between peers/clients/servers
Logger = require '../logger'
_ = require '../../vendor/lodash'

#instance checks
Server = require '../server/server'
Client = require '../client/client'
LocalPeer = require '../peer/local-peer'

module.exports = class Store extends Logger

  name: 'Store'

  defaults:
    id: null
    debug: false
    subscribe: false
    publish: false
    publishInterval: "nextTick"
    filter: null
    eventWildcard: "*"

  constructor: (@peer, opts = {}) ->
    @opts = _.defaults opts, @defaults
    @name = "#{@name}(#{@peer.id})"

    unless @opts.id and typeof @opts.id is "string"
      @err "must have a store 'id'"
    @id = @opts.id

    unless @opts.subscribe or @opts.publish
      @err "must 'subscribe' and/or 'publish'"

    #convert to enum (object)
    enumify = (prop) =>
      if @opts[prop]
        if @opts[prop] instanceof Array
          obj = {}
          @opts[prop].forEach (k) -> obj[k] = true
          @opts[prop] = obj
        else if @opts[prop] isnt true
          @err "'#{prop}' must be boolean or an array"
    enumify 'subscribe'
    enumify 'publish'

    @channel = "_store-#{@id}"
    @obj = {}
    @events = {}

    #store original 'on()'
    @$setupPublish() if @opts.publish
    @$setupSubscribe() if @opts.subscribe
    return

  destroy: ->
    if @opts.publish
      e = {}
      e[@opts.id] = `undefined`
      @peer.expose e
    if @opts.subscribe
      @peer.unsubscribe @channel
      @peer.off 'remote', @preload
    return

  #update store from peers
  $setupPublish: ->
    @log "setup publish..."

    unless @opts.publishInterval is "nextTick" or
           @opts.publishInterval >= 0
      @err "invalid 'publishInterval' option"

    @publishId = 1
    @publishQue = []

    exposed = {}
    exposed[@opts.id] = [=>
      if @opts.publish is true
        return @obj
      #grab subset
      o = {}
      for k,v of @obj
        if @opts.publish[k]
          o[k] = v
      return o
    ]
    @peer.expose _store: exposed

  #dynamic expose the entire store to new peers
  $setupSubscribe: ->
    @log "setup subscribe..."

    #checks whitelist and filter
    check = (path, val, ctx) =>
      (@opts.subscribe is true or @opts.subscribe[path[0]]) and
      (not @opts.filter or @opts.filter.call ctx, path, value)

    #only preload each remote once
    preloads = []
    @preload = (remote) =>
      obj = remote._store?[@opts.id]
      return unless typeof obj is 'object'
      #only preload a remote store once
      return if preloads.indexOf(obj) >= 0
      preloads.push obj
      @log "preloading %j", obj
      #silently merge existing data
      for k,v of obj
        k = [k]
        if check k, v
          @set k, v, true
      return

    #subscribe to updates
    self = @
    @peer.subscribe @channel, (updates) ->
      ctx = @
      self.log "subscriptions-in #%s", updates.length
      for update in updates
        [path, value] = update
        if check path, value
          self.log "subscription-in %j = %j", path, value
          self.set path, value, true
      return

    #grab existing remotes
    if @peer instanceof Client
      @peer.server @preload
    else if @peer instanceof Server or @peer instanceof LocalPeer
      @peer.all (remotes) => remotes.forEach @preload

    #grab new prefilled remotes
    @peer.on 'remote', @preload

  object: ->
    @obj

  get: (path) ->
    o = @obj
    if typeof path is 'string'
      return o[path]

    i = 0
    while o and i < path.length
      o = o[path[i++]]
    return o

  del: (path) ->
    return @set path#, undefined

  set: (path, value, silent) ->

    value = _.cloneDeep value

    if typeof path is 'string'
      path = [path]
    
    unless path instanceof Array
      @err "set(path, ...) path must be a string or an array"

    if path.length is 0
      if typeof value is 'object'
        for k,v of value
          @set [k], v, silent
        return
      else
        @err "set(path, ...) path empty"

    @$set @obj, 0, path, value, silent

  #recurrsive accumulator
  $set: (obj, i, path, value, silent) ->

    prop = path[i]
    t = typeof prop
    unless t is "string" or t is "number"
      @err "property missing '#{prop}' (#{t})"
    
    #move index along the path
    i++
    if i < path.length
      unless typeof obj[prop] is 'object'
        #if next item is a number, create an array
        obj[prop] = if /\D/.test path[i] then {} else []
      return @$set obj[prop], i, path, value, silent

    #if both src and dest are objects, merge
    if _.isPlainObject(value) and _.isPlainObject(obj[prop])
      for k,v of value
        @$set obj[prop], i, path.concat(k), v, silent
      return

    prev = obj[prop]
    #skip if is already the value
    if _.isEqual prev, value
      # @log "skip. path equates: %j (%j)", path, value
      return

    del = value is `undefined`

    #entry should be as deep as possible
    if del
      delete obj[prop]
    else
      obj[prop] = value

    #publish raw changes
    if not silent and @opts.publish is true or @opts.publish[path[0]]
      #missing value allows undefined in JSON (instead of null)
      @$publish(if del then [path] else [path, _.cloneDeep value])

    #publish raw events
    @emit "change", path, value

    #wrap 'current' value in path keys (if deleted use prev, if replaced use new)
    update = @$wrap(path, if del then prev else value)

    #recursively emit events from the events tree
    @$emit @events, [], del, @obj, update, prev
    return

  #recurrsive accumulator
  $emit: (e, wilds, del, curr, update, prev) ->
    #no events in this portion of the tree
    return unless e

    #this portion of the tree contains an event object!
    eObj = e.$event
    if eObj
      action = if _.isPlainObject curr
        #resolve action using object
        if curr isnt update
          "update"
        else if del
          "remove"
        else
          "add"
      else
        #resolve action using value (store arrays are values!)
        if prev is `undefined`
          "add"
        else if del or curr is `undefined`
          "remove"
        else
          "update"

      args = wilds.slice(0)
      args.push(curr)
      # console.log "%s: %s: %j %j %j", e.$event, action, curr, update, prev
      @emit.apply @,[eObj[action]].concat(args) if eObj[action]
      @emit.apply @,[eObj["*"], action].concat(args) if eObj["*"]

    return unless typeof update is 'object'
    
    w = @opts.eventWildcard

    #the existing data was deleted, use update!
    curr = update if not curr

    for k of e
      #meta data
      if k is "$event"
        continue
      #recurse into wildcard tree *for every key in value*
      if k is w
        for vk of update
          @$emit e[w], wilds.concat(vk), del, curr[vk], update[vk], prev
      #recurse into value tree when it contains 'key'
      else if k of update
        @$emit e[k], wilds, del, curr[k], update[k], prev

    return

  $publish: (arr) ->
    @publishQue.push arr
    return unless @publishQue.length is 1
    
    fire = =>
      @log "publish #%s", @publishQue.length
      @peer.publish @channel, @publishQue
      @publishQue = []

    if @opts.publishInterval is "nextTick"
      process.nextTick fire
    else
      setTimeout fire, @opts.publishInterval

  check: (path) ->
    if typeof path is "string"
      path = [path]
    unless path instanceof Array
      @err "invalid path"
    path

  #override 'on' to accept a path array as event type
  on: (action, path, fn) ->
    #wildcard action
    if arguments.length is 2
      fn = path
      path = action
      action = "*"
      #change special case
      if path is "change"
        return super "change", fn
    else if action not in ["add", "remove","update"]
      @err "invalid action"
    #check path
    path = @check path
    #insert fn inside the events tree
    e = @events
    for p, i in path
      e = e[p] or e[p] = {}
    $e = e.$event ?= {}
    #generate unqiue id for this event
    $e[action] = "#{action}|#{JSON.stringify(path)}"
    super $e[action], fn

  # wrap(["c","b"], {a:42})
  #   => {"c":{"b":{"a":42}}}
  $wrap: (path, value) ->
    root = v = {}
    l = path.length-1
    for i in [0..l-1] by 1
      v = v[path[i]] = {}
    v[path[l]] = value
    root



  # events = {
  #   "a": {
  #     "*": {
  #       $event: "a *"
  #     }
  #     "b": {
  #       "c": {
  #         "*": {
  #           $event: "a b c *" 
  #         }
  #       }
  #     }
  #   }
  # }

  # value = {
  #   "a": {
  #     "d": undefined
  #   }
  # }