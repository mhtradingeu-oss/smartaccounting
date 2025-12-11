
const { sequelize } = require('../src/models');

module.exports = async () => {
  try {
    await sequelize.close();
    console.log('✅ Test database teardown complete');
  } catch (error) {
    console.error('❌ Test database teardown failed:', error);
  }
};
