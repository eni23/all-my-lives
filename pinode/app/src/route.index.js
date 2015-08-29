var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');


var serve_static = function(file, res){
  res.sendFile( path.dirname( path.dirname( require.main.filename ) ) + "/app/static/" + file );
}

router.get('/', function(req, res, next) {
  serve_static("sketchctl.html",res);
});

router.get('/sketchctl', function(req, res, next) {
  serve_static("sketchctl.html",res);
});

router.get('/amlctl', function(req, res, next) {
  serve_static("amlctl.html",res);
});

router.get('/lifxctl', function(req, res, next) {
  serve_static("lifxctl.html",res);
});


module.exports = router;
