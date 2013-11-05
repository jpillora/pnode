#manual stream transport, provide both client and server handlers
exports.parse = (str) ->
  throw "'stream' transport has no shortcut string" if str

exports.bindServer = (emitter, handler) ->
  handler emitter
  return

exports.bindClient = (emitter, handler) ->
  handler emitter
  return