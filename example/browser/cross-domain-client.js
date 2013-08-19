var client = pnode.client('browser');

//cross domain!
client.bind('ws://localhost:8001/pnode-ws');

client(function(remote) {
  remote.time(function(str) {
    document.body.innerText = str;
  });
});
