
import api from './api';

export const dashboardAPI = {
  // Get dashboard overview data
  getDashboardData: async () => {
    try {
      const response = await api.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Dashboard API error:', error);
      throw error;
    }
  },

  // Get dashboard statistics
  getStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Dashboard stats API error:', error);
      throw error;
    }
  },

  // Get monthly data
  getMonthlyData: async () => {
    try {
      const response = await api.get('/dashboard/monthly-data');
      return response.data;
    } catch (error) {
      console.error('Dashboard monthly data API error:', error);
      throw error;
    }
  },

  // Get tax summary
  getTaxSummary: async () => {
    try {
      const response = await api.get('/dashboard/tax-summary');
      return response.data;
    } catch (error) {
      console.error('Dashboard tax summary API error:', error);
      throw error;
    }
  },

  // Get upload statistics
  getUploadStats: async () => {
    try {
      const response = await api.get('/dashboard/upload-stats');
      return response.data;
    } catch (error) {
      console.error('Dashboard upload stats API error:', error);
      throw error;
    }
  },

  // Get recent activity
  getRecentActivity: async () => {
    try {
      const response = await api.get('/dashboard/activities');
      return response.data;
    } catch (error) {
      console.error('Dashboard activity API error:', error);
      throw error;
    }
  },
};

export default dashboardAPI;
