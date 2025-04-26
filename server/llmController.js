// Controller for handling LLM API requests
const axios = require("axios");

// In-memory store for recently generated graphs
const memoryStore = {
  lastGeneratedGraph: null
};

/**
 * Generate a knowledge graph from a user prompt
 * Uses Gemini API to create nodes and relationships
 */
exports.generateGraph = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key is not configured" });
    }

    // Create system prompt for the LLM to generate a knowledge graph
    const systemPrompt = `
      You are an AI specialized in generating knowledge graphs from user queries.
      Based on the user's topic, generate:
      1. 10 nodes (concepts, entities, processes, etc) related to the topic.
      2. A set of edges connecting nodes with semantic relationships.
      3. Clusters that group related nodes together.
      
      Each node should have:
      - A unique id (1-10)
      - A descriptive label (1-5 words)
      - A brief description (1-2 sentences)
      - A type (concept, entity, process, property, question, technology)
      - Properties including importance (0-1) and domain
      
      Each edge should have:
      - Source and target node IDs
      - A relationship type (is_a, part_of, related_to, leads_to, depends_on, contradicts, similar_to, example_of)
      - A description explaining the relationship between the two nodes (1-2 sentences)
      - A weight value (0-1)
      - Whether it's bidirectional
      
      Each cluster should:
      - Group related nodes
      - Have a descriptive label
      - Have a brief description
      
      Format your response as a valid JSON object with this structure:
      {
        "nodes": [
          { "id": 1, "label": "Concept 1", "description": "Description", "type": "concept", "properties": { "importance": 0.9, "domain": "domain1" } },
          ...
        ],
        "edges": [
          { "source": 1, "target": 2, "type": "is_a", "weight": 0.8, "bidirectional": false, "description": "Description of how these nodes relate" },
          ...
        ],
        "clusters": [
          { "id": "c1", "label": "Cluster 1", "description": "Description", "nodes": [1, 2, 3] },
          ...
        ]
      }
    `;

    // Call Gemini API
    let response;
    try {
      console.log("Making Gemini API request...");
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      response = await axios.post(
        apiUrl,
        {
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2500,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
      console.log("Received Gemini API response");
    } catch (error) {
      console.error("Error calling Gemini API:", error.response ? error.response.data : error.message);
      return res.status(500).json({ error: "Error calling Gemini API" });
    }
    
    // Parse the Gemini response
    let content;
    try {
      if (response.data?.candidates && response.data.candidates.length > 0) {
        const candidate = response.data.candidates[0];
        if (candidate?.content?.parts && candidate.content.parts.length > 0) {
          content = candidate.content.parts[0].text;
        } else {
          throw new Error("No content in Gemini response");
        }
      } else {
        throw new Error("Invalid Gemini response structure");
      }
    } catch (error) {
      console.error("Error extracting content from Gemini response:", error);
      return res.status(500).json({ error: "Error parsing Gemini response" });
    }

    let graphData;
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      graphData = JSON.parse(jsonString);

      // Validate the structure
      if (
        !graphData.nodes ||
        !Array.isArray(graphData.nodes) ||
        !graphData.edges ||
        !Array.isArray(graphData.edges)
      ) {
        throw new Error("Invalid response structure");
      }

      // Add metadata
      graphData.metadata = {
        prompt: prompt,
        generated: new Date().toISOString(),
        version: "1.0",
      };
      
      // Store the graph data in memory for expand-node endpoint to use
      memoryStore.lastGeneratedGraph = {
        nodes: graphData.nodes,
        edges: graphData.edges,
        clusters: graphData.clusters || []
      };
      
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError);
      return res.status(500).json({ error: "Failed to parse API response" });
    }

    // Return the graph data
    res.json(graphData);
  } catch (error) {
    console.error("Error generating graph:", error);
    return res.status(500).json({ error: "Failed to generate graph" });
  }
};

/**
 * Expand a specific node to get its connected nodes
 * @param {Object} req - Express request object with nodeId parameter
 * @param {Object} res - Express response object
 */
exports.expandNode = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const limit = req.query.limit ? Number.parseInt(req.query.limit, 10) : 3;
    const expansionType = req.query.expansion_type || "all";

    // Validate nodeId
    const id = Number.parseInt(nodeId, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid node ID" });
    }

    // Find the node to expand from our most recently generated graph
    if (!memoryStore.lastGeneratedGraph?.nodes) {
      return res.status(404).json({ error: "No graph data exists. Generate a graph first." });
    }
    
    const sourceNode = memoryStore.lastGeneratedGraph.nodes.find((n) => n.id === id);
    
    // If node not found, return error
    if (!sourceNode) {
      return res.status(404).json({ error: "Node not found in current graph" });
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key is not configured" });
    }

    // Get information about existing nodes to avoid duplicates
    const existingNodes = memoryStore.lastGeneratedGraph.nodes;
    const existingNodeInfo = existingNodes.map(node => ({
      id: node.id,
      label: node.label,
      type: node.type
    }));
    
    // Get a list of nodes already connected to this node
    const connectedNodes = memoryStore.lastGeneratedGraph.edges
      .filter(edge => edge.source === id || edge.target === id)
      .map(edge => {
        const connectedId = edge.source === id ? edge.target : edge.source;
        const connectedNode = existingNodes.find(n => n.id === connectedId);
        return connectedNode ? {
          id: connectedNode.id,
          label: connectedNode.label,
          relationship: edge.type
        } : null;
      })
      .filter(Boolean);

    // Create system prompt for the LLM to generate connected nodes
    const systemPrompt = `
      You are an AI specialized in generating semantic network expansions for knowledge graphs.
      Generate ${limit} connected nodes for the concept: "${
      sourceNode.label
    }" (${sourceNode.description || "No description available"}).
      
      The knowledge graph already contains the following nodes:
      ${JSON.stringify(existingNodeInfo, null, 2)}
      
      And this source node is already connected to:
      ${JSON.stringify(connectedNodes, null, 2)}
      
      IMPORTANT: Avoid generating nodes that duplicate or are too similar to existing nodes in the graph.
      Generate nodes that are semantically distinct from the existing ones.
      
      Each node should have:
      - A unique id starting from ${id * 100 + 1}
      - A descriptive label (1-5 words)
      - A brief description (1-2 sentences)
      - A node type (concept, entity, process, property, question, technology)
      - Properties including importance (0-1) and domain
      
      Also generate edges connecting these new nodes to the source node and to each other with:
      - Source and target node IDs
      - A relationship type (is_a, part_of, related_to, leads_to, depends_on, contradicts, similar_to, example_of)
      - A description explaining the relationship between the two nodes (1-2 sentences)
      - A weight value (0-1)
      - Whether it's bidirectional
      
      Format your response as a valid JSON object with this structure:
      {
        "nodes": [
          { "id": ${
            id * 100 + 1
          }, "label": "Related Node 1", "description": "Description", "type": "concept", "properties": { "importance": 0.8, "domain": "domain" } },
          ...
        ],
        "edges": [
          { "source": ${id}, "target": ${
      id * 100 + 1
    }, "type": "is_a", "weight": 0.8, "bidirectional": false, "description": "Description of how these nodes relate" },
          ...
        ]
      }
    `;

    console.log("Making Gemini API request for node expansion...");
    // Call Google Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `Generate connected nodes for the concept: "${sourceNode.label}"` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        }
      }
    );

    console.log("Received Gemini API response for node expansion");

    // Parse the Gemini response
    let content;
    if (response.data?.candidates && response.data.candidates.length > 0) {
      const candidate = response.data.candidates[0];
      if (candidate?.content?.parts && candidate.content.parts.length > 0) {
        content = candidate.content.parts[0].text;
      } else {
        throw new Error("No content in Gemini response");
      }
    } else {
      throw new Error("Invalid Gemini response structure");
    }
    
    // Create the expansion object
    let nodeExpansion;
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(jsonString);

      // Validate the structure
      if (
        !parsed.nodes ||
        !Array.isArray(parsed.nodes) ||
        !parsed.edges ||
        !Array.isArray(parsed.edges)
      ) {
        throw new Error("Invalid response structure");
      }
      
      // Filter out duplicate nodes based on label or description similarity
      const filteredNodes = parsed.nodes.filter(newNode => {
        // Check if there's a node with the same ID (direct duplicate)
        const idDuplicate = existingNodes.some(existingNode => existingNode.id === newNode.id);
        if (idDuplicate) return false;
        
        // Check for label similarity
        const labelDuplicate = existingNodes.some(existingNode => {
          // Exact match
          if (existingNode.label.toLowerCase() === newNode.label.toLowerCase()) return true;
          
          // Similar enough (contains each other or >70% the same)
          const existingLower = existingNode.label.toLowerCase();
          const newLower = newNode.label.toLowerCase();
          
          return existingLower.includes(newLower) || 
                 newLower.includes(existingLower);
        });
        
        return !labelDuplicate;
      });
      
      // If we filtered out all nodes, return the original nodes
      // but with uniqueness enforced through ID changes
      const finalNodes = filteredNodes.length > 0 ? filteredNodes : 
        parsed.nodes.map((node, index) => ({
          ...node,
          id: id * 1000 + index + 1, // Use a larger multiplier to avoid conflicts
          label: `${node.label} (Variant)` // Slightly modify label
        }));
      
      // Update edges to use the new node IDs if needed
      const finalEdges = parsed.edges.filter(edge => {
        // Keep edges connected to source node
        if (edge.source === id) {
          return finalNodes.some(n => n.id === edge.target);
        }
        if (edge.target === id) {
          return finalNodes.some(n => n.id === edge.source);
        }
        
        // For edges between new nodes
        const sourceExists = finalNodes.some(n => n.id === edge.source);
        const targetExists = finalNodes.some(n => n.id === edge.target);
        return sourceExists && targetExists;
      });

      nodeExpansion = {
        sourceNode: {
          id: sourceNode.id,
          label: sourceNode.label,
          type: sourceNode.type,
        },
        nodes: finalNodes,
        edges: finalEdges,
      };
      
      // Add expanded nodes to the memory store so they can be expanded later
      if (memoryStore.lastGeneratedGraph && Array.isArray(memoryStore.lastGeneratedGraph.nodes)) {
        memoryStore.lastGeneratedGraph.nodes = [
          ...memoryStore.lastGeneratedGraph.nodes,
          ...finalNodes.filter(newNode => 
            !memoryStore.lastGeneratedGraph.nodes.some(existingNode => existingNode.id === newNode.id)
          )
        ];
        
        // Also add the new edges
        if (Array.isArray(memoryStore.lastGeneratedGraph.edges)) {
          memoryStore.lastGeneratedGraph.edges = [
            ...memoryStore.lastGeneratedGraph.edges,
            ...finalEdges.filter(newEdge => 
              !memoryStore.lastGeneratedGraph.edges.some(existingEdge => 
                existingEdge.source === newEdge.source && existingEdge.target === newEdge.target
              )
            )
          ];
        }
      }
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError);
      return res.status(500).json({ error: "Failed to parse node expansion data" });
    }

    // Return the expansion data
    res.json(nodeExpansion);
  } catch (error) {
    console.error("Error expanding node:", error);
    return res.status(500).json({ error: "Failed to expand node" });
  }
};
