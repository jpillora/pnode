// var pnode = require('../../browser/src/index');
// var test = require('tape');

// test('connect', function (t) {

//   t.plan(1);

//   var client = pnode.client({id:'browser-1', debug:false});

//   client.bind('ws:///pnode-ws');

//   client.server(function(remote) {
//     remote.sum(36,6,function(sum) {
//       t.equal(sum, 42);
//       client.unbind();
//     });
//   });

// });
var assert = require('assert');

describe('integers', function () {
  it('should square the numbers', function (done) {
    assert.equal(2*2, 4);
    // assert.equal(typeof xhook, 'object');
    done();
  });
});