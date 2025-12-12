// Application entrypoint: loads configuration, syncs DB, then starts the Express app from src/app.js.
require('dotenv').config();

const app = require('./src/app');
const logger = require('./src/lib/logger');
const { sequelize, syncDatabase } = require('./src/models');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const API_PREFIX = app.get('apiPrefix') || process.env.API_BASE_URL || '/api';

async function startServer() {
  try {
    await syncDatabase({ alter: false });
    const server = app.listen(PORT, HOST, () => {
      logger.info('Server running', {
        host: HOST,
        port: PORT,
        apiPrefix: API_PREFIX,
        environment: process.env.NODE_ENV || 'development',
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
