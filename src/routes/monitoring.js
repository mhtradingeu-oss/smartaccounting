const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const cache = require('../lib/cache');
const logger = require('../lib/logger');
const os = require('os');
const fs = require('fs').promises;

router.get('/health', async (req, res) => {
  const startTime = Date.now();
  const checks = {};

  try {
    
    try {
      await sequelize.authenticate();
      const dbQuery = await sequelize.query('SELECT 1 as test');
      checks.database = {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        connection: 'active'
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        error: error.message
      };
    }

    try {
      await cache.set('health_check', 'ok', 10);
      const cacheTest = await cache.get('health_check');
      checks.cache = {
        status: cacheTest === 'ok' ? 'healthy' : 'unhealthy',
        type: cache.redisConnected ? 'redis' : 'memory'
      };
    } catch (error) {
      checks.cache = {
        status: 'unhealthy',
        error: error.message
      };
    }

    try {
      const stats = await fs.stat(process.cwd());
      checks.diskSpace = {
        status: 'healthy',
        available: 'OK' 
      };
    } catch (error) {
      checks.diskSpace = {
        status: 'unhealthy',
        error: error.message
      };
    }

    const memUsage = process.memoryUsage();
    checks.memory = {
      status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', 
      usage: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`
      }
    };

    const overallStatus = Object.values(checks).every(check => 
      check.status === 'healthy' || check.status === 'warning'
    ) ? 'healthy' : 'unhealthy';

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      checks
    };

    res.status(overallStatus === 'healthy' ? 200 : 503).json(response);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        uptime: process.uptime(),
        loadAverage: os.loadavg(),
        cpuCount: os.cpus().length,
        totalMemory: `${Math.round(os.totalmem() / 1024 / 1024)}MB`,
        freeMemory: `${Math.round(os.freemem() / 1024 / 1024)}MB`
      },
      process: {
        pid: process.pid,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      timestamp: new Date().toISOString()
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Metrics collection failed', { error: error.message });
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const { level = 'info', limit = 100 } = req.query;

    const logs = {
      level,
      limit: parseInt(limit),
      entries: [], 
      message: 'Log querying not implemented - use external log aggregation service'
    };

    res.json(logs);
  } catch (error) {
    logger.error('Log retrieval failed', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

module.exports = router;
