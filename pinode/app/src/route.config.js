var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

router.get('/', function(req, res, next) {
  res.send("config")
});


router.get('/get', function(req, res, next) {
  var conffile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/config.json"
  var content = fs.readFileSync(conffile);
  var data=JSON.parse(content);
  res.json(data);
});

router.get('/get-lifx', function(req, res, next) {
  var conffile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/lifx-bulbs.json"
  var content = fs.readFileSync(conffile);
  var data=JSON.parse(content);
  res.json(data);
});

router.get('/files', function(req, res, next) {
  var data={};

  data.video = [
    "videofile01.avi",
    "videofile02.avi",
    "foooobar.avi"
  ]
  data.audio = [
    "never_gonna_give_you_up.mp3 (2:55:13)",
    "liebeskummer_lohnt_nicht.flac (3:23:89)",
    "friday.mp3 (4:33:11)"
  ]
  res.json(data);
});


module.exports = router;
