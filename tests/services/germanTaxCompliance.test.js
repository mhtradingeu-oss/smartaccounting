
const germanTaxService = require('../../src/services/germanTaxCompliance');

describe('German Tax Compliance Service', () => {
  describe('VAT Calculations', () => {
    test('should calculate standard VAT (19%)', () => {
      const netAmount = 1000;
      const vatAmount = germanTaxService.calculateVAT(netAmount, 'standard');
      
      expect(vatAmount).toBe(190);
    });

    test('should calculate reduced VAT (7%)', () => {
      const netAmount = 1000;
      const vatAmount = germanTaxService.calculateVAT(netAmount, 'reduced');
      
      expect(vatAmount).toBe(70);
    });

    test('should handle zero VAT', () => {
      const netAmount = 1000;
      const vatAmount = germanTaxService.calculateVAT(netAmount, 'exempt');
      
      expect(vatAmount).toBe(0);
    });
  });

  describe('Tax Report Generation', () => {
    test('should generate quarterly tax report', async () => {
      const reportData = {
        quarter: 'Q1',
        year: 2024,
        transactions: []
      };

      const report = await germanTaxService.generateQuarterlyReport(reportData);
      
      expect(report).toHaveProperty('totalRevenue');
      expect(report).toHaveProperty('totalVAT');
      expect(report).toHaveProperty('period');
    });
  });

  describe('Compliance Validation', () => {
    test('should validate invoice format', () => {
      const invoice = {
        number: 'INV-2024-001',
        issueDate: new Date(),
        amount: 1000,
        vatAmount: 190,
        clientName: 'Test Client',
        clientAddress: 'Test Address'
      };

      const isValid = germanTaxService.validateInvoiceCompliance(invoice);
      expect(isValid.isCompliant).toBe(true);
    });

    test('should detect non-compliant invoice', () => {
      const invoice = {
        number: 'INV-001', // Invalid format
        amount: 1000
        // Missing required fields
      };

      const validation = germanTaxService.validateInvoiceCompliance(invoice);
      expect(validation.isCompliant).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});
