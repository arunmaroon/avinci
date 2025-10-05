const { createApi } = require('unsplash-js');
const { pool } = require('../models/database');

// Initialize Unsplash API
const unsplash = createApi({
    accessKey: process.env.UNSPLASH_ACCESS_KEY,
});

/**
 * Get appropriate photo for an agent based on their demographics
 * @param {Object} agent - Agent object with demographics
 * @returns {Object} Photo data with URL and seed
 */
async function getPhotoForAgent(agent) {
    try {
        // Build search query based on agent attributes
        let searchQuery = 'indian person';
        
        // Add gender if available
        if (agent.gender) {
            searchQuery = `indian ${agent.gender.toLowerCase()}`;
        }
        
        // Add age group if available
        if (agent.age) {
            if (agent.age < 25) {
                searchQuery += ' young';
            } else if (agent.age > 50) {
                searchQuery += ' mature';
            }
        }
        
        // Add professional context if applicable
        if (agent.occupation && (
            agent.occupation.toLowerCase().includes('engineer') ||
            agent.occupation.toLowerCase().includes('manager') ||
            agent.occupation.toLowerCase().includes('executive') ||
            agent.occupation.toLowerCase().includes('professional')
        )) {
            searchQuery += ' professional';
        }
        
        console.log(`Searching Unsplash for: ${searchQuery}`);
        
        // Search for photos
        const response = await unsplash.search.getPhotos({
            query: searchQuery,
            orientation: 'portrait',
            perPage: 20,
            orderBy: 'relevant'
        });
        
        if (response.errors) {
            console.error('Unsplash API errors:', response.errors);
            return getFallbackAvatar(agent);
        }
        
        const photos = response.response?.results || [];
        
        if (photos.length === 0) {
            console.log('No photos found, using fallback');
            return getFallbackAvatar(agent);
        }
        
        // Select a random photo from the results
        const randomIndex = Math.floor(Math.random() * Math.min(photos.length, 10));
        const selectedPhoto = photos[randomIndex];
        
        return {
            avatar_url: selectedPhoto.urls.regular,
            avatar_seed: selectedPhoto.id,
            photographer: selectedPhoto.user.name,
            photographer_url: selectedPhoto.user.links.html
        };
        
    } catch (error) {
        console.error('Error fetching photo from Unsplash:', error);
        return getFallbackAvatar(agent);
    }
}

/**
 * Generate fallback avatar when Unsplash fails
 * @param {Object} agent - Agent object
 * @returns {Object} Fallback avatar data
 */
function getFallbackAvatar(agent) {
    const initials = agent.name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    
    // Generate a consistent color based on agent name
    const colors = [
        '#144835', '#DE5E2B', '#3B82F6', '#8B5CF6', 
        '#10B981', '#F59E0B', '#EF4444', '#6B7280'
    ];
    const colorIndex = agent.name.length % colors.length;
    const backgroundColor = colors[colorIndex];
    
    // Create a data URL for a simple avatar
    const avatarUrl = `data:image/svg+xml;base64,${Buffer.from(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="${backgroundColor}"/>
            <text x="100" y="120" font-family="Arial, sans-serif" font-size="60" 
                  font-weight="bold" text-anchor="middle" fill="white">${initials}</text>
        </svg>
    `).toString('base64')}`;
    
    return {
        avatar_url: avatarUrl,
        avatar_seed: `fallback_${agent.name.replace(/\s+/g, '_').toLowerCase()}`,
        photographer: 'System Generated',
        photographer_url: null
    };
}

/**
 * Assign photos to all agents that don't have them
 * @returns {Object} Summary of photo assignments
 */
async function assignPhotosToAllAgents() {
    try {
        console.log('Starting bulk photo assignment...');
        
        // Get all agents without photos
        const result = await pool.query(`
            SELECT * FROM agents 
            WHERE avatar_url IS NULL OR avatar_url = ''
        `);
        
        const agents = result.rows;
        console.log(`Found ${agents.length} agents without photos`);
        
        const results = {
            total: agents.length,
            successful: 0,
            failed: 0,
            errors: []
        };
        
        for (const agent of agents) {
            try {
                const photoData = await getPhotoForAgent(agent);
                
                // Update agent with photo data
                await pool.query(`
                    UPDATE agents 
                    SET avatar_url = $1, avatar_seed = $2, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                `, [photoData.avatar_url, photoData.avatar_seed, agent.id]);
                
                console.log(`✅ Assigned photo to ${agent.name}`);
                results.successful++;
                
                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Failed to assign photo to ${agent.name}:`, error.message);
                results.failed++;
                results.errors.push({
                    agent: agent.name,
                    error: error.message
                });
            }
        }
        
        console.log('Photo assignment complete:', results);
        return results;
        
    } catch (error) {
        console.error('Error in bulk photo assignment:', error);
        throw error;
    }
}

/**
 * Refresh photo for a specific agent
 * @param {string} agentId - Agent ID
 * @returns {Object} Updated photo data
 */
async function refreshAgentPhoto(agentId) {
    try {
        // Get agent data
        const result = await pool.query('SELECT * FROM agents WHERE id = $1', [agentId]);
        
        if (result.rows.length === 0) {
            throw new Error('Agent not found');
        }
        
        const agent = result.rows[0];
        const photoData = await getPhotoForAgent(agent);
        
        // Update agent with new photo
        await pool.query(`
            UPDATE agents 
            SET avatar_url = $1, avatar_seed = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [photoData.avatar_url, photoData.avatar_seed, agentId]);
        
        console.log(`✅ Refreshed photo for ${agent.name}`);
        return photoData;
        
    } catch (error) {
        console.error('Error refreshing agent photo:', error);
        throw error;
    }
}

/**
 * Get full agent profile with photo
 * @param {string} agentId - Agent ID
 * @returns {Object} Complete agent profile
 */
async function getAgentFullProfile(agentId) {
    try {
        const result = await pool.query('SELECT * FROM agents WHERE id = $1', [agentId]);
        
        if (result.rows.length === 0) {
            throw new Error('Agent not found');
        }
        
        const agent = result.rows[0];
        
        // If agent doesn't have a photo, assign one
        if (!agent.avatar_url) {
            console.log(`Agent ${agent.name} has no photo, assigning one...`);
            const photoData = await getPhotoForAgent(agent);
            
            await pool.query(`
                UPDATE agents 
                SET avatar_url = $1, avatar_seed = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
            `, [photoData.avatar_url, photoData.avatar_seed, agentId]);
            
            agent.avatar_url = photoData.avatar_url;
            agent.avatar_seed = photoData.avatar_seed;
        }
        
        return agent;
        
    } catch (error) {
        console.error('Error getting agent full profile:', error);
        throw error;
    }
}

module.exports = {
    getPhotoForAgent,
    assignPhotosToAllAgents,
    refreshAgentPhoto,
    getAgentFullProfile
};
