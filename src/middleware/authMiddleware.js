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
      success: false,
      message: 'Authentication credentials are missing',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Company, as: 'company' }],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
      });
    }

    req.user = user;
    req.userId = user.id;
    req.companyId = user.companyId;
    req.token = token;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

const requireRole = (allowedRoles = []) => (req, res, next) => {
  if (!allowedRoles.length) {
    return next();
  }

  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions',
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireRole,
  requireCompany,
};
