
### `pnode.`[`server`/`client`]`(options)`

`options` must be an object, if it's a string it'll be converted to `{ id: options }`

returns a `server`/`client` instance

#### [`server`/`client`]`.expose(object)`

each property of `object` will be publically exposed to all remote connections

#### [`server`/`client`]`.bind(transport, args...)`

`transport` must be a string representing an avaiable transport

if `transport` is a URI `://` then it will parse `host` and `port` from it which will then be prepended to the arguments. So, `server.bind('tcp://my-server.com:3000', 'a', 'b')` is equivalent to `server.bind('tcp', 3000, 'my-server.com', 'a', 'b')`.

`args` will be passed directly into the transport's `bindServer()`/`bindClient()` method (minus the `transport` string)

### `pnode.addTransport(transport)`

the `transport` object must implement:

1. a `bindServer` method, which must `server.handle()` each new incoming connection. It must also call `server.setInterface(obj)` with a `obj.unbind()` method implemented, which may be used to close the server and well as a `obj.uri` property which is a string with the URI of the server.
1. a `bindClient` method, which must define a `client.createConnection()` function to create new outgoing connections. It must also call `server.setInterface(obj)` with a `obj.uri` property which is a string with the URI of the server the client is connected to.




#### The TCP Transport

`src/transports/tcp.coffee`:

```
net = require 'net'

exports.bindServer = (args...) ->
  pserver = @
  s = net.createServer pserver.handle
  s.listen.apply s, args

  pserver.setInterface {
    uri: "tcp://#{typeof args[1] is 'string' and args[1] or '0.0.0.0'}:#{args[0]}"
    unbind: -> s.close()
  }
  return

exports.bindClient = (args...) ->
  pclient = @
  pclient.createConnection (callback) ->
    callback net.connect.apply null, args

  pclient.setInterface {
    uri: "tcp://#{typeof args[1] is 'string' and args[1] or 'localhost'}:#{args[0]}"
  }
  return

```

See how each transport is implemented for more
examples [here](src/transports)





