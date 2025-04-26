// API routes for the Express server
const express = require('express');
const llmController = require('./llmController');

const router = express.Router();

// Main endpoint for generating knowledge graph from prompt
router.post('/generate-graph', llmController.generateGraph);

// Endpoint for expanding a specific node
router.get('/expand-node/:nodeId', llmController.expandNode);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    version: '1.0.0'
  });
});

module.exports = router; 