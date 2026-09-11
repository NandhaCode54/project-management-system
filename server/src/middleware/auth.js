const db = require('../config/db');
const env = require('../config/env');
const { verifyAccessToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');
const { unauthorized } = require('../utils/httpErrors');

function extractToken(req) {
  if (req.cookies && req.cookies[env.jwt.cookieName]) {
    return req.cookies[env.jwt.cookieName];
  }

  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }

  return null;
}

const authMiddleware = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw unauthorized('Authentication required');
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    throw unauthorized('Invalid or expired token');
  }

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, fullName: true, email: true },
  });

  if (!user) {
    throw unauthorized('Invalid or expired token');
  }

  req.user = user;
  next();
});

module.exports = { authMiddleware, extractToken };