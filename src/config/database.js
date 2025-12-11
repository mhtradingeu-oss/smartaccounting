const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create basic console logger if none exists
const logger = {
  info: (msg, meta = '') => console.log(`[INFO] ${msg}`, meta),
  error: (msg, meta = '') => console.error(`[ERROR] ${msg}`, meta),
  warn: (msg, meta = '') => console.warn(`[WARN] ${msg}`, meta)
};

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'sqlite',
  storage: './database/smartaccounting.db',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true 
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    match: [
      /SQLITE_BUSY/
    ],
    max: 3
  }
});

sequelize.authenticate()
  .then(() => {
    logger.info('✅ Database connection established successfully.');
  })
  .catch(err => {
    logger.error('❌ Unable to connect to the database:', err);
  });

module.exports = { sequelize, Sequelize };