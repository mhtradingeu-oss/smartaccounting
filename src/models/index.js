const { sequelize, syncDatabase, Sequelize } = require('../lib/database');
const defineUser = require('./User');
const defineCompany = require('./Company');
const defineInvoice = require('./Invoice');
const defineTransaction = require('./Transaction');
const defineTaxReport = require('./TaxReport');
const defineBankStatement = require('./BankStatement');
const defineBankTransaction = require('./BankTransaction');
const defineAuditLog = require('./AuditLog');
const defineFileAttachment = require('./FileAttachment');

const User = defineUser(sequelize);
const Company = defineCompany(sequelize);
const Invoice = defineInvoice(sequelize);
const Transaction = defineTransaction(sequelize, Sequelize.DataTypes);
const TaxReport = defineTaxReport(sequelize, Sequelize.DataTypes);
const BankStatement = defineBankStatement(sequelize, Sequelize.DataTypes);
const BankTransaction = defineBankTransaction(sequelize, Sequelize.DataTypes);
const AuditLog = defineAuditLog(sequelize, Sequelize.DataTypes);
const FileAttachment = defineFileAttachment(sequelize, Sequelize.DataTypes);

const models = { 
  User, 
  Company, 
  Invoice, 
  Transaction, 
  TaxReport, 
  BankStatement, 
  BankTransaction, 
  AuditLog, 
  FileAttachment, 
};

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = {
  sequelize,
  syncDatabase,
  Sequelize,
  ...models,
};
