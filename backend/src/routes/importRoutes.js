const express = require('express');
const router = express.Router();
const {
    previewExcelFile,
    importExcelData,
    getAvailableFiles,
    analyzeImportStrategy
} = require('../controllers/importController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

// All import routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/import/files
 * @desc    Get list of available Excel files for import
 * @access  Private
 */
router.get('/files', getAvailableFiles);

/**
 * @route   GET /api/import/preview/:filename
 * @desc    Preview Excel file structure and data
 * @access  Private
 * @param   filename - Name of Excel file (Bajaj PCB Dec 25 Data.xlsm or Atomberg Data.xlsm)
 */
router.get('/preview/:filename', previewExcelFile);

/**
 * @route   POST /api/import/analyze
 * @desc    Analyze Excel file and suggest import strategy
 * @access  Private
 * @body    { filename: string }
 */
router.post('/analyze', analyzeImportStrategy);

/**
 * @route   POST /api/import/excel
 * @desc    Import data from Excel file into database
 * @access  Private (Admin)
 * @body    { filename: string, sheetName: string, importType?: 'auto'|'components'|'bom' }
 */
router.post('/excel', requireAdmin, importExcelData);

module.exports = router;
