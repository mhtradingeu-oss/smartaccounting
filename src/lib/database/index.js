const fs = require('fs');
const { Sequelize } = require('sequelize');
const config = require('../../config/database');
const { logger } = require('../../utils/errorHandler');

const { databaseUrl, isSqlite, storage, pool, logging, dialectOptions, define } = config;

if (isSqlite && storage) {
  const dir = require('path').dirname(storage);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const sqliteOptions = {
  dialect: 'sqlite',
  storage: storage || ':memory:',
  logging: logging ? (msg) => logger.info(msg) : false,
  pool,
  define,
};

const postgresOptions = {
  logging: logging ? (msg) => logger.info(msg) : false,
  pool,
  define,
  dialectOptions: Object.keys(dialectOptions).length ? dialectOptions : undefined,
};

const sequelize = isSqlite
  ? new Sequelize(sqliteOptions)
  : new Sequelize(databaseUrl, { dialect: 'postgres', ...postgresOptions });

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
    return sequelize;
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    throw error;
  }
};

const syncDatabase = async (options = {}) => {
  await connectDatabase();
  const syncConfig = {
    logging: false,
    alter: false,
    ...options,
  };
  await sequelize.sync(syncConfig);
  logger.info('Database synchronized');
};

module.exports = {
  sequelize,
  Sequelize,
  connectDatabase,
  syncDatabase,
};
