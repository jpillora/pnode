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
    @name = "@name(#{@peer.id})"

    unless @opts.id and typeof @opts.id is "string"
      @error "must have a store 'id'"
    @id = @opts.id

    unless @opts.read or @opts.write
      @error "must 'read' or 'write'"

    @on 'change', (action, path, val) =>
      @log ">>> %s: '%s': %s", action, path, val

    @channel = "_store-#{@id}"
    @obj = {}

    @$setupWrite() if @opts.write
    @$setupRead() if @opts.read
    return

  #update store from peers
  $setupWrite: ->
    @log "setup write..."
    exposed = {}
    exposed[@opts.id] = [=> @obj]
    @peer.expose _store: exposed

  #dynamic expose the entire store to new peers
  $setupRead: ->
    @log "setup read..."
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
      @set [], obj, true
      return

    #subscribe to updates
    self = @
    @peer.subscribe @channel, (path, doDelete, value) ->
      value = undefined if doDelete
      self.log "subscription-in %j = %j", path, value
      if not self.opts.filter or self.opts.filter.call @, path, value
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
        if typeof path[0] is 'number'
          obj[prop] = []
        else
          obj[prop] = {}
      return @setAcc obj[prop], used, path, value, silent

    del = value is undefined

    prev = obj[prop]
    #skip if is already the value
    if _.isEqual prev, value
      return
    
    if del
      delete obj[prop]
    else
      obj[prop] = value

    if not silent and @opts.write
      @log "publish %j = %j", used, value
      @peer.publish @channel, used, del, value

    if del
      @emit 'del', used, prev
    else
      @emit 'set', used, value, prev

    @emit 'change', (if del then 'del' else 'set'), used, value, prev

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
