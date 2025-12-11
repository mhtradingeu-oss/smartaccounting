const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    if (stack) {
      log += `\n${stack}`;
    }

    if (Object.keys(meta).length > 0) {
      log += `\nMetadata: ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'smartaccounting',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 10485760, 
      maxFiles: 5,
      tailable: true
    }),

    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, 
      maxFiles: 10,
      tailable: true
    }),

    new winston.transports.File({ 
      filename: path.join(logDir, 'audit.log'),
      level: 'warn',
      maxsize: 5242880, 
      maxFiles: 3
    }),

    new winston.transports.File({ 
      filename: path.join(logDir, 'performance.log'),
      level: 'info',
      maxsize: 5242880, 
      maxFiles: 3
    })
  ],

  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'rejections.log') })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: customFormat,
    level: 'debug'
  }));
} else {
  
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
    level: 'warn'
  }));
}

logger.security = (message, meta = {}) => {
  logger.warn(message, { ...meta, type: 'security' });
};

logger.performance = (message, duration, meta = {}) => {
  logger.info(message, { ...meta, type: 'performance', duration });
};

logger.audit = (action, user, resource, meta = {}) => {
  logger.warn('Audit Log', { 
    ...meta, 
    type: 'audit', 
    action, 
    user, 
    resource,
    timestamp: new Date().toISOString()
  });
};

logger.business = (event, data = {}) => {
  logger.info(`Business Event: ${event}`, { ...data, type: 'business' });
};

module.exports = logger;