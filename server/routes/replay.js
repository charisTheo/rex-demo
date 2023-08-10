import express from 'express';
import {render} from '../controllers/puppeteer.js';
const router = new express.Router();

router.post('/', async function(req, res, next) {
  const {url, options} = req.body;
  const result = await render(url, options);

  res.send(result);
});

export default router;
