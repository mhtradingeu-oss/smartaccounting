process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite::memory:';

const { Sequelize } = require('sequelize');
const http = require('http');
const { logger } = require('../src/utils/errorHandler');
const { sequelize } = require('../src/models');

http.Server.prototype.listen = function(...args) {
  const lastArg = args[args.length - 1];
  const callback = typeof lastArg === 'function' ? args.pop() : undefined;
  const port = typeof args[0] === 'number' ? args[0] : 0;

  this.address = () => ({
    address: '127.0.0.1',
    family: 'IPv4',
    port: port || 0
  });

  if (callback) {
    process.nextTick(callback);
  }

  return this;
};

// Suppress console logs during testing
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();

  // Mock logger
  logger.info = jest.fn();
  logger.warn = jest.fn();
  logger.error = jest.fn();
}

// Global test timeout
jest.setTimeout(10000);

// Mock additional env variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.EMAIL_HOST = 'test.smtp.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'testpass';
process.env.STRIPE_SECRET_KEY = 'test-stripe-key';

// Global test database instance
let testDb;

beforeAll(async () => {
  testDb = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: {
      timestamps: true,
      underscored: false
    }
  });

  try {
    await testDb.authenticate();
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('Unable to connect to test database:', error);
  }
});

afterAll(async () => {
  if (testDb) {
    await testDb.close();
  }
  await sequelize.close();
});

afterEach(async () => {
  jest.clearAllMocks();
  if (testDb) {
    const models = Object.keys(testDb.models);
    for (const modelName of models) {
      try {
        await testDb.models[modelName].destroy({ where: {}, force: true });
      } catch (error) {
        // Ignore cleanup failures
      }
    }
  }
});

// Export test utilities
global.testDb = testDb;

jest.mock('../src/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'test-message-id' }),
  checkRateLimit: jest.fn().mockReturnValue(true),
  validateEmail: jest.fn().mockReturnValue(true)
}));

jest.mock('../src/services/stripeService', () => ({
  createCustomer: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
  createSubscription: jest.fn().mockResolvedValue({ id: 'sub_test123', status: 'active' }),
  cancelSubscription: jest.fn().mockResolvedValue({ id: 'sub_test123', status: 'canceled' })
}));

global.testUtils = require('../src/utils/testUtils');
