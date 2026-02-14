const express = require('express');
const router = express.Router();
const {
    getAllPCBs,
    getPCBById,
    createPCB,
    deletePCB,
    getPCBComponents,
    addComponentToPCB,
    updatePCBComponent,
    removeComponentFromPCB
} = require('../controllers/pcbController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

// All PCB routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/pcbs
 * @desc    Get all PCBs
 * @access  Private
 */
router.get('/', getAllPCBs);

/**
 * @route   GET /api/pcbs/:id
 * @desc    Get PCB by ID
 * @access  Private
 */
router.get('/:id', getPCBById);

/**
 * @route   POST /api/pcbs
 * @desc    Create new PCB
 * @access  Private (Admin)
 */
router.post('/', requireAdmin, createPCB);

/**
 * @route   DELETE /api/pcbs/:id
 * @desc    Delete PCB
 * @access  Private (Admin)
 */
router.delete('/:id', requireAdmin, deletePCB);

/**
 * @route   GET /api/pcbs/:id/components
 * @desc    Get BOM for a PCB
 * @access  Private
 */
router.get('/:id/components', getPCBComponents);

/**
 * @route   POST /api/pcbs/:id/components
 * @desc    Add component to PCB BOM
 * @access  Private (Admin)
 */
router.post('/:id/components', requireAdmin, addComponentToPCB);

/**
 * @route   PUT /api/pcbs/:pcbId/components/:componentId
 * @desc    Update component quantity in PCB BOM
 * @access  Private (Admin)
 */
router.put('/:pcbId/components/:componentId', requireAdmin, updatePCBComponent);

/**
 * @route   DELETE /api/pcbs/:pcbId/components/:componentId
 * @desc    Remove component from PCB BOM
 * @access  Private (Admin)
 */
router.delete('/:pcbId/components/:componentId', requireAdmin, removeComponentFromPCB);

module.exports = router;
