
const { User, Invoice, Company } = require('../../src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class TestHelpers {
  static async createTestUser(overrides = {}) {
    const defaultUser = {
      email: `test-${Date.now()}@example.com`,
      password: await bcrypt.hash('testpass123', 10),
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      isActive: true
    };

    return await User.create({ ...defaultUser, ...overrides });
  }

  static async createTestCompany(userId, overrides = {}) {
    const defaultCompany = {
      name: `Test Company ${Date.now()}`,
      taxId: `DE${Math.random().toString().slice(2, 11)}`,
      address: 'Test Address 123',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Germany',
      userId
    };

    return await Company.create({ ...defaultCompany, ...overrides });
  }

  static async createTestInvoice(userId, overrides = {}) {
    const defaultInvoice = {
      number: `INV-TEST-${Date.now()}`,
      amount: 1000.00,
      currency: 'EUR',
      status: 'pending',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      clientName: 'Test Client',
      userId
    };

    return await Invoice.create({ ...defaultInvoice, ...overrides });
  }

  static createAuthToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h'
    });
  }

  static async cleanDatabase() {
    // Clean up test data in correct order (respecting foreign keys)
    await Invoice.destroy({ where: {}, force: true });
    await Company.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  }

  static mockStripeCustomer() {
    return {
      id: 'cus_test123',
      email: 'test@example.com',
      created: Math.floor(Date.now() / 1000),
      subscriptions: {
        data: []
      }
    };
  }

  static mockStripeSubscription() {
    return {
      id: 'sub_test123',
      customer: 'cus_test123',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      items: {
        data: [{
          price: {
            id: 'price_test123',
            recurring: { interval: 'month' }
          }
        }]
      }
    };
  }
}

module.exports = TestHelpers;
