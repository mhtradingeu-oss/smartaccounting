
const request = require('supertest');
const express = require('express');
const invoiceRoutes = require('../../src/routes/invoices');
const { Invoice, User } = require('../../src/models');
const authMiddleware = require('../../src/middleware/authMiddleware');

// Mock auth middleware for testing
jest.mock('../../src/middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  };
});

const app = express();
app.use(express.json());
app.use('/api/invoices', invoiceRoutes);

describe('Invoice Routes', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await global.testUtils.createTestUser();
  });

  describe('GET /api/invoices', () => {
    test('should get all invoices', async () => {
      // Create test invoice
      await Invoice.create({
        number: 'INV-001',
        amount: 1000.00,
        currency: 'EUR',
        status: 'paid',
        issueDate: new Date(),
        dueDate: new Date(),
        userId: testUser.id
      });

      const response = await request(app)
        .get('/api/invoices');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('invoices');
      expect(Array.isArray(response.body.invoices)).toBe(true);
    });
  });

  describe('POST /api/invoices', () => {
    test('should create new invoice', async () => {
      const invoiceData = {
        number: 'INV-002',
        amount: 1500.00,
        currency: 'EUR',
        status: 'pending',
        issueDate: new Date(),
        dueDate: new Date(),
        clientName: 'Test Client'
      };

      const response = await request(app)
        .post('/api/invoices')
        .send(invoiceData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('invoice');
      expect(response.body.invoice.number).toBe(invoiceData.number);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .send({
          amount: 1000
          // Missing required fields
        });

      expect(response.status).toBe(400);
    });
  });
});
