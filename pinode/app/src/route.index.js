var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

router.get('/', function(req, res, next) {
  res.sendFile( path.dirname( path.dirname( require.main.filename ) ) + "/app/static/sketchctl.html" );
});

router.get('/amlctl', function(req, res, next) {
  res.sendFile( path.dirname( path.dirname( require.main.filename ) ) + "/app/static/amlctl.html" );
});

module.exports = router;
