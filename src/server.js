const { syncDatabase } = require('./lib/database');
const app = require('./app');
const { logger } = require('./utils/errorHandler');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await syncDatabase({ force: false });
    const server = app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
    });
    return server;
  } catch (error) {
    logger.error('Server failed to start', { error: error.message });
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = startServer;
