const express = require('express');
const router = express.Router();
const {
    getAllComponents,
    getComponentById,
    createComponent,
    updateComponent,
    deleteComponent
} = require('../controllers/componentController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

// All component routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/components
 * @desc    Get all components
 * @access  Private
 */
router.get('/', getAllComponents);

/**
 * @route   GET /api/components/:id
 * @desc    Get component by ID
 * @access  Private
 */
router.get('/:id', getComponentById);

/**
 * @route   POST /api/components
 * @desc    Create new component
 * @access  Private (Admin)
 */
router.post('/', requireAdmin, createComponent);

/**
 * @route   PUT /api/components/:id
 * @desc    Update component
 * @access  Private (Admin)
 */
router.put('/:id', requireAdmin, updateComponent);

/**
 * @route   DELETE /api/components/:id
 * @desc    Delete component
 * @access  Private (Admin)
 */
router.delete('/:id', requireAdmin, deleteComponent);

module.exports = router;
