const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');
const { pool } = require('../models/database');
const { redis } = require('../models/database');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Chat endpoint
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { agentId, text, conversationHistory } = req.body;
    const image = req.file;

    if (!agentId || !text) {
      return res.status(400).json({ error: 'Agent ID and text are required' });
    }

    // Get agent details from database
    const agentResult = await pool.query(
      'SELECT * FROM agents WHERE id = $1',
      [agentId]
    );

    if (agentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const agent = agentResult.rows[0];

    // Prepare the prompt with agent personality
    const systemPrompt = createAgentPrompt(agent);
    
    // Prepare messages for OpenAI
    let messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const message of conversationHistory.slice(-10)) { // Keep last 10 messages
        messages.push({
          role: message.isUser ? 'user' : 'assistant',
          content: message.text
        });
      }
    }

    // Add current message
    let currentMessage = text;

    // Add image analysis if present
    if (image) {
      const imageBase64 = image.buffer.toString('base64');
      const imageUrl = `data:${image.mimetype};base64,${imageBase64}`;
      
      // Use OpenAI Vision API for image analysis
      const visionResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image from a UX research perspective. Describe what you see, identify potential usability issues, accessibility concerns, and user experience considerations. Be specific and detailed.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const imageAnalysis = visionResponse.choices[0].message.content;
      currentMessage += `\n\nImage Analysis: ${imageAnalysis}`;
    }

    messages.push({ role: 'user', content: currentMessage });

    // Generate response
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    const processingTime = Date.now() - startTime;
    const responseText = response.choices[0].message.content;

    // Add human-like delays and variations
    const finalResponse = await addHumanLikeBehavior(responseText, agent);

    // Create message object
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: finalResponse,
      isUser: false,
      timestamp: new Date().toISOString(),
      agentId: agentId,
      metadata: {
        processingTime,
        tokens: response.response.length,
        model: 'gpt-4o'
      }
    };

    // Store conversation in Redis for session management
    const sessionKey = `chat_session_${agentId}_${req.ip}`;
    await redis.lpush(sessionKey, JSON.stringify(message));
    await redis.expire(sessionKey, 3600); // Expire in 1 hour

    res.json({
      message,
      agentId,
      processingTime,
      tokens: response.response.length
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
});

// Get conversation history
router.get('/history/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const sessionKey = `chat_session_${agentId}_${req.ip}`;
    
    const messages = await redis.lrange(sessionKey, 0, -1);
    const conversation = messages.map(msg => JSON.parse(msg)).reverse();

    res.json({ conversation });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation history' });
  }
});

// Clear conversation history
router.delete('/history/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const sessionKey = `chat_session_${agentId}_${req.ip}`;
    
    await redis.del(sessionKey);
    res.json({ success: true });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear conversation history' });
  }
});

// Create agent prompt based on personality traits
function createAgentPrompt(agent) {
  const {
    name,
    persona,
    knowledgeLevel,
    languageStyle,
    emotionalRange,
    hesitationLevel,
    traits
  } = agent;

  let prompt = `You are ${name}, a ${persona} in a UX research context. `;
  
  // Knowledge level
  switch (knowledgeLevel) {
    case 'Novice':
      prompt += `You have basic knowledge and often ask clarifying questions. You use simple terms and need explanations for technical concepts. `;
      break;
    case 'Intermediate':
      prompt += `You have moderate knowledge and can understand most concepts but may need some clarification on advanced topics. `;
      break;
    case 'Advanced':
      prompt += `You have strong knowledge and can discuss complex topics with confidence. `;
      break;
    case 'Expert':
      prompt += `You are highly knowledgeable and can provide detailed, technical insights. `;
      break;
  }

  // Language style
  switch (languageStyle) {
    case 'Formal':
      prompt += `Use formal, professional language. `;
      break;
    case 'Casual':
      prompt += `Use casual, friendly language with contractions. `;
      break;
    case 'Technical':
      prompt += `Use technical terminology and precise language. `;
      break;
    case 'Conversational':
      prompt += `Use conversational, approachable language. `;
      break;
  }

  // Emotional range
  switch (emotionalRange) {
    case 'Reserved':
      prompt += `Keep emotions minimal and responses measured. `;
      break;
    case 'Moderate':
      prompt += `Show moderate emotional expression. `;
      break;
    case 'Expressive':
      prompt += `Be expressive and show enthusiasm or concern as appropriate. `;
      break;
    case 'Highly Expressive':
      prompt += `Be very expressive with strong emotional reactions. `;
      break;
  }

  // Hesitation level
  switch (hesitationLevel) {
    case 'Low':
      prompt += `Respond confidently without hesitation. `;
      break;
    case 'Medium':
      prompt += `Occasionally show uncertainty with phrases like "I think" or "maybe". `;
      break;
    case 'High':
      prompt += `Frequently show hesitation with phrases like "um", "I'm not sure", "let me think". `;
      break;
  }

  // Add traits
  if (traits && traits.length > 0) {
    prompt += `Your key traits include: ${traits.join(', ')}. `;
  }

  prompt += `Respond as this persona would in a UX research discussion. Be authentic to their character and provide realistic feedback on user interfaces, experiences, and design decisions.`;

  return prompt;
}

// Add human-like behavior to responses
async function addHumanLikeBehavior(response, agent) {
  let modifiedResponse = response;

  // Add fillers based on hesitation level
  if (agent.hesitationLevel === 'High') {
    const fillers = ['um', 'uh', 'well', 'you know', 'I mean'];
    const randomFiller = fillers[Math.floor(Math.random() * fillers.length)];
    
    // Insert filler at random position
    const words = modifiedResponse.split(' ');
    const insertPos = Math.floor(Math.random() * words.length);
    words.splice(insertPos, 0, randomFiller);
    modifiedResponse = words.join(' ');
  }

  // Add emotional expressions
  if (agent.emotionalRange === 'Expressive' || agent.emotionalRange === 'Highly Expressive') {
    const expressions = ['!', '...', '?'];
    const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
    
    // Sometimes add emotional punctuation
    if (Math.random() < 0.3) {
      modifiedResponse += randomExpression;
    }
  }

  // Add occasional "mistakes" or corrections
  if (Math.random() < 0.1) {
    const corrections = [
      ' Actually, let me correct that.',
      ' Wait, I think I meant...',
      ' Sorry, let me rephrase that.'
    ];
    const randomCorrection = corrections[Math.floor(Math.random() * corrections.length)];
    modifiedResponse += randomCorrection;
  }

  return modifiedResponse;
}

module.exports = router;