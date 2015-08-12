var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var htmlfile = path.dirname( path.dirname( require.main.filename ) ) + "/app/static/index.html"
  var content = fs.readFileSync(conffile);

  res.send(content);
});

module.exports = router;
