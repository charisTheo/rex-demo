import express from 'express';
import jwt from 'jsonwebtoken';

import {
  getAuthorizeUrl,
  getProperties,
  getReport,
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
    const token = jwt.sign({code}, process.env.JWT_SECRET);
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

router.get('/analytics/properties', auth, async (req, res) => {
  const {code} = req.data;
  const properties = await getProperties(code);
  res.send({properties});
});

router.get('/analytics/report', auth, async (req, res) => {
  const {code} = req.data;
  const {propertyId} = req.params;
  if (!propertyId) {
    return res.status(400).send('Property ID is required');
  }

  const properties = getReport(code, propertyId);
  res.send({properties});
});

export default router;
