
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

# args must be in the format:
#   transport, ...rest
# or
#   "transport://host:port", ...rest
# which will translate to
#   transport, port, host,   ...rest

extract = (args) ->
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
  parseFn = trans.parse or exports.parse

  #prepend parsed args
  parsed = parseFn(uri)
  while parsed.length
    args.unshift parsed.pop()

  return trans

exports.bind = (context, args, callback) ->

  args = Array::slice.call args

  try
    trans = extract args
  catch err
    context.err "Transport: #{err}"

  if context.name is 'Client'
    #listen for next stream...
    context.once 'stream', (obj) ->
      callback obj
    trans.bindClient.apply context, args

  else if context.name is 'Server'
    #include callback for
    trans.bindServer.apply context, [callback].concat args

  return

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
