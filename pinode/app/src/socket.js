var path = require('path');
var fs = require('fs');


var lifxconvert = function( raw_status ){
  var obj = {};
  var _convert = function( value, r1, r2 ) {
    return ( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ];
  }
  if ( raw_status.power > 0 ){
    obj.on = true;
  }
  else {
    obj.on = false;
  }
  obj.h = parseInt( _convert( raw_status.hue, [0, 65535], [0, 360] ) );
  obj.s = parseFloat( _convert( raw_status.saturation, [0, 65535], [0, 1] ) );
  obj.l = parseFloat( _convert( raw_status.brightness, [0, 65535], [0, 1] ) );
  obj.w = parseFloat( _convert( raw_status.kelvin, [0, 8999], [0, 0.168] ) );
  //obj.raw = raw_status;
  return obj;
}


// lifxctl live value ajustments from bulb data, sendt as socket-broadcast
lx.on("bulbstate", function(data) {
  var bulbstatus = lifxconvert(data.state);
  bulbstatus.id = data.addr.toString('hex');
  io.emit("lifx-bulbstatus",bulbstatus);
});


io.on('connection', function(socket){

  socket.on('config', function(msg){
    socket.emit('config',get_config());
  });

  socket.on('status', function(msg){
    socket.emit('status',{
      enabled: enabled,
      running: sketchrunner.is_running
    });
  });

  socket.on('sketch', function(msg){
    socket.emit('sketch',get_sketch());
  });

  socket.on('run-enter-sketch', function(msg){
    if ( sketchrunner.is_running == false && enabled == true ){
      var sketch = get_sketch();
      sketchrunner.config = get_config();
      sketchrunner.run_identifier = 'exit';
      sketchrunner.start( sketch.enter );
    }
  });

  socket.on('run-exit-sketch', function(msg){
    if ( sketchrunner.is_running == false && enabled == true ){
      var sketch = get_sketch();
      sketchrunner.config = get_config();
      sketchrunner.run_identifier = 'exit';
      sketchrunner.start( sketch.exit );
    }
  });

  socket.on('trigger-enable', function(msg){
    enabled=true;
  });

  socket.on('trigger-disable', function(msg){
    enabled=false;
  });

  socket.on('stop-sketch', function(msg){
    sketchrunner.stop();
  });

  socket.on('update-sketch', function(req){
    put_sketch(req);
  });

  socket.on('set-lifx', function(msg){
    var hue = parseInt(msg.h * (0xffff / 360)),
  	    sat = parseInt(msg.s * 0xffff),
	      lum = parseInt(msg.l * 0xffff),
	      white = parseInt(msg.w * 0xffff);

    if (!msg.bulb){
      var config = get_config();
      for (bulb of config.lifxbulbs){
        if (bulb.id){
          io.emit("lifx-bulbstatus",{ id:bulb.id, h:msg.h, s:msg.s, l:msg.l});
          lx.lightsColour(hue, sat, lum, white, 0, bulb.id);
        }
      }
    }
    else {
      io.emit("lifx-bulbstatus",{ id:msg.bulb, h:msg.h, s:msg.s, l:msg.l});
      lx.lightsColour(hue, sat, lum, white, 0, msg.bulb);
    }
  });

  socket.on('lifx-on', function(msg){
    var bulbstatus = lifxconvert(lx.bulbs[msg.bulbid].state);
    bulbstatus.id = msg.bulbid;
    bulbstatus.on = true;
    lx.lightsOn(msg.bulbid);
    io.emit("lifx-bulbstatus",bulbstatus);
  });

  socket.on('lifx-all-on', function(msg){
    for (idx in lx.gateways){
      lx.lightsOn(lx.gateways[idx].bulbAddress);
    }
    lx.requestStatus();
  });

  socket.on('lifx-off', function(msg){
    lx.lightsOff(msg.bulbid);
    var bulbstatus = lifxconvert(lx.bulbs[msg.bulbid].state);
    bulbstatus.id = msg.bulbid;
    bulbstatus.on = false;
    lx.lightsOff(msg.bulbid);
    io.emit("lifx-bulbstatus",bulbstatus);
  });

  socket.on('lifx-all-off', function(msg){
    for (idx in lx.gateways){
      lx.lightsOff(lx.gateways[idx].bulbAddress);
      var bulbstatus = {};
      bulbstatus.on = false;
      bulbstatus.id = lx.gateways[idx].bulbAddress;
      io.emit("lifx-bulbstatus",bulbstatus);
    }
  });

  socket.on('lifx-request-status', function(msg){
    lx.requestStatus();
  });

  socket.on('lifx-bulbs', function(msg){
    socket.emit('lifx-bulbs', lx.bulbs );
  });

  socket.on('lifx-gw', function(msg){
    socket.emit('lifx-gw', lx.gateways );
  });

  socket.on('set-dmx', function(msg){
    console.log("set dmx");
    artnet.set(0, parseInt( msg.channel ), parseInt( msg.value ));
  });


  socket.on('files', function(msg){
    socket.emit('files',get_files());
  });

  socket.on('sketch-test-single', function(req){
    sketchrunner.stop();
    var item = req[0];
    item.blocking = true;
    var sketch =  [ item ];
    sketchrunner.config=get_config();
    sketchrunner.run_identifier = "single";
    sketchrunner.start(sketch);
    console.log("test-single");
  });

  socket.on('sketch-test-enter', function(req){
    var sketch = get_sketch();
    sketchrunner.config=get_config();
    sketchrunner.run_identifier = 'enter';
    sketchrunner.stop();
    sketchrunner.start(sketch.enter);
  });

  socket.on('sketch-test-exit', function(req){
    var sketch = get_sketch();
    sketchrunner.config=get_config();
    sketchrunner.run_identifier = 'exit';
    sketchrunner.stop();
    sketchrunner.start(sketch.exit);
  });

  socket.on('nodelist', function(msg){
    var ctlconf = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/amlctl.json"
    var raw_ctlconf = fs.readFileSync(ctlconf);
    socket.emit('nodelist',JSON.parse(raw_ctlconf));
  });

});
