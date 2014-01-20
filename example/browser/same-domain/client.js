var client = pnode.client({name:'browser-1', debug:true, maxRetries:100});

//same domain
client.bind('ws:///pnode-ws');
// or
// client.bind('ws://localhost:8000/pnode-ws');

client.server(function(remote) {
  remote.time(function(str) {
    document.body.innerText = str;
  });
});
