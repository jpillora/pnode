var client = pnode.client({
  id: 'browser',
  debug: true
});

client.bind('ws:///pnode-ws');

client(function(remote) {
  remote.time(function(str) {
    document.body.innerText = str;
  });
});
