const express = require('express');
const router = express.Router();
const {
    getAllProductionLogs,
    recordProduction,
    getProductionLogById
} = require('../controllers/productionController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

// All production routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/production
 * @desc    Get all production logs
 * @access  Private
 */
router.get('/', getAllProductionLogs);

/**
 * @route   GET /api/production/:id
 * @desc    Get production log by ID with details
 * @access  Private
 */
router.get('/:id', getProductionLogById);

/**
 * @route   POST /api/production
 * @desc    Record production (deduct stock, create consumption history, trigger procurement)
 * @access  Private (Admin)
 */
router.post('/', requireAdmin, recordProduction);

module.exports = router;
