const { ZodError } = require('zod');
const { Prisma } = require('@prisma/client');

const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const KNOWN_CODES = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
};

const envIsTest = process.env.NODE_ENV === 'test';

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;
  let code = KNOWN_CODES[statusCode] || 'INTERNAL_ERROR';

  if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      code = 'CONFLICT';
      message = 'A record with this value already exists';
      const target = (err.meta && err.meta.target) || [];
      details = [{ field: Array.isArray(target) ? target.join(',') : target, message: 'Must be unique' }];
    } else if (err.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'Resource not found';
    }
  } else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err?.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Malformed JSON body';
  }

  if (statusCode >= 500) {
    logger.error({ err }, 'Unhandled error');
  } else if (!envIsTest) {
    if (statusCode === 401 || statusCode === 404) {
      logger.debug({ status: statusCode, code, message }, 'Request error');
    } else {
      logger.warn({ err }, 'Request error');
    }
  }

  return res.status(statusCode).json({
    success: false,
    message,
    error: { code, ...(details ? { details } : {}) },
  });
}

module.exports = errorHandler;