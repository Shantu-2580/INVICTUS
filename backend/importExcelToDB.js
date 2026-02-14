require('dotenv').config();
const path = require('path');
const fs = require('fs');
const pool = require('./src/config/db');
const {
  extractComponents,
  extractBOM,
  readExcelFile
} = require('./src/utils/excelParser');
const { readCSVFile } = require('./src/utils/csvParser');

async function importFile(filename) {
  const filePath = path.join(__dirname, 'data', filename);

  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filename}`);
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log(`\nImporting ${filename}...`);

    let workbook;
    if (filename.toLowerCase().endsWith('.csv')) {
      console.log('Detected CSV file, using CSV parser...');
      workbook = readCSVFile(filePath);
    } else {
      console.log('Detected Excel file, using Excel parser...');
      workbook = readExcelFile(filePath);
    }

    // Process all sheets that look like they contain data
    // Or just the relevant ones. For now, let's process the first sheet as before, 
    // or iterate if we want to be more comprehensive.
    // The previous logic used only the first sheet. 
    // Let's try to be smarter: process "Master" or "Pivot" or just the first one if unsure.
    // Given the previous code just took [0], we'll start with that but log available sheets.

    console.log('Available sheets:', workbook.SheetNames);

    // Heuristic: Prefer "Master" or "Pivot" or sheets with "Data" in name?
    // For now, let's stick to the first sheet to maintain behavior, 
    // BUT checking the CSV content earlier, the first "Tab" might be what we want.
    // In Atomberg CSV, first tab is "Part Code wise OK_SCRAP", which might NOT be the BOM.
    // "Component Consumption" or "Master" look more promising.

    let sheetName = workbook.SheetNames[0];
    const preferredSheets = ['Master', 'Pivot', 'Component Consumption', 'Sheet1'];

    for (const pref of preferredSheets) {
      if (workbook.SheetNames.includes(pref)) {
        sheetName = pref;
        break;
      }
    }

    console.log(`Using sheet: "${sheetName}"`);

    /* =============================
       1️⃣ Extract Components
       ============================= */

    // Pass the workbook object directly
    const components = extractComponents(workbook, sheetName);

    for (const comp of components) {
      await client.query(
        `INSERT INTO components 
        (name, part_number, current_stock, monthly_required_quantity)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (part_number) DO NOTHING`,
        [
          comp.name,
          comp.part_number,
          comp.current_stock,
          comp.monthly_required_quantity
        ]
      );
    }

    console.log(`Inserted ${components.length} components`);

    /* =============================
       2️⃣ Extract BOM
       ============================= */

    const bomEntries = extractBOM(workbook, sheetName);

    for (const entry of bomEntries) {

      // Insert PCB if not exists
      const pcbResult = await client.query(
        `INSERT INTO pcbs (pcb_name)
         VALUES ($1)
         ON CONFLICT (pcb_name) DO UPDATE SET pcb_name = EXCLUDED.pcb_name
         RETURNING id`,
        [entry.pcb_name]
      );

      const pcbId = pcbResult.rows[0].id;

      // Find component ID
      const compResult = await client.query(
        `SELECT id FROM components 
         WHERE name = $1 OR part_number = $1`,
        [entry.component_identifier]
      );

      if (compResult.rows.length === 0) continue;

      const componentId = compResult.rows[0].id;

      // Insert mapping
      await client.query(
        `INSERT INTO pcb_components
        (pcb_id, component_id, quantity_per_pcb)
        VALUES ($1, $2, $3)
        ON CONFLICT (pcb_id, component_id) DO NOTHING`,
        [pcbId, componentId, entry.quantity_per_pcb]
      );
    }

    console.log(`Inserted ${bomEntries.length} BOM mappings`);

    await client.query('COMMIT');
    console.log(`Import completed for ${filename}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Import failed:', err);
  } finally {
    client.release();
  }
}

/* =============================
   RUN IMPORT
   ============================= */

async function run() {
  // Prefer CSVs if they exist, otherwise fallback to original Excel files
  const filesToImport = [
    { csv: 'Bajaj_PCB_Dec_25_Data_All_Tabs.csv', excel: 'Bajaj PCB Dec 25 Data.xlsm' },
    { csv: 'Atomberg_Data_All_Tabs.csv', excel: 'Atomberg Data.xlsm' }
  ];

  for (const fileSet of filesToImport) {
    if (fs.existsSync(path.join(__dirname, 'data', fileSet.csv))) {
      await importFile(fileSet.csv);
    } else {
      await importFile(fileSet.excel);
    }
  }

  console.log('\nAll imports finished');
  process.exit();
}

run();
