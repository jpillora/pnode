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
    read: false
    write: false
    filter: null

  constructor: (@peer, opts = {}) ->
    @opts = _.defaults opts, @defaults
    @name = "#{@name}(#{@peer.id})"

    unless @opts.id and typeof @opts.id is "string"
      @err "must have a store 'id'"
    @id = @opts.id

    unless @opts.read or @opts.write
      @err "must 'read' or 'write'"

    #convert to enum (object)
    enumify = (prop) =>
      if @opts[prop]
        if @opts[prop] instanceof Array
          obj = {}
          @opts[prop].forEach (k) -> obj[k] = true
          @opts[prop] = obj
        else if @opts[prop] isnt true
          @err "'#{prop}' must be boolean or an array"
    enumify 'read'
    enumify 'write'


    @on 'change', (action, path, val) =>
      @log ">>> %s: %j = %j", action, path, val

    @channel = "_store-#{@id}"
    @obj = {}

    @$setupWrite() if @opts.write
    @$setupRead() if @opts.read
    return

  #update store from peers
  $setupWrite: ->
    @log "setup write..."
    exposed = {}
    exposed[@opts.id] = [=>
      if @opts.write is true
        return @obj
      #grab subset
      o = {}
      for k,v of @obj
        if @opts.write[k]
          o[k] = v
      return o
    ]
    @peer.expose _store: exposed

  #dynamic expose the entire store to new peers
  $setupRead: ->
    @log "setup read..."

    #checks whitelist and filter
    check = (path, val, ctx) =>
      (@opts.read is true or @opts.read[path[0]]) and
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
    @peer.subscribe @channel, (path, doDelete, value) ->
      ctx = @
      value = undefined if doDelete
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
    while o and path.length
      o = o[path.shift()]
    return o

  set: (path, value, silent) ->
    if typeof path is 'string'
      path = [path]
    unless path instanceof Array
      throw new Error("set(path, ...) path must be a string or an array")
    if path.length is 0
      if typeof value is 'object'
        for k,v of value
          @set [k], v, silent
        return
      else
        throw new Error("set(path, ...) path empty");
    @setAcc @obj, [], path, value, silent

  setAcc: (obj, used, path, value, silent) ->

    prop = path.shift()
    t = typeof prop
    unless t is "string" or t is "number"
      throw new Error "property missing '#{prop}' (#{t})"
    
    used.push prop

    if path.length > 0
      if typeof obj[prop] isnt 'object'
        if /\D/.test path[0]
          obj[prop] = {}
        else
          obj[prop] = []
      return @setAcc obj[prop], used, path, value, silent

    del = value is undefined

    prev = obj[prop]
    #skip if is already the value
    if _.isEqual prev, value
      return
    
    if del
      delete obj[prop]
      @emit 'del', used, prev
    else
      obj[prop] = value
      @emit 'set', used, value, prev

    if used.length is 1 and used[0] is "controlId" and value < prev
      @err "CONTROL ID DECREASED!"

    @emit 'change', (if del then 'del' else 'set'), used, value, prev

    if not silent and @opts.write is true or @opts.write[used[0]]
      @log "publish %j = %j", used, value
      @peer.publish @channel, used, del, value

    return

  del: (path) ->
    return @set path#, undefined


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



