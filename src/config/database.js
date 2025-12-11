const path = require('path');
require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isTest = NODE_ENV === 'test';
const explicitUrl = process.env.DATABASE_URL;
const fallbackPostgresUrl = 'postgres://localhost:5432/smartaccounting';

const databaseUrl = explicitUrl || (isTest ? 'sqlite::memory:' : fallbackPostgresUrl);
const isSqlite = databaseUrl.startsWith('sqlite:');
const isInMemorySqlite = databaseUrl === 'sqlite::memory:';

let storage;
if (isSqlite && !isInMemorySqlite) {
  storage = path.resolve(process.cwd(), databaseUrl.replace('sqlite:', ''));
}

const pool = {
  max: Number(process.env.DB_POOL_MAX) || 10,
  min: Number(process.env.DB_POOL_MIN) || 0,
  acquire: Number(process.env.DB_POOL_ACQUIRE) || 30000,
  idle: Number(process.env.DB_POOL_IDLE) || 10000
};

const logging = process.env.SEQUELIZE_LOGGING === 'true' || NODE_ENV === 'development';

const dialectOptions = {};
if (!isSqlite && process.env.DB_SSL === 'true') {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false
  };
}

module.exports = {
  NODE_ENV,
  databaseUrl,
  isTest,
  isSqlite,
  storage,
  pool,
  logging,
  dialectOptions,
  define: {
    timestamps: true,
    underscored: false
  }
};
