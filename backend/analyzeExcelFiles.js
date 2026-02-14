const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { analyzeExcelStructure, detectColumnMapping, getColumnHeaders, readExcelFile, extractBOM } = require('./src/utils/excelParser');
const { readCSVFile } = require('./src/utils/csvParser');

// Setup output file
const outputLogPath = path.join(__dirname, 'analysis_results.txt');
fs.writeFileSync(outputLogPath, ''); // Clear file

function log(message) {
    console.log(message);
    fs.appendFileSync(outputLogPath, message + '\n');
}

// Analyze the Data files
const files = [
    'Bajaj_PCB_Dec_25_Data_All_Tabs.csv',
    'Atomberg_Data_All_Tabs.csv'
];

log('='.repeat(60));
log('DATA FILE ANALYSIS');
log('='.repeat(60));

for (const filename of files) {
    const filePath = path.join(__dirname, 'data', filename);

    if (!fs.existsSync(filePath)) {
        log(`\n⚠️  File not found: ${filename}, skipping...`);
        continue;
    }

    try {
        log(`\n📁 Analyzing: ${filename}`);
        log('-'.repeat(60));

        let workbook;
        if (filename.toLowerCase().endsWith('.csv')) {
            log('  Parsing as CSV...');
            workbook = readCSVFile(filePath);
        } else {
            log('  Parsing as Excel...');
            workbook = readExcelFile(filePath);
        }

        const analysis = analyzeExcelStructure(workbook);
        // Fix filename in analysis if it was passed as object
        analysis.fileName = filename;

        log(`Total Sheets: ${analysis.totalSheets}`);

        analysis.sheets.forEach((sheet, idx) => {
            log(`\n  Sheet ${idx + 1}: ${sheet.name}`);
            log(`  Row Count: ${sheet.rowCount}`);
            log(`  Headers: ${sheet.headers.join(', ')}`);

            // Detect column mapping
            const headers = getColumnHeaders(workbook, sheet.name);
            const mapping = detectColumnMapping(headers);

            log(`\n  🔍 Detected Mapping:`);
            log(`    - Component Name: ${mapping.component_name || 'NOT FOUND'}`);
            log(`    - Part Number: ${mapping.part_number || 'NOT FOUND'}`);
            log(`    - Current Stock: ${mapping.current_stock || 'NOT FOUND'}`);
            log(`    - Monthly Required: ${mapping.monthly_required_quantity || 'NOT FOUND'}`);
            log(`    - PCB Name: ${mapping.pcb_name || 'NOT FOUND'}`);
            log(`    - Quantity per PCB: ${mapping.quantity_per_pcb || 'NOT FOUND'}`);

            if (sheet.sampleRows.length > 0) {
                log(`\n  📋 Sample Data (first row):`);
                log(`    ` + JSON.stringify(sheet.sampleRows[0], null, 2).replace(/\n/g, '\n    '));
            }

            // Test BOM Extraction logic
            const bomEntries = extractBOM(workbook, sheet.name);
            if (bomEntries.length > 0) {
                log(`\n  🧩 Extracted BOM Entries (First 5 of ${bomEntries.length}):`);
                bomEntries.slice(0, 5).forEach((entry, i) => {
                    log(`    ${i + 1}. PCB: "${entry.pcb_name}" | Component: "${entry.component_identifier}" | Qty: ${entry.quantity_per_pcb}`);
                });
            } else {
                log(`\n  ⚠️ No valid BOM entries extracted from this sheet.`);
            }
        });

    } catch (error) {
        log(`\n❌ Error analyzing ${filename}: ${error.message}`);
    }
}

log('\n' + '='.repeat(60));
