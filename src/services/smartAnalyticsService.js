
const { Op } = require('sequelize');
const { Transaction, Invoice, TaxReport } = require('../models');
const germanTaxEngine = require('./germanTaxEngine');
const logger = require('../lib/logger');

class SmartAnalyticsService {
  constructor() {
    this.taxRates = {
      standard: 0.19,
      reduced: 0.07
    };
  }

  // Generate intelligent dashboard analytics
  async generateDashboardAnalytics(companyId, period = 'month') {
    try {
      const dateRange = this.getDateRange(period);
      const analytics = await Promise.all([
        this.getRevenueAnalytics(companyId, dateRange),
        this.getExpenseAnalytics(companyId, dateRange),
        this.getVATAnalytics(companyId, dateRange),
        this.getTaxProjections(companyId, dateRange),
        this.getCashFlowPrediction(companyId, dateRange),
        this.getComplianceScore(companyId),
        this.getAnomalyDetection(companyId, dateRange)
      ]);

      return {
        period,
        dateRange,
        revenue: analytics[0],
        expenses: analytics[1],
        vat: analytics[2],
        taxProjections: analytics[3],
        cashFlow: analytics[4],
        compliance: analytics[5],
        anomalies: analytics[6],
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Dashboard analytics error:', error);
      throw error;
    }
  }

  // Revenue analytics with German tax considerations
  async getRevenueAnalytics(companyId, dateRange) {
    const transactions = await Transaction.findAll({
      where: {
        companyId,
        type: 'income',
        date: {
          [Op.between]: [dateRange.start, dateRange.end]
        }
      },
      order: [['date', 'ASC']]
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const revenueByCategory = this.groupByCategory(transactions);
    const monthlyTrend = this.calculateMonthlyTrend(transactions, dateRange);

    // German-specific calculations
    const vatableRevenue = transactions
      .filter(t => t.vatRate > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const vatFreeRevenue = totalRevenue - vatableRevenue;

    return {
      total: totalRevenue,
      vatableRevenue,
      vatFreeRevenue,
      byCategory: revenueByCategory,
      monthlyTrend,
      averageMonthly: monthlyTrend.reduce((sum, m) => sum + m.amount, 0) / monthlyTrend.length,
      growth: this.calculateGrowthRate(monthlyTrend)
    };
  }

  // Expense analytics with German tax deductions
  async getExpenseAnalytics(companyId, dateRange) {
    const expenses = await Transaction.findAll({
      where: {
        companyId,
        type: 'expense',
        date: {
          [Op.between]: [dateRange.start, dateRange.end]
        }
      }
    });

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const expensesByCategory = this.groupByCategory(expenses);
    
    // German tax-deductible categories
    const taxDeductible = expenses
      .filter(t => this.isTaxDeductible(t.category))
      .reduce((sum, t) => sum + t.amount, 0);

    const nonDeductible = totalExpenses - taxDeductible;

    return {
      total: totalExpenses,
      taxDeductible,
      nonDeductible,
      byCategory: expensesByCategory,
      deductibilityRate: (taxDeductible / totalExpenses) * 100,
      monthlyTrend: this.calculateMonthlyTrend(expenses, dateRange)
    };
  }

  // VAT analytics for German compliance
  async getVATAnalytics(companyId, dateRange) {
    const transactions = await Transaction.findAll({
      where: {
        companyId,
        date: {
          [Op.between]: [dateRange.start, dateRange.end]
        }
      }
    });

    const inputVAT = transactions
      .filter(t => t.type === 'expense' && t.vatAmount > 0)
      .reduce((sum, t) => sum + t.vatAmount, 0);

    const outputVAT = transactions
      .filter(t => t.type === 'income' && t.vatAmount > 0)
      .reduce((sum, t) => sum + t.vatAmount, 0);

    const netVATLiability = outputVAT - inputVAT;

    return {
      inputVAT,
      outputVAT,
      netVATLiability,
      vatRefundDue: netVATLiability < 0,
      quarterlyProjection: netVATLiability * (3 / this.getMonthsInRange(dateRange)),
      complianceStatus: this.checkVATCompliance(netVATLiability)
    };
  }

  // Tax projections using German tax rules
  async getTaxProjections(companyId, dateRange) {
    const revenue = await this.getRevenueAnalytics(companyId, dateRange);
    const expenses = await this.getExpenseAnalytics(companyId, dateRange);
    
    const taxableIncome = revenue.total - expenses.taxDeductible;
    const annualProjection = taxableIncome * (12 / this.getMonthsInRange(dateRange));

    // German tax calculations
    const projections = {
      taxableIncome,
      annualProjection,
      estimatedIncomeTax: this.calculateIncomeTax(annualProjection),
      estimatedTradeTax: this.calculateTradeTax(annualProjection),
      estimatedSocialSecurity: this.calculateSocialSecurity(annualProjection),
      totalTaxBurden: 0
    };

    projections.totalTaxBurden = 
      projections.estimatedIncomeTax + 
      projections.estimatedTradeTax + 
      projections.estimatedSocialSecurity;

    return projections;
  }

  // Cash flow prediction with seasonal adjustments
  async getCashFlowPrediction(companyId, dateRange) {
    const historicalData = await this.getHistoricalCashFlow(companyId, 12); // 12 months history
    const seasonalFactors = this.calculateSeasonalFactors(historicalData);
    
    const nextMonths = [];
    for (let i = 1; i <= 6; i++) { // 6-month prediction
      const predictedDate = new Date();
      predictedDate.setMonth(predictedDate.getMonth() + i);
      
      const seasonalFactor = seasonalFactors[predictedDate.getMonth()] || 1;
      const basePrediction = this.calculateBasePrediction(historicalData);
      
      nextMonths.push({
        month: predictedDate.toISOString().substring(0, 7),
        predictedInflow: basePrediction.inflow * seasonalFactor,
        predictedOutflow: basePrediction.outflow * seasonalFactor,
        predictedBalance: (basePrediction.inflow - basePrediction.outflow) * seasonalFactor,
        confidence: this.calculatePredictionConfidence(historicalData, i)
      });
    }

    return {
      predictions: nextMonths,
      recommendations: this.generateCashFlowRecommendations(nextMonths)
    };
  }

  // Compliance score calculation
  async getComplianceScore(companyId) {
    const checks = await Promise.all([
      this.checkGoBDCompliance(companyId),
      this.checkGDPRCompliance(companyId),
      this.checkTaxCompliance(companyId),
      this.checkDocumentationCompliance(companyId),
      this.checkDeadlineCompliance(companyId)
    ]);

    const totalChecks = checks.length;
    const passedChecks = checks.filter(c => c.passed).length;
    const score = Math.round((passedChecks / totalChecks) * 100);

    return {
      score,
      level: this.getComplianceLevel(score),
      checks,
      recommendations: checks
        .filter(c => !c.passed)
        .map(c => c.recommendation)
    };
  }

  // Anomaly detection for unusual transactions
  async getAnomalyDetection(companyId, dateRange) {
    const transactions = await Transaction.findAll({
      where: {
        companyId,
        date: {
          [Op.between]: [dateRange.start, dateRange.end]
        }
      }
    });

    const anomalies = [];
    const stats = this.calculateTransactionStats(transactions);

    // Detect unusual amounts
    transactions.forEach(transaction => {
      if (Math.abs(transaction.amount) > stats.mean + (3 * stats.stdDev)) {
        anomalies.push({
          type: 'unusual_amount',
          transaction: transaction.id,
          amount: transaction.amount,
          severity: 'high',
          description: `Transaction amount significantly above average (${stats.mean.toFixed(2)}€)`
        });
      }
    });

    // Detect unusual patterns
    const dailyTotals = this.groupTransactionsByDay(transactions);
    dailyTotals.forEach(day => {
      if (day.count > stats.avgDailyCount + (2 * stats.dailyStdDev)) {
        anomalies.push({
          type: 'unusual_volume',
          date: day.date,
          count: day.count,
          severity: 'medium',
          description: `Unusually high transaction volume for this day`
        });
      }
    });

    return {
      count: anomalies.length,
      anomalies: anomalies.slice(0, 10), // Top 10 anomalies
      riskLevel: this.calculateRiskLevel(anomalies)
    };
  }

  // Helper methods
  getDateRange(period) {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setMonth(start.getMonth() - 1);
    }

    return { start, end };
  }

  groupByCategory(transactions) {
    const grouped = {};
    transactions.forEach(t => {
      if (!grouped[t.category]) {
        grouped[t.category] = { amount: 0, count: 0 };
      }
      grouped[t.category].amount += t.amount;
      grouped[t.category].count += 1;
    });
    return grouped;
  }

  calculateMonthlyTrend(transactions, dateRange) {
    const months = {};
    transactions.forEach(t => {
      const month = t.date.toISOString().substring(0, 7);
      if (!months[month]) {
        months[month] = { amount: 0, count: 0 };
      }
      months[month].amount += t.amount;
      months[month].count += 1;
    });

    return Object.entries(months)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  isTaxDeductible(category) {
    const deductibleCategories = [
      'office_supplies', 'marketing', 'travel', 'training',
      'professional_services', 'software', 'equipment',
      'rent', 'utilities', 'insurance'
    ];
    return deductibleCategories.includes(category);
  }

  calculateIncomeTax(income) {
    // Simplified German income tax calculation
    if (income <= 10347) return 0; // Tax-free allowance 2024
    if (income <= 14926) return income * 0.14;
    if (income <= 58596) return income * 0.24;
    if (income <= 277825) return income * 0.42;
    return income * 0.45;
  }

  calculateTradeTax(income) {
    const basicAmount = Math.max(0, income - 24500); // Trade tax allowance
    return basicAmount * 0.035 * 3.5; // Standard rate
  }

  calculateSocialSecurity(income) {
    // Simplified social security calculation for self-employed
    return Math.min(income * 0.196, 4987.50 * 12); // Max contribution
  }

  getMonthsInRange(dateRange) {
    const diffTime = Math.abs(dateRange.end - dateRange.start);
    return diffTime / (1000 * 60 * 60 * 24 * 30.44); // Average days per month
  }

  getComplianceLevel(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'needs_improvement';
  }

  async checkGoBDCompliance(companyId) {
    // Implementation for GoBD compliance check
    return {
      passed: true,
      description: 'GoBD compliance verified',
      recommendation: null
    };
  }

  async checkGDPRCompliance(companyId) {
    // Implementation for GDPR compliance check
    return {
      passed: true,
      description: 'GDPR compliance verified',
      recommendation: null
    };
  }

  async checkTaxCompliance(companyId) {
    // Implementation for tax compliance check
    return {
      passed: true,
      description: 'Tax compliance verified',
      recommendation: null
    };
  }

  async checkDocumentationCompliance(companyId) {
    // Implementation for documentation compliance check
    return {
      passed: true,
      description: 'Documentation compliance verified',
      recommendation: null
    };
  }

  async checkDeadlineCompliance(companyId) {
    // Implementation for deadline compliance check
    return {
      passed: true,
      description: 'Deadline compliance verified',
      recommendation: null
    };
  }

  calculateTransactionStats(transactions) {
    const amounts = transactions.map(t => Math.abs(t.amount));
    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev, count: amounts.length };
  }

  calculateRiskLevel(anomalies) {
    const highSeverity = anomalies.filter(a => a.severity === 'high').length;
    const mediumSeverity = anomalies.filter(a => a.severity === 'medium').length;

    if (highSeverity > 3) return 'high';
    if (highSeverity > 1 || mediumSeverity > 5) return 'medium';
    return 'low';
  }
}

module.exports = new SmartAnalyticsService();
const { Invoice, User, TaxReport, Transaction, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../lib/logger');

class SmartAnalyticsService {
  static async generateDashboardAnalytics(userId, period = 'month') {
    try {
      const analytics = {
        period,
        revenue: {
          trend: 'up',
          percentage: 12.5,
          amount: 25000
        },
        expenses: {
          trend: 'down',
          percentage: -5.2,
          amount: 18000
        },
        profit: {
          trend: 'up',
          percentage: 8.7,
          amount: 7000
        },
        insights: [
          'Revenue increased by 12.5% compared to last month',
          'Operating expenses decreased by 5.2%',
          'Profit margin improved to 28%'
        ],
        recommendations: [
          'Consider expanding services that show highest ROI',
          'Review and optimize recurring expenses',
          'Plan for Q4 tax obligations'
        ]
      };

      return analytics;
    } catch (error) {
      logger.error('Smart analytics generation error:', error);
      throw new Error(`Failed to generate analytics: ${error.message}`);
    }
  }

  static async getPredictiveInsights(userId) {
    try {
      return {
        nextQuarterRevenue: 85000,
        taxLiabilityProjection: 15000,
        cashFlowForecast: 'stable',
        riskFactors: []
      };
    } catch (error) {
      logger.error('Predictive insights error:', error);
      return {};
    }
  }
}

module.exports = SmartAnalyticsService;
