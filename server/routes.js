// API routes for the Express server
const express = require('express');
const llmController = require('./llmController');

const router = express.Router();

// Route for generating knowledge graph from prompt
router.post('/generate-graph', llmController.generateGraph);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router; 