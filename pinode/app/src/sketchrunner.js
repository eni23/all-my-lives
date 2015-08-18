var exec = require('child_process').exec;
var cp = require('child_process');
var path = require('path');
var psTree = require('ps-tree');

require('array.prototype.find');

/********************************************************************
 * Sketch-Runner
 *
 * this Code runs the "Sketches" created by webfrontend
 *
 * Author: Cyrill von Wattenwyl < eni@e23.ch >
 *
 * Usage:
 * taskrunner.start( sketch.json )
 * taskrunner.stop()
 *
 ********************************************************************/

var approot = path.dirname(path.dirname(__dirname));

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

module.exports = {

  sketchdata: [{}],
  sketchidx: 0,
  is_running: false,
  next_timeout: false,
  config: {},
  child_pids: [],

  dmxblocking: false,

  falsecallback: function(){},

  stop: function(){
    for (idx in this.child_pids){
      var childpid=parseInt(this.child_pids[idx]);
      if (typeof childpid != "function"){
        if (childpid > 0) {
          console.log( "kill pid: " + childpid );
          this.kill_proctree(childpid);
          this.child_pids.remove( childpid );
        }
      }
    }

    this.is_running = false;
    this.sketchdata = [{}];
    clearTimeout(this.next_timeout);
    clearTimeout(this.dmxtimeout);
    this.dmxblocking = false;
    io.emit("stop-sketch");
  },

 dmxrunner: function( channel, universe, start, end, duration ) {
     this.channel = parseInt( channel );
     this.universe = parseInt( universe );
     this.start = parseInt( start );
     this.end = parseInt( end );
     var rawsteps = start - end;
     this.steps = -rawsteps > 0 ? -rawsteps : rawsteps;
     this.actstep = 0;
     this.multipl = -rawsteps > 0 ? 1 : -1;
     this.sleep = duration / this.steps;
     this.blocking = false;
     console.log("dmxrunner start");
     this.nextval = function() {
       var val = this.start + ( this.multipl * this.actstep );
       //console.log("set dmx val to: " + val);
       if ( this.end == val ){
         console.log("dmxrunner end");
         if ( this.blocking ){
           that.aftersleep();
         }
         return;
       }
       else {
         setTimeout( this.nextval.bind(this), this.sleep )
         this.actstep++;
       }
     }
   },

  spawn_exec: function( command, callback ){
    var child = cp.exec( command );
    child.stdout.on('data', function(data) {
        console.log( data );
    });
    child.stderr.on('data', function(data) {
        console.log( data );
    });
    child.on('close', function(code) {
        callback( code );
    });
  },

  fork_proc: function(cmd, callback){
    var cp = require('child_process');
    var child = cp.fork( approot + '/bin/child-worker' );
    child.unref();
    child.on('message', function(msg) {
      switch (msg.type) {
        case "stdout":
          console.log(msg.data);
          break;
        case "stderr":
          console.log(msg.data);
          break;
        case "done":
          console.log("child done");
          for (idx in msg.pid){
            that.child_pids.remove( msg.pid[idx] );
          }
          callback();
          break;
        case "pid":
          for (idx in msg.data){
            if (typeof msg.data[idx] != "function"){
              that.child_pids.push( msg.data[idx] );
            }
          }
          break;
        default:
          break;
      }
    });
    child.send({ type: "cmd", data: cmd });
    child.send({ type: "pid" });
  },

  // from: http://stackoverflow.com/questions/18694684/spawn-and-kill-a-process-in-node-js
  kill_proctree: function(pid, signal, callback) {
    signal   = signal || 'SIGKILL';
    callback = callback || function () {};
    var killTree = true;
    if(killTree) {
      psTree(pid, function (err, children) {
        [pid].concat(
          children.map(function (p) {
            return p.PID;
          })
        ).forEach(function (tpid) {
          try { process.kill(tpid, signal) }
          catch (ex) { }
        });
        callback();
      });
    } else {
      try { process.kill(pid, signal) }
      catch (ex) { }
      callback();
    }
  },


  start: function( data ){
    that=this
    this.sketchdata = data;
    this.sketchidx = 0;
    this.is_running = true;
    this.processitem( this.next() );
    io.emit("start-sketch");
  },


  next: function(){
    var item = this.sketchdata[this.sketchidx];
    if ( item ){
      this.sketchidx++;
      return item;
    }
    else {
      console.log("sketch done");
      this.is_running = false;
      io.emit("stop-sketch");
      return false;
    }
  },


  sleepnext: function( delay ){
    this.next_timeout = setTimeout( that.aftersleep, delay );
  },


  aftersleep: function(){
    var nextitem=that.next();
    if ( nextitem ){
      that.processitem( nextitem );
    }
  },


  processitem: function( item ){

    //if ( this.dmxblocking ){
    //  return;
    //}

    switch ( item.type ) {


      case "lifx":

        var time_ms = ( ( item.t / 1000 ) * 16.6666666 );

        var hue = parseInt(item.h * (0xffff / 360))
      	var sat = parseInt(item.s * 0xffff)
      	var lum = parseInt(item.l * 0xffff)
      	var white = parseInt(item.w * 0xffff)
        var time = parseInt( (time_ms / 1000) * 0xffff)


        console.log("run lifx");
        // all lamps in config
        if ( !item.bulb ){
          for ( bulb of this.config.lifxbulbs ){
            if ( bulb.id ){
              lx.lightsColour( hue, sat, lum, white, time, bulb.id );
            }
          }
        }
        // single lamp
        else {
          lx.lightsColour( hue, sat, lum, white, time, item.bulb );
        }
        if ( item.blocking ){
          console.log("lifx blocking");
          this.sleepnext( item.t );
          return;
        }
        break;

      case "dmx":
        console.log("run dmx");
        var runner = new this.dmxrunner( item.channel, 0, item.start, item.end, item.duration );
        runner.blocking = item.blocking;
        runner.nextval();
        if ( item.blocking ){
          console.log("dmx blocking");
          return;
        }
        break;

      case "audio":
        //console.log(item)
        console.log("run audio");
        var audiodev = this.config.audiosinks.find(function(a) { return a.id == item.sink; });
        var shellcmd = "";
        if (audiodev.player == "omxplayer" ){
          shellcmd = "omxplayer -o " + audiodev.dev + " '" + this.config.audiopath + "/" + item.file + "'" ;
        }
        else {
          shellcmd = "mplayer -ao alsa:device=" + audiodev.dev + " '" + this.config.audiopath + "/" + item.file + "'";
          //shellcmd = "mplayer '" + this.config.audiopath + "/" + item.file + "'";
        }
        console.log(shellcmd);

        if ( item.blocking ){
          console.log("audio blocking");
          this.fork_proc( shellcmd, this.aftersleep );
          return;
        }
        this.fork_proc( shellcmd, this.falsecallback );
        break;


      case "video":
        console.log("run video");
        var shellcmd = "omxplayer -o local '" + this.config.videopath + "/" + item.file + "'" ;
        console.log( shellcmd );
        if ( item.blocking ){
          console.log("video blocking");
          this.fork_proc( shellcmd, this.aftersleep );
          return;
        }
        this.fork_proc( shellcmd, this.falsecallback );
        break;


      case "delay":
        console.log("delay");
        this.sleepnext( item.duration );
        return;
        break;

      case "script":
        console.log("run script");
        if ( item.blocking ){
          console.log("script blocking");
          this.fork_proc( item.cmd, this.aftersleep );
          return;
        }
        else {
          this.fork_proc( item.cmd, this.falsecallback );
        }
        break;

      default:
        break;

    }

    var nextitem = this.next();
    if ( nextitem ){
      this.processitem( nextitem );
    }

  }

}
