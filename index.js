const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./src/config/database');
// Import logger with fallback
let logger;
try {
  logger = require('./src/lib/logger');
} catch (error) {
  // Fallback logger if winston logger fails
  logger = {
    info: (msg, meta = '') => console.log(`[INFO] ${msg}`, meta),
    error: (msg, meta = '') => console.error(`[ERROR] ${msg}`, meta),
    warn: (msg, meta = '') => console.warn(`[WARN] ${msg}`, meta),
    debug: (msg, meta = '') => console.log(`[DEBUG] ${msg}`, meta)
  };
}
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const invoiceRoutes = require('./src/routes/invoices');
const bankStatementRoutes = require('./src/routes/bankStatements');
const germanTaxRoutes = require('./src/routes/germanTax');
const companyRoutes = require('./src/routes/companies');
const userRoutes = require('./src/routes/users');
const stripeRoutes = require('./src/routes/stripe');
const taxReportRoutes = require('./src/routes/taxReports');
const systemRoutes = require('./src/routes/system');
const monitoringRoutes = require('./src/routes/monitoring');
const complianceRoutes = require('./src/routes/compliance');
const elsterRoutes = require('./src/routes/elster');
const ocrRoutes = require('./src/routes/ocr');
const logRoutes = require('./src/routes/logs');
const emailTestRoutes = require('./src/routes/emailTest');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Replit
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsMiddleware = require('./src/middleware/cors');
app.use(corsMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SmartAccounting Backend',
    port: PORT
  });
});

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use('/api/invoices', require('./src/routes/invoices'));
app.use('/api/bank-statements', require('./src/routes/bankStatements'));
app.use('/api/german-tax', require('./src/routes/germanTax'));
app.use('/api/stripe', require('./src/routes/stripe'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/companies', require('./src/routes/companies'));
app.use('/api/tax-reports', require('./src/routes/taxReports'));
app.use('/api/compliance', require('./src/routes/compliance'));
app.use('/api/german-tax-compliance', require('./src/routes/germanTaxCompliance'));
app.use('/api/elster', require('./src/routes/elster'));
app.use('/api/ocr', require('./src/routes/ocr'));
app.use('/api/system', require('./src/routes/system'));
app.use('/api/monitoring', require('./src/routes/monitoring'));
app.use('/api/logs', require('./src/routes/logs'));
app.use('/api/email-test', require('./src/routes/emailTest'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Database connection and server startup
async function startServer() {
  try {
    // Initialize models first
    require('./src/models');
    logger.info('✅ Database models loaded');

    // Test database connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');

    // Sync database models
    await sequelize.sync({ alter: false });
    logger.info('✅ Database models synchronized');

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 SmartAccounting backend server running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🌐 Server accessible at: http://0.0.0.0:${PORT}`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

startServer();

module.exports = app;