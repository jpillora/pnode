
fs = require 'fs'
path = require 'path'
helper = require '../helper'

re = /^([a-z]+):\/\//
transports = {}

#extract protocol, hostname, port from string
exports.parse = (str) ->
  args = []
  if typeof str is 'string' and /^(.+?)(:(\d+))?$/.test str
    hostname = RegExp.$1
    port = parseInt RegExp.$3, 10
    args.push(port) if port
    args.push(hostname)
  return args

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

  if re.test transport
    name = RegExp.$1
    obj = exports.get name
    uri = transport.replace re, ''
  else
    name = transport
    obj = exports.get name

  unless obj
    context.err "Transport: '#{transport}' not found"
  #get a parse function
  parseFn = obj.parse or exports.parse

  #prepend parsed args
  args = parseFn(uri).concat(args)

  fn = obj["bind#{context.name}"]
  fn.apply context, args

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
unless process.browser
  files = fs.readdirSync path.join __dirname, "transports"
  files.filter((f)->/\.js$/.test f).forEach (f) ->
    exports.add f.replace('.js',''), require("./transports/#{f}")
