***In progress - API Unstable!***

--------------

# <name>pnode</end>

<description>peer-to-peer dnode over anything!</end>

[![NPM version](https://nodei.co/npm/pnode.png?compact=true)](https://npmjs.org/package/pnode)

Node tests:

[![Build Status](https://travis-ci.org/jpillora/pnode.png)](https://travis-ci.org/jpillora/pnode)

Browser tests:

[![browser support](https://ci.testling.com/jpillora/pnode.png)](https://ci.testling.com/jpillora/pnode)

## Summary

**pnode** is a Node.js library, built ontop of dnode ([What's dnode?](http://substack.net/doc/dnode_slides_nodeconf.pdf)),
allows applications (node and browser) to easily communicate in a peer-to-peer fashion. Since there's no centralised server,
there's no single point of failure, this ability simplifies the implementation of *resilient* applications by adding
*redundancy*.

## Features

* Simplified [dnode](https://github.com/substack/dnode) API 
* Autoreconnects and buffering **like** [upnode](https://github.com/substack/upnode)
* Easily utilise different transports
* Usable in the browser with the Websockets transport
* Create your own transport types with any duplex stream

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
  * Allowing `client` can communicate with `server2` via `server1` (`client`↔`server1`↔`server2`)
  * Achieved by `expose()`ing another `server`/`client`
* WebRTC transport `rtc://` to provide `client`↔`client` networks

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

See [browser examples](example/browser/)

See [this demo](http://pnode-browser-demo.herokuapp.com/) ('long-polling-heroku' in the examples),
since Heroku doesn't support Websockets, sockjs falls back to
[XHR long polling](http://en.wikipedia.org/wiki/Comet_(programming))
with [shoe](https://github.com/substack/shoe) maintaining stream-like behaviour.

## API

See [API docs](docs/pnode-api.md/)



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
