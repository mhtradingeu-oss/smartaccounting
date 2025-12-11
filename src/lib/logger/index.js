const logger = require('./winston');

const requestLogger = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationMs = (seconds * 1000) + (nanoseconds / 1e6);
    logger.info('HTTP request', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: `${durationMs.toFixed(2)}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  });

  next();
};

const stream = {
  write: (message) => {
    if (typeof message === 'string') {
      logger.info(message.trim());
    }
  },
};

const createChildLogger = (meta = {}) => logger.child(meta);

Object.assign(logger, { requestLogger, stream, createChildLogger });

module.exports = logger;
