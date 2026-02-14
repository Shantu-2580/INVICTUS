const fs = require('fs');
const XLSX = require('xlsx');

/**
 * Parses a custom multi-tab CSV file into an XLSX Workbook object.
 * Format expected:
 * === TAB: SheetName ===
 * CSV Content...
 * 
 * @param {string} filePath - Path to the CSV file
 * @returns {object} - XLSX Workbook object
 */
const readCSVFile = (filePath) => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Regex to split by the tab marker. 
        // Matches start of line, === TAB: ..., ===, end of line.
        // The capturing group (.*?) captures the sheet name.
        const tabRegex = /^=== TAB: (.*?) ===$/gm;

        const parts = fileContent.split(tabRegex);

        // split results: [ 'garbage before first tab', 'Sheet1', 'content1', 'Sheet2', 'content2', ... ]
        // If file starts with marker, first element is empty string.

        const workbook = {
            SheetNames: [],
            Sheets: {}
        };

        // We expect pairs of (SheetName, Content) starting from index 1.
        for (let i = 1; i < parts.length; i += 2) {
            const sheetName = parts[i].trim();
            const csvContent = parts[i + 1].trim();

            if (!sheetName) continue;

            // Parse the CSV content chunk using XLSX
            const tempWb = XLSX.read(csvContent, { type: 'string', raw: true });
            const firstSheetName = tempWb.SheetNames[0];
            const sheet = tempWb.Sheets[firstSheetName];

            workbook.SheetNames.push(sheetName);
            workbook.Sheets[sheetName] = sheet;
        }

        // Fallback: If no tabs detected, treat whole file as one sheet named "Sheet1"
        if (workbook.SheetNames.length === 0) {
            const tempWb = XLSX.readFile(filePath);
            return tempWb;
        }

        return workbook;

    } catch (error) {
        throw new Error(`Failed to read CSV file: ${error.message}`);
    }
};

module.exports = {
    readCSVFile
};
