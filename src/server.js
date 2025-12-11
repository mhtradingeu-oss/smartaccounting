const { syncDatabase } = require('./lib/database');
const app = require('./app');
const { logger } = require('./utils/errorHandler');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await syncDatabase({ force: false });

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });

    return server;
  } catch (err) {
    logger.error('Server failed to start', err);
    process.exit(1);
  }
}

// Only run when NOT in tests
if (require.main === module) {
  startServer();
}

module.exports = startServer;
