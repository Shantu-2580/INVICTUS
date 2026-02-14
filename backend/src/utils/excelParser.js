const XLSX = require('xlsx');
const path = require('path');

/**
 * Excel Parser Utility
 * Handles parsing of .xlsm files and extracting structured data
 */

/**
 * Read Excel file and return workbook
 * @param {string} filePath - Absolute path to Excel file
 * @returns {object} - XLSX workbook object
 */
const readExcelFile = (filePath) => {
    try {
        const workbook = XLSX.readFile(filePath, {
            cellDates: true,
            cellNF: false,
            cellText: false
        });
        return workbook;
    } catch (error) {
        throw new Error(`Failed to read Excel file: ${error.message}`);
    }
};

/**
 * Get all sheet names from workbook
 * @param {object} workbook - XLSX workbook
 * @returns {array} - Array of sheet names
 */
const getSheetNames = (workbook) => {
    return workbook.SheetNames;
};

/**
 * Convert sheet to JSON array
 * @param {object} workbook - XLSX workbook
 * @param {string} sheetName - Name of sheet to convert
 * @returns {array} - Array of row objects
 */
const sheetToJSON = (workbook, sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
    }

    return XLSX.utils.sheet_to_json(sheet, {
        defval: null,
        blankrows: false,
        raw: false
    });
};

/**
 * Get column headers from a sheet
 * @param {object} workbook - XLSX workbook
 * @param {string} sheetName - Sheet name
 * @returns {array} - Array of column header names
 */
const getColumnHeaders = (workbook, sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        return [];
    }

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    return data.length > 0 ? data[0] : [];
};

/**
 * Analyze Excel file structure
 * @param {string} filePath - Path to Excel file
 * @returns {object} - File structure analysis
 */
const analyzeExcelStructure = (filePath) => {
    try {
        const workbook = readExcelFile(filePath);
        const sheetNames = getSheetNames(workbook);

        const analysis = {
            fileName: path.basename(filePath),
            totalSheets: sheetNames.length,
            sheets: []
        };

        for (const sheetName of sheetNames) {
            const headers = getColumnHeaders(workbook, sheetName);
            const data = sheetToJSON(workbook, sheetName);

            analysis.sheets.push({
                name: sheetName,
                headers: headers,
                rowCount: data.length,
                sampleRows: data.slice(0, 5) // First 5 rows
            });
        }

        return analysis;
    } catch (error) {
        throw new Error(`Failed to analyze Excel structure: ${error.message}`);
    }
};

/**
 * Detect column mapping for database
 * Uses fuzzy matching to identify relevant columns
 * @param {array} headers - Array of column headers
 * @returns {object} - Detected column mappings
 */
const detectColumnMapping = (headers) => {
    const mapping = {
        component_name: null,
        part_number: null,
        current_stock: null,
        monthly_required_quantity: null,
        pcb_name: null,
        quantity_per_pcb: null
    };

    // Normalize headers for matching
    const normalizedHeaders = headers.map(h =>
        String(h).toLowerCase().trim()
    );

    normalizedHeaders.forEach((header, index) => {
        const original = headers[index];

        // Component name patterns
        if (header.includes('component') && header.includes('name')) {
            mapping.component_name = original;
        } else if (header.includes('item') && header.includes('name')) {
            mapping.component_name = original;
        } else if (header === 'component' || header === 'item') {
            mapping.component_name = original;
        }

        // Part number patterns
        if (header.includes('part') && header.includes('number')) {
            mapping.part_number = original;
        } else if (header.includes('part') && header.includes('no')) {
            mapping.part_number = original;
        } else if (header === 'partno' || header === 'part_no') {
            mapping.part_number = original;
        } else if (header.includes('code') || header.includes('sku')) {
            mapping.part_number = original;
        }

        // Stock patterns
        if (header.includes('stock') || header.includes('inventory')) {
            mapping.current_stock = original;
        } else if (header.includes('qty') && !header.includes('required')) {
            mapping.current_stock = original;
        } else if (header === 'quantity' && !header.includes('required')) {
            mapping.current_stock = original;
        }

        // Monthly required patterns
        if (header.includes('monthly') && header.includes('required')) {
            mapping.monthly_required_quantity = original;
        } else if (header.includes('required') && header.includes('qty')) {
            mapping.monthly_required_quantity = original;
        }

        // PCB name patterns
        if (header.includes('pcb') && header.includes('name')) {
            mapping.pcb_name = original;
        } else if (header === 'pcb' || header === 'board') {
            mapping.pcb_name = original;
        }

        // Quantity per PCB patterns
        if (header.includes('qty') && header.includes('pcb')) {
            mapping.quantity_per_pcb = original;
        } else if (header.includes('per') && header.includes('pcb')) {
            mapping.quantity_per_pcb = original;
        } else if (header.includes('usage') && header.includes('pcb')) {
            mapping.quantity_per_pcb = original;
        }
    });

    return mapping;
};

/**
 * Extract components data from Excel
 * @param {string} filePath - Path to Excel file
 * @param {string} sheetName - Sheet name to extract from
 * @returns {array} - Array of component objects
 */
const extractComponents = (filePath, sheetName) => {
    try {
        const workbook = readExcelFile(filePath);
        const headers = getColumnHeaders(workbook, sheetName);
        const data = sheetToJSON(workbook, sheetName);
        const mapping = detectColumnMapping(headers);

        const components = [];

        for (const row of data) {
            // Skip empty rows
            if (!row || Object.keys(row).length === 0) continue;

            const component = {
                name: mapping.component_name ? row[mapping.component_name] : null,
                part_number: mapping.part_number ? row[mapping.part_number] : null,
                current_stock: mapping.current_stock ?
                    parseFloat(row[mapping.current_stock]) || 0 : 0,
                monthly_required_quantity: mapping.monthly_required_quantity ?
                    parseFloat(row[mapping.monthly_required_quantity]) || 0 : 0
            };

            // Only add if we have at least name or part number
            if (component.name || component.part_number) {
                // Generate part number if missing
                if (!component.part_number && component.name) {
                    component.part_number = `AUTO-${component.name.substring(0, 20).toUpperCase().replace(/[^A-Z0-9]/g, '-')}`;
                }

                components.push(component);
            }
        }

        return components;
    } catch (error) {
        throw new Error(`Failed to extract components: ${error.message}`);
    }
};

/**
 * Extract BOM data (PCB-Component mappings)
 * @param {string} filePath - Path to Excel file
 * @param {string} sheetName - Sheet name
 * @returns {array} - Array of BOM mappings
 */
const extractBOM = (filePath, sheetName) => {
    try {
        const workbook = readExcelFile(filePath);
        const headers = getColumnHeaders(workbook, sheetName);
        const data = sheetToJSON(workbook, sheetName);
        const mapping = detectColumnMapping(headers);

        const bomMappings = [];

        for (const row of data) {
            if (!row || Object.keys(row).length === 0) continue;

            const bomEntry = {
                pcb_name: mapping.pcb_name ? row[mapping.pcb_name] : null,
                component_identifier: mapping.component_name ?
                    row[mapping.component_name] :
                    (mapping.part_number ? row[mapping.part_number] : null),
                quantity_per_pcb: mapping.quantity_per_pcb ?
                    parseInt(row[mapping.quantity_per_pcb]) || 1 : 1
            };

            if (bomEntry.pcb_name && bomEntry.component_identifier) {
                bomMappings.push(bomEntry);
            }
        }

        return bomMappings;
    } catch (error) {
        throw new Error(`Failed to extract BOM: ${error.message}`);
    }
};

module.exports = {
    readExcelFile,
    getSheetNames,
    sheetToJSON,
    getColumnHeaders,
    analyzeExcelStructure,
    detectColumnMapping,
    extractComponents,
    extractBOM
};
