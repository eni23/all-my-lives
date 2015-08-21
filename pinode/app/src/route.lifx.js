var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

//lifx.setDebug(true);
//console.log(lx,artnet)

router.get('/', function(req, res, next) {
  res.sendFile(  path.dirname( path.dirname( require.main.filename ) ) + "/app/static/lifx.html" );
});

router.get('/list', function(req, res, next) {
  res.contentType("text/plain");
  res.send(JSON.stringify(lx.bulbs, null, 2));
});
router.get('/list/gw', function(req, res, next) {
  res.contentType("text/plain");
  res.send(JSON.stringify(lx.gateways, null, 2));
});

router.get('/on', function(req, res, next) {
  lx.lightsOn(lx.bulbs[req.query.bulb]);
  res.send('ok');
});

router.get('/off', function(req, res, next) {
  lx.lightsOff(lx.bulbs[req.query.bulb]);
  res.send('ok');
});

router.get('/set', function(req, res, next) {

	// scale and cast to int
	var hue = parseInt(req.query.h * (0xffff / 360))
	var sat = parseInt(req.query.s * 0xffff)
	var lum = parseInt(req.query.l * 0xffff)
	var white = parseInt(req.query.w * 0xffff)
  var time = parseInt(req.query.t * 0xffff)

  var lamp = req.query.lamp

  // all lamps in config
  if (!req.query.lamp){
    var conffile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/config.json"
    var confcontent = fs.readFileSync(conffile);
    var config=JSON.parse(confcontent);
    for (bulb of config.lifxbulbs){
      if (bulb.id){
        lx.lightsColour(hue, sat, lum, white, time, bulb.id);
      }
    }
  }
  // single lamp
  else {
    lx.lightsColour(hue, sat, lum, white, time, req.query.lamp );
  }
  res.send('ok');
});


module.exports = router;
