const OpenAI = require('openai');
const { pool } = require('../models/database');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

class AgentGenerator {
    static async generateFromDocument(participantData, uploadId, adminId) {
        const agents = [];

        for (const participant of participantData) {
            try {
                const agentProfile = await this.extractAgentProfile(participant);
                const agentId = await this.saveAgent(agentProfile, uploadId, adminId);
                agents.push({ id: agentId, ...agentProfile });
            } catch (error) {
                console.error(`Error generating agent for ${participant.participant}:`, error);
            }
        }

        return agents;
    }

    static async extractAgentProfile(participant) {
        const prompt = `Analyze this user research participant and create a detailed persona profile:

Participant: ${participant.participant}
Category: ${participant.category}
Transcript/Data: ${participant.transcript}

Create a comprehensive persona with:
1. Demographics (age, gender, occupation, education, location, income)
2. Behavioral traits (tech savviness, financial knowledge, English level)
3. Personality (analytical, creative, practical, social traits)
4. Goals and motivations
5. Pain points and frustrations
6. Communication style and sample quotes
7. Background story

Return ONLY a JSON object with this structure:
{
    "name": "Full Name",
    "age": 30,
    "gender": "Male/Female",
    "occupation": "Job Title",
    "education": "Education Level",
    "location": "City, Country",
    "income_range": "₹X-₹Y",
    "employment_type": "Salaried/Self-Employed/Business Owner",
    "tech_savviness": "Low/Medium/High",
    "financial_savviness": "Low/Medium/High",
    "english_level": "Basic/Intermediate/Fluent/Native",
    "personality": {
        "traits": ["trait1", "trait2"],
        "type": "Analytical/Creative/Practical/Social"
    },
    "goals": ["goal1", "goal2"],
    "pain_points": ["pain1", "pain2"],
    "motivations": ["motivation1"],
    "fears": ["fear1"],
    "sample_quote": "How this person typically speaks",
    "vocabulary_level": "Simple/Professional/Technical",
    "tone": "Friendly/Formal/Casual",
    "product_familiarity": "Beginner/Intermediate/Expert",
    "background_story": "Brief life background",
    "conversation_style": {
        "pace": "Slow/Medium/Fast",
        "detail_level": "Brief/Moderate/Detailed",
        "question_style": "Direct/Indirect"
    }
}`;

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            });

            const profileText = response.choices[0].message.content;
            const profile = JSON.parse(profileText);
            
            // Add category from original data
            profile.category = participant.category;
            
            return profile;
        } catch (error) {
            console.error('Error extracting profile:', error);
            // Return default profile if AI fails
            return this.createDefaultProfile(participant);
        }
    }

    static createDefaultProfile(participant) {
        return {
            name: participant.participant,
            category: participant.category,
            age: 30,
            gender: 'Not specified',
            occupation: 'Not specified',
            education: 'Not specified',
            location: 'India',
            income_range: '₹25,000-₹50,000',
            employment_type: 'Salaried',
            tech_savviness: 'Medium',
            financial_savviness: 'Medium',
            english_level: 'Intermediate',
            personality: {
                traits: ['Analytical'],
                type: 'Practical'
            },
            goals: ['Financial stability'],
            pain_points: ['Complex processes'],
            motivations: ['Better financial products'],
            fears: ['Financial loss'],
            sample_quote: 'I want simple and reliable financial solutions.',
            vocabulary_level: 'Professional',
            tone: 'Friendly',
            product_familiarity: 'Beginner',
            background_story: 'A typical user looking for better financial services.',
            conversation_style: {
                pace: 'Medium',
                detail_level: 'Moderate',
                question_style: 'Direct'
            }
        };
    }

    static async saveAgent(profile, uploadId, adminId) {
        const systemPrompt = this.generateSystemPrompt(profile);
        
        const query = `
            INSERT INTO ai_agents (
                name, category, age, gender, occupation, education, location, 
                income_range, employment_type, tech_savviness, financial_savviness, 
                english_level, personality, goals, pain_points, motivations, fears,
                sample_quote, vocabulary_level, tone, product_familiarity,
                conversation_style, background_story, system_prompt, source_type,
                source_document, created_by
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
                $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
            ) RETURNING id
        `;

        const values = [
            profile.name, profile.category, profile.age, profile.gender,
            profile.occupation, profile.education, profile.location,
            profile.income_range, profile.employment_type, profile.tech_savviness,
            profile.financial_savviness, profile.english_level,
            JSON.stringify(profile.personality), profile.goals, profile.pain_points,
            profile.motivations, profile.fears, profile.sample_quote,
            profile.vocabulary_level, profile.tone, profile.product_familiarity,
            JSON.stringify(profile.conversation_style), profile.background_story,
            systemPrompt, 'document', uploadId, adminId
        ];

        const result = await pool.query(query, values);
        return result.rows[0].id;
    }

    static generateSystemPrompt(profile) {
        return `You are ${profile.name}, a ${profile.age}-year-old ${profile.gender} who works as ${profile.occupation} in ${profile.location}.

BACKGROUND STORY: ${profile.background_story}

DEMOGRAPHICS:
- Education: ${profile.education}
- Income: ${profile.income_range}
- Employment: ${profile.employment_type}

BEHAVIORAL TRAITS:
- Tech Savviness: ${profile.tech_savviness}
- Financial Knowledge: ${profile.financial_savviness}
- English Level: ${profile.english_level}

PERSONALITY: ${JSON.stringify(profile.personality)}
GOALS: ${profile.goals.join('; ')}
PAIN POINTS: ${profile.pain_points.join('; ')}
MOTIVATIONS: ${profile.motivations.join('; ')}
FEARS: ${profile.fears.join('; ')}

COMMUNICATION STYLE:
- Sample speech: "${profile.sample_quote}"
- Vocabulary: ${profile.vocabulary_level}
- Tone: ${profile.tone}
- Pace: ${profile.conversation_style.pace}
- Detail level: ${profile.conversation_style.detail_level}

INSTRUCTIONS:
- Respond exactly as this person would based on their background and traits
- Use vocabulary appropriate for your education and English level
- Show hesitation or ask for clarification when discussing unfamiliar topics
- Reference your specific experiences, goals, and constraints
- Maintain consistent personality and avoid contradicting your profile
- Use natural speech patterns including fillers like "um", "actually", "I think"
- If discussing financial topics like EMI, respond based on your financial_savviness level
- Express emotions and reactions appropriate to your personality type`;
    }
}

module.exports = AgentGenerator;
