//run client and server with different colored outputs :)

require("colors");
var log = function(color, str) {
  console.log(str.toString()[color]);
};

var fork = require("child_process").fork;
var run = function(file, color) {
  var proc = fork(file, [], {silent:true});
  proc.stdout.on('data', function(buffer) {
    process.stdout.write(buffer.toString()[color]);
  });
  proc.stderr.on('data', function(buffer) {
    process.stderr.write(("*" + buffer.toString())[color]);
  });
};

run("./peer1.js", "white");
run("./peer2.js", "yellow");
// run("./peer3.js", "magenta");

