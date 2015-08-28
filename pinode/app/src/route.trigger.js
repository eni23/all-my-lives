var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');


function get_sketch(){
  var sketchfile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/sketch.json"
  var raw_sketch = fs.readFileSync(sketchfile);
  return JSON.parse(raw_sketch);
}

function get_config(){
  var conffile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/config.json"
  var raw_config = fs.readFileSync(conffile);
  return JSON.parse(raw_config);
}

router.get('/', function(req, res, next) {
  res.send('trigger');
});


router.get('/:pir', function(req, res, next) {
  if (!enabled){
    res.send("not enabled");
    return;
  }

  if (parseInt(req.params.pir) == 1 ){
    if ( sketchrunner.is_running == true){
      res.send("sketch allready running");
    } else {
      var sketch = get_sketch();
      sketchrunner.config = get_config();
      sketchrunner.start( sketch.enter );
      res.send("ok");
    }
  } else {
    res.send("not triggered, pir is 0");
  }
});


router.get('/:reed/:pir', function(req, res, next) {
  if (!enabled){
    res.send("not enabled");
    return;
  }
  if (parseInt(req.params.pir) == 1 ){
    if ( sketchrunner.is_running == true){
      res.send("sketch allready running");
    }
    else if ( parseInt(req.params.reed) == 1 ){
      res.send("door is open")
    }
    else {
      var sketch = get_sketch();
      sketchrunner.config = get_config();
      sketchrunner.start( sketch.enter );
      res.send("ok");
    }
  } else {
    res.send("not triggered, pir is 0");
  }
});

router.get('/api/v1/enter', function(req, res, next) {
  if ( sketchrunner.is_running == false ){
    var sketch = get_sketch();
    sketchrunner.config = get_config();
    sketchrunner.start( sketch.enter );
    res.send('ok');
  }
  else {
    res.send('sketch is allready running');
  }
});

router.get('/api/v1/exit', function(req, res, next) {
  if ( sketchrunner.is_running == false ){
    var sketch = get_sketch();
    sketchrunner.config = get_config();
    sketchrunner.start( sketch.exit );
    res.send('ok');
  }
  else {
    res.send('sketch is allready running');
  }
});

router.get('/api/v1/stop', function(req, res, next) {
  sketchrunner.stop();
  res.send('ok');
});

module.exports = router;
