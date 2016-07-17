var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index/index', { title: 'Aggregator API' });
});

router.get('/welcome', function(req, res, next) {
  res.render('index/index', { title: 'welcome page' });
});

module.exports = router;
