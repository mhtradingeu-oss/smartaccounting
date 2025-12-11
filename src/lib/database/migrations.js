const { syncDatabase } = require('../../models');
const { logger } = require('../../utils/errorHandler');

(async () => {
  try {
    await syncDatabase({ force: false, alter: true });
    logger.info('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', { error: error.message });
    process.exit(1);
  }
})();
