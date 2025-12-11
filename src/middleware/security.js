const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  })
];

module.exports = securityMiddleware;
const compression = require('compression');
const { body, validationResult } = require('express-validator');
const logger = require('../lib/logger');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 15 * 60 * 1000
    },
    skip: (req) => {
      
      return req.path === '/health' || req.path === '/api/health';
    },
    ...options
  };

  return rateLimit(defaultOptions);
};

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, 
  delayAfter: 50, 
  delayMs: 500 
});

const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many API requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, 
  max: 20, 
  message: 'Too many file uploads, please try again later'
});

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      fontSrc: ["'self'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], 
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  crossOriginEmbedderPolicy: false 
});

const sanitizeRequest = (req, res, next) => {
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }

  return sanitized;
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  return str
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

const validateRequest = (validations) => {
  return async (req, res, next) => {
    
    for (const validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) {
        break;
      }
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    next();
  };
};

const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      logger.warn(`Blocked request from unauthorized IP: ${clientIP}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied from your IP address'
      });
    }

    next();
  };
};

const csrfProtection = (req, res, next) => {
  
  if (req.method === 'GET' || req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed'
    });
  }

  next();
};

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function(data) {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };

    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.warn('Suspicious request:', logData);
    } else if (res.statusCode >= 500) {
      logger.error('Server error:', logData);
    } else {
      logger.info('Request:', logData);
    }

    return originalSend.call(this, data);
  };

  next();
};

const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
      return next();
    }

    const contentType = req.get('Content-Type');
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      return res.status(415).json({
        success: false,
        message: 'Unsupported content type'
      });
    }

    next();
  };
};

const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('Content-Length');
    if (contentLength && parseInt(contentLength) > parseSize(maxSize)) {
      return res.status(413).json({
        success: false,
        message: 'Request too large'
      });
    }
    next();
  };
};

const parseSize = (size) => {
  if (typeof size === 'number') return size;

  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/);

  if (!match) return 0;

  return parseFloat(match[1]) * units[match[2]];
};

const applySecurityMiddleware = (app) => {
  
  app.use(securityHeaders);

  app.use(mongoSanitize());

  app.use(xss());

  app.use(hpp({
    whitelist: ['sort', 'fields', 'page', 'limit', 'category', 'status']
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
  requestSizeLimiter
};