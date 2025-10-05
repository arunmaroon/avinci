const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');
const { pool } = require('../models/database');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to extract text from different file types
const extractTextFromFile = async (filePath, fileType) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // For now, we'll handle text-based files
    // In a production system, you'd use libraries like pdf-parse, mammoth, etc.
    if (fileType === 'txt' || fileType === 'md' || fileType === 'json' || fileType === 'csv') {
      return fileContent;
    }
    
    // For other file types, return a placeholder
    return `Document content from ${fileType} file: ${filePath}`;
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return `Error reading file: ${filePath}`;
  }
};

// Helper function to analyze documents and extract user personas
const analyzeDocumentsForPersonas = async (documents, config) => {
  try {
    const documentTexts = [];
    
    // Extract text from all documents
    for (const doc of documents) {
      const text = await extractTextFromFile(doc.path, doc.type);
      documentTexts.push(`Document: ${doc.name}\n${text}\n---\n`);
    }
    
    const combinedText = documentTexts.join('\n');
    
    // Use OpenAI to analyze documents and generate personas
    const prompt = `
Analyze the following research documents and extract diverse user personas based on the data. 
Create ${config.numberOfAgents} distinct personas that represent different user types found in the research.

Configuration:
- Tech Savviness: ${config.techSavviness}
- English Level: ${config.englishLevel}
- Fintech Savviness: ${config.fintechSavviness}
- Demographic Diversity: ${config.demographicDiversity}

Documents:
${combinedText}

For each persona, provide:
1. Name (realistic first and last name)
2. Persona type (e.g., "Tech-Savvy Millennial", "Traditional Business Owner")
3. Knowledge level (Novice, Intermediate, Advanced, Expert)
4. Language style (Casual, Conversational, Technical, Formal)
5. Emotional range (Reserved, Moderate, Expressive, Highly Expressive)
6. Hesitation level (Low, Medium, High)
7. Key traits (array of 3-5 personality traits)
8. Detailed prompt (2-3 sentences describing their background, preferences, and communication style)

Return the response as a JSON array with this exact structure:
[
  {
    "name": "John Smith",
    "persona": "Tech-Savvy Millennial",
    "knowledge_level": "Expert",
    "language_style": "Technical",
    "emotional_range": "Moderate",
    "hesitation_level": "Low",
    "traits": ["Analytical", "Innovation-focused", "Detail-oriented"],
    "prompt": "You are John, a tech-savvy millennial who works in fintech..."
  }
]
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert UX researcher who analyzes user research data to create authentic user personas. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Could not parse personas from AI response');
    }
  } catch (error) {
    console.error('Error analyzing documents:', error);
    throw error;
  }
};

// Generate sample agents (for the "Generate Sample Agents" button)
router.post('/sample', async (req, res) => {
  try {
    console.log('Generating sample agents...');
    
    // Pre-defined sample agents
    const sampleAgents = [
      {
        name: 'Sarah Chen',
        persona: 'Tech-Savvy Millennial',
        knowledge_level: 'Expert',
        language_style: 'Technical',
        emotional_range: 'Moderate',
        hesitation_level: 'Low',
        traits: ['Analytical', 'Detail-oriented', 'Innovation-focused'],
        prompt: 'You are Sarah, a tech-savvy millennial who works in fintech. You understand complex financial products and can explain EMI calculations in detail. You prefer digital solutions and are comfortable with new technologies.'
      },
      {
        name: 'Raj Patel',
        persona: 'Traditional Business Owner',
        knowledge_level: 'Novice',
        language_style: 'Casual',
        emotional_range: 'Reserved',
        hesitation_level: 'High',
        traits: ['Cautious', 'Traditional', 'Relationship-focused'],
        prompt: 'You are Raj, a traditional business owner who prefers face-to-face interactions. You are cautious about new technologies and need simple explanations. You value personal relationships and trust in financial matters.'
      },
      {
        name: 'Emily Rodriguez',
        persona: 'Young Professional',
        knowledge_level: 'Intermediate',
        language_style: 'Conversational',
        emotional_range: 'Expressive',
        hesitation_level: 'Medium',
        traits: ['Enthusiastic', 'Learning-oriented', 'Social'],
        prompt: 'You are Emily, a young professional who is eager to learn about financial products. You ask questions and show enthusiasm. You prefer mobile apps and digital solutions but need guidance on complex features.'
      },
      {
        name: 'David Kim',
        persona: 'Senior Executive',
        knowledge_level: 'Advanced',
        language_style: 'Formal',
        emotional_range: 'Reserved',
        hesitation_level: 'Low',
        traits: ['Strategic', 'Time-conscious', 'Results-focused'],
        prompt: 'You are David, a senior executive who values efficiency and strategic thinking. You prefer comprehensive solutions and need detailed information to make decisions. You are comfortable with technology but want it to be reliable.'
      }
    ];

    // Insert agents into database
    const createdAgents = [];
    for (const agent of sampleAgents) {
      const result = await pool.query(
        `INSERT INTO agents (name, persona, knowledge_level, language_style, emotional_range, hesitation_level, traits, prompt, avatar)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [agent.name, agent.persona, agent.knowledge_level, agent.language_style, 
         agent.emotional_range, agent.hesitation_level, JSON.stringify(agent.traits), agent.prompt, null]
      );
      createdAgents.push(result.rows[0]);
    }

    res.json({ 
      success: true, 
      message: 'Sample agents generated successfully',
      agents: createdAgents 
    });

  } catch (error) {
    console.error('Error generating sample agents:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate sample agents',
      details: error.message 
    });
  }
});

// Generate agents from documents
router.post('/from-documents', upload.array('documents', 10), async (req, res) => {
  try {
    console.log('Generating agents from documents...');
    
    const { numberOfAgents, techSavviness, englishLevel, fintechSavviness, demographicDiversity } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No documents uploaded' 
      });
    }

    // Prepare document information
    const documents = files.map(file => ({
      name: file.originalname,
      path: file.path,
      type: file.originalname.split('.').pop().toLowerCase()
    }));

    const config = {
      numberOfAgents: parseInt(numberOfAgents) || 5,
      techSavviness,
      englishLevel,
      fintechSavviness,
      demographicDiversity
    };

    // Analyze documents and generate personas
    const personas = await analyzeDocumentsForPersonas(documents, config);

    // Insert agents into database
    const createdAgents = [];
    for (const persona of personas) {
      const result = await pool.query(
        `INSERT INTO agents (name, persona, knowledge_level, language_style, emotional_range, hesitation_level, traits, prompt, avatar)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [persona.name, persona.persona, persona.knowledge_level, persona.language_style, 
         persona.emotional_range, persona.hesitation_level, JSON.stringify(persona.traits), persona.prompt, null]
      );
      createdAgents.push(result.rows[0]);
    }

    // Clean up uploaded files
    files.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    });

    res.json({ 
      success: true, 
      message: 'Agents generated successfully from documents',
      agents: createdAgents 
    });

  } catch (error) {
    console.error('Error generating agents from documents:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate agents from documents',
      details: error.message 
    });
  }
});

module.exports = router;