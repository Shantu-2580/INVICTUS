const pool = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('Running database migration...');

        // Check if columns already exist
        const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='pcbs' 
      AND column_name IN ('revision', 'description')
    `);

        if (checkResult.rows.length === 2) {
            console.log('✓ Migration already applied - revision and description columns exist');
            return;
        }

        // Run migration
        await client.query(`
      ALTER TABLE pcbs 
      ADD COLUMN IF NOT EXISTS revision VARCHAR(50),
      ADD COLUMN IF NOT EXISTS description TEXT
    `);

        console.log('✓ Migration completed successfully!');
        console.log('  - Added revision column (VARCHAR(50))');
        console.log('  - Added description column (TEXT)');

    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
runMigration()
    .then(() => {
        console.log('\nMigration process completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nMigration failed:', error);
        process.exit(1);
    });
