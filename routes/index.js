import express from 'express';
const router = new express.Router();

router.get('/', function(req, res, next) {
  res.send('Rex API Server 🐕');
});

export default router;
