

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

export const TAX_RATES = {
  DEFAULT_VAT: 0.19,
  REDUCED_VAT: 0.07
};

export const FILE_UPLOAD = {
  MAX_SIZE: 10485760, 
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  UPLOAD_DIR: './uploads'
};

export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending'
};

export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout'
};
