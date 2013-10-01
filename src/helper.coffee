exports.isReadable = (stream) ->
  stream.readable is true or typeof stream.read is 'function'

exports.isWritable = (stream) ->
  stream.writable is true or typeof stream.write is 'function'

exports.serialize = (obj) ->
  if obj instanceof Array
    return obj.filter (o) ->
      typeof o.serialize is 'function'
    .map (o) -> 
      o.serialize()
  
  newobj = {}
  for key, o of obj
    newobj[key] = o.serialize() if o.serialize
  return newobj

exports.callbacker = (callback) ->
  received = 0
  expecting = 0
  #callback maker
  ->
    expecting++
    #return a sub-callback
    ->
      received++
      if expecting is received
        callback()
      return

exports.set = ->

  arr = []
  arr.has = (o) ->
    @indexOf(o) isnt -1

  arr.add = (o) ->
    return false if @has o
    @push o
    return true

  arr.remove = (o) ->
    i = @indexOf(o)
    return false if i is -1
    @splice i, 1
    return true

  arr.copy = ->
    @slice()

  arr.find = (fn) ->
    for o in @
      return o if fn(o)
    return null
  arr


