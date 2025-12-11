require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const corsMiddleware = require('./src/middleware/cors');
const { applySecurityMiddleware } = require('./src/middleware/security');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/lib/logger');
const { specs, swaggerOptions } = require('./src/config/swagger');
const { sequelize, syncDatabase } = require('./src/models');

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
const germanTaxComplianceRoutes = require('./src/routes/germanTaxCompliance');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const apiPrefix = process.env.API_BASE_URL || '/api';

if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

applySecurityMiddleware(app);
app.use(corsMiddleware);
app.use(express.json({ limit: process.env.JSON_LIMIT || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_LIMIT || '10mb' }));
app.use(logger.requestLogger);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get(`${apiPrefix}/health`, (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'SmartAccounting Backend',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
app.use(`${apiPrefix}/invoices`, invoiceRoutes);
app.use(`${apiPrefix}/bank-statements`, bankStatementRoutes);
app.use(`${apiPrefix}/german-tax`, germanTaxRoutes);
app.use(`${apiPrefix}/stripe`, stripeRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/companies`, companyRoutes);
app.use(`${apiPrefix}/tax-reports`, taxReportRoutes);
app.use(`${apiPrefix}/compliance`, complianceRoutes);
app.use(`${apiPrefix}/german-tax-compliance`, germanTaxComplianceRoutes);
app.use(`${apiPrefix}/elster`, elsterRoutes);
app.use(`${apiPrefix}/ocr`, ocrRoutes);
app.use(`${apiPrefix}/system`, systemRoutes);
app.use(`${apiPrefix}/monitoring`, monitoringRoutes);
app.use(`${apiPrefix}/logs`, logRoutes);
app.use(`${apiPrefix}/email-test`, emailTestRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.use(errorHandler);

async function startServer() {
  try {
    await syncDatabase({ alter: false });
    const server = app.listen(PORT, HOST, () => {
      logger.info('Server running', {
        host: HOST,
        port: PORT,
        apiPrefix,
        environment: process.env.NODE_ENV || 'development'
      });
      logger.info(`Swagger docs available at http://localhost:${PORT}/api/docs`);
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.stack || error.message });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

startServer();

module.exports = app;
