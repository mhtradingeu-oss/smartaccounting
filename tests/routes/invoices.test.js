
const request = require('supertest');
const express = require('express');
const invoiceRoutes = require('../../src/routes/invoices');
const { Invoice, User } = require('../../src/models');
jest.mock('../../src/middleware/authMiddleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, role: 'admin', companyId: 'test-company-id' };
    req.userId = req.user.id;
    req.companyId = req.user.companyId;
    next();
  },
  requireCompany: (req, res, next) => {
    req.companyId = req.companyId || 'test-company-id';
    next();
  },
  requireRole: () => (req, res, next) => next(),
}));

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
        invoiceNumber: 'INV-001',
        date: new Date(),
        dueDate: new Date(),
        clientName: 'Test Client',
        subtotal: 1000.0,
        total: 1000.0,
        currency: 'EUR',
        status: 'paid',
        userId: testUser.id,
        companyId: testUser.companyId,
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
      invoiceNumber: 'INV-002',
      amount: 1500.0,
      currency: 'EUR',
      status: 'pending',
      issueDate: new Date(),
      dueDate: new Date(),
      clientName: 'Test Client',
    };

      const response = await request(app)
        .post('/api/invoices')
        .send(invoiceData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('invoice');
      expect(response.body.invoice.invoiceNumber).toBe(invoiceData.invoiceNumber);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .send({
          amount: 1000,
          // Missing required fields
        });

      expect(response.status).toBe(400);
    });
  });
});
