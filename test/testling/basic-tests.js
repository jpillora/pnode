var pnode = require('../../browser/src/index');
var test = require('tape');

test('connect', function (t) {

  t.plan(1);

  var client = pnode.client({id:'browser-1', debug:false});

  client.bind('ws:///pnode-ws');

  client.server(function(remote) {
    remote.sum(36,6,function(sum) {
      t.equal(sum, 42);
      client.unbind();
    });
  });

});