const ApiError = require('./ApiError');

const notFound = (message = 'Resource not found') => new ApiError(404, message);
const badRequest = (message = 'Invalid request', details) => new ApiError(400, message, details);
const unauthorized = (message = 'Authentication required') => new ApiError(401, message);
const forbidden = (message = 'You do not have permission to perform this action') => new ApiError(403, message);
const conflict = (message = 'Resource already exists') => new ApiError(409, message);
const internal = (message = 'Something went wrong') => new ApiError(500, message);

module.exports = {
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  conflict,
  internal,
};