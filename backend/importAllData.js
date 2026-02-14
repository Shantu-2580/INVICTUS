require('dotenv').config();
const path = require('path');
const pool = require('./src/config/db');
const XLSX = require('xlsx');
const { detectColumnMapping } = require('./src/utils/excelParser');

/**
 * Comprehensive Excel Import Script
 * Handles multiple sheets and extracts all data types
 */

async function importComprehensiveData() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('\n' + '='.repeat(60));
        console.log('COMPREHENSIVE DATA IMPORT');
        console.log('='.repeat(60));

        // ============================================
        // 1. Import from Bajaj File
        // ============================================

        console.log('\n📁 Processing: Bajaj PCB Dec 25 Data.xlsm');
        const bajajPath = path.join(__dirname, 'data', 'Bajaj PCB Dec 25 Data.xlsm');
        const bajajWB = XLSX.readFile(bajajPath);

        // Import from Master_Summary sheet (components)
        console.log('\n  📋 Processing Master_Summary sheet...');
        await importComponentsFromSheet(client, bajajWB, 'Master_Summary');

        // Import PCBs and BOMs from numbered sheets
        const pcbSheets = ['974290', '971039', '971065', '971089', '974284', '971040', '971084', '974278'];

        for (const sheetName of pcbSheets) {
            console.log(`\n  📋 Processing PCB sheet: ${sheetName}`);
            await importPCBSheet(client, bajajWB, sheetName);
        }

        // ============================================
        // 2. Import from Atomberg File
        // ============================================

        console.log('\n\n📁 Processing: Atomberg Data.xlsm');
        const atombergPath = path.join(__dirname, 'data', 'Atomberg Data.xlsm');
        const atombergWB = XLSX.readFile(atombergPath);

        // Import components
        console.log('\n  📋 Processing Part Code wise OK_SCRAP sheet...');
        await importComponentsFromSheet(client, atombergWB, 'Part Code wise OK_SCRAP');

        console.log('\n  📋 Processing Component Consumption sheet...');
        await importComponentsFromSheet(client, atombergWB, 'Component Consumption');

        // Import PCBs/BOMs
        console.log('\n  📋 Processing PCB-Serial-No sheet...');
        await importPCBSheet(client, atombergWB, 'PCB-Serial-No');

        await client.query('COMMIT');

        // ============================================
        // 3. Summary
        // ============================================

        console.log('\n' + '='.repeat(60));
        console.log('IMPORT SUMMARY');
        console.log('='.repeat(60));

        const compCount = await client.query('SELECT COUNT(*) FROM components');
        const pcbCount = await client.query('SELECT COUNT(*) FROM pcbs');
        const bomCount = await client.query('SELECT COUNT(*) FROM pcb_components');

        console.log(`✅ Components: ${compCount.rows[0].count}`);
        console.log(`✅ PCBs: ${pcbCount.rows[0].count}`);
        console.log(`✅ BOM Entries: ${bomCount.rows[0].count}`);
        console.log('='.repeat(60));

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Import failed:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Import components from a sheet
 */
async function importComponentsFromSheet(client, workbook, sheetName) {
    try {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            console.log(`    ⚠️  Sheet "${sheetName}" not found`);
            return;
        }

        const data = XLSX.utils.sheet_to_json(sheet);
        const headers = data.length > 0 ? Object.keys(data[0]) : [];
        const mapping = detectColumnMapping(headers);

        let imported = 0;

        for (const row of data) {
            const name = mapping.component_name ? row[mapping.component_name] : null;
            const partNumber = mapping.part_number ? row[mapping.part_number] : null;
            const stock = mapping.current_stock ? parseFloat(row[mapping.current_stock]) || 0 : 0;
            const required = mapping.monthly_required_quantity ? parseFloat(row[mapping.monthly_required_quantity]) || 0 : 0;

            if (name || partNumber) {
                const finalPartNumber = partNumber || `AUTO-${(name || '').substring(0, 20).toUpperCase().replace(/[^A-Z0-9]/g, '-')}`;

                try {
                    await client.query(
                        `INSERT INTO components (name, part_number, current_stock, monthly_required_quantity)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (part_number) DO UPDATE 
             SET current_stock = EXCLUDED.current_stock,
                 monthly_required_quantity = EXCLUDED.monthly_required_quantity`,
                        [name || partNumber, finalPartNumber, stock, required]
                    );
                    imported++;
                } catch (err) {
                    // Skip on error
                }
            }
        }

        console.log(`    ✅ Imported ${imported} components`);

    } catch (error) {
        console.log(`    ⚠️  Error: ${error.message}`);
    }
}

/**
 * Import PCB and its BOM from a sheet
 * The sheet name is used as the PCB name
 */
async function importPCBSheet(client, workbook, sheetName) {
    try {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            console.log(`    ⚠️  Sheet "${sheetName}" not found`);
            return;
        }

        // Create PCB with sheet name as PCB name
        let pcbId;
        try {
            const pcbResult = await client.query(
                `INSERT INTO pcbs (pcb_name)
         VALUES ($1)
         ON CONFLICT (pcb_name) DO UPDATE SET pcb_name = EXCLUDED.pcb_name
         RETURNING id`,
                [sheetName]
            );
            pcbId = pcbResult.rows[0].id;
            console.log(`    ✅ PCB created/found: ${sheetName} (ID: ${pcbId})`);
        } catch (err) {
            console.log(`    ⚠️  PCB error: ${err.message}`);
            return;
        }

        // Extract BOM data
        const data = XLSX.utils.sheet_to_json(sheet);
        const headers = data.length > 0 ? Object.keys(data[0]) : [];
        const mapping = detectColumnMapping(headers);

        let bomImported = 0;

        for (const row of data) {
            const componentIdentifier = mapping.component_name ? row[mapping.component_name] :
                (mapping.part_number ? row[mapping.part_number] : null);
            const quantity = mapping.quantity_per_pcb ? parseInt(row[mapping.quantity_per_pcb]) || 1 : 1;

            if (componentIdentifier) {
                try {
                    // Find component
                    const compResult = await client.query(
                        `SELECT id FROM components 
             WHERE name = $1 OR part_number = $1
             LIMIT 1`,
                        [componentIdentifier]
                    );

                    if (compResult.rows.length > 0) {
                        const componentId = compResult.rows[0].id;

                        await client.query(
                            `INSERT INTO pcb_components (pcb_id, component_id, quantity_per_pcb)
               VALUES ($1, $2, $3)
               ON CONFLICT (pcb_id, component_id) DO UPDATE
               SET quantity_per_pcb = EXCLUDED.quantity_per_pcb`,
                            [pcbId, componentId, quantity]
                        );
                        bomImported++;
                    }
                } catch (err) {
                    // Skip on error
                }
            }
        }

        console.log(`    ✅ BOM entries: ${bomImported}`);

    } catch (error) {
        console.log(`    ⚠️  Error: ${error.message}`);
    }
}

// Run the import
importComprehensiveData()
    .then(() => {
        console.log('\n✅ All data imported successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
    });
