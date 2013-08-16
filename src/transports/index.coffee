
fs = require 'fs'
path = require 'path'
helper = require '../helper'

transports = {}

#transport args must be in the format:
#   transport, ...rest
# or
#   transport://host:port, ...rest
# which will translate to
#   transport, port, host, ...rest
exports.bind = (context, args) ->
  args = Array::slice.call args
  transport = args.shift()

  unless transport
    context.err "Transport argument missing"

  parsed = helper.parseOrigin transport
  if parsed
    transport = parsed.protocol
    args.unshift parsed.hostname
    args.unshift parsed.port if parsed.port
  else if /[^a-z]/.test transport
    context.err "Invalid transport name: '#{transport}'"

  obj = exports.get transport
  unless obj
    @err "Transport: '#{transport}' not found"

  obj['bind'+context.name].apply context, args

exports.add = (name, obj) ->
  if typeof obj.bindServer isnt 'function' or
     typeof obj.bindClient isnt 'function'
    throw "Transport '#{name}' cannot be added, bind methods are missing"

  if /[^a-z]/.test name
    throw "Transport name must be lowercase letters only"

  if exports.get name
    throw "Transport '#{name}' already exists"

  transports[name] = obj
  true

exports.get = (name) ->
  return transports[name]

#init
fs.readdirSync(__dirname).forEach (file) ->
  if file isnt 'index.js'
    exports.add file.replace('.js',''), require("./#{file}")
