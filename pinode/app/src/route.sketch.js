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
  res.send("sketch")
});

router.get('/enter/get', function(req, res, next) {
  var sketch = get_sketch();
  res.json(sketch.enter);
});

router.get('/exit/get', function(req, res, next) {
  var sketch = get_sketch();
  res.json(sketch.exit);
});

router.get('/download', function(req, res, next) {
  var sketch = get_sketch();
  var json = JSON.stringify(sketch, null, 2);
  res.setHeader('Content-disposition', 'attachment; filename=sketch.json');
  res.setHeader('Content-type', 'text/json');
  res.send(sketch);
});

router.post('/update', function(req, res, next) {
  data = {
    enter: req.body.enter,
    exit: req.body.exit
  }
  var sketchfile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/sketch.json"
  var json = JSON.stringify(data, null, 2);
  fs.writeFileSync(sketchfile,json,'utf8');
  res.json({ success:true });
});

router.post('/test-single', function(req, res, next) {

  var item = req.body[0];
  item.blocking = false;
  var sketch =  [ item ];

  sketchrunner.config=get_config();

  sketchrunner.stop();
  sketchrunner.start(sketch);
  res.json({ success:true });

});

router.get('/test-enter', function(req, res, next) {

  sketchrunner.config=get_config();
  var sketch = get_sketch();

  sketchrunner.stop();
  sketchrunner.start(sketch.enter);
  res.json({ success:true });

});


router.get('/test-exit', function(req, res, next) {

  sketchrunner.config=get_config();
  var sketch = get_sketch();

  sketchrunner.stop();
  sketchrunner.start(sketch.exit);
  res.json({ success:true });

});

router.get('/stop', function(req, res, next) {
  sketchrunner.stop();
  res.json({ success:true });
})


module.exports = router;
