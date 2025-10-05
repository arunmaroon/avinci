const express = require('express');
const { pool } = require('../models/database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get all agents
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM agents ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get agent by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM agents WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// Create new agent
router.post('/', async (req, res) => {
  try {
    const {
      name,
      persona,
      knowledgeLevel,
      languageStyle,
      emotionalRange,
      hesitationLevel,
      traits,
      prompt
    } = req.body;

    // Validate required fields
    if (!name || !persona || !knowledgeLevel || !languageStyle) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, persona, knowledgeLevel, languageStyle' 
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO agents (
        id, name, persona, knowledge_level, language_style, 
        emotional_range, hesitation_level, traits, prompt, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        id,
        name,
        persona,
        knowledgeLevel,
        languageStyle,
        emotionalRange || 'Moderate',
        hesitationLevel || 'Medium',
        JSON.stringify(traits || []),
        prompt || '',
        now,
        now
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Update agent
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      persona,
      knowledgeLevel,
      languageStyle,
      emotionalRange,
      hesitationLevel,
      traits,
      prompt
    } = req.body;

    const now = new Date().toISOString();

    const result = await pool.query(
      `UPDATE agents SET 
        name = COALESCE($1, name),
        persona = COALESCE($2, persona),
        knowledge_level = COALESCE($3, knowledge_level),
        language_style = COALESCE($4, language_style),
        emotional_range = COALESCE($5, emotional_range),
        hesitation_level = COALESCE($6, hesitation_level),
        traits = COALESCE($7, traits),
        prompt = COALESCE($8, prompt),
        updated_at = $9
      WHERE id = $10
      RETURNING *`,
      [
        name,
        persona,
        knowledgeLevel,
        languageStyle,
        emotionalRange,
        hesitationLevel,
        traits ? JSON.stringify(traits) : null,
        prompt,
        now,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Delete agent
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM agents WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ success: true, deletedAgent: result.rows[0] });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// Generate agents from documents
router.post('/generate', async (req, res) => {
  try {
    const { documents, numberOfAgents, focusAreas, demographicDiversity } = req.body;

    if (!documents || documents.length === 0) {
      return res.status(400).json({ error: 'Documents are required' });
    }

    // This would integrate with the agent generation service
    // For now, return a placeholder response
    res.json({
      message: 'Agent generation started',
      jobId: uuidv4(),
      status: 'processing'
    });
  } catch (error) {
    console.error('Error generating agents:', error);
    res.status(500).json({ error: 'Failed to generate agents' });
  }
});

// Get agent generation status
router.get('/generate/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // This would check the actual generation status
    // For now, return a mock response
    res.json({
      jobId,
      status: 'completed',
      agents: [],
      progress: 100
    });
  } catch (error) {
    console.error('Error checking generation status:', error);
    res.status(500).json({ error: 'Failed to check generation status' });
  }
});

module.exports = router;