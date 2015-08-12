var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser')

var datadir = path.dirname( path.dirname( require.main.filename ) ) + "/data/"

router.get('/', function(req, res, next) {
  res.send("files")
});

router.get('/list', function(req, res, next) {
  var files = fs.readdirSync(datadir)
  res.json(files);
});

router.get('/del', function(req, res, next) {
  var content = fs.readFileSync(sketchfile);
  var data=JSON.parse(content);
  res.json(data.exit);
});

router.post('/upload', function(req, res, next) {
  res.send("okay")
});

module.exports = router;
