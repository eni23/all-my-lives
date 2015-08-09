var express = require('express');
var router = express.Router();
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

  console.log(hue,sat,lum,white,time);

  lx.lightsColour(hue, sat, lum, white, time);
  res.send('ok');
});


module.exports = router;
