import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartBarIcon,
  CurrencyEuroIcon,
  ArrowUpIcon as ArrowTrendingUpIcon,
  ArrowDownIcon as ArrowTrendingDownIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ChartPieIcon,
  BanknotesIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const Analytics = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setAnalyticsData({
        revenue: {
          current: 125480.50,
          previous: 112340.20,
          growth: 11.7,
        },
        expenses: {
          current: 89320.75,
          previous: 95210.30,
          growth: -6.2,
        },
        profit: {
          current: 36159.75,
          previous: 17129.90,
          growth: 111.2,
        },
        invoices: {
          total: 142,
          paid: 134,
          pending: 8,
          overdue: 3,
        },
        topClients: [
          { name: 'Müller GmbH', revenue: 15420.50, invoices: 12 },
          { name: 'Schmidt & Partner', revenue: 12350.00, invoices: 8 },
          { name: 'Weber Industries', revenue: 9870.25, invoices: 6 },
        ],
        monthlyTrends: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          revenue: [12000, 15000, 18000, 22000, 19000, 25000],
          expenses: [8000, 9500, 11000, 14000, 12000, 16000],
        },
      });
      setLoading(false);
    }, 1000);
  }, [timeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Business Analytics</h1>
          <p className="page-subtitle">
            Comprehensive insights into your business performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="input text-sm py-2"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="btn-secondary">
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button className="btn-primary">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Revenue',
            value: formatCurrency(analyticsData.revenue.current),
            change: formatPercentage(analyticsData.revenue.growth),
            trend: analyticsData.revenue.growth > 0 ? 'up' : 'down',
            icon: CurrencyEuroIcon,
            color: 'emerald',
          },
          {
            title: 'Expenses',
            value: formatCurrency(analyticsData.expenses.current),
            change: formatPercentage(analyticsData.expenses.growth),
            trend: analyticsData.expenses.growth > 0 ? 'up' : 'down',
            icon: ArrowTrendingDownIcon,
            color: 'red',
          },
          {
            title: 'Net Profit',
            value: formatCurrency(analyticsData.profit.current),
            change: formatPercentage(analyticsData.profit.growth),
            trend: analyticsData.profit.growth > 0 ? 'up' : 'down',
            icon: ArrowTrendingUpIcon,
            color: 'blue',
          },
        ].map((metric, index) => (
          <div key={index} className="card-elevated p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg bg-${metric.color}-100 dark:bg-${metric.color}-900/20`}>
                  <metric.icon className={`h-6 w-6 text-${metric.color}-600 dark:text-${metric.color}-400`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metric.value}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {metric.trend === 'up' ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                metric.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {metric.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs previous period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend Chart */}
        <div className="card p-6">
          <h3 className="section-title mb-6">Revenue Trend</h3>
          <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Chart.js Integration Coming Soon</p>
            </div>
          </div>
        </div>

        {/* Invoice Status */}
        <div className="card p-6">
          <h3 className="section-title mb-6">Invoice Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Invoices</span>
              <span className="font-medium text-gray-900 dark:text-white">{analyticsData.invoices.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Paid</span>
              <span className="font-medium text-emerald-600">{analyticsData.invoices.paid}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
              <span className="font-medium text-amber-600">{analyticsData.invoices.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Overdue</span>
              <span className="font-medium text-red-600">{analyticsData.invoices.overdue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="card p-6">
        <h3 className="section-title mb-6">Top Clients</h3>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Client</th>
                <th className="table-header-cell">Revenue</th>
                <th className="table-header-cell">Invoices</th>
                <th className="table-header-cell">Performance</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {analyticsData.topClients.map((client, index) => (
                <tr key={index} className="table-row">
                  <td className="table-cell font-medium">{client.name}</td>
                  <td className="table-cell">{formatCurrency(client.revenue)}</td>
                  <td className="table-cell">{client.invoices}</td>
                  <td className="table-cell">
                    <span className="badge-success">Excellent</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;