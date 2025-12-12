// Canonical Express error handler: logs failures and responds with a consistent shape.
const logger = require('../lib/logger');

const formatErrorDetails = (errorList = []) => errorList.map((el) => el.message);

const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (res.headersSent) {
    return next(err);
  }

  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Server error';
  let code = err.code;
  let details;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    code = code || 'VALIDATION_ERROR';
    details = formatErrorDetails(Object.values(err.errors));
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Database validation error';
    code = code || 'DB_VALIDATION_ERROR';
    details = formatErrorDetails(err.errors);
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = code || 'INVALID_TOKEN';
  }

  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    message = 'Server error';
  }

  const response = {
    status: 'error',
    message,
  };

  if (code) {
    response.code = code;
  }

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
