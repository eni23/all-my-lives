var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

enabled = true;

router.get('/', function(req, res, next) {
  res.send("config")
});

router.get('/enable', function(req, res, next) {
  enabled=true;
  res.send("ok");
});
router.get('/disable', function(req, res, next) {
  enabled=false;
  res.send("ok");
});
router.get('/status', function(req, res, next) {
  res.json({
    enabled: enabled,
    running: sketchrunner.is_running
  });
});


router.get('/get', function(req, res, next) {
  var conffile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/config.json"
  var content = fs.readFileSync(conffile);
  var data=JSON.parse(content);
  res.json(data);
});

router.get('/files', function(req, res, next) {
  var data={};
  var conffile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/config.json"
  var content = fs.readFileSync(conffile);
  var config=JSON.parse(content);


  data.video = fs.readdirSync(config.videopath)
  data.audio = fs.readdirSync(config.audiopath)

  res.json(data);
});


module.exports = router;
