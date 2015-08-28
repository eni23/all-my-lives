var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var socket_io = require('socket.io');

var conffile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/config.json"
var confcontent = fs.readFileSync(conffile);
var config=JSON.parse(confcontent);

var options = {
    host: config.artnethost
}

enabled = true;
artnet = require('artnet')(options);
lifx = require('lifx');
lx   = lifx.init();
lx.requestStatus();
sketchrunner = require('./sketchrunner');

// this helps the raspi to keep his arp-table up-to-date
setInterval(function(){
  //console.log("requesting status of all bulbs");
  lx.requestStatus();
}, 15000 );


var routes = require('./route.index');
var rlifx = require('./route.lifx');
var config = require('./route.config');
var sketch = require('./route.sketch');
var files = require('./route.files');
var dmx = require('./route.dmx');
var trigger = require('./route.trigger');

var app = express();
io = socket_io();
app.io = io;


var get_sketch = function(){
  var sketchfile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/sketch.json"
  var raw_sketch = fs.readFileSync(sketchfile);
  return JSON.parse(raw_sketch);
}

var put_sketch = function(data){
  var sketchfile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/sketch.json"
  var json = JSON.stringify(data, null, 2);
  fs.writeFileSync(sketchfile,json,'utf8');
}

var get_config = function(){
  var conffile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/config.json"
  var raw_config = fs.readFileSync(conffile);
  return JSON.parse(raw_config);
}

var get_files = function(){
  var data={};
  var conffile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/config.json"
  var content = fs.readFileSync(conffile);
  var config=JSON.parse(content);
  data.video = fs.readdirSync(config.videopath);
  data.audio = fs.readdirSync(config.audiopath);
  return data;
}


// socket.io-"api"
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
      sketchrunner.start( sketch.enter );
    }
  });

  socket.on('run-exit-sketch', function(msg){
    if ( sketchrunner.is_running == false && enabled == true ){
      var sketch = get_sketch();
      sketchrunner.config = get_config();
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
          lx.lightsColour(hue, sat, lum, white, 0, bulb.id);
        }
      }
    }
    else {
      lx.lightsColour(hue, sat, lum, white, 0, msg.bulb);
    }
  });

  socket.on('lifx-on', function(msg){
    for (idx in lx.gateways){
      lx.lightsOn(lx.gateways[idx].bulbAddress);
    }
  });

  socket.on('lifx-off', function(msg){
    for (idx in lx.gateways){
      lx.lightsOff(lx.gateways[idx].bulbAddress);
    }
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
    var item = req[0];
    item.blocking = false;
    var sketch =  [ item ];
    sketchrunner.config=get_config();
    sketchrunner.stop();
    sketchrunner.start(sketch);
    console.log("test-single");
  });

  socket.on('sketch-test-enter', function(req){
    var sketch = get_sketch();
    sketchrunner.config=get_config();
    sketchrunner.stop();
    sketchrunner.start(sketch.enter);
  });

  socket.on('sketch-test-exit', function(req){
    var sketch = get_sketch();
    sketchrunner.config=get_config();
    sketchrunner.stop();
    sketchrunner.start(sketch.exit);
  });

  socket.on('nodelist', function(msg){
    var ctlconf = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/amlctl.json"
    var raw_ctlconf = fs.readFileSync(ctlconf);
    socket.emit('nodelist',JSON.parse(raw_ctlconf));
  });

});



// view engine setup
app.set('views', path.join(path.dirname(__dirname), 'tpl'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(path.dirname(__dirname), 'static')));

app.use('/', routes);
app.use('/lifx', rlifx);
app.use('/config', config);
app.use('/sketch', sketch);
app.use('/files', files);
app.use('/dmx', dmx);
app.use('/trigger', trigger);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
