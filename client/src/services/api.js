
import axios from 'axios';

/*
 * API contract v0.1
 * baseURL = /api/v1
 *
 * Public:
 *   POST /auth/login
 *   POST /auth/register
 *
 * Authenticated:
 *   GET /auth/me
 *   GET /dashboard/stats
 *
 * Companies:
 *   GET /companies
 *   PUT /companies
 *
 * Users:
 *   GET /users
 *   POST /users
 *   PUT /users/:userId
 *   DELETE /users/:userId
 *
 * Invoices:
 *   GET /invoices
 *   POST /invoices
 *   PUT /invoices/:invoiceId
 *
 * Bank statements:
 *   GET /bank-statements
 *   POST /bank-statements/import
 *   GET /bank-statements/:id/transactions
 *   POST /bank-statements/reconcile
 *   PUT /bank-statements/transactions/:id/categorize
 */


const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.log(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      );
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(
        `✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`,
      );
    }
    return response;
  },
  (error) => {

    if (error.response) {

      const { status, data } = error.response;

      if (import.meta.env.DEV) {
        console.error(`❌ API Error ${status}:`, data);
      }

      switch (status) {
        case 401:

          localStorage.removeItem('token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          console.error('🚫 Forbidden:', data?.message);
          break;
        case 404:
          console.error('🔍 Not Found:', error.config.url);
          break;
        case 501:
          console.warn('🟡 Feature disabled in v0.1:', data?.feature);
          break;
        case 500:
          console.error('🔥 Server error:', data?.message);
          break;
        default:
          console.error(`⚠️ API Error ${status}:`, data?.message);
      }
    } else if (error.request) {
      console.error('🌐 Network error - backend may be down:', error.message);
    } else {
      console.error('❌ API request failed:', error.message);
    }

    return Promise.reject(error);
  },
);

export default api;
