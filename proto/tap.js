module.exports = function(obj, name, fn) {
  var orig = obj[name];
  obj[name] = function() {
    fn.apply(obj, arguments);
    orig.apply(obj, arguments);
  };
};

module.exports.emit = function(obj) {
  module.exports(obj,'emit',function(name) {
    console.log('!',name);
  });
};