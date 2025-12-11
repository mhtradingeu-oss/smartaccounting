const winston = require('winston');
const path = require('path');

const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const productionFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${service || 'APP'}] ${level}: ${message} ${metaStr}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'smartaccounting' },
  transports: []
});

if (process.env.NODE_ENV === 'production') {
  logger.format = productionFormat;

  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 10 * 1024 * 1024, 
    maxFiles: 5
  }));

  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 10 * 1024 * 1024, 
    maxFiles: 10
  }));

  logger.add(new winston.transports.Console({
    level: 'error',
    format: winston.format.simple()
  }));
} else {
  
  logger.format = developmentFormat;

  logger.add(new winston.transports.Console({
    level: 'debug'
  }));

  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'development.log'),
    level: 'debug'
  }));
}

logger.audit = (message, meta = {}) => {
  logger.info(message, { ...meta, type: 'AUDIT' });
};

logger.security = (message, meta = {}) => {
  logger.warn(message, { ...meta, type: 'SECURITY' });
};

logger.performance = (message, meta = {}) => {
  logger.info(message, { ...meta, type: 'PERFORMANCE' });
};

module.exports = logger;