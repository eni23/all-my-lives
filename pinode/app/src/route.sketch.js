var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

var sketchfile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/sketch.json"


router.get('/', function(req, res, next) {
  res.send("sketch")
});


router.get('/enter/get', function(req, res, next) {
  var content = fs.readFileSync(sketchfile);
  console.log(content)
  var data=JSON.parse(content);

  res.json(data["enter"]);
});

router.get('/get-lifx', function(req, res, next) {
  var conffile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/lifx-bulbs.json"
  var content = fs.readFileSync(conffile);
  var data=JSON.parse(content);
  res.json(data);
});


module.exports = router;
