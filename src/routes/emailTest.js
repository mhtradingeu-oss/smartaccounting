const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const EmailValidation = require('../utils/emailValidation');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/test-config', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const validation = EmailValidation.validateEnvironment();

    res.json({
      isConfigured: emailService.isConfigured,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        configuration: {
          ...validation.configuration,
          user: EmailValidation.sanitizeEmailForLog(validation.configuration.user)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/test-connection', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await emailService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/send-test', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { to } = req.body;
    const testEmail = to || req.user.email;

    if (!EmailValidation.validateEmailFormat(testEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const result = await emailService.sendTestEmail(testEmail);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/test-template/:type', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { type } = req.params;
    const { to } = req.body;
    const testEmail = to || req.user.email;

    if (!EmailValidation.validateEmailFormat(testEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    let result;
    const companyName = req.user.company || 'Test Company GmbH';

    switch (type) {
      case 'tax-deadline':
        result = await emailService.sendTaxDeadlineAlert(
          testEmail,
          companyName,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
          'Test Umsatzsteuer-Voranmeldung'
        );
        break;

      case 'invoice':
        result = await emailService.sendNewInvoiceAlert(
          testEmail,
          companyName,
          'TEST-INV-2024-001',
          '1,234.56'
        );
        break;

      case 'subscription':
        result = await emailService.sendSubscriptionExpiryAlert(
          testEmail,
          companyName,
          'Professional',
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
          7
        );
        break;

      default:
        return res.status(400).json({ error: 'Invalid template type' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

```text
The code applies updates to the email service integration, specifically focusing on using the singleton instance of the email service in the test routes.
</text>

```javascript
const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const EmailValidation = require('../utils/emailValidation');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/test-config', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const validation = EmailValidation.validateEnvironment();

    res.json({
      isConfigured: emailService.isConfigured,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        configuration: {
          ...validation.configuration,
          user: EmailValidation.sanitizeEmailForLog(validation.configuration.user)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/test-connection', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await emailService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/send-test', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { to } = req.body;
    const testEmail = to || req.user.email;

    if (!EmailValidation.validateEmailFormat(testEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const result = await emailService.sendTestEmail(testEmail);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/test-template/:type', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { type } = req.params;
    const { to } = req.body;
    const testEmail = to || req.user.email;

    if (!EmailValidation.validateEmailFormat(testEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    let result;
    const companyName = req.user.company || 'Test Company GmbH';

    switch (type) {
      case 'tax-deadline':
        result = await emailService.sendTaxDeadlineAlert(
          testEmail,
          companyName,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
          'Test Umsatzsteuer-Voranmeldung'
        );
        break;

      case 'invoice':
        result = await emailService.sendNewInvoiceAlert(
          testEmail,
          companyName,
          'TEST-INV-2024-001',
          '1,234.56'
        );
        break;

      case 'subscription':
        result = await emailService.sendSubscriptionExpiryAlert(
          testEmail,
          companyName,
          'Professional',
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
          7
        );
        break;

      default:
        return res.status(400).json({ error: 'Invalid template type' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;