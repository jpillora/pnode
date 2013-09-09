var test = require('tape');

require('../browser/src/index');

test('basic client connection', function(t) {

  t.plan(1);

  var client = pnode.client({id:'browser-1', debug:false});

  //same domain
  client.bind('ws:///pnode-ws');

  client.server(function(remote) {
    remote.sum(36,6,function(sum) {
      t.equal(sum,42);
      client.unbind();
    });
  });

});
