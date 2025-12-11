
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../lib/logger');

const authenticate = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findByPk(decoded.id);

    if (!currentUser) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token - user not found' 
      });
    }

    if (!currentUser.isActive) {
      return res.status(401).json({ 
        success: false, 
        error: 'Account is deactivated' 
      });
    }

    req.user = currentUser;
    req.userId = currentUser.id;
    req.userRole = currentUser.role;
    req.companyId = currentUser.companyId;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

const requireAdmin = authorize('admin', 'superadmin');

module.exports = {
  authenticate,
  authorize,
  requireAdmin
};
