var exec = require('child_process').exec;

var run_command = function( command ){
  var child = exec( command );
  child.stdout.on('data', function(data) {
    process.send( {
      type: "stdout",
      data: data
    });
  });
  child.stderr.on('data', function(data) {
    process.send( {
      type: "stderr",
      data: data
    });
  });
  child.on('close', function(code) {
    process.send( {
      type: "done",
      exitcode: code
    });
    console.log("child done");
  });
  child.unref();
}

process.on('message', function(m) {
  run_command( m.cmd );
  console.log("child runs: " + m.cmd);
});
