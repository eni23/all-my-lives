var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var socket_io = require('socket.io');
var exec = require('child_process').exec;
var cp = require('child_process');


enabled = true;
lifx = require('lifx');
lx   = lifx.init();
lx.requestStatus();
sketchrunner = require('./sketchrunner');
io = socket_io();
require('./socket');


// this helps the raspi to keep his arp-table up-to-date
setInterval(function(){
  lx.requestStatus();
}, 15000 );


var route_index = require('./route.index');
var route_trigger = require('./route.trigger');
var route_api_v1 = require('./api.v1');

var app = express();
app.io = io;

range_convert = function( old_value, old_min, old_max, new_min, new_max ){
  return ( (old_value - old_min) / (old_max - old_min) ) * (new_max - new_min) + new_min;
}

get_sketch = function(){
  var sketchfile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/sketch.json"
  var raw_sketch = fs.readFileSync(sketchfile);
  return JSON.parse(raw_sketch);
};

put_sketch = function(data){
  var sketchfile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/sketch.json"
  var json = JSON.stringify(data, null, 2);
  fs.writeFileSync(sketchfile,json,'utf8');
};

get_config = function(){
  var conffile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/config.json"
  var raw_config = fs.readFileSync(conffile);
  return JSON.parse(raw_config);
};

init_artnet = function(){
  var options = {
      host: config.artnethost
  }
  artnet = require('artnet')(options);
};

get_jobs = function(){
  var cronfile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/jobs.json"
  var raw_cron = fs.readFileSync(cronfile);
  return JSON.parse(raw_cron);
};

config = get_config();
init_artnet();


spawn_exec =  function( command, callback ){
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
};

var jobs_list = get_jobs();
for (job of jobs_list.jobs){
  if (job.enabled){
    setInterval((function(){
      if (this.check_running){
        if (!sketchrunner.is_running){
          spawn_exec(this.command,function(){});
        }
      }
      else {
        spawn_exec(this.command,function(){});
      }
    }).bind(job),job.interval);

    console.log("adding job '"+job.command+"', every "+job.interval);
  }
}



get_files = function(){
  var data={};
  var conffile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/config.json"
  var content = fs.readFileSync(conffile);
  var config=JSON.parse(content);
  data.video = fs.readdirSync(config.videopath);
  data.audio = fs.readdirSync(config.audiopath);
  return data;
};

get_amlctl = function(){
  var ctlconf = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/amlctl.json"
  var raw_ctlconf = fs.readFileSync(ctlconf);
  return JSON.parse(raw_ctlconf);
};

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}


// view engine setup
app.set('views', path.join(path.dirname(__dirname), 'tpl'));
app.set('view engine', 'ejs');

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(path.dirname(__dirname), 'static')));

app.use('/', route_index);
app.use('/trigger', route_trigger);
app.use('/api/v1', route_api_v1);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  console.log(req.url);
  if (req.url.startsWith("/api/v1") ){
    res.json({
      success: false,
      status: err.status || 500,
      message: err.message
    });
  }
  else {
    res.render('error', {
      message: err.message,
      error: err
    });
  }
});



module.exports = app;
