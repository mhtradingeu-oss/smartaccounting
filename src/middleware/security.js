const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const { validationResult } = require('express-validator');
const logger = require('../lib/logger');

const createRateLimiter = (options = {}) => {
  const defaults = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes',
    },
    skip: (req) => ['/health', '/api/health'].includes(req.path),
    ...options,
  };

  return rateLimit(defaults);
};

const authRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '5 minutes',
  },
});

const apiRateLimiter = createRateLimiter({
  max: 100,
  message: {
    error: 'Too many API requests, please try again later.',
    retryAfter: '15 minutes',
  },
});

const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour',
  },
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: 500,
});

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\'', 'ws:', 'wss:'],
      fontSrc: ['\'self\''],
      objectSrc: ['\'none\''],
      mediaSrc: ['\'self\''],
      frameSrc: ['\'none\''],
      baseUri: ['\'self\''],
      formAction: ['\'self\''],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  crossOriginEmbedderPolicy: false,
});

const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((value) => sanitizeObject(value));
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[key] = sanitizeObject(value);
    return acc;
  }, {});
};

const sanitizeString = (value) => {
  if (typeof value !== 'string') {return value;}

  return value
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

const sanitizeRequest = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

const validateContentType = (allowedTypes = ['application/json']) => (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const contentType = req.get('Content-Type');
  if (!contentType || !allowedTypes.some((type) => contentType.includes(type))) {
    return res.status(415).json({
      success: false,
      message: 'Unsupported content type',
    });
  }

  next();
};

const parseSize = (size) => {
  if (typeof size === 'number') {
    return size;
  }

  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = String(size).toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/);
  if (!match) {return 0;}
  return parseFloat(match[1]) * units[match[2]];
};

const requestSizeLimiter = (maxSize = '10mb') => (req, res, next) => {
  const contentLength = parseInt(req.get('Content-Length') || '0', 10);
  if (contentLength > parseSize(maxSize)) {
    return res.status(413).json({
      success: false,
      message: 'Request too large',
    });
  }
  next();
};

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send.bind(res);

  res.send = (body) => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    if (res.statusCode >= 500) {
      logger.error('Server error', logData);
    } else if (res.statusCode === 401 || res.statusCode === 403) {
      logger.warn('Unauthorized request', logData);
    } else {
      logger.info('Request', logData);
    }

    return originalSend(body);
  };

  next();
};

const validateRequest = (validations) => async (req, res, next) => {
  for (const validation of validations) {
    await validation.run(req);
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  next();
};

const ipWhitelist = (allowedIPs = []) => (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  if (allowedIPs.length && !allowedIPs.includes(clientIP)) {
    logger.warn('Blocked request from unauthorized IP', { ip: clientIP });
    return res.status(403).json({
      success: false,
      message: 'Access denied from your IP address',
    });
  }

  next();
};

const csrfProtection = (req, res, next) => {
  if (req.method === 'GET' || req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed',
    });
  }

  next();
};

const applySecurityMiddleware = (app) => {
  app.use(securityHeaders);
  app.use(mongoSanitize());
  app.use(xss());
  app.use(hpp({
    whitelist: ['sort', 'fields', 'page', 'limit', 'category', 'status'],
  }));
  app.use(requestLogger);
  app.use(compression());
  app.use(sanitizeRequest);
  app.use(validateContentType(['application/json', 'multipart/form-data']));
  app.use(requestSizeLimiter('10mb'));
  app.use('/api/auth/login', authRateLimiter);
  app.use('/api/auth/register', authRateLimiter);
  app.use('/api/auth/forgot-password', authRateLimiter);
  app.use('/api/invoices/upload', uploadRateLimiter);
  app.use('/api/ocr/extract', uploadRateLimiter);
  app.use('/api', speedLimiter);
  app.use('/api', apiRateLimiter);
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.removeHeader('X-Powered-By');
    next();
  });
  app.use((req, res, next) => {
    if (req.path.includes('/upload')) {
      req.setTimeout(300000);
    } else {
      req.setTimeout(30000);
    }
    next();
  });

  logger.info('Security middleware applied successfully');
};

module.exports = {
  applySecurityMiddleware,
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  securityHeaders,
  sanitizeRequest,
  validateRequest,
  ipWhitelist,
  csrfProtection,
  requestLogger,
  validateContentType,
  requestSizeLimiter,
};
