const logger = require('../lib/logger');

const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken, requireRole } = require('../middleware/auth');
const OCRService = require('../services/ocrService');
const { FileAttachment } = require('../models');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    
    const uploadsDir = 'uploads/documents';
    const ocrTempDir = 'temp/ocr';
    
    if (!require('fs').existsSync(uploadsDir)) {
      require('fs').mkdirSync(uploadsDir, { recursive: true });
    }
    if (!require('fs').existsSync(ocrTempDir)) {
      require('fs').mkdirSync(ocrTempDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
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
      cb(new Error('Only images (JPEG, JPG, PNG) and PDF files are allowed'));
    }
  }
});

router.post('/process', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { documentType = 'OTHER' } = req.body;
    const filePath = req.file.path;

    const ocrResult = documentType === 'RECEIPT' 
      ? await OCRService.processReceiptOCR(filePath)
      : await OCRService.processDocument(filePath);

    const fileAttachment = await FileAttachment.create({
      companyId: req.user.companyId,
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      filePath: filePath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileHash: require('crypto').createHash('sha256').update(require('fs').readFileSync(filePath)).digest('hex'),
      documentType: documentType,
      ocrProcessed: true,
      ocrText: ocrResult.text,
      ocrConfidence: ocrResult.confidence,
      ocrLanguage: 'deu+eng',
      extractedData: ocrResult.extractedData,
      uploadedBy: req.user.id,
      processingStatus: 'COMPLETED'
    });

    res.json({
      message: 'OCR processing completed successfully',
      fileId: fileAttachment.id,
      extractedData: ocrResult.extractedData,
      confidence: ocrResult.confidence,
      ocrText: ocrResult.text
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'OCR processing failed',
      details: error.message 
    });
  }
});

router.get('/results/:fileId', authenticateToken, async (req, res) => {
  try {
    const fileAttachment = await FileAttachment.findOne({
      where: {
        id: req.params.fileId,
        companyId: req.user.companyId
      }
    });

    if (!fileAttachment) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      id: fileAttachment.id,
      originalFilename: fileAttachment.originalFilename,
      documentType: fileAttachment.documentType,
      ocrProcessed: fileAttachment.ocrProcessed,
      ocrText: fileAttachment.ocrText,
      ocrConfidence: fileAttachment.ocrConfidence,
      extractedData: fileAttachment.extractedData,
      uploadDate: fileAttachment.createdAt
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve OCR results' });
  }
});

router.post('/reprocess/:fileId', authenticateToken, requireRole(['admin', 'accountant']), async (req, res) => {
  try {
    const fileAttachment = await FileAttachment.findOne({
      where: {
        id: req.params.fileId,
        companyId: req.user.companyId
      }
    });

    if (!fileAttachment) {
      return res.status(404).json({ error: 'File not found' });
    }

    const ocrResult = await OCRService.processDocument(fileAttachment.filePath);

    await fileAttachment.update({
      ocrProcessed: true,
      ocrText: ocrResult.text,
      ocrConfidence: ocrResult.confidence,
      extractedData: ocrResult.extractedData,
      processingStatus: 'COMPLETED'
    });

    res.json({
      message: 'OCR reprocessing completed successfully',
      extractedData: ocrResult.extractedData,
      confidence: ocrResult.confidence
    });

  } catch (error) {
    res.status(500).json({ error: 'OCR reprocessing failed' });
  }
});

router.get('/test', async (req, res) => {
  try {
    const testResult = await OCRService.testOCR();
    res.json({
      message: 'OCR service test completed',
      result: testResult,
      directories: {
        uploads: 'uploads/documents',
        temp: 'temp/ocr'
      },
      status: testResult.success ? 'ready' : 'error'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'OCR test failed',
      details: error.message 
    });
  }
});

router.post('/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { documentType = 'INVOICE' } = req.body;
    const filePath = req.file.path;

    const ocrResult = documentType === 'RECEIPT' 
      ? await OCRService.processReceiptOCR(filePath)
      : await OCRService.processDocument(filePath);

    setTimeout(() => {
      try {
        require('fs').unlinkSync(filePath);
        } catch (cleanupError) {
        }
    }, 5000);

    if (!ocrResult.success) {
      return res.status(500).json({
        error: 'OCR processing failed',
        details: ocrResult.error
      });
    }

    res.json({
      success: true,
      extractedText: ocrResult.text,
      confidence: ocrResult.confidence,
      vendor: ocrResult.extractedData?.vendor,
      amount: ocrResult.extractedData?.amount,
      date: ocrResult.extractedData?.date,
      invoiceNumber: ocrResult.extractedData?.invoiceNumber,
      items: ocrResult.extractedData?.items || [],
      structuredData: ocrResult.extractedData
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'OCR extraction failed',
      details: error.message 
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const ocrService = require('../services/ocrService');
const logger = require('../lib/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'temp/ocr/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, TIFF, and PDF are allowed.'));
    }
  }
});

// Process document with OCR
router.post('/process', authenticate, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { documentType = 'receipt', language = 'deu+eng' } = req.body;

    const result = await ocrService.processDocument(req.file.path, {
      language,
      documentType,
      userId: req.user.id,
      companyId: req.user.companyId
    });

    res.json(result);
  } catch (error) {
    logger.error('OCR processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process document'
    });
  }
});

// Search archived documents
router.get('/search', authenticate, async (req, res) => {
  try {
    const {
      documentType,
      dateFrom,
      dateTo,
      vendor,
      minAmount,
      maxAmount
    } = req.query;

    const criteria = {
      documentType,
      dateFrom,
      dateTo,
      vendor,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined
    };

    const documents = await ocrService.searchDocuments(criteria);

    res.json({
      success: true,
      documents,
      count: documents.length
    });
  } catch (error) {
    logger.error('Document search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search documents'
    });
  }
});

// Validate document integrity
router.get('/validate/:documentId', authenticate, async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const validation = await ocrService.validateDocumentIntegrity(documentId);

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    logger.error('Document validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate document'
    });
  }
});

module.exports = router;
