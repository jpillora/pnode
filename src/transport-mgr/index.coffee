
fs = require 'fs'
path = require 'path'
helper = require '../helper'

re = /^([a-z]+):\/\//
transports = {}

#extract protocol, hostname, port from string
parse = (str) ->
  args = []
  if typeof str is 'string' and /^(.+?)(:(\d+))?$/.test str
    hostname = RegExp.$1
    port = parseInt RegExp.$3, 10
    args.push(port) if port
    args.push(hostname)
  return args

# args must be in the format:
#   transport, ...rest
# or
#   "transport://host:port", ...rest
# which will translate to
#   transport, port, host,   ...rest

exports.get = (args) ->
  transport = args.shift()

  unless transport
    throw "name missing"

  if re.test transport
    name = RegExp.$1
    trans = exports.get name
    uri = transport.replace re, ''
  else
    name = transport
    trans = exports.get name

  unless trans
    throw "'#{name}' not found"
  #get a parse function
  parseFn = trans.parse or parse

  #prepend parsed args
  parsed = parseFn(uri)
  while parsed.length
    args.unshift parsed.pop()

  return trans

exports.add = (name, obj) ->
  if typeof obj.bindServer isnt 'function' or
     typeof obj.bindClient isnt 'function'
    throw "Transport '#{name}' cannot be added, bind methods are missing"

  if /[^a-z]/.test name
    throw "Transport name must be lowercase letters only"

  if transports[name]
    throw "Transport '#{name}' already exists"

  transports[name] = obj
  true

#init
unless process.browser
  files = fs.readdirSync path.join __dirname, "transports"
  files.filter((f)->/\.js$/.test f).forEach (f) ->
    exports.add f.replace('.js',''), require("./transports/#{f}")
