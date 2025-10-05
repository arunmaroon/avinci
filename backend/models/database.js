const { Pool } = require('pg');
const Redis = require('redis');
const bcrypt = require('bcrypt');

const pool = new Pool({
    user: process.env.DB_USER || 'avinci_admin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'avinci',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Redis client for sessions and cache
const redis = Redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    }
});

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.on('connect', () => console.log('✅ Redis connected'));

const createTables = async () => {
    try {
        // Admin users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                avatar_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            );
        `);

        // AI agents table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ai_agents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                category VARCHAR(50),
                age INTEGER,
                gender VARCHAR(20),
                occupation VARCHAR(100),
                education VARCHAR(50),
                location VARCHAR(100),
                income_range VARCHAR(50),
                employment_type VARCHAR(50),
                tech_savviness VARCHAR(20),
                financial_savviness VARCHAR(20),
                english_level VARCHAR(20),
                personality JSONB,
                goals TEXT[],
                pain_points TEXT[],
                motivations TEXT[],
                fears TEXT[],
                sample_quote TEXT,
                vocabulary_level VARCHAR(20),
                tone VARCHAR(20),
                product_familiarity VARCHAR(20),
                conversation_style JSONB,
                background_story TEXT,
                system_prompt TEXT,
                avatar_url VARCHAR(500),
                source_type VARCHAR(20) DEFAULT 'manual',
                source_document UUID,
                created_by UUID REFERENCES admin_users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            );
        `);

        // New agents table for the chat system
        await pool.query(`
            CREATE TABLE IF NOT EXISTS agents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                persona VARCHAR(100) NOT NULL,
                knowledge_level VARCHAR(20) NOT NULL,
                language_style VARCHAR(20) NOT NULL,
                emotional_range VARCHAR(20) DEFAULT 'Moderate',
                hesitation_level VARCHAR(20) DEFAULT 'Medium',
                traits JSONB DEFAULT '[]',
                prompt TEXT,
                avatar VARCHAR(500),
                avatar_url VARCHAR(500),
                avatar_seed VARCHAR(100),
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Document uploads table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS document_uploads (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size INTEGER,
                mime_type VARCHAR(100),
                status VARCHAR(50) DEFAULT 'pending',
                processed_agents_count INTEGER DEFAULT 0,
                error_message TEXT,
                uploaded_by UUID REFERENCES admin_users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP
            );
        `);

        // Chat sessions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_name VARCHAR(100),
                agent_ids UUID[] NOT NULL,
                admin_id UUID REFERENCES admin_users(id),
                message_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Chat messages table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
                agent_id UUID REFERENCES ai_agents(id),
                role VARCHAR(20) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create indexes
        await pool.query('CREATE INDEX IF NOT EXISTS idx_agents_category ON ai_agents(category)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_agents_created_by ON ai_agents(created_by)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_chat_session_id ON chat_messages(session_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_documents_status ON document_uploads(status)');

        console.log('✅ Database tables created');

        // Create default admin
        await createDefaultAdmin();

    } catch (error) {
        console.error('Database creation error:', error);
        throw error;
    }
};

const createDefaultAdmin = async () => {
    try {
        const result = await pool.query(
            'SELECT id FROM admin_users WHERE email = $1',
            ['admin@avinci.com']
        );

        if (result.rows.length === 0) {
            const hashedPassword = await bcrypt.hash('avinci123', 10);
            await pool.query(`
                INSERT INTO admin_users (email, password_hash, name, role)
                VALUES ($1, $2, $3, $4)
            `, ['admin@avinci.com', hashedPassword, 'Avinci Admin', 'super_admin']);
            
            console.log('✅ Default admin created: admin@avinci.com / avinci123');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
};

module.exports = {
    pool,
    redis,
    createTables
};
