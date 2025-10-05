const OpenAI = require('openai');
const { pool } = require('../models/database');

const getAIClient = () => {
    const provider = process.env.AI_PROVIDER || 'openai';
    
    if (provider === 'grok') {
        return new OpenAI({
            apiKey: process.env.GROK_API_KEY,
            baseURL: 'https://api.x.ai/v1'
        });
    } else {
        return new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
};

class AgentGenerator {
    static async generateFromDocument(participantData, uploadId, adminId) {
        const agents = [];
        const provider = process.env.AI_PROVIDER || 'openai';
        console.log(`🤖 Generating ${participantData.length} agents using ${provider}...`);

        for (const participant of participantData) {
            try {
                console.log(`   Processing: ${participant.participant}...`);
                const agentProfile = await this.extractAgentProfile(participant);
                const agentId = await this.saveAgent(agentProfile, uploadId, adminId);
                agents.push({ id: agentId, ...agentProfile });
                console.log(`   ✅ Created: ${agentProfile.name}`);
            } catch (error) {
                console.error(`   ❌ Error: ${participant.participant} - ${error.message}`);
            }
        }

        return agents;
    }

    static async extractAgentProfile(participant) {
        const prompt = 'Analyze this user research participant and create a detailed persona.\n\nParticipant: ' + participant.participant + '\nCategory: ' + participant.category + '\n\nReturn ONLY valid JSON:\n{\n    "name": "' + participant.participant + '",\n    "age": 35,\n    "gender": "Male/Female",\n    "occupation": "Job title",\n    "education": "Bachelor Degree",\n    "location": "City, India",\n    "income_range": "30000-50000",\n    "employment_type": "Salaried",\n    "tech_savviness": "Medium",\n    "financial_savviness": "Medium",\n    "english_level": "Intermediate",\n    "personality": {"traits": ["trait1"], "type": "Analytical"},\n    "goals": ["goal1"],\n    "pain_points": ["pain1"],\n    "motivations": ["motivation1"],\n    "fears": ["fear1"],\n    "sample_quote": "How they speak",\n    "vocabulary_level": "Professional",\n    "tone": "Friendly",\n    "product_familiarity": "Beginner",\n    "background_story": "Brief background",\n    "conversation_style": {"pace": "Medium", "detail_level": "Moderate", "question_style": "Direct"}\n}';

        try {
            const client = getAIClient();
            const model = process.env.AI_PROVIDER === 'grok' ? 'grok-beta' : 'gpt-4';
            
            const response = await client.chat.completions.create({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 800
            });

            const content = response.choices[0].message.content;
            let jsonStr = content.trim();
            
            if (jsonStr.indexOf('```') !== -1) {
                jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '');
            }
            
            const profile = JSON.parse(jsonStr);
            profile.category = participant.category;
            
            return profile;
        } catch (error) {
            console.error('AI extraction failed, using default:', error.message);
            return this.createDefaultProfile(participant);
        }
    }

    static createDefaultProfile(participant) {
        return {
            name: participant.participant,
            category: participant.category,
            age: 30,
            gender: 'Not specified',
            occupation: 'Professional',
            education: 'Bachelor Degree',
            location: 'India',
            income_range: '30000-50000',
            employment_type: 'Salaried',
            tech_savviness: 'Medium',
            financial_savviness: 'Medium',
            english_level: 'Intermediate',
            personality: { traits: ['Practical'], type: 'Practical' },
            goals: ['Financial stability'],
            pain_points: ['Complex processes'],
            motivations: ['Better services'],
            fears: ['Financial loss'],
            sample_quote: 'I want simple solutions.',
            vocabulary_level: 'Professional',
            tone: 'Friendly',
            product_familiarity: 'Beginner',
            background_story: 'A typical user.',
            conversation_style: { pace: 'Medium', detail_level: 'Moderate', question_style: 'Direct' }
        };
    }

    static async saveAgent(profile, uploadId, adminId) {
        const query = 'INSERT INTO ai_agents (name, category, age, gender, occupation, education, location, income_range, employment_type, tech_savviness, financial_savviness, english_level, personality, goals, pain_points, motivations, fears, sample_quote, vocabulary_level, tone, product_familiarity, conversation_style, background_story, source_type, source_document, created_by, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27) RETURNING id';

        const values = [
            profile.name,
            profile.category,
            profile.age,
            profile.gender,
            profile.occupation,
            profile.education,
            profile.location,
            profile.income_range,
            profile.employment_type,
            profile.tech_savviness,
            profile.financial_savviness,
            profile.english_level,
            JSON.stringify(profile.personality),
            profile.goals || [],
            profile.pain_points || [],
            profile.motivations || [],
            profile.fears || [],
            profile.sample_quote,
            profile.vocabulary_level,
            profile.tone,
            profile.product_familiarity,
            JSON.stringify(profile.conversation_style),
            profile.background_story,
            'document',
            uploadId,
            adminId,
            true
        ];

        const result = await pool.query(query, values);
        return result.rows.id;
    }
}

module.exports = AgentGenerator;
