/**
 * MODELS INDEX — CLEANED VERSION
 * SmartAccounting — Sequelize model bootstrapping
 */

const { sequelize, Sequelize } = require('../config/database');
const { DataTypes } = Sequelize;

const modelFactories = {
  User: require('./User'),
  Company: require('./Company'),
  Invoice: require('./Invoice'),
  Transaction: require('./Transaction'),
  BankStatement: require('./BankStatement'),
  BankTransaction: require('./BankTransaction'),
  TaxReport: require('./TaxReport'),
  AuditLog: require('./AuditLog'),
  FileAttachment: require('./FileAttachment')
};

const models = Object.entries(modelFactories).reduce((acc, [name, defineModel]) => {
  acc[name] = defineModel(sequelize, DataTypes);
  return acc;
}, {});

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

const syncDatabase = async (options = {}) => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: false, ...options });
    console.info('✅ Database synced');
  } catch (err) {
    console.error('❌ Database sync error:', err);
    throw err;
  }
};

module.exports = {
  sequelize,
  Sequelize,
  syncDatabase,
  ...models
};
