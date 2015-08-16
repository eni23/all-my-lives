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

artnet = require('artnet')(options);
lifx = require('lifx');
lx   = lifx.init();
sketchrunner = require('./sketchrunner');



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
