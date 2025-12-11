const logger = require('../lib/logger');

const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { auth } = require('../middleware/auth');
const bankStatementService = require('../services/bankStatementService');
const BankStatement = require('../models/BankStatement');
const BankTransaction = require('../models/BankTransaction');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/bank-statements/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.csv', '.txt', '.xml'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Allowed: CSV, TXT, XML'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 
  }
});

router.post('/import', auth, upload.single('bankStatement'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { format } = req.body;
    if (!format || !['CSV', 'MT940', 'CAMT053'].includes(format.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid or missing format' });
    }

    const result = await bankStatementService.importBankStatement(
      req.user.companyId,
      req.file.path,
      req.file.originalname,
      format.toUpperCase()
    );

    res.json({
      message: 'Bank statement imported successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const statements = await BankStatement.findAll({
      where: { companyId: req.user.companyId },
      order: [['importDate', 'DESC']]
    });

    res.json({ data: statements });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bank statements' });
  }
});

router.get('/:id/transactions', auth, async (req, res) => {
  try {
    const transactions = await BankTransaction.findAll({
      where: {
        companyId: req.user.companyId,
        bankStatementId: req.params.id
      },
      order: [['transactionDate', 'DESC']]
    });

    res.json({ data: transactions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bank transactions' });
  }
});

router.post('/reconcile', auth, async (req, res) => {
  try {
    const reconciled = await bankStatementService.reconcileTransactions(req.user.companyId);

    res.json({
      message: 'Reconciliation completed',
      data: {
        reconciled: reconciled.length,
        transactions: reconciled
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reconcile transactions' });
  }
});

router.put('/transactions/:id/categorize', auth, async (req, res) => {
  try {
    const { category, vatCategory } = req.body;
    
    const transaction = await BankTransaction.findOne({
      where: {
        id: req.params.id,
        companyId: req.user.companyId
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await transaction.update({
      category,
      vatCategory
    });

    res.json({
      message: 'Transaction categorized successfully',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to categorize transaction' });
  }
});

module.exports = router;
