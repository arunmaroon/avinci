const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

class AIService {
    static getClient() {
        const provider = process.env.AI_PROVIDER || 'grok';
        
        switch (provider) {
            case 'grok':
                return new OpenAI({
                    apiKey: process.env.GROK_API_KEY,
                    baseURL: 'https://api.x.ai/v1'
                });
            case 'claude':
                return new Anthropic({
                    apiKey: process.env.CLAUDE_API_KEY
                });
            case 'openai':
            default:
                return new OpenAI({
                    apiKey: process.env.OPENAI_API_KEY
                });
        }
    }

    static generateSystemPrompt(agent) {
        return `You are ${agent.name}, a ${agent.age || 'adult'}-year-old ${agent.gender || 'person'} who works as ${agent.occupation || 'a professional'} in ${agent.location || 'your city'}.

BACKGROUND: ${agent.background_story || 'You have a unique background and perspective.'}

DEMOGRAPHICS:
- Education: ${agent.education || 'Not specified'}
- Income: ${agent.income_range || 'Not specified'}
- Employment: ${agent.employment_type || 'Employed'}
- Category: ${agent.category || 'General User'}

BEHAVIORAL TRAITS:
- Tech Savviness: ${agent.tech_savviness || 'Medium'} - ${this.getTechDescription(agent.tech_savviness)}
- Financial Knowledge: ${agent.financial_savviness || 'Medium'} - ${this.getFinancialDescription(agent.financial_savviness)}
- English Level: ${agent.english_level || 'Fluent'}

PERSONALITY: ${JSON.stringify(agent.personality || { traits: ['Friendly'] })}

GOALS: ${(agent.goals || []).join('; ') || 'Personal growth'}
PAIN POINTS: ${(agent.pain_points || []).join('; ') || 'Common frustrations'}
MOTIVATIONS: ${(agent.motivations || []).join('; ') || 'Success'}
FEARS: ${(agent.fears || []).join('; ') || 'Common concerns'}

COMMUNICATION STYLE:
- Sample speech: "${agent.sample_quote || 'I speak naturally.'}"
- Vocabulary: ${agent.vocabulary_level || 'Professional'}
- Tone: ${agent.tone || 'Friendly'}
- Pace: ${agent.conversation_style?.pace || 'Medium'}

CRITICAL INSTRUCTIONS:
1. Stay completely in character - never break character or mention you're an AI
2. Use vocabulary matching your education and English level
3. Show genuine hesitation when discussing unfamiliar topics
4. Ask for clarifications naturally when confused
5. Use natural speech: "um," "actually," "I think," "you know"
6. Express authentic emotions based on your personality
7. Financial topics (EMI, loans):
   - High savviness: Explain with confidence and detail
   - Medium: Show basic understanding, ask questions
   - Low: Express confusion, need simple explanations
8. Technology topics:
   - High: Comfortable with apps and tech terms
   - Medium: Use basics but need guidance
   - Low: Prefer simple interfaces, express anxiety
9. Reference your personal goals and pain points in responses
10. Maintain consistency with your background story`;
    }

    static getTechDescription(level) {
        const descriptions = {
            'High': 'Very comfortable with technology, uses apps daily, understands technical concepts',
            'Medium': 'Can use basic technology but needs guidance with complex features',
            'Low': 'Struggles with technology, prefers simple interfaces, anxious about new tech'
        };
        return descriptions[level] || descriptions['Medium'];
    }

    static getFinancialDescription(level) {
        const descriptions = {
            'High': 'Strong understanding of financial concepts, manages money well, knows investment terms',
            'Medium': 'Basic financial literacy, understands common concepts but needs help with complex topics',
            'Low': 'Limited financial knowledge, struggles with banking terms, needs simple explanations'
        };
        return descriptions[level] || descriptions['Medium'];
    }

    static async generateResponse(agent, conversationHistory, userMessage) {
        const provider = process.env.AI_PROVIDER || 'grok';
        
        try {
            if (provider === 'claude') {
                return await this.generateWithClaude(agent, conversationHistory, userMessage);
            } else {
                return await this.generateWithOpenAICompatible(agent, conversationHistory, userMessage);
            }
        } catch (error) {
            console.error(`AI Service Error (${provider}):`, error.message);
            throw new Error('Failed to generate response: ' + error.message);
        }
    }

    static async generateWithOpenAICompatible(agent, conversationHistory, userMessage) {
        const client = this.getClient();
        const systemPrompt = this.generateSystemPrompt(agent);
        
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-10),
            { role: 'user', content: userMessage }
        ];

        const response = await client.chat.completions.create({
            model: process.env.AI_PROVIDER === 'grok' ? 'grok-beta' : 'gpt-4',
            messages: messages,
            temperature: 0.7,
            max_tokens: 300,
            presence_penalty: 0.6,
            frequency_penalty: 0.3
        });

        return response.choices[0].message.content;
    }

    static async generateWithClaude(agent, conversationHistory, userMessage) {
        const client = this.getClient();
        const systemPrompt = this.generateSystemPrompt(agent);
        
        // Claude format: system separate, no system role in messages
        const messages = conversationHistory.slice(-10).map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        }));
        
        messages.push({
            role: 'user',
            content: userMessage
        });

        const response = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 300,
            system: systemPrompt,
            messages: messages
        });

        return response.content[0].text;
    }

    static calculateDelay(responseText, agentPace = 'Medium') {
        const baseDelays = {
            'Slow': 2000,
            'Medium': 1500,
            'Fast': 1000
        };
        
        const baseDelay = baseDelays[agentPace] || 1500;
        const charDelay = responseText.length * 25;
        
        return Math.min(baseDelay + charDelay, 5000);
    }
}

module.exports = AIService;
