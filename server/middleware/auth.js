import jwt from 'jsonwebtoken';

/**
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Function} next
 */
export default function auth(req, res, next) {
  try {
    const data = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    if (!data) {
      throw new Error();
    }
    // refresh token
    const token = jwt.sign({code: data.code}, process.env.JWT_SECRET);
    // add decoded token data to request object
    req.data = data;
    res.cookie('token', token, {httpOnly: true});
    next();
  } catch (err) {
    res.status(401).send('Unauthorised');
  }
}
