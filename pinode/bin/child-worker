var exec = require('child_process').exec;

var mypid=process.pid;
var childpid=false;

var run_command = function( command ){
  var child = exec( command );
  childpid = child.pid;
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
      exitcode: code,
      pid: [ mypid, childpid ]
    });
    process.exit(code);
  });
  //process.send( {
  //  type: "pid",
  //  data: [ mypid, childpid ]
  //});
}

process.on('message', function(m) {
  if ( m.type == "cmd" ){
    console.log("child runs: "+m.data);
    run_command( m.data );
  }
  else if ( m.type == "pid" ){
    process.send( {
      type: "pid",
      data: [ mypid, childpid ]
    });
  }
});
