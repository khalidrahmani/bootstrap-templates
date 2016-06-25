var  express  = require('express')
    ,router   = express.Router()

router.get('/', function(req, res, next) {
  res.send({status: 200})
})

module.exports = router;