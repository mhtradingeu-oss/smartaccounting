const compression = require('compression');
const helmet = require('helmet');
const responseTime = require('response-time');
const morgan = require('morgan');
const cluster = require('cluster');
const os = require('os');
const logger = require('../lib/logger');
const { cache } = require('../lib/cache');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      totalResponseTime: 0,
      errors: 0,
      slowRequests: 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };

    setInterval(() => this.collectMetrics(), 30000);
  }

  collectMetrics() {
    this.metrics.memoryUsage = process.memoryUsage();
    this.metrics.cpuUsage = process.cpuUsage();

    logger.performance('System Metrics', 0, {
      memory: this.metrics.memoryUsage,
      cpu: this.metrics.cpuUsage,
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      slowRequestRate: this.getSlowRequestRate()
    });
  }

  recordRequest(duration, error = false) {
    this.metrics.requests++;
    this.metrics.totalResponseTime += duration;

    if (error) {
      this.metrics.errors++;
    }

    if (duration > 1000) { 
      this.metrics.slowRequests++;
    }
  }

  getAverageResponseTime() {
    return this.metrics.requests > 0 
      ? (this.metrics.totalResponseTime / this.metrics.requests).toFixed(2)
      : 0;
  }

  getErrorRate() {
    return this.metrics.requests > 0 
      ? ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2)
      : 0;
  }

  getSlowRequestRate() {
    return this.metrics.requests > 0 
      ? ((this.metrics.slowRequests / this.metrics.requests) * 100).toFixed(2)
      : 0;
  }

  getMetrics() {
    return {
      ...this.metrics,
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      slowRequestRate: this.getSlowRequestRate(),
      uptime: process.uptime(),
      loadAverage: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem()
    };
  }
}

const performanceMonitor = new PerformanceMonitor();

const performanceMiddleware = (app) => {
  
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024, 
    level: 6 
  }));

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:
        scriptSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "https:
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:
      }
    },
    crossOriginEmbedderPolicy: false 
  }));

  app.use(responseTime((req, res, time) => {
    const isError = res.statusCode >= 400;
    performanceMonitor.recordRequest(time, isError);

    res.set('X-Response-Time', `${time}ms`);
    res.set('X-Request-ID', req.id || 'unknown');

    if (time > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: time,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
  }));

  const morganFormat = process.env.NODE_ENV === 'production' 
    ? 'combined' 
    : ':method :url :status :response-time ms - :res[content-length]';

  app.use(morgan(morganFormat, {
    stream: {
      write: (message) => logger.info(message.trim())
    },
    skip: (req, res) => {
      
      return req.path === '/api/health' || req.path.startsWith('/static/');
    }
  }));

  app.use((req, res, next) => {
    req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.set('X-Request-ID', req.id);
    next();
  });

  app.use((req, res, next) => {
    const memUsage = process.memoryUsage();

    if (memUsage.heapUsed > 100 * 1024 * 1024) { 
      logger.warn('High memory usage detected', {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        path: req.path
      });
    }

    next();
  });

  app.use((req, res, next) => {
    
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
      res.set('Cache-Control', 'public, max-age=86400'); 
    } else if (req.path.startsWith('/api/')) {
      
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
    next();
  });

  app.set('etag', 'weak');

  app.get('/api/performance/metrics', (req, res) => {
    res.json(performanceMonitor.getMetrics());
  });

  app.get('/api/health/detailed', (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      loadAverage: os.loadavg(),
      performance: performanceMonitor.getMetrics(),
      cache: cache.getStats()
    };
    res.json(health);
  });
};

const setupCluster = () => {
  if (cluster.isMaster && process.env.NODE_ENV === 'production') {
    const numCPUs = os.cpus().length;
    const numWorkers = Math.min(numCPUs, 4); 

    logger.info(`Master ${process.pid} starting ${numWorkers} workers`);

    for (let i = 0; i < numWorkers; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      logger.error(`Worker ${worker.process.pid} died`, { code, signal });
      cluster.fork(); 
    });

    return false; 
  }

  return true; 
};

module.exports = {
  performanceMiddleware,
  performanceMonitor,
  setupCluster
};