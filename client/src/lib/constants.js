

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout'
  },
  USERS: '/api/users',
  COMPANIES: '/api/companies',
  INVOICES: '/api/invoices',
  TAX_REPORTS: '/api/tax-reports',
  DASHBOARD: '/api/dashboard',
  STRIPE: '/api/stripe'
};

export const USER_ROLES = {
  ADMIN: 'admin',
  ACCOUNTANT: 'accountant',
  AUDITOR: 'auditor',
  VIEWER: 'viewer'
};

export const SUBSCRIPTION_PLANS = {
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

export const THEME = {
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#6B7280',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444'
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px'
  }
};

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PHONE_REGEX: /^\+?[\d\s-()]+$/
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'smartaccounting_token',
  USER_DATA: 'smartaccounting_user',
  LANGUAGE: 'smartaccounting_language',
  THEME: 'smartaccounting_theme'
};
