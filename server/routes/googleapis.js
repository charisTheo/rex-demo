import express from 'express';
import jwt from 'jsonwebtoken';

import {
  getAuthorizeUrl,
  getAccounts,
  getReport,
  getAccessTokenFromCode,
} from '../controllers/googleapis.js';
import auth from '../middleware/auth.js';
const router = new express.Router();

router.get('/oauth2Url', (req, res) => {
  const url = getAuthorizeUrl();
  res.send({url});
});

router.get('/oauth2Callback', async (req, res) => {
  const {code} = req.query;
  try {
    const token = jwt.sign(
        {accessToken: await getAccessTokenFromCode(code)},
        process.env.JWT_SECRET,
    );
    if (!code || !token) {
      throw new Error();
    }
    res
        .cookie('token', token, {httpOnly: true})
        .redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : '' }/?auth=1`);
  } catch (err) {
    res
        .redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : '' }/?auth=0&error=true`);
  }
});

router.get('/analytics/accounts', auth, async (req, res) => {
  const {accessToken} = req.data;
  try {
    const accounts = await getAccounts(accessToken);
    res.send({accounts});
  } catch (err) {
    console.log('👨‍💻 | /analytics/accounts | err:', err);
    res
        .status(err.toString().indexOf('Invalid Credentials') >= 0 ? 401 : 500)
        .send('There was an error.');
  }
});

router.get('/analytics/report', auth, async (req, res) => {
  const {accessToken} = req.data;
  const {propertyName} = req.query;
  if (!propertyName) {
    return res.status(400).send('`propertyName` is required');
  }

  try {
    const report = await getReport(accessToken, propertyName);
    res.send({report});
  } catch (err) {
    console.log('👨‍💻 | /analytics/report | err:', err);
    res
        .status(err.toString().indexOf('Invalid Credentials') >= 0 ? 401 : 500)
        .send('There was an error.');
  }
});

export default router;
