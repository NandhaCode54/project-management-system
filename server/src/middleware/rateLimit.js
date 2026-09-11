const rateLimit = require('express-rate-limit');

const ApiError = require('../utils/ApiError');
const env = require('../config/env');

function createLimiter(options) {
  return rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(new ApiError(429, 'Too many requests, please try again later'));
    },
    ...options,
  });
}

const apiLimiter = createLimiter();

const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: env.isTest ? 1000 : 20,
  message: 'Too many authentication attempts, please try again later',
});

module.exports = { apiLimiter, authLimiter };