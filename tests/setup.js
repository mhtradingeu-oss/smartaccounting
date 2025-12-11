process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite::memory:';

const { Sequelize } = require('sequelize');
const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');
const { logger } = require('../src/utils/errorHandler');
const { sequelize } = require('../src/models');

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
      underscored: false,
    },
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
  const models = Object.values(sequelize.models);
  for (const model of models) {
    try {
      await model.destroy({ where: {}, force: true });
    } catch (error) {
      // Ignore cleanup failures
    }
  }
});

// Export test utilities
global.testDb = testDb;
global.requestApp = ({ app, method = 'GET', url = '/', headers = {}, body }) => {
  return new Promise((resolve) => {
    const normalizedHeaders = { ...headers };
    if (body && !normalizedHeaders['content-type']) {
      normalizedHeaders['content-type'] = 'application/json';
    }

    const req = httpMocks.createRequest({
      method,
      url,
      headers: normalizedHeaders,
      body,
    });

    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });

    res.on('end', () => {
      let data = res._getData();
      try {
        data = typeof data === 'string' && data.length ? JSON.parse(data) : data;
      } catch (_) {
        // Leave data as-is if JSON parse fails
      }

      resolve({
        status: res.statusCode,
        body: data,
        headers: res._getHeaders(),
      });
    });

    app.handle(req, res);
  });
};

jest.mock('../src/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'test-message-id' }),
  checkRateLimit: jest.fn().mockReturnValue(true),
  validateEmail: jest.fn().mockReturnValue(true),
}));

jest.mock('../src/services/stripeService', () => ({
  createCustomer: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
  createSubscription: jest.fn().mockResolvedValue({ id: 'sub_test123', status: 'active' }),
  cancelSubscription: jest.fn().mockResolvedValue({ id: 'sub_test123', status: 'canceled' }),
}));

global.testUtils = require('../src/utils/testUtils');
