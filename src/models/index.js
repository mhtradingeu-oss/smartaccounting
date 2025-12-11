const { sequelize, syncDatabase } = require('../lib/database');
const defineUser = require('./User');
const defineCompany = require('./Company');
const defineInvoice = require('./Invoice');

const User = defineUser(sequelize);
const Company = defineCompany(sequelize);
const Invoice = defineInvoice(sequelize);

const models = { User, Company, Invoice };

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = {
  sequelize,
  syncDatabase,
  ...models
};
