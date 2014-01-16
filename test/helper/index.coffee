
exports.callbacker = (expecting, callback = expecting) ->
  received = 0
  inc = typeof expecting isnt 'number'
  expecting = 0 if inc
  #callback maker
  ->
    expecting++ if inc
    #return a sub-callback
    ->
      received++
      if expecting is received
        callback()
      return

exports.onUp = (pnodes..., n, callback) ->
  i = 0
  onRemote = ->
    callback() if ++i is n
  for p in pnodes
    if p
      p.on 'remote', onRemote
  return

exports.unbindAfter = (pnodes..., done) ->
  pnodes = pnodes.filter (p) -> p


  #TIMEOUT HACK :O
  callback = ->
    return if callback.fired
    callback.fired = true
    done()
  callback.fired = false
  setTimeout callback, 100

  i = 0
  onUnbound = ->
    # console.log("UNBOUND   #{i}")
    callback() if ++i is pnodes.length

  for p, n in pnodes
    # console.log("UNBINDING #{n}")
    p.unbind onUnbound
  return
