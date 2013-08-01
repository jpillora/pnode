
fs = require 'fs'
path = require 'path'

transports = {}

fs.readdirSync(__dirname).forEach (file) ->
  if file isnt 'index.js'
    transports[file.replace('.js','')] = require("./#{file}")

module.exports = transports
