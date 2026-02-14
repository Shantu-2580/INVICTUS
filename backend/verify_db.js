const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'invictus',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function verify() {
    try {
        const client = await pool.connect();

        console.log('\n--- PCBs Table ---');
        const pcbs = await client.query('SELECT * FROM pcbs LIMIT 10');
        console.log(`Total PCBs: ${(await client.query('SELECT COUNT(*) FROM pcbs')).rows[0].count}`);
        pcbs.rows.forEach(r => console.log(JSON.stringify(r)));

        console.log('\n--- Components Table ---');
        const components = await client.query('SELECT * FROM components LIMIT 10');
        console.log(`Total Components: ${(await client.query('SELECT COUNT(*) FROM components')).rows[0].count}`);
        components.rows.forEach(r => console.log(JSON.stringify(r)));

        console.log('\n--- PCB Components (BOM) Table ---');
        const bom = await client.query(`
            SELECT p.pcb_name as pcb, c.part_number as component, pc.quantity_per_pcb as quantity 
            FROM pcb_components pc
            JOIN pcbs p ON pc.pcb_id = p.id
            JOIN components c ON pc.component_id = c.id
            LIMIT 10
        `);
        console.log(`Total BOM Entries: ${(await client.query('SELECT COUNT(*) FROM pcb_components')).rows[0].count}`);
        bom.rows.forEach(r => console.log(JSON.stringify(r)));

        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

verify();
