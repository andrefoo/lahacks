// Vercel API route for expanding knowledge graph nodes
import axios from 'axios';

// Note: In a serverless environment, this won't persist between function calls
// You would need a database or Redis to store this properly
let lastGeneratedGraph = null;

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nodeId } = req.query;
    const limit = req.query.limit ? Number.parseInt(req.query.limit, 10) : 3;
    const expansionType = req.query.expansion_type || "all";

    // Validate nodeId
    const id = Number.parseInt(nodeId, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid node ID" });
    }

    // In a real serverless environment, you'll need a database to store the graph
    // This is just a placeholder that won't work across function invocations
    if (!lastGeneratedGraph?.nodes) {
      return res.status(404).json({ error: "No graph data exists. Generate a graph first." });
    }
    
    const sourceNode = lastGeneratedGraph.nodes.find((n) => n.id === id);
    
    // If node not found, return error
    if (!sourceNode) {
      return res.status(404).json({ error: "Node not found in current graph" });
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key is not configured" });
    }

    // For a real implementation, you would use the Gemini API to expand the node
    // This is a simplified version that just returns connected nodes
    
    // Get connected nodes from the last generated graph
    const connectedEdges = lastGeneratedGraph.edges.filter(
      edge => edge.source === id || edge.target === id
    );
    
    const connectedNodeIds = Array.from(
      new Set(
        connectedEdges.map(edge => edge.source === id ? edge.target : edge.source)
      )
    );
    
    const connectedNodes = connectedNodeIds.map(nodeId => 
      lastGeneratedGraph.nodes.find(n => n.id === nodeId)
    ).filter(Boolean);

    // Return the expanded node data
    res.status(200).json({
      sourceNode: sourceNode,
      nodes: connectedNodes,
      edges: connectedEdges
    });
    
  } catch (error) {
    console.error("Error expanding node:", error);
    return res.status(500).json({ error: "Failed to expand node" });
  }
} 