const requireCompany = (req, res, next) => {
  const companyId = req.companyId || req.user?.companyId;

  if (!companyId) {
    return res.status(403).json({
      success: false,
      message: 'Company context is required for this resource',
    });
  }

  req.companyId = companyId;
  next();
};

module.exports = requireCompany;
