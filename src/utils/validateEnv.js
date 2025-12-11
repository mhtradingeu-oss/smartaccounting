
const logger = require('../lib/logger');

const requiredEnvVars = [
  'JWT_SECRET',
  'DATABASE_URL',
  'NODE_ENV',
  'PORT',
];

const optionalEnvVars = [
  'EMAIL_HOST',
  'EMAIL_USER', 
  'EMAIL_PASS',
  'STRIPE_SECRET_KEY',
  'FRONTEND_URL',
];

function validateEnvironment() {
  const missing = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check optional variables
  optionalEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  // JWT Secret validation
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    missing.push('JWT_SECRET (must be at least 32 characters)');
  }

  if (missing.length > 0) {
    logger.error('❌ Missing required environment variables:', missing);
    logger.error('Please check your .env file and ensure all required variables are set.');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (warnings.length > 0) {
    logger.warn('⚠️ Optional environment variables not set:', warnings);
    logger.warn('Some features may not work properly without these variables.');
  }

  logger.info('✅ Environment validation passed');
  return true;
}

module.exports = validateEnvironment;
