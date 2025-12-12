const express = require('express');
const authService = require('../services/authService');
const { sanitizeInput, preventNoSqlInjection } = require('../middleware/validation');
const { loginLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', sanitizeInput, preventNoSqlInjection, async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, user: user.toJSON() });
  } catch (error) {
    next(error);
  }
});

router.post('/login', loginLimiter, sanitizeInput, preventNoSqlInjection, async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, sanitizeInput, preventNoSqlInjection, async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

module.exports = router;
