
const request = require('supertest');
const express = require('express');
const { sequelize } = require('../../src/models');

// Import all routes
const authRoutes = require('../../src/routes/auth');
const invoiceRoutes = require('../../src/routes/invoices');
const dashboardRoutes = require('../../src/routes/dashboard');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);

describe('Full Workflow Integration Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Ensure database is synced
    await sequelize.sync({ force: true });
  });

  describe('Complete User Journey', () => {
    test('should complete full invoice workflow', async () => {
      // 1. Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'workflow@example.com',
          password: 'password123',
          firstName: 'Workflow',
          lastName: 'User',
          role: 'admin',
        });

      expect(registerResponse.status).toBe(201);

      // 2. Login user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'workflow@example.com',
          password: 'password123',
        });

      expect(loginResponse.status).toBe(200);
      authToken = loginResponse.body.token;

      // 3. Create invoice
      const invoiceResponse = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          number: 'INV-WORKFLOW-001',
          amount: 2000.00,
          currency: 'EUR',
          status: 'pending',
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          clientName: 'Integration Test Client',
        });

      expect(invoiceResponse.status).toBe(201);
      const invoiceId = invoiceResponse.body.invoice.id;

      // 4. Get dashboard data
      const dashboardResponse = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(dashboardResponse.status).toBe(200);
      expect(dashboardResponse.body).toHaveProperty('totalRevenue');

      // 5. Update invoice status
      const updateResponse = await request(app)
        .put(`/api/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'paid',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.invoice.status).toBe('paid');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle unauthorized access properly', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats');

      expect(response.status).toBe(401);
    });

    test('should handle invalid token', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
