const bcrypt = require('bcrypt');
const { pool } = require('./models/database');

async function createAdminUser() {
    try {
        // Check if admin already exists
        const existingAdmin = await pool.query(
            'SELECT id FROM admin_users WHERE email = $1',
            ['admin@avinci.com']
        );

        if (existingAdmin.rows.length > 0) {
            console.log('✅ Admin user already exists');
            return;
        }

        // Create admin user
        const passwordHash = await bcrypt.hash('admin123', 10);
        
        const result = await pool.query(`
            INSERT INTO admin_users (email, password_hash, name, role, is_active)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, name
        `, ['admin@avinci.com', passwordHash, 'Admin User', 'admin', true]);

        console.log('✅ Admin user created successfully:');
        console.log(`   Email: admin@avinci.com`);
        console.log(`   Password: admin123`);
        console.log(`   ID: ${result.rows[0].id}`);
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await pool.end();
    }
}

createAdminUser();
