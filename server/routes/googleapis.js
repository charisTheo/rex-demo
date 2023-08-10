import express from 'express';
import {
  getAuthorizeUrl,
  attachCredentials,
  getReport,
} from '../controllers/googleapis.js';
const router = new express.Router();

router.get('/oauth2Url', function(req, res, next) {
  const url = getAuthorizeUrl();
  res.send({url});
});

router.get('/oauth2Callback', async (req, res) => {
  const {code} = req.query;
  const oauth2Client = await attachCredentials(code);
  const data = getReport(oauth2Client);
  console.log('👨‍💻 | router.get | data:', data);
  res.send('Authentication successfull');
  // TODO redirect to homepage
  // res.redirect('/');
});

export default router;
