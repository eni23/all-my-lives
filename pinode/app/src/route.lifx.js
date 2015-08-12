var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');


lifx = require('lifx');
lx   = lifx.init();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('lifx');
});

router.get('/list', function(req, res, next) {
  res.send(lx.bulbs);

});

router.get('/on', function(req, res, next) {
  lx.lightsOn();
  res.send('ok');
});

router.get('/off', function(req, res, next) {
  lx.lightsOff();
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

  console.log(lx.bulbs)

  if (!lamp){
    var conffile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/config.json"
    var confcontent = fs.readFileSync(conffile);
    var config=JSON.parse(confcontent);
    for (bulb of config.lifxbulbs){
      if (bulb.id){
        for (lb of lx.bulbs){
          console.log(lb);
        }
        //lx.lightsColour(hue, sat, lum, white, time, lx.bulbs[bulb.id]);
      }
    }
  }
  else {
    lx.lightsColour(hue, sat, lum, white, time, lx.bulbs[req.query.lamp]);
  }
  res.send('ok');
});


module.exports = router;
