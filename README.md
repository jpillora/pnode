
***In progress***

--------------

# <name>multinode</end>

<description>dnode over anything</end>

<!--
[![Build Status](https://travis-ci.org/visionmedia/jade.png?branch=master)](https://travis-ci.org/visionmedia/jade)
[![Dependency Status](https://gemnasium.com/visionmedia/jade.png)](https://gemnasium.com/visionmedia/jade)
-->
[![NPM version](https://nodei.co/npm/multinode.png)](https://npmjs.org/package/multinode)

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

## Quick Usage

**As well as `http`; `https`, `net` and `tls` are avaiable**

Server:
<showFile("example/http-server.js")>
``` javascript
var multinode = require('../');
var server = multinode.server();

server.expose({
  ho: function(date) {
    console.log('ho at ' + date);
  }
});

server.https.listen(8000, function(){
  console.log('listening on 8000');
});
```
</end>

Client:
<showFile("example/http-client.js")>
``` javascript
var multinode = require('../');
var client = multinode.client();

client.expose({
  hi: function() {
    console.log('hi!');
  }
});

client.https.connect(8000);

setInterval(function() {

  var d = new Date().toString();
  client(function(remote) {
    console.log('calling ho...');
    remote.ho(d);
  });

}, 1000);
```
</end>

## Advanced Usage

### `server.handle`

Instead of `server.[transport].listen()`, you can
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

### `client.createConnection`

Instead of `client.[transport].connect()`, you can asynchronously 
provide a function to create the connection streams:

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
needs to re-establish a connection

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
