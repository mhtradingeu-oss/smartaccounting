
const express = require('express');
const router = express.Router();

const DashboardService = require('../services/dashboardService');
const { authenticate } = require('../middleware/authMiddleware'); 
const logger = require('../lib/logger');

// Log all dashboard requests
router.use((req, res, next) => {
  logger.info('Dashboard route accessed:', req.path);
  next();
});

// Apply authentication middleware
router.use(authenticate);

/**
 * @route GET /api/dashboard
 * @desc Get comprehensive dashboard data
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    // Get all dashboard data in one response
    const [stats, monthlyData, taxSummary, uploadStats, activities] = await Promise.all([
      DashboardService.getStats(companyId),
      DashboardService.getMonthlyData(companyId),
      DashboardService.getTaxSummary(companyId),
      DashboardService.getUploadStats(companyId),
      DashboardService.getRecentActivities(companyId, 5)
    ]);

    res.json({
      success: true,
      data: {
        stats,
        monthlyData,
        taxSummary,
        uploadStats,
        activities
      },
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    logger.error('Dashboard main route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/dashboard/stats
 * @desc Get dashboard statistics
 * @access Private
 */
router.get('/stats', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const stats = await DashboardService.getStats(companyId);
    
    res.json({
      success: true,
      data: stats,
      message: 'Dashboard statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('Dashboard stats route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/dashboard/monthly-data
 * @desc Get monthly data for charts
 * @access Private
 */
router.get('/monthly-data', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const monthlyData = await DashboardService.getMonthlyData(companyId);
    
    res.json({
      success: true,
      data: monthlyData,
      message: 'Monthly data retrieved successfully'
    });
  } catch (error) {
    logger.error('Dashboard monthly data route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve monthly data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/dashboard/tax-summary
 * @desc Get tax summary
 * @access Private
 */
router.get('/tax-summary', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const taxSummary = await DashboardService.getTaxSummary(companyId);
    
    res.json({
      success: true,
      data: taxSummary,
      message: 'Tax summary retrieved successfully'
    });
  } catch (error) {
    logger.error('Dashboard tax summary route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tax summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/dashboard/upload-stats
 * @desc Get upload statistics
 * @access Private
 */
router.get('/upload-stats', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const uploadStats = await DashboardService.getUploadStats(companyId);
    
    res.json({
      success: true,
      data: uploadStats,
      message: 'Upload statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('Dashboard upload stats route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve upload statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/dashboard/activities
 * @desc Get recent activities
 * @access Private
 */
router.get('/activities', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const activities = await DashboardService.getRecentActivities(companyId, limit);
    
    res.json({
      success: true,
      data: activities,
      message: 'Recent activities retrieved successfully'
    });
  } catch (error) {
    logger.error('Dashboard activities route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/dashboard/health
 * @desc Dashboard health check
 * @access Private
 */
router.get('/health', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    // Quick health check - just verify we can access the database
    const { sequelize } = require('../config/database');
    await sequelize.authenticate();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        companyId: companyId
      },
      message: 'Dashboard service is healthy'
    });
  } catch (error) {
    logger.error('Dashboard health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Dashboard service health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
