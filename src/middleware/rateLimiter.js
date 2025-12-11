const logger = require('../lib/logger');

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('redis');

const redisClient = Redis.createClient({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => {
  });

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient.isReady ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient.isReady ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 20, 
  message: {
    error: 'Upload limit exceeded, please try again later.',
    retryAfter: '1 hour'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter
};
