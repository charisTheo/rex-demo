import express from 'express';
import {render} from '../controllers/puppeteer.js';
import auth from '../middleware/auth.js';
const router = new express.Router();

router.post('/', auth, async (req, res) => {
  const {url, options} = req.body;
  const result = await render(url, options);

  res.send(result);
});

export default router;
