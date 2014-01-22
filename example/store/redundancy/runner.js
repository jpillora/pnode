require('colors');
var fork = require('child_process').fork;
var fs = require('fs');
var procs = [];
var colors = ['blue','cyan','yellow','green'];

fs.readdir(__dirname, function(err, files) {
  files.forEach(function(file) {
    if(!/^s/.test(file)) return;

    var name = file.replace(/\.js$/,'');
    var color = colors.pop();
    console.log("Starting '%s' as %s", name, color);

    var proc = fork(file, {silent:true});

    proc.stdout.on('data',function(buffer) {
      console.log(name, buffer.toString().replace(/\n$/,'')[color]);
    });
    proc.stderr.on('data',function(buffer) {
      console.error(name, buffer.toString().replace(/\n$/,'').red);
    });

    procs.push(proc);
  });
});