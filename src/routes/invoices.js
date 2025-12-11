const logger = require('../lib/logger');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Invoice, Company } = require('../models');
const { authenticateToken, requireRole, requireCompany } = require('../middleware/auth');
const ocrService = require('../services/ocrService');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  }
});

router.get('/', authenticateToken, requireCompany, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { companyId: req.user.companyId };
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const invoices = await Invoice.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      invoices: invoices.rows,
      total: invoices.count,
      pages: Math.ceil(invoices.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/upload', authenticateToken, requireCompany, upload.single('invoice'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let ocrData = {};
    try {
      ocrData = await ocrService.processInvoice(req.file.path);
    } catch (ocrError) {
      }

    const invoice = await Invoice.create({
      companyId: req.user.companyId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: 'pending',
      type: 'incoming',

      invoiceNumber: ocrData.invoiceNumber || null,
      invoiceDate: ocrData.invoiceDate || null,
      supplierName: ocrData.supplierName || null,
      supplierVatNumber: ocrData.supplierVatNumber || null,
      netAmount: ocrData.netAmount || null,
      vatAmount: ocrData.vatAmount || null,
      grossAmount: ocrData.grossAmount || null,
      vatRate: ocrData.vatRate || null,
      currency: ocrData.currency || 'EUR',

      ocrData: ocrData,
      uploadedBy: req.user.userId
    });

    res.status(201).json({
      message: 'Invoice uploaded and processed successfully',
      invoice
    });
  } catch (error) {
    
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        }
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:invoiceId', authenticateToken, requireCompany, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: {
        id: req.params.invoiceId,
        companyId: req.user.companyId
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:invoiceId', authenticateToken, requireRole(['admin', 'accountant']), requireCompany, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: {
        id: req.params.invoiceId,
        companyId: req.user.companyId
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const updateData = req.body;
    delete updateData.companyId; 
    delete updateData.filePath; 

    await invoice.update(updateData);

    res.json({
      message: 'Invoice updated successfully',
      invoice
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:invoiceId', authenticateToken, requireRole(['admin']), requireCompany, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: {
        id: req.params.invoiceId,
        companyId: req.user.companyId
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.filePath && fs.existsSync(invoice.filePath)) {
      try {
        fs.unlinkSync(invoice.filePath);
      } catch (fileError) {
        }
    }

    await invoice.destroy();

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;