import express from 'express';
import {replayExperience} from '../controllers/puppeteer.js';
import auth from '../middleware/auth.js';
const router = new express.Router();

router.post('/', auth, async (req, res) => {
  const {url, emulateCPUThrottling, slow3G, viewportConfig} = req.body;
  const result = await replayExperience(url, emulateCPUThrottling, slow3G, viewportConfig);
  res.send(result);
});

export default router;
