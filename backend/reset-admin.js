const bcrypt = require('bcrypt');
const { pool } = require('./models/database');

async function resetAdminPassword() {
    try {
        // Reset admin password
        const passwordHash = await bcrypt.hash('admin123', 10);
        
        const result = await pool.query(`
            UPDATE admin_users 
            SET password_hash = $1 
            WHERE email = 'admin@avinci.com'
            RETURNING id, email, name
        `, [passwordHash]);

        if (result.rows.length > 0) {
            console.log('✅ Admin password reset successfully:');
            console.log(`   Email: admin@avinci.com`);
            console.log(`   Password: admin123`);
            console.log(`   User: ${result.rows[0].name}`);
        } else {
            console.log('❌ Admin user not found');
        }
        
    } catch (error) {
        console.error('❌ Error resetting admin password:', error);
    } finally {
        await pool.end();
    }
}

resetAdminPassword();