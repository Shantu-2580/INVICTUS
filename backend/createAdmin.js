const bcrypt = require('bcrypt');
const pool = require('./src/config/db');

async function createAdminUser() {
    const client = await pool.connect();

    try {
        console.log('Setting up admin user...');

        // Admin credentials
        const adminEmail = 'admin@invictus.com';
        const adminPassword = 'admin123';
        const adminName = 'Admin User';

        // Check if admin already exists
        const checkResult = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [adminEmail]
        );

        if (checkResult.rows.length > 0) {
            console.log('✓ Admin user already exists');
            return;
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

        // Create admin user
        await client.query(
            `INSERT INTO users (name, email, password, role) 
             VALUES ($1, $2, $3, $4)`,
            [adminName, adminEmail, hashedPassword, 'admin']
        );

        console.log('✓ Admin user created successfully!');
        console.log('  Email:', adminEmail);
        console.log('  Password:', adminPassword);
        console.log('  Role: admin');

    } catch (error) {
        console.error('✗ Failed to create admin user:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the script
createAdminUser()
    .then(() => {
        console.log('\nAdmin setup completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nAdmin setup failed:', error);
        process.exit(1);
    });
