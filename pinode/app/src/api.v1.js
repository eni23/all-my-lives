var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

var resp_tpl = {
};

var build_answer = function(data, status, success){
  var ret = {};
  ret.status = status;
  ret.success = success;
  for (ridx in resp_tpl){
    ret[ridx] = resp_tpl[idx];
  }
  for (idx in data){
    ret[idx] = data[idx];
  }
  return ret;
};


router.get('/', function(req, res, next) {
  res.json(build_answer({},true,true));
});

router.get('/config', function(req, res, next) {
  res.json(build_answer(get_config(),true,true));
});

router.get('/sketch', function(req, res, next) {
  res.json(build_answer(get_sketch(),true,true));
});

router.get('/sketch/download', function(req, res, next) {
  res.setHeader('Content-disposition', 'attachment; filename=sketch.json');
  res.setHeader('Content-type', 'text/json');
  res.send(JSON.stringify(get_sketch(),0,2));
});

router.get('/status', function(req, res, next) {
  res.json( build_answer({
    enabled: enabled,
    running: sketchrunner.is_running
  },true,true) );
});

router.get('/lifx-bulbs', function(req, res, next) {
  res.json(build_answer(lx.bulbs,true,true));
});

router.get('/lifx-gw', function(req, res, next) {
  res.json(build_answer(lx.gateways,true,true));
});

router.get('/amlctl-nodes', function(req, res, next) {
  res.json(build_answer(get_amlctl(),true,true));
});


module.exports = router;
