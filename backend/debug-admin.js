const { pool } = require('./models/database');

async function debugAdmin() {
    try {
        // Check what's in the admin_users table
        const result = await pool.query('SELECT id, email, name, role, is_active FROM admin_users');
        
        console.log('📊 Admin users in database:');
        console.log(result.rows);
        
        if (result.rows.length === 0) {
            console.log('❌ No admin users found');
        } else {
            console.log(`✅ Found ${result.rows.length} admin user(s)`);
        }
        
    } catch (error) {
        console.error('❌ Error checking admin users:', error);
    } finally {
        await pool.end();
    }
}

debugAdmin();
