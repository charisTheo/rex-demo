import express from 'express';
const router = new express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile('/server/public/index.html', {title: 'Express', root: '.'});
});

export default router;
