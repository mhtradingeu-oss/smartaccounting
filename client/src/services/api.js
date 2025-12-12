
import axios from 'axios';

/*
 * API contract v0.1 (baseURL = /api)
 * Public: POST /auth/login, POST /auth/register
 * Authenticated: GET /auth/me, GET /dashboard/stats
 * Companies: GET /companies, PUT /companies
 * Users: GET/POST /users, PUT/DELETE /users/:userId
 * Invoices: GET/POST /invoices, PUT /invoices/:invoiceId
 * Bank statements: GET /bank-statements, POST /bank-statements/import, GET /bank-statements/:id/transactions, POST /bank-statements/reconcile, PUT /bank-statements/transactions/:id/categorize
 */

// Single base URL ensures no duplicate /api segments in requests.
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Enhanced request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  },
);

// Enhanced response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    console.error('❌ Response interceptor error:', error);
    
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          console.error('Access forbidden:', data.message);
          break;
        case 404:
          console.error('Resource not found:', error.config.url);
          break;
        case 500:
          console.error('Server error:', data.message);
          break;
        default:
          console.error(`API Error ${status}:`, data.message);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - backend may be down:', error.message);
    } else {
      // Other error
      console.error('API request failed:', error.message);
    }
    
    return Promise.reject(error);
  },
);

export default api;
