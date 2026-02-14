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
 * @param {string|object} source - Path to Excel file OR Workbook object
 * @returns {object} - File structure analysis
 */
const analyzeExcelStructure = (source) => {
    try {
        let workbook;
        if (typeof source === 'string') {
            workbook = readExcelFile(source);
        } else {
            workbook = source;
        }
        const sheetNames = getSheetNames(workbook);

        const analysis = {
            fileName: typeof source === 'string' ? path.basename(source) : 'Workbook Object',
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

    const normalizedHeaders = headers.map(h =>
        String(h || '').toLowerCase().trim()
    );

    normalizedHeaders.forEach((header, index) => {
        const original = headers[index];

        /* =========================
           COMPONENT NAME
        ========================= */

        if (
            header.includes('component') ||
            header.includes('description') ||
            header.includes('item') ||
            header.includes('material') ||
            header.includes('change') // Matches "Component Change"
        ) {
            mapping.component_name = original;
        }

        /* =========================
           PART NUMBER
        ========================= */

        if (
            header.includes('part') ||
            header.includes('code') ||
            header.includes('sku') ||
            header.includes('material code') ||
            header.includes('item code')
        ) {
            mapping.part_number = original;
        }

        /* =========================
           CURRENT STOCK
        ========================= */

        if (
            header.includes('stock') ||
            header.includes('inventory') ||
            header.includes('available') ||
            header.includes('balance') ||
            header.includes('bal qty') ||
            header === 'qty'
        ) {
            mapping.current_stock = original;
        }

        /* =========================
           MONTHLY REQUIRED
        ========================= */

        if (
            (header.includes('monthly') ||
                header.includes('required') ||
                header.includes('requirement') ||
                header.includes('consumption') ||
                header.includes('req qty')) &&
            !header.includes('entry') && // Exclude "Consumption Entry"
            !header.includes('component') // Exclude "Component Consumption"
        ) {
            mapping.monthly_required_quantity = original;
        }

        /* =========================
           PCB NAME
        ========================= */

        if (
            header.includes('pcb') ||
            header.includes('board') ||
            header.includes('assembly') ||
            header.includes('part code') // "Part Code" often refers to the PCB Model in these files
        ) {
            mapping.pcb_name = original;
        }

        /* =========================
           QTY PER PCB
        ========================= */

        if (
            header.includes('per pcb') ||
            header.includes('usage') ||
            header.includes('qty/pcb') ||
            header.includes('quantity per pcb')
        ) {
            mapping.quantity_per_pcb = original;
        }
    });

    return mapping;
};


/**
 * Extract components data from Excel
 * @param {string|object} source - Path to Excel file OR Workbook object
 * @param {string} sheetName - Sheet name to extract from
 * @returns {array} - Array of component objects
 */
const extractComponents = (source, sheetName) => {
    try {
        let workbook;
        if (typeof source === 'string') {
            workbook = readExcelFile(source);
        } else {
            workbook = source;
        }
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

            // Fallback for name
            if (!component.name && component.part_number) {
                component.name = component.part_number;
            }

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
 * @param {string|object} source - Path to Excel file OR Workbook object
 * @param {string} sheetName - Sheet name
 * @returns {array} - Array of BOM mappings
 */
const extractBOM = (source, sheetName) => {
    try {
        let workbook;
        if (typeof source === 'string') {
            workbook = readExcelFile(source);
        } else {
            workbook = source;
        }
        const headers = getColumnHeaders(workbook, sheetName);
        const data = sheetToJSON(workbook, sheetName);
        const mapping = detectColumnMapping(headers);

        const bomMappings = [];

        for (const row of data) {
            if (!row || Object.keys(row).length === 0) continue;

            const pcbName = mapping.pcb_name ? row[mapping.pcb_name] : (sheetName || null);
            let componentIdentifier = mapping.component_name ?
                row[mapping.component_name] :
                (mapping.part_number ? row[mapping.part_number] : null);

            const quantity = mapping.quantity_per_pcb ?
                parseInt(row[mapping.quantity_per_pcb]) || 1 : 1;

            if (pcbName && componentIdentifier) {
                // Handle slash-separated components (e.g. "C1/C2/R1")
                const subComponents = String(componentIdentifier).split('/').map(s => s.trim()).filter(s => s.length > 0);

                for (const subComp of subComponents) {
                    bomMappings.push({
                        pcb_name: pcbName,
                        component_identifier: subComp,
                        quantity_per_pcb: 1 // Default to 1 per split item, unless we want to divide the total? Usually it means 1 of each.
                    });
                }
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
