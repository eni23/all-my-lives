var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

var options = {
    host: '10.10.1.5'
}

var artnet = require('artnet')(options);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('dmx');
});



router.get('/set', function(req, res, next) {
  artnet.set(0, parseInt( req.query.channel), parseInt(req.query.value));
  res.send('ok');
});


module.exports = router;
