// Authentication/authorization middleware source of truth for protected routes.
const jwt = require('jsonwebtoken');
const { User, Company } = require('../models');
const requireCompany = require('./requireCompany');

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication credentials are missing',
      code: 'AUTH_MISSING',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Company, as: 'company' }],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid authentication token',
        code: 'AUTH_INVALID',
      });
    }

    req.user = user;
    req.userId = user.id;
    req.companyId = user.companyId;
    req.token = token;

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
      code: 'TOKEN_INVALID',
    });
  }
};

const requireRole = (allowedRoles = []) => (req, res, next) => {
  if (!allowedRoles.length) {
    return next();
  }

  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Insufficient permissions',
      code: 'INSUFFICIENT_ROLE',
    });
  }

  next();
};

// Legacy aliases used by some routes
const authorize = (roles) => requireRole(Array.isArray(roles) ? roles : roles ? [roles] : []);
const requireAdmin = requireRole(['admin']);

module.exports = {
  authenticate,
  requireRole,
  authorize,
  requireAdmin,
  requireCompany,
};
