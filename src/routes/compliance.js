const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { disabledFeatureHandler } = require('../utils/disabledFeatureResponse');

router.use(disabledFeatureHandler('Compliance overview'));

router.get('/test', (req, res) => {
  res.json({
    message: 'Compliance route is working',
    timestamp: new Date().toISOString(),
  });
});

router.get('/overview', authenticate, async (req, res) => {
  try {
    
    const complianceData = {
      ustVoranmeldung: {
        status: 'pending',
        nextDue: '2024-02-10',
        amount: 1250.00,
      },
      jahresabschluss: {
        status: 'draft',
        year: 2023,
        dueDate: '2024-07-31',
      },
      goBD: {
        compliant: true,
        lastCheck: '2024-01-15',
      },
      elster: {
        connected: true,
        certificate: 'valid',
      },
    };

    res.json({
      success: true,
      data: complianceData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compliance overview',
    });
  }
});

router.get('/reports/:companyId/:type', authenticate, async (req, res) => {
  try {
    const { companyId, type } = req.params;

    const report = {
      companyId,
      type,
      status: 'completed',
      generatedAt: new Date().toISOString(),
      data: {
        period: '2024-01',
        summary: 'Compliance report generated successfully',
      },
    };

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate compliance report',
    });
  }
});

router.get('/deadlines', authenticate, async (req, res) => {
  try {
    const deadlines = [
      {
        type: 'VAT Return',
        dueDate: '2024-02-10',
        status: 'pending',
      },
      {
        type: 'Annual Report',
        dueDate: '2024-07-31',
        status: 'draft',
      },
    ];

    res.json({
      success: true,
      data: deadlines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compliance deadlines',
    });
  }
});

module.exports = router;
