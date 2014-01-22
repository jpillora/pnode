require('colors');
var cp = require('child_process');
var fs = require('fs');
var path = require('path');
var procs = [];
var colors = ['blue','cyan','yellow','green'];

var exampleDir = path.join(__dirname, process.argv[2]);

if(!fs.existsSync(exampleDir))
  return console.warn("example directory '%s' does not exist", exampleDir);

fs.readdir(exampleDir, function(err, files) {

  files.forEach(function(file) {

    var filename = file;
    file = path.join(exampleDir, filename);

    if(/^x\-/.test(filename))
      return;

    var ext = path.extname(file);
    var name = file.replace(ext,'');
    var color = colors.pop();

    var start;
    if(ext === '.js')
      start = cp.fork;
    else if(ext === '.sh')
      start = cp.execFile;
    else
      return;

    filename = filename[color];

    console.log("Starting '%s'", filename);

    var proc = start(file, {silent:true});

    proc.stdout.on('data',function(buffer) {
      console.log("["+filename+"]", buffer.toString().replace(/\n$/,'')[color]);
    });
    proc.stderr.on('data',function(buffer) {
      console.error("["+filename+"]", buffer.toString().replace(/\n$/,'').red);
    });

    procs.push(proc);
  });
});