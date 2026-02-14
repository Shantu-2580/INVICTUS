const pool = require('../config/db');
const path = require('path');
const {
    analyzeExcelStructure,
    extractComponents,
    extractBOM,
    getSheetNames,
    readExcelFile
} = require('../utils/excelParser');

/**
 * Preview Excel file structure
 * GET /api/import/preview/:filename
 */
const previewExcelFile = async (req, res) => {
    try {
        const { filename } = req.params;

        // Validate filename
        const allowedFiles = ['Bajaj PCB Dec 25 Data.xlsm', 'Atomberg Data.xlsm'];
        if (!allowedFiles.includes(filename)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file. Allowed files: Bajaj PCB Dec 25 Data.xlsm, Atomberg Data.xlsm'
            });
        }

        const filePath = path.join(__dirname, '../../data', filename);
        const analysis = analyzeExcelStructure(filePath);

        res.status(200).json({
            success: true,
            message: 'File structure analyzed successfully',
            data: analysis
        });
    } catch (error) {
        console.error('Preview error:', error);
        res.status(500).json({
            success: false,
            message: 'Error previewing Excel file',
            error: error.message
        });
    }
};

/**
 * Import data from Excel file
 * POST /api/import/excel
 */
const importExcelData = async (req, res) => {
    const client = await pool.connect();

    try {
        const { filename, sheetName, importType = 'auto' } = req.body;

        // Validation
        if (!filename) {
            return res.status(400).json({
                success: false,
                message: 'Please provide filename'
            });
        }

        const allowedFiles = ['Bajaj PCB Dec 25 Data.xlsm', 'Atomberg Data.xlsm'];
        if (!allowedFiles.includes(filename)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file. Allowed files: Bajaj PCB Dec 25 Data.xlsm, Atomberg Data.xlsm'
            });
        }

        const filePath = path.join(__dirname, '../../data', filename);

        // Get available sheets if no sheet specified
        if (!sheetName) {
            const workbook = readExcelFile(filePath);
            const sheets = getSheetNames(workbook);

            return res.status(400).json({
                success: false,
                message: 'Please specify sheetName',
                availableSheets: sheets
            });
        }

        // START TRANSACTION
        await client.query('BEGIN');

        const importSummary = {
            componentsAdded: 0,
            componentsUpdated: 0,
            pcbsAdded: 0,
            bomMappingsAdded: 0,
            errors: []
        };

        // Extract components
        let components = [];
        try {
            components = extractComponents(filePath, sheetName);
        } catch (error) {
            importSummary.errors.push({
                type: 'component_extraction',
                message: error.message
            });
        }

        // Import components with UPSERT logic
        for (const comp of components) {
            try {
                // Validate component data
                if (!comp.name || !comp.part_number) {
                    importSummary.errors.push({
                        type: 'validation',
                        data: comp,
                        message: 'Missing name or part_number'
                    });
                    continue;
                }

                // Check if component exists
                const existingComp = await client.query(
                    'SELECT id, current_stock FROM components WHERE part_number = $1',
                    [comp.part_number]
                );

                if (existingComp.rows.length > 0) {
                    // Update existing component (add to stock)
                    await client.query(
                        `UPDATE components 
             SET current_stock = current_stock + $1,
                 monthly_required_quantity = GREATEST(monthly_required_quantity, $2),
                 name = $3
             WHERE part_number = $4`,
                        [comp.current_stock, comp.monthly_required_quantity, comp.name, comp.part_number]
                    );
                    importSummary.componentsUpdated++;
                } else {
                    // Insert new component
                    await client.query(
                        `INSERT INTO components (name, part_number, current_stock, monthly_required_quantity)
             VALUES ($1, $2, $3, $4)`,
                        [comp.name, comp.part_number, comp.current_stock, comp.monthly_required_quantity]
                    );
                    importSummary.componentsAdded++;
                }
            } catch (error) {
                importSummary.errors.push({
                    type: 'component_insert',
                    component: comp.name,
                    message: error.message
                });
            }
        }

        // Extract and import BOM data if import type includes BOM
        if (importType === 'auto' || importType === 'bom') {
            let bomData = [];
            try {
                bomData = extractBOM(filePath, sheetName);
            } catch (error) {
                importSummary.errors.push({
                    type: 'bom_extraction',
                    message: error.message
                });
            }

            // Group BOM data by PCB
            const pcbMap = new Map();
            for (const bom of bomData) {
                if (!pcbMap.has(bom.pcb_name)) {
                    pcbMap.set(bom.pcb_name, []);
                }
                pcbMap.get(bom.pcb_name).push(bom);
            }

            // Import PCBs and BOM mappings
            for (const [pcbName, bomEntries] of pcbMap.entries()) {
                try {
                    // Check if PCB exists
                    let pcbResult = await client.query(
                        'SELECT id FROM pcbs WHERE pcb_name = $1',
                        [pcbName]
                    );

                    let pcbId;
                    if (pcbResult.rows.length === 0) {
                        // Insert new PCB
                        const insertResult = await client.query(
                            'INSERT INTO pcbs (pcb_name) VALUES ($1) RETURNING id',
                            [pcbName]
                        );
                        pcbId = insertResult.rows[0].id;
                        importSummary.pcbsAdded++;
                    } else {
                        pcbId = pcbResult.rows[0].id;
                    }

                    // Insert BOM mappings for this PCB
                    for (const bomEntry of bomEntries) {
                        try {
                            // Find component by name or part number
                            const componentResult = await client.query(
                                `SELECT id FROM components 
                 WHERE name = $1 OR part_number = $1
                 LIMIT 1`,
                                [bomEntry.component_identifier]
                            );

                            if (componentResult.rows.length === 0) {
                                importSummary.errors.push({
                                    type: 'bom_component_not_found',
                                    pcb: pcbName,
                                    component: bomEntry.component_identifier
                                });
                                continue;
                            }

                            const componentId = componentResult.rows[0].id;

                            // Check if mapping exists
                            const existingMapping = await client.query(
                                'SELECT id FROM pcb_components WHERE pcb_id = $1 AND component_id = $2',
                                [pcbId, componentId]
                            );

                            if (existingMapping.rows.length === 0) {
                                // Insert new mapping
                                await client.query(
                                    `INSERT INTO pcb_components (pcb_id, component_id, quantity_per_pcb)
                   VALUES ($1, $2, $3)`,
                                    [pcbId, componentId, bomEntry.quantity_per_pcb]
                                );
                                importSummary.bomMappingsAdded++;
                            } else {
                                // Update existing mapping
                                await client.query(
                                    `UPDATE pcb_components 
                   SET quantity_per_pcb = $1
                   WHERE pcb_id = $2 AND component_id = $3`,
                                    [bomEntry.quantity_per_pcb, pcbId, componentId]
                                );
                            }
                        } catch (error) {
                            importSummary.errors.push({
                                type: 'bom_mapping_insert',
                                pcb: pcbName,
                                component: bomEntry.component_identifier,
                                message: error.message
                            });
                        }
                    }
                } catch (error) {
                    importSummary.errors.push({
                        type: 'pcb_insert',
                        pcb: pcbName,
                        message: error.message
                    });
                }
            }
        }

        // COMMIT TRANSACTION
        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: 'Excel data imported successfully',
            data: importSummary
        });

    } catch (error) {
        // ROLLBACK on error
        await client.query('ROLLBACK');
        console.error('Import error:', error);
        res.status(500).json({
            success: false,
            message: 'Error importing Excel data. Transaction rolled back.',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * Get list of available Excel files
 * GET /api/import/files
 */
const getAvailableFiles = async (req, res) => {
    try {
        const files = [
            {
                filename: 'Bajaj PCB Dec 25 Data.xlsm',
                description: 'Bajaj PCB December 2025 Data'
            },
            {
                filename: 'Atomberg Data.xlsm',
                description: 'Atomberg Component Data'
            }
        ];

        res.status(200).json({
            success: true,
            count: files.length,
            data: { files }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching available files',
            error: error.message
        });
    }
};

/**
 * Analyze and suggest import strategy
 * POST /api/import/analyze
 */
const analyzeImportStrategy = async (req, res) => {
    try {
        const { filename } = req.body;

        if (!filename) {
            return res.status(400).json({
                success: false,
                message: 'Please provide filename'
            });
        }

        const allowedFiles = ['Bajaj PCB Dec 25 Data.xlsm', 'Atomberg Data.xlsm'];
        if (!allowedFiles.includes(filename)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid filename'
            });
        }

        const filePath = path.join(__dirname, '../../data', filename);
        const analysis = analyzeExcelStructure(filePath);

        // Suggest import strategy for each sheet
        const suggestions = analysis.sheets.map(sheet => {
            const hasComponents = sheet.headers.some(h =>
                h && String(h).toLowerCase().includes('component')
            );
            const hasPCB = sheet.headers.some(h =>
                h && String(h).toLowerCase().includes('pcb')
            );

            let suggestedType = 'components';
            if (hasComponents && hasPCB) {
                suggestedType = 'bom';
            } else if (hasPCB) {
                suggestedType = 'pcbs';
            }

            return {
                sheetName: sheet.name,
                rowCount: sheet.rowCount,
                detectedType: suggestedType,
                headers: sheet.headers,
                sampleData: sheet.sampleRows.slice(0, 2)
            };
        });

        res.status(200).json({
            success: true,
            message: 'Import strategy analyzed',
            data: {
                fileName: analysis.fileName,
                suggestions
            }
        });
    } catch (error) {
        console.error('Analyze error:', error);
        res.status(500).json({
            success: false,
            message: 'Error analyzing import strategy',
            error: error.message
        });
    }
};

module.exports = {
    previewExcelFile,
    importExcelData,
    getAvailableFiles,
    analyzeImportStrategy
};
