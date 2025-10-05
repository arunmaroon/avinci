const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../models/database');
const DocumentProcessor = require('../services/documentProcessor');
const AgentGenerator = require('../services/agentGenerator');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
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
            cb(new Error('Invalid file type'));
        }
    }
});

router.post('/', authenticateToken, upload.single('document'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const uploadResult = await pool.query(
            'INSERT INTO document_uploads (filename, original_name, file_path, file_size, mime_type, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype, req.user.id]
        );

        const uploadId = uploadResult.rows[0].id;
        processDocumentAsync(uploadId, req.file.path, req.file.mimetype, req.user.id);

        res.json({
            message: 'File uploaded successfully',
            uploadId: uploadId,
            filename: req.file.originalname
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

router.get('/status/:uploadId', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT u.*, COUNT(a.id) as generated_agents FROM document_uploads u LEFT JOIN ai_agents a ON a.source_document = u.id::text WHERE u.id = $1 AND u.uploaded_by = $2 GROUP BY u.id',
            [req.params.uploadId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Upload not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get status' });
    }
});

router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT u.*, COUNT(a.id) as generated_agents FROM document_uploads u LEFT JOIN ai_agents a ON a.source_document = u.id::text WHERE u.uploaded_by = $1 GROUP BY u.id ORDER BY u.created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get uploads' });
    }
});

async function processDocumentAsync(uploadId, filePath, mimeType, adminId) {
    try {
        await pool.query('UPDATE document_uploads SET status = $1 WHERE id = $2', ['processing', uploadId]);
        
        console.log('Processing document:', uploadId);
        const participantData = await DocumentProcessor.processDocument(filePath, mimeType);
        console.log('Found participants:', participantData.length);
        
        const agents = await AgentGenerator.generateFromDocument(participantData, uploadId, adminId);
        
        await pool.query('UPDATE document_uploads SET status = $1, processed_agents_count = $2, processed_at = CURRENT_TIMESTAMP WHERE id = $3', ['completed', agents.length, uploadId]);
        
        console.log('Successfully generated agents:', agents.length);
    } catch (error) {
        console.error('Processing error:', error);
        await pool.query('UPDATE document_uploads SET status = $1, error_message = $2 WHERE id = $3', ['error', error.message, uploadId]);
    }
}

module.exports = router;
