const jwt = require('jsonwebtoken');

const env = require('../config/env');

const ACCESS_TOKEN_TYPE = 'at';

function signAccessToken(userId) {
  return jwt.sign({ sub: userId, typ: ACCESS_TOKEN_TYPE }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, env.jwt.secret);
    if (payload.sub === undefined || payload.typ !== ACCESS_TOKEN_TYPE) {
      throw new Error('invalid payload');
    }
    return payload;
  } catch {
    return null;
  }
}

module.exports = { signAccessToken, verifyAccessToken };