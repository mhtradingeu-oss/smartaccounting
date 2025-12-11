const logger = require('../lib/logger');

const formatErrorDetails = (errorList = []) => errorList.map((el) => el.message);

const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: formatErrorDetails(Object.values(err.errors))
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Database Validation Error',
      details: formatErrorDetails(err.errors)
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Server Error'
      : err.message
  });
};

module.exports = errorHandler;
