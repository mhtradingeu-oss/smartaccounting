const logger = {
  info: (...args) => console.info('[info]', ...args),
  warn: (...args) => console.warn('[warn]', ...args),
  error: (...args) => console.error('[error]', ...args),
  debug: (...args) => console.debug('[debug]', ...args)
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    status = 400;
    message = err.errors?.map((error) => error.message).join('; ') || message;
  }

  logger.error('Request failed', { status, message, stack: err.stack });

  res.status(status).json({
    success: false,
    message
  });
};

module.exports = {
  logger,
  errorHandler
};
