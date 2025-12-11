
const express = require('express');
const invoiceRoutes = require('../../src/routes/invoices');
const { Invoice, User } = require('../../src/models');

let mockCurrentUser = { id: 1, role: 'admin', companyId: null };
jest.mock('../../src/middleware/authMiddleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: mockCurrentUser.id, role: mockCurrentUser.role, companyId: mockCurrentUser.companyId };
    req.userId = req.user.id;
    req.companyId = req.user.companyId;
    next();
  },
  requireCompany: (req, res, next) => {
    req.companyId = req.companyId || mockCurrentUser.companyId;
    next();
  },
  requireRole: () => (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/invoices', invoiceRoutes);
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Error' });
});

describe('Invoice Routes', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await global.testUtils.createTestUser();
    mockCurrentUser = { id: testUser.id, role: testUser.role, companyId: testUser.companyId };
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

      const response = await global.requestApp({
        app,
        method: 'GET',
        url: '/api/invoices',
      });

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

      const response = await global.requestApp({
        app,
        method: 'POST',
        url: '/api/invoices',
        body: invoiceData,
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('invoice');
      expect(response.body.invoice.invoiceNumber).toBe(invoiceData.invoiceNumber);
    });

    test('should validate required fields', async () => {
      const response = await global.requestApp({
        app,
        method: 'POST',
        url: '/api/invoices',
        body: {
          amount: 1000,
        },
      });

      expect(response.status).toBe(400);
    });
  });
});
