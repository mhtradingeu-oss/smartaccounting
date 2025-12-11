const express = require('express');
const { authenticate, requireRole, requireCompany } = require('../middleware/authMiddleware');
const invoiceService = require('../services/invoiceService');

const router = express.Router();

router.use(authenticate);
router.use(requireCompany);

router.get('/', requireRole(['admin', 'accountant', 'auditor', 'viewer']), async (req, res, next) => {
  try {
    const invoices = await invoiceService.listInvoices(req.companyId);
    res.status(200).json({ success: true, invoices });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole(['admin', 'accountant']), async (req, res, next) => {
  try {
    const invoice = await invoiceService.createInvoice(req.body, req.userId, req.companyId);
    res.status(201).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
});

router.put('/:invoiceId', requireRole(['admin', 'accountant']), async (req, res, next) => {
  try {
    const invoice = await invoiceService.updateInvoice(req.params.invoiceId, req.body, req.companyId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.status(200).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
