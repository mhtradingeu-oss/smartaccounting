
const express = require('express');
const router = express.Router();
const logger = require('../lib/logger');

router.post('/', (req, res) => {
  try {
    const { level, message, meta, timestamp, url, userAgent } = req.body;
    
    const logData = {
      frontend: true,
      url,
      userAgent,
      timestamp,
      ...meta,
    };

    switch (level) {
      case 'error':
        logger.error(`Frontend Error: ${message}`, logData);
        break;
      case 'warn':
        logger.warn(`Frontend Warning: ${message}`, logData);
        break;
      case 'info':
        logger.info(`Frontend Info: ${message}`, logData);
        break;
      default:
        logger.debug(`Frontend Log: ${message}`, logData);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Failed to process frontend log:', error);
    res.status(500).json({ error: 'Failed to process log' });
  }
});

module.exports = router;
