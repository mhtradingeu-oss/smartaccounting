const logger = require('../lib/logger');
const express = require('express');
const { Company, User } = require('../models');
const { authenticateToken, requireRole, requireCompany } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireCompany, async (req, res) => {
  try {
    const company = await Company.findByPk(req.user.companyId, {
      include: [{
        model: User,
        as: 'users',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'status']
      }]
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      name,
      legalName,
      vatNumber,
      address,
      industry,
      fiscalYearEnd,
      accountingMethod,
      settings
    } = req.body;

    const company = await Company.findByPk(req.user.companyId);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await company.update({
      name,
      legalName,
      vatNumber,
      address,
      industry,
      fiscalYearEnd,
      accountingMethod,
      settings
    });

    res.json({
      message: 'Company updated successfully',
      company
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;