***In progress - API Unstable!***

--------------

# <name>pnode</end>

<description>peer-to-peer dnode over anything!</end>

[![NPM version](https://nodei.co/npm/pnode.png?compact=true)](https://npmjs.org/package/pnode)

Node tests:

[![Build Status](https://travis-ci.org/jpillora/pnode.png)](https://travis-ci.org/jpillora/pnode)

Browser tests:

[![browser support](http://ci.testling.com/jpillora/pnode.png)](http://ci.testling.com/jpillora/pnode)


## Features

* Simplified `dnode` API
* Autoreconnects and buffering like `upnode`
* Easily utilise different transports
* Usable in the browser with the Websockets transport 

## Future Features

* Client function call timeouts
* Integration with [cluster](http://nodejs.org/api/cluster.html)
* Peer-to-Peer API
  * Each instance is a server and many clients
* Authentication
  * Password
  * Certificates
  * [ACL](http://en.wikipedia.org/wiki/Access_control_list)
* Proxying RPC
  * For example `client` can communicate with `server2` via `server1` - `client-server1-server2`
  * Achived by `expose()`ing another `server`/`client`

## Download

<codeBlock("npm install " + name)>
```
npm install pnode
```
</end>

***Note: Only node `v0.10.x` is currently supported***

## Basic Usage

Server:
<showFile("example/basic/https/server.js")>
``` javascript
var pnode = require('../../../');
var server = pnode.server();

server.expose({
  say: function(date) {
    console.log('client says ' + date);
  }
});

server.bind('https://0.0.0.0:8000', function(){
  console.log('bound to all interfaces on port 8000');
});
```
</end>

Client:
<showFile("example/basic/https/client.js")>
``` javascript
var pnode = require('../../../');
var client = pnode.client();

client.bind('https://localhost:8000');

client.server(function(remote) {
  remote.say(new Date());
});

```
</end>

You can use a different transport by simply changing the URI. Currently,
the following transports are avaiable:

* `tcp`
* `tls`
* `http`
* `https`
* `ipc` (unix sockets)
* `ws` (websockets)

See [basic examples](example/basic/)

## Browser Usage

See [browser examples](example/browser/) and 'long-polling-heroku' is depolyed [here](http://pnode-browser-demo.herokuapp.com/)

## API

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
<showFile("src/transports/tcp.coffee")>
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
</end>

See how each transport is implemented for more
examples [here](src/transports)

## Advanced Usage

#### `server.handle`

Instead of `server.listen()`, you can
provide the streams to `server.handle()`:

``` javascript
// handle a read and write stream
foo(function(req, res) {
  server.handle(req, res);
});
// OR
// handle a duplex stream
bar(function(stream) {
  server.handle(stream);
});
```

Each call to `server.handle()` will be seen as a new
client by the server.

#### `client.createConnection`

Instead of `client.connect()`, you can provide a
function which will asynchronously create 
connection streams:

``` javascript
// create a read and a write stream
client.createConnection(function(readCallback, writeCallback) {
  readCallback(foo.createReadStream());
  writeCallback(bar.createWriteStream());
});
// OR
// create a duplex stream
client.createConnection(function(streamCallback) {
  streamCallback(bar.createStream());
});
```

This will get called to whenever <name>pnode</end>
needs to restablish a connection.

<license()>
#### MIT License

Copyright &copy; 2013 Jaime Pillora &lt;dev@jpillora.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
</end>
