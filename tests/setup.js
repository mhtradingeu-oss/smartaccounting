
const { Sequelize } = require('sequelize');
const { logger } = require('../src/utils/errorHandler');

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

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'sqlite::memory:';
process.env.EMAIL_HOST = 'test.smtp.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'testpass';

// Global test database instance
let testDb;

beforeAll(async () => {
  // Create test database
  testDb = new Sequelize('sqlite::memory:', {
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
    },
  });
  
  // Test connection
  try {
    await testDb.authenticate();
  } catch (error) {
    console.error('Unable to connect to test database:', error);
  }
});

afterAll(async () => {
  // Close database connection
  if (testDb) {
    await testDb.close();
  }
});

// Clean up between tests
afterEach(async () => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clean up test data if needed
  if (testDb) {
    const models = Object.keys(testDb.models);
    for (const modelName of models) {
      try {
        await testDb.models[modelName].destroy({ where: {}, force: true });
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
  }
});

// Export test utilities
global.testDb = testDb;

// Mock external services
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
