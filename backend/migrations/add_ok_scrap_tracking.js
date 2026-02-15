const pool = require('../src/config/db');

async function addOkScrapTracking() {
    const client = await pool.connect();

    try {
        console.log('Adding OK/SCRAP tracking to production_logs table...');

        // Check if columns already exist
        const checkResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='production_logs' 
            AND column_name IN ('quantity_ok', 'quantity_scrap')
        `);

        if (checkResult.rows.length === 2) {
            console.log('✓ Migration already applied - quantity_ok and quantity_scrap columns exist');
            return;
        }

        // Add new columns
        await client.query(`
            ALTER TABLE production_logs
            ADD COLUMN IF NOT EXISTS quantity_ok INTEGER CHECK (quantity_ok >= 0),
            ADD COLUMN IF NOT EXISTS quantity_scrap INTEGER CHECK (quantity_scrap >= 0)
        `);

        console.log('✓ Added quantity_ok and quantity_scrap columns');

        // Add constraint to ensure quantity_produced = quantity_ok + quantity_scrap
        // First, drop the constraint if it exists
        await client.query(`
            ALTER TABLE production_logs
            DROP CONSTRAINT IF EXISTS check_quantity_sum
        `);

        // Add the constraint
        await client.query(`
            ALTER TABLE production_logs
            ADD CONSTRAINT check_quantity_sum 
            CHECK (
                quantity_ok IS NULL 
                OR quantity_scrap IS NULL 
                OR quantity_produced = quantity_ok + quantity_scrap
            )
        `);

        console.log('✓ Added check_quantity_sum constraint');
        console.log('\nMigration completed successfully!');
        console.log('  - Added quantity_ok column (INTEGER, >= 0)');
        console.log('  - Added quantity_scrap column (INTEGER, >= 0)');
        console.log('  - Added constraint: quantity_produced = quantity_ok + quantity_scrap');

    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
addOkScrapTracking()
    .then(() => {
        console.log('\nMigration process completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nMigration failed:', error);
        process.exit(1);
    });
