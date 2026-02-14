const express = require('express');
const router = express.Router();
const {
    getConsumptionSummary,
    getTopConsumedComponents,
    getLowStockComponents,
    getProcurementAlerts,
    resolveProcurementAlert,
    getProductionStats
} = require('../controllers/analyticsController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

// All analytics routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/analytics/consumption-summary
 * @desc    Get component-wise consumption summary
 * @access  Private
 * @query   startDate, endDate (optional)
 */
router.get('/consumption-summary', getConsumptionSummary);

/**
 * @route   GET /api/analytics/top-consumed
 * @desc    Get top consumed components
 * @access  Private
 * @query   limit (default: 10)
 */
router.get('/top-consumed', getTopConsumedComponents);

/**
 * @route   GET /api/analytics/low-stock
 * @desc    Get components with low stock (< 20% of monthly requirement)
 * @access  Private
 */
router.get('/low-stock', getLowStockComponents);

/**
 * @route   GET /api/analytics/procurement-alerts
 * @desc    Get procurement triggers/alerts
 * @access  Private
 * @query   status (default: open)
 */
router.get('/procurement-alerts', getProcurementAlerts);

/**
 * @route   PUT /api/analytics/procurement-alerts/:id/resolve
 * @desc    Resolve a procurement alert
 * @access  Private (Admin)
 */
router.put('/procurement-alerts/:id/resolve', requireAdmin, resolveProcurementAlert);

/**
 * @route   GET /api/analytics/production-stats
 * @desc    Get production statistics by PCB
 * @access  Private
 * @query   startDate, endDate (optional)
 */
router.get('/production-stats', getProductionStats);

module.exports = router;
