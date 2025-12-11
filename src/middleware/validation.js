const { body, param, query, validationResult } = require('express-validator');
const DOMPurify = require('isomorphic-dompurify');
const rateLimit = require('express-rate-limit');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

const authRateLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many login attempts');
const apiRateLimit = createRateLimit(15 * 60 * 1000, 100, 'Too many API requests');

const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj);
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);

  next();
};

const userValidation = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).withMessage('Password must contain at least 8 characters, including uppercase, lowercase, number and special character'),
    body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
    body('role').optional().isIn(['admin', 'accountant', 'auditor', 'viewer']).withMessage('Invalid role')
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ]
};

const invoiceValidation = {
  create: [
    body('number').trim().isLength({ min: 1, max: 50 }).withMessage('Invoice number required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
    body('dueDate').isISO8601().withMessage('Valid due date required'),
    body('companyId').isUUID().withMessage('Valid company ID required')
  ]
};

const companyValidation = {
  create: [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Company name must be 2-100 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
    body('taxId').optional().isLength({ min: 5, max: 20 }).withMessage('Valid tax ID required')
  ]
};

module.exports = {
  handleValidationErrors,
  sanitizeInput,
  userValidation,
  invoiceValidation,
  companyValidation,
  authRateLimit,
  apiRateLimit
};