{EventEmitter2} = require 'eventemitter2'

module.exports = EventEmitter2
# module.exports = class Emitter extends EventEmitter2

#   proxy: (emitter, events...) ->
#     for e in events
#       @on e, (a1, a2, a3, a4) ->
#         emitter.emit e, a1, a2, a3, a4
#     return