
fs = require 'fs'
path = require 'path'

transports = {}

exports.add = (name, obj) ->
  if typeof obj.listen isnt 'function' or
     typeof obj.connect isnt 'function'
    throw "Invalid transport"

  if /[^a-z]/.test name
    throw "Transport name must be lowercase letters only"

  if exports.get name
    throw "Transport #{name} already exists"

  transports[name] = obj
  true

exports.get = (name) ->
  return transports[name]

#init
fs.readdirSync(__dirname).forEach (file) ->
  if file isnt 'index.js'
    exports.add file.replace('.js',''), require("./#{file}")
