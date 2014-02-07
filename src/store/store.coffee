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
    filter: null
    eventWildcard: "*"

  constructor: (@peer, opts = {}) ->
    @opts = _.defaults opts, @defaults
    @name = "#{@name}(#{@peer.id})"

    unless @opts.id and typeof @opts.id is "string"
      @err "must have a store 'id'"
    @id = @opts.id

    unless @opts.subscribe or @opts.publish
      @err "must 'subscribe' or 'publish'"

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

    @on 'change', (action, path, val) =>
      @log ">>> %s: %j = %j", action, path, val

    @channel = "_store-#{@id}"
    @obj = {}
    @events = {}

    #store original 'on()'
    @$setupWrite() if @opts.publish
    @$setupRead() if @opts.subscribe
    return

  #update store from peers
  $setupWrite: ->
    @log "setup publish..."

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
  $setupRead: ->
    @log "setup subscribe..."

    #checks whitelist and filter
    check = (path, val, ctx) =>
      (@opts.subscribe is true or @opts.subscribe[path[0]]) and
      (not @opts.filter or @opts.filter.call ctx, path, value)

    #only preload each remote once
    preloads = []
    preload = (remote) =>
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
      @peer.server preload
    else if @peer instanceof Server or @peer instanceof LocalPeer
      @peer.all (remotes) -> remotes.forEach preload

    #grab new prefilled remotes
    @peer.on 'remote', preload

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

  $set: (obj, i, path, value, silent) ->

    prop = path[i]
    t = typeof prop
    unless t is "string" or t is "number"
      @err "property missing '#{prop}' (#{t})"
    
    #move index along the path
    i++
    isObj = typeof obj[prop] is 'object'

    if i < path.length
      unless isObj
        #if next item is a number, create an array
        obj[prop] = if /\D/.test path[i] then {} else []
      return @$set obj[prop], i, path, value, silent

    #if both src and dest are objects, merge
    if isObj and typeof value is 'object'
      for k,v of value
        @$set obj[prop], i, path.concat(k), v, silent
      return

    del = value is undefined

    prev = obj[prop]
    #skip if is already the value
    if _.isEqual prev, value
      @log "skip. path equates: %j (%j)", path, value
      return

    #entry should be as deep as possible
    if del
      delete obj[prop]
    else
      obj[prop] = value

    #publish raw changes
    if not silent and @opts.publish is true or @opts.publish[path[0]]
      @log "publish %j = %j", path, value
      if @publishQue.length is 0
        process.nextTick =>
          @peer.publish @channel, @publishQue
          @publishQue = []
      #missing value allows undefined in JSON (instead of null)
      @publishQue.push if value is `undefined` then [path] else [path, value]

    #emit path array
    @emit path, value
    return

  #override 'on' to accept a path array as event type
  on: (path, fn) ->
    return super unless path instanceof Array
    if path.length is 0
      @err "path empty"
    #insert fn inside the events tree
    e = @events
    for p, i in path
      e = e[p] or e[p] = {}
    super e.$event = JSON.stringify(path), fn

  #override 'emit' to accept a path array as event type
  emit: (path, value) ->
    return super unless path instanceof Array
    if path.length is 0
      @err "path empty"
    #recursive emit events from the events tree
    @$emit @events, [], path, 0, value
    return

  # LISTEN {
  #   "f1": {
  #     "post": {
  #       "*": {
  #         $event: "f1 post *"
  #       },
  #       "p001": {
  #         $event: "f1 post p001"
  #       },
  #     }
  #   }
  # }
  # RECIVE ["f1"],{ post: { "p002": { comment:{ "c001":  { body:  "oi!"} } } } }


  #recurrsive path emit
  $emit: (e, wilds, path, pi, value) ->
    #no events in this portion of the tree
    return unless e

    #emit string for standard emit!
    if e.$event
      @emit.apply @, [e.$event].concat(wilds).concat(value)

    w = @opts.eventWildcard
    #enter into the tree using path
    if pi < path.length
      p = path[pi]
      #recurse into wildcard tree
      @$emit e[w], wilds.concat(p), path, pi+1, value if e[w]
      #recurse into 'key' tree 
      @$emit e[p], wilds, path, pi+1, value if e[p]
      return 

    #path run out, use value
    if typeof value is 'object'
      for k of e
        #meta data
        if k is "$event"
          continue
        #recurse into wildcard tree *for every key in value*
        if k is w
          for vk, v of value
            @$emit e[w], wilds.concat(vk), path, pi, v
        #recurse into value tree when it contains 'key'
        else if k of value
          @$emit e[k], wilds, path, pi, value[k]

    return

# STRING PATH HELPERS

# pathify = (prop) ->
#   return if /^\d+$/.test prop
#     "[#{prop}]"
#   else if /^\d/.test(prop) or /[^\w]/.test(prop)
#     "['#{prop}']"
#   else
#     prop

# parse = (str) ->
#   eq = str.indexOf("=")
#   return  if eq is -1 #invalid
#   json = str.substr(eq + 1)
#   pathStr = str.substr(0, eq)
#   val
#   if json
#     try val = JSON.parse(json)
#     catch e
#       e.message = "JSON Error: " + e.message
#       throw e

#   path: parsePath pathStr
#   val: val

# parsePath = (str) ->
#   return [] if str is ''
#   str = '.' + str unless /^(\.|\[)/.test str
#   path = []
#   while /^(\[(\d+)\]|\[\'([^']+)\'\]|\.([a-zA-Z]\w+))/.test(str)
#     p = RegExp.$2 or RegExp.$3 or RegExp.$4
#     str = str.replace(RegExp.$1, "")
#     path.push p
#   return path




