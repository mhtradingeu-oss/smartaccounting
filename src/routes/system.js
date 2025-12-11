const express = require('express');
const { Company, User, Invoice, TaxReport, sequelize } = require('../models');
const { authenticate: authenticateToken, authorize: requireRole } = require('../middleware/authMiddleware');
const logger = require('../lib/logger');

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'SmartAccounting System',
    });
  } catch (error) {
    res.status(500).json({ error: 'System health check failed' });
  }
});

router.get('/info', authenticateToken, requireRole(['admin']), (req, res) => {
  res.json({
    status: 'SmartAccounting System',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      multiTenant: true,
      germanTaxCompliance: true,
      ocrProcessing: true,
      taxAccountingEngine: true,
      skr03Classification: true,
      elsterExport: true,
      gobdCompliant: true,
      stripeIntegration: !!process.env.STRIPE_SECRET_KEY,
    },
    timestamp: new Date().toISOString(),
  });
});

router.get('/health-detailed', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    let databaseStatus = 'unknown';

    try {
      await sequelize.authenticate();
      databaseStatus = 'connected';
    } catch (error) {
      databaseStatus = 'disconnected';
    }

    res.json({
      status: 'healthy',
      database: databaseStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [
      totalUsers,
      totalCompanies,
      totalInvoices,
      totalTaxReports,
    ] = await Promise.all([
      User.count(),
      Company.count(),
      Invoice.count(),
      TaxReport.count(),
    ]);

    const stats = {
      users: totalUsers,
      companies: totalCompanies,
      invoices: totalInvoices,
      taxReports: totalTaxReports,
      systemHealth: 'operational',
    };

    res.json(stats);
  } catch (error) {
    logger.error('System stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/db-test', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'connected',
      database: sequelize.config.database,
      host: sequelize.config.host,
    });
  } catch (error) {
    logger.error('Database test error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

module.exports = router;