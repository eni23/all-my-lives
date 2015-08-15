var exec = require('child_process').exec;
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



module.exports = {

  sketchdata: [{}],
  sketchidx: 0,
  is_running: false,
  next_timeout: false,
  config: {},

  dmxstep: 0,
  dmxnum: 0,
  dmxsleep: 0,
  dmxstart: 0,
  dmxtimeout: false,
  dmxblocking: false,
  dmxchannel: false,

  falsecallback: function(){},

  stop: function(){
    this.spawn_exec("killall mplayer", this.falsecallback);
    this.spawn_exec("killall omxplayer.bin", this.falsecallback);
    this.is_running = false;
    this.sketchdata = [{}];
    clearTimeout(this.next_timeout);
    clearTimeout(this.dmxtimeout);
    this.dmxblocking = false;
  },


  spawn_exec: function( command, callback ){
    var child = exec( command );
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


  start: function( data ){
    that=this
    this.sketchdata = data;
    this.sketchidx = 0;
    this.is_running = true;
    this.processitem( this.next() );
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


  dmxrunner: function(){
    console.log("set dmx to:" + that.dmxnum );
    artnet.set(0, parseInt( that.dmxchannel ), parseInt( that.dmxnum ) );
    if ( ( that.dmxstep - 1 ) < ( that.dmxnum - that.dmxstart ) ) {
      console.log("dmx done");
      if ( that.dmxblocking ) {
        that.dmxblocking = false;
        var nextitem = that.next();
        if ( nextitem ){
          that.processitem( nextitem );
        }
      }
      return;
    }
    that.dmxtimeout = setTimeout( that.dmxrunner, that.dmxsleep );
    that.dmxnum++;
  },


  processitem: function( item ){

    if ( this.dmxblocking ){
      return;
    }

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
        this.dmxchannel = item.channel;
        this.dmxstep = item.end - item.start;
        console.log(this.dmxstep);
        this.dmxnum = item.start;
        this.dmxstart = item.start;
        this.dmxsleep = item.duration / this.dmxstep ;
        this.dmxrunner();
        if ( item.blocking ){
          console.log("dmx blocking");
          this.dmxblocking = true;
          return;
        }
        else {
          this.dmxblocking = false;
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
          shellcmd = "mplayer -ao alsa:device=hw=" + audiodev.dev + " '" + this.config.audiopath + "/" + item.file + "'";
        }
        console.log(shellcmd);

        if ( item.blocking ){
          console.log("audio blocking");
          this.spawn_exec( shellcmd, this.aftersleep );
          return;
        }
        this.spawn_exec( shellcmd, this.falsecallback );
        break;


      case "video":
        console.log("run video");
        var shellcmd = "omxplayer -o local '" + this.config.videopath + "/" + item.file + "'" ;
        console.log( shellcmd );
        if ( item.blocking ){
          console.log("video blocking");
          this.spawn_exec( shellcmd, this.aftersleep );
          return;
        }
        this.spawn_exec( shellcmd, this.falsecallback );
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
          this.spawn_exec( item.cmd, this.aftersleep );
          return;
        }
        else {
          this.spawn_exec( item.cmd, this.falsecallback );
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
