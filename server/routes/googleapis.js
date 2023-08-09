var express = require('express');
const { getAuthorizeUrl, attachCredentials } = require('../controllers/googleapis');
var router = express.Router();

router.get('/oauth2Url', function(req, res, next) {
  const url = getAuthorizeUrl();
  res.send({ url });
});

router.get('/oauth2Callback/:code', async (req, res) => {
  const { code } = req.params;
  await attachCredentials(code)
  res.send('Authentication successfull');
  // TODO redirect to homepage
  // res.redirect('/');
})

module.exports = router;
