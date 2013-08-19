var client = pnode.client('browser');

//same domain
client.bind('ws:///pnode-ws');
// or
// client.bind('ws://localhost:8000/pnode-ws');

client(function(remote) {
  remote.time(function(str) {
    document.body.innerText = str;
  });
});
