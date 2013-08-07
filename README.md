
***In progress***

--------------

# <name>multinode</end>

<description>dnode over anything</end>

[![NPM version](https://nodei.co/npm/multinode.png?compact=true)](https://npmjs.org/package/multinode)

[![Build Status](https://travis-ci.org/jpillora/multinode.png)](https://travis-ci.org/jpillora/multinode)

## Features

* Simplified `dnode` API
* Autoreconnects and buffering like `upnode`
* Easily splice in different transports

## Download

<codeBlock("npm install " + name)>
```
npm install multinode
```
</end>

***Note: Only node `v0.10.x` is currently supported***

## Basic Usage

**As well as `https`, you can use `http` and `tcp` (`tls` is in progress)**

Server:
<showFile("example/basic/https/server.js")>
``` javascript
var multinode = require('../../../');
var server = multinode.server();

server.expose({
  say: function(date) {
    console.log('client says ' + date);
  }
});

server.listen('https', 8000, function(){
  console.log('listening on 8000');
});
```
</end>

Client:
<showFile("example/basic/https/client.js")>
``` javascript
var multinode = require('../../../');
var client = multinode.client();

// client.connect('https://localhost:8000');
client.connect('https',8000,'localhost');

setInterval(function() {

  var d = new Date().toString();
  client(function(remote) {
    remote.say(d);
  });

}, 1000);

```
</end>

## Advanced Usage

#### `server.handle`

Instead of `server.listen()`, you can
provide the streams for the `server` to `handle`:

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

This will get called to whenever <name>multinode</end>
needs to restablish a connection.

#### TCP Example

``` js
//handle tcp connections
net.createServer(server.handle).listen(port, callback);

//create new tcp connections
client.createConnection(function(streamCallback) {
  streamCallback(net.connect(port));
});
```

See how each transport is implemented for more
examples [here](src/transports)

## Todo

* Websockets transport (using browserify and shoe)
* Peer mode (A Peer class which is both client and server)

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
