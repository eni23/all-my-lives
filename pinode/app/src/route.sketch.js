var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser')

var conffile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/config.json"
var sketchfile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/sketch.json"
var jsonParser = bodyParser.json()

router.get('/', function(req, res, next) {
  res.send("sketch")
});

router.get('/enter/get', function(req, res, next) {
  var content = fs.readFileSync(sketchfile);
  var data=JSON.parse(content);
  res.json(data.enter);
});

router.get('/exit/get', function(req, res, next) {
  var content = fs.readFileSync(sketchfile);
  var data=JSON.parse(content);
  res.json(data.exit);
});

router.get('/download', function(req, res, next) {
  var content = fs.readFileSync(sketchfile);
  res.setHeader('Content-disposition', 'attachment; filename=sketch.json');
  res.setHeader('Content-type', 'text/json');
  res.send(content);
});

router.post('/update', function(req, res, next) {
  data = {
    enter: req.body.enter,
    exit: req.body.exit
  }
  var json = JSON.stringify(data, null, 2);
  fs.writeFileSync(sketchfile,json,'utf8');
  res.json({ success:true });
});

router.post('/test-single', function(req, res, next) {

  var item = req.body[0];
  item.blocking = false;
  //console.log(item);

  var sketch =  [ item ];

  var conffile = path.dirname( path.dirname( require.main.filename ) ) + "/app/data/config.json"
  var content = fs.readFileSync(conffile);
  sketchrunner.config=JSON.parse(content);

  sketchrunner.stop();
  sketchrunner.start(sketch);
  res.json({ success:true });

});

router.get('/test-enter', function(req, res, next) {

  var content = fs.readFileSync(conffile);
  sketchrunner.config=JSON.parse(content);
  var scontent = fs.readFileSync(sketchfile);
  var sketch=JSON.parse(scontent);


  sketchrunner.stop();
  sketchrunner.start(sketch.enter);
  res.json({ success:true });

});


router.get('/test-exit', function(req, res, next) {

  var content = fs.readFileSync(conffile);
  sketchrunner.config=JSON.parse(content);
  var scontent = fs.readFileSync(sketchfile);
  var sketch=JSON.parse(scontent);


  sketchrunner.stop();
  sketchrunner.start(sketch.exit);
  res.json({ success:true });

});

router.get('/stop', function(req, res, next) {
  sketchrunner.stop();
  res.json({ success:true });
})


module.exports = router;
