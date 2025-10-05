const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');
const { pool } = require('../models/database');
const { redis } = require('../models/database');
const { v4: uuidv4 } = require('uuid');

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

// Start new chat session
router.post('/start-session', async (req, res) => {
  try {
    const { agentId, sessionName } = req.body;
    
    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    // Get agent details
    const agentResult = await pool.query('SELECT * FROM agents WHERE id = $1', [agentId]);
    if (agentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const agent = agentResult.rows[0];
    const sessionId = uuidv4();

    // Store session in Redis
    await redis.setex(`session:${sessionId}`, 3600, JSON.stringify({
      agentId,
      sessionName: sessionName || `Chat with ${agent.name}`,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    }));

    res.json({
      sessionId,
      agent: {
        id: agent.id,
        name: agent.name,
        persona: agent.persona,
        avatar_url: agent.avatar_url
      },
      conversationHistory: []
    });

  } catch (error) {
    console.error('Error starting chat session:', error);
    res.status(500).json({ error: 'Failed to start chat session', details: error.message });
  }
});

// Send message and get response
router.post('/message', async (req, res) => {
  try {
    const { sessionId, agentId, message } = req.body;

    if (!sessionId || !agentId || !message) {
      return res.status(400).json({ error: 'Session ID, Agent ID, and message are required' });
    }

    // Get session from Redis
    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = JSON.parse(sessionData);

    // Get agent details
    const agentResult = await pool.query('SELECT * FROM agents WHERE id = $1', [agentId]);
    if (agentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const agent = agentResult.rows[0];

    // Get conversation history
    const historyKey = `conversation:${sessionId}`;
    const historyData = await redis.get(historyKey);
    const conversationHistory = historyData ? JSON.parse(historyData) : [];

    // Create realistic response
    const response = await generateRealisticResponse(agent, message, conversationHistory);

    // Store user message
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    // Store agent response
    const agentMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: response.text,
      timestamp: new Date().toISOString(),
      emotion: response.emotion
    };

    // Update conversation history
    const updatedHistory = [...conversationHistory, userMessage, agentMessage];
    await redis.setex(historyKey, 3600, JSON.stringify(updatedHistory));

    // Update session last activity
    session.lastActivity = new Date().toISOString();
    await redis.setex(`session:${sessionId}`, 3600, JSON.stringify(session));

    res.json({
      messageId: agentMessage.id,
      response: response.text,
      typing_duration: response.typingDuration,
      emotion: response.emotion,
      timestamp: agentMessage.timestamp
    });

  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message', details: error.message });
  }
});

// Get session details
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Get session from Redis
    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = JSON.parse(sessionData);

    // Get conversation history
    const historyKey = `conversation:${sessionId}`;
    const historyData = await redis.get(historyKey);
    const messages = historyData ? JSON.parse(historyData) : [];

    // Get agent details
    const agentResult = await pool.query('SELECT * FROM agents WHERE id = $1', [session.agentId]);
    const agent = agentResult.rows[0];

    res.json({
      session,
      messages,
      agent
    });

  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session', details: error.message });
  }
});

// Mark messages as read
router.put('/session/:sessionId/mark-read', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Update session last activity
    const sessionData = await redis.get(`session:${sessionId}`);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      session.lastActivity = new Date().toISOString();
      await redis.setex(`session:${sessionId}`, 3600, JSON.stringify(session));
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read', details: error.message });
  }
});

// Generate realistic response with human-like behavior
async function generateRealisticResponse(agent, userMessage, conversationHistory) {
  try {
    // Analyze user message sentiment and complexity
    const messageAnalysis = analyzeUserMessage(userMessage);
    
    // Update agent's emotional state based on conversation
    const emotionalState = updateEmotionalState(agent, userMessage, conversationHistory);
    
    // Build contextual system prompt
    const systemPrompt = buildContextualPrompt(agent, emotionalState, conversationHistory);
    
    // Prepare messages for OpenAI
    let messages = [{ role: 'system', content: systemPrompt }];
    
    // Add conversation history (last 10 messages)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }
    
    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    // Generate response
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.7 + (emotionalState.intensity * 0.2), // Vary based on emotion
      max_tokens: 500
    });

    let responseText = response.choices[0].message.content;

    // Post-process for realism
    responseText = addHumanElements(responseText, agent, emotionalState);
    
    // Calculate typing delay
    const typingDuration = calculateTypingDelay(responseText, agent, messageAnalysis);

    return {
      text: responseText,
      emotion: emotionalState.current,
      typingDuration: typingDuration
    };

  } catch (error) {
    console.error('Error generating realistic response:', error);
    return {
      text: "I'm sorry, I'm having trouble processing that right now. Could you please try again?",
      emotion: 'neutral',
      typingDuration: 2000
    };
  }
}

// Analyze user message for sentiment and complexity
function analyzeUserMessage(message) {
  const complexity = message.length > 100 ? 'high' : message.length > 50 ? 'medium' : 'low';
  const hasQuestion = message.includes('?');
  const hasExclamation = message.includes('!');
  const isUrgent = message.toLowerCase().includes('urgent') || message.toLowerCase().includes('asap');
  
  return {
    complexity,
    hasQuestion,
    hasExclamation,
    isUrgent,
    length: message.length
  };
}

// Update agent's emotional state based on conversation
function updateEmotionalState(agent, userMessage, conversationHistory) {
  const baseEmotion = agent.emotional_range || 'Moderate';
  let currentEmotion = 'neutral';
  let intensity = 0.5;

  // Analyze recent conversation for emotional cues
  const recentMessages = conversationHistory.slice(-5);
  const hasPositiveCues = userMessage.toLowerCase().includes('thank') || 
                         userMessage.toLowerCase().includes('great') ||
                         userMessage.toLowerCase().includes('awesome');
  
  const hasNegativeCues = userMessage.toLowerCase().includes('problem') ||
                         userMessage.toLowerCase().includes('issue') ||
                         userMessage.toLowerCase().includes('wrong');

  if (hasPositiveCues) {
    currentEmotion = 'interested';
    intensity = 0.7;
  } else if (hasNegativeCues) {
    currentEmotion = 'cautious';
    intensity = 0.6;
  } else if (userMessage.length > 100) {
    currentEmotion = 'thoughtful';
    intensity = 0.8;
  }

  return {
    current: currentEmotion,
    intensity: intensity,
    base: baseEmotion
  };
}

// Build contextual prompt based on agent and emotional state
function buildContextualPrompt(agent, emotionalState, conversationHistory) {
  let prompt = `You are ${agent.name}, a ${agent.persona}. `;
  
  // Add personality traits
  if (agent.traits && agent.traits.length > 0) {
    prompt += `Your key traits are: ${agent.traits.join(', ')}. `;
  }
  
  // Add knowledge level context
  const knowledgeContext = {
    'Novice': 'You have basic knowledge and prefer simple explanations. Ask clarifying questions when things are unclear.',
    'Intermediate': 'You have moderate knowledge and can discuss topics with some depth. You occasionally ask questions.',
    'Advanced': 'You have good knowledge and can provide detailed explanations. You rarely need clarification.',
    'Expert': 'You have extensive knowledge and can provide comprehensive, technical explanations.'
  };
  prompt += knowledgeContext[agent.knowledgeLevel] || knowledgeContext['Intermediate'];
  
  // Add emotional state context
  const emotionContext = {
    'neutral': 'Respond in a calm, professional manner.',
    'interested': 'Show enthusiasm and engagement in your response.',
    'cautious': 'Be careful and thoughtful in your response, asking clarifying questions.',
    'thoughtful': 'Take time to consider your response carefully.',
    'excited': 'Show excitement and energy in your response.'
  };
  prompt += ` ${emotionContext[emotionalState.current] || emotionContext['neutral']}`;
  
  // Add conversation context
  if (conversationHistory.length > 0) {
    prompt += ` You are continuing a conversation, so reference previous topics naturally.`;
  }
  
  prompt += `\n\nRespond as naturally as possible, incorporating your persona's characteristics. Use appropriate fillers, hesitations, and natural speech patterns. Keep responses conversational and human-like.`;
  
  return prompt;
}

// Add human-like elements to response
function addHumanElements(text, agent, emotionalState) {
  let modifiedText = text;
  
  // Add fillers based on hesitation level
  const hesitationLevel = agent.hesitationLevel || 'Medium';
  const fillerChance = {
    'Low': 0.1,
    'Medium': 0.2,
    'High': 0.3
  };
  
  if (Math.random() < fillerChance[hesitationLevel]) {
    const fillers = ['Um...', 'Well...', 'You know...', 'I mean...'];
    const filler = fillers[Math.floor(Math.random() * fillers.length)];
    modifiedText = filler + ' ' + modifiedText;
  }
  
  // Add self-corrections occasionally
  if (Math.random() < 0.1) {
    const corrections = ['Actually...', 'I mean...', 'Wait, let me think...'];
    const correction = corrections[Math.floor(Math.random() * corrections.length)];
    modifiedText = correction + ' ' + modifiedText;
  }
  
  // Add emotional expressions
  if (emotionalState.intensity > 0.7) {
    const expressions = ['!', '...', '?'];
    if (Math.random() < 0.3) {
      modifiedText += expressions[Math.floor(Math.random() * expressions.length)];
    }
  }
  
  return modifiedText;
}

// Calculate realistic typing delay
function calculateTypingDelay(responseText, agent, messageAnalysis) {
  const baseDelay = 1000; // 1 second base
  const lengthDelay = responseText.length * 50; // 50ms per character
  const complexityDelay = messageAnalysis.complexity === 'high' ? 2000 : 
                         messageAnalysis.complexity === 'medium' ? 1000 : 500;
  
  // Adjust based on agent's tech savviness (typing speed)
  const techSavviness = agent.knowledgeLevel || 'Intermediate';
  const speedMultiplier = {
    'Novice': 1.5,
    'Intermediate': 1.0,
    'Advanced': 0.8,
    'Expert': 0.6
  };
  
  const totalDelay = (baseDelay + lengthDelay + complexityDelay) * speedMultiplier[techSavviness];
  
  // Add some randomness (±20%)
  const randomFactor = 0.8 + (Math.random() * 0.4);
  
  return Math.min(Math.max(totalDelay * randomFactor, 1000), 8000); // Between 1-8 seconds
}

module.exports = router;