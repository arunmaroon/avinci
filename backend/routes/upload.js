const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../models/database');
const DocumentProcessor = require('../services/documentProcessor');
const AgentGenerator = require('../services/agentGenerator');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only CSV, Excel, and Text files are allowed.'));
        }
    }
});

// Upload and process document
router.post('/', authenticateToken, upload.single('document'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Save upload record
        const uploadResult = await pool.query(`
            INSERT INTO document_uploads (filename, original_name, file_path, file_size, mime_type, uploaded_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [
            req.file.filename,
            req.file.originalname,
            req.file.path,
            req.file.size,
            req.file.mimetype,
            req.user.id
        ]);

        const uploadId = uploadResult.rows[0].id;

        // Process document in background
        processDocumentAsync(uploadId, req.file.path, req.file.mimetype, req.user.id);

        res.json({
            message: 'File uploaded successfully. Processing in background.',
            uploadId: uploadId,
            filename: req.file.originalname
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Get upload status
router.get('/status/:uploadId', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.*, COUNT(a.id) as generated_agents
            FROM document_uploads u
            LEFT JOIN ai_agents a ON a.source_document = u.id::text
            WHERE u.id = $1 AND u.uploaded_by = $2
            GROUP BY u.id
        `, [req.params.uploadId, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: 'Failed to get status' });
    }
});

// Background processing function
async function processDocumentAsync(uploadId, filePath, mimeType, adminId) {
    try {
        // Update status to processing
        await pool.query(
            'UPDATE document_uploads SET status = $1 WHERE id = $2',
            ['processing', uploadId]
        );

        // Process document
        const participantData = await DocumentProcessor.processDocument(filePath, mimeType);
        
        // Generate agents
        const agents = await AgentGenerator.generateFromDocument(participantData, uploadId, adminId);

        // Update status to completed
        await pool.query(`
            UPDATE document_uploads 
            SET status = $1, processed_agents_count = $2 
            WHERE id = $3
        `, ['completed', agents.length, uploadId]);

        console.log(`Successfully generated ${agents.length} agents from upload ${uploadId}`);

    } catch (error) {
        console.error('Background processing error:', error);
        
        // Update status to error
        await pool.query(
            'UPDATE document_uploads SET status = $1 WHERE id = $2',
            ['error', uploadId]
        );
    }
}

// Get all uploads
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.*, COUNT(a.id) as generated_agents
            FROM document_uploads u
            LEFT JOIN ai_agents a ON a.source_document = u.id::text
            WHERE u.uploaded_by = $1
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `, [req.user.id]);

        res.json(result.rows);
    } catch (error) {
        console.error('Get uploads error:', error);
        res.status(500).json({ error: 'Failed to get uploads' });
    }
});

module.exports = router;
