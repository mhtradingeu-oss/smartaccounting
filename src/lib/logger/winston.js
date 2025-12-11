const path = require('path');
const fs = require('fs');
const winston = require('winston');

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const environment = process.env.NODE_ENV || 'development';
const defaultLevel = process.env.LOG_LEVEL || (environment === 'production' ? 'info' : 'debug');

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    const metaString = metadata && Object.keys(metadata).length
      ? ` ${JSON.stringify(metadata, null, 2)}`
      : '';
    return `${timestamp} [${level}]: ${message}${metaString}`;
  }),
);

const transports = [
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 10 * 1024 * 1024,
    maxFiles: 5,
    tailable: true,
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 10 * 1024 * 1024,
    maxFiles: 10,
    tailable: true,
  }),
];

if (environment === 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
      level: 'info',
    }),
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: defaultLevel,
    }),
  );
}

const logger = winston.createLogger({
  level: defaultLevel,
  format: baseFormat,
  defaultMeta: {
    service: 'smartaccounting',
    environment,
    version: process.env.npm_package_version || '1.0.0',
  },
  transports,
  exitOnError: false,
});

logger.security = (message, meta = {}) => {
  logger.warn(message, { ...meta, channel: 'security' });
};

logger.performance = (message, meta = {}) => {
  logger.info(message, { ...meta, channel: 'performance' });
};

logger.audit = (message, meta = {}) => {
  logger.info(message, { ...meta, channel: 'audit' });
};

logger.business = (event, meta = {}) => {
  logger.info(`Business Event: ${event}`, { ...meta, channel: 'business' });
};

module.exports = logger;
