exports.onUp = (pnodes..., n, callback) ->
  i = 0
  onRemote = ->
    console.log 'REMOTE #', i+1
    callback() if ++i is n
  for p in pnodes
    if p
      p.on 'remote', onRemote
  return

exports.onDown = (pnodes..., callback) ->
  i = 0
  onUnbound = ->
    callback() if ++i is pnodes.length
  for p in pnodes
    if p
      p.unbind onUnbound
  return
