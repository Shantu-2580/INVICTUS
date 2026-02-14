const path = require('path');
require('dotenv').config();
const { getColumnHeaders, sheetToJSON, readExcelFile, detectColumnMapping } = require('./src/utils/excelParser');

// Analyze all sheets in both files
const files = {
    'Bajaj PCB Dec 25 Data.xlsm': [
        'Master_Summary',
        'Dashboard',
        'Pivot',
        '974290',
        '971039',
        '971065',
        '971089',
        '974284',
        '971040',
        '971084',
        '974278'
    ],
    'Atomberg Data.xlsm': [
        'Part Code wise OK_SCRAP',
        'Component Consumption',
        'Pivot',
        'Master',
        'PCB-Serial-No'
    ]
};

console.log('='.repeat(80));
console.log('COMPREHENSIVE SHEET ANALYSIS');
console.log('='.repeat(80));

for (const [filename, sheets] of Object.entries(files)) {
    const filePath = path.join(__dirname, 'data', filename);

    console.log(`\n📁 FILE: ${filename}`);
    console.log('='.repeat(80));

    try {
        const workbook = readExcelFile(filePath);

        for (const sheetName of sheets) {
            console.log(`\n  📋 SHEET: "${sheetName}"`);
            console.log('  ' + '-'.repeat(76));

            try {
                const headers = getColumnHeaders(workbook, sheetName);
                const data = sheetToJSON(workbook, sheetName);
                const mapping = detectColumnMapping(headers);

                console.log(`  Rows: ${data.length}`);
                console.log(`  Columns: ${headers.length}`);
                console.log(`  Headers: ${headers.slice(0, 8).join(', ')}${headers.length > 8 ? ', ...' : ''}`);

                console.log(`\n  🔍 Detected Mapping:`);
                console.log(`    Component Name: ${mapping.component_name || '❌'}`);
                console.log(`    Part Number: ${mapping.part_number || '❌'}`);
                console.log(`    Current Stock: ${mapping.current_stock || '❌'}`);
                console.log(`    Monthly Required: ${mapping.monthly_required_quantity || '❌'}`);
                console.log(`    PCB Name: ${mapping.pcb_name || '❌'}`);
                console.log(`    Quantity per PCB: ${mapping.quantity_per_pcb || '❌'}`);

                if (data.length > 0) {
                    console.log(`\n  📊 Sample Row 1:`);
                    const sample = data[0];
                    const keys = Object.keys(sample).slice(0, 6);
                    keys.forEach(key => {
                        const value = sample[key];
                        const displayValue = value ? String(value).substring(0, 40) : 'null';
                        console.log(`    ${key}: ${displayValue}`);
                    });

                    if (data.length > 1) {
                        console.log(`\n  📊 Sample Row 2:`);
                        const sample2 = data[1];
                        const keys2 = Object.keys(sample2).slice(0, 6);
                        keys2.forEach(key => {
                            const value = sample2[key];
                            const displayValue = value ? String(value).substring(0, 40) : 'null';
                            console.log(`    ${key}: ${displayValue}`);
                        });
                    }
                }

            } catch (error) {
                console.log(`  ❌ Error: ${error.message}`);
            }
        }

    } catch (error) {
        console.error(`\n❌ Error reading ${filename}:`, error.message);
    }
}

console.log('\n' + '='.repeat(80));
console.log('Analysis complete!');
