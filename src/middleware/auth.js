
// Compatibility layer: expose helpers consumed by legacy routes
const {
  authenticate,
  authorize,
  requireAdmin,
  requireCompany: requireCompanyMiddleware,
} = require('./authMiddleware');

module.exports = {
  authenticateToken: authenticate,
  requireRole: authorize,
  requireAdmin,
  requireCompany: requireCompanyMiddleware,
  auth: authenticate,
};
