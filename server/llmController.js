// Controller for handling LLM API requests
const axios = require('axios');

// Sample initial nodes for fallback
const initialNodes = [
  { id: 1, label: "Decentralized Energy Grids", description: "Systems that distribute energy generation across multiple small-scale sources rather than centralized power plants.", type: "concept", properties: { importance: 0.9, domain: "energy" } },
  { id: 2, label: "Renewable Energy Sources", description: "Energy sources that are naturally replenished on a human timescale, such as sunlight, wind, rain, tides, waves, and geothermal heat.", type: "concept", properties: { importance: 0.8, domain: "energy" } },
  { id: 3, label: "Grid Resilience", description: "The ability of power systems to withstand and recover from extreme events and disruptions.", type: "property", properties: { importance: 0.7, domain: "energy" } },
  { id: 4, label: "Energy Storage Technologies", description: "Methods of storing energy for later use, including batteries, pumped hydro, and thermal storage.", type: "technology", properties: { importance: 0.8, domain: "energy" } },
  { id: 5, label: "Microgrid Implementation", description: "Small-scale power grids that can operate independently or in coordination with the main grid.", type: "process", properties: { importance: 0.6, domain: "energy" } },
  { id: 6, label: "Smart Grid Technologies", description: "Digital technology that allows for two-way communication between utilities and consumers.", type: "technology", properties: { importance: 0.7, domain: "technology" } },
  { id: 7, label: "Energy Democratization", description: "Shift of power from centralized entities to individuals and communities in energy production and distribution.", type: "concept", properties: { importance: 0.6, domain: "society" } },
  { id: 8, label: "Regulatory Frameworks", description: "Legal and policy structures governing energy production, distribution, and consumption.", type: "process", properties: { importance: 0.7, domain: "policy" } },
  { id: 9, label: "Community-Owned Energy", description: "Energy projects owned and operated by local communities rather than by corporations or governments.", type: "entity", properties: { importance: 0.5, domain: "society" } },
  { id: 10, label: "Grid Modernization", description: "Upgrading electricity infrastructure to improve reliability, efficiency, security, and integration of renewables.", type: "process", properties: { importance: 0.8, domain: "technology" } }
];

// Sample edges for fallback
const initialEdges = [
  { source: 1, target: 2, type: "depends_on", weight: 0.9, bidirectional: false },
  { source: 1, target: 3, type: "leads_to", weight: 0.7, bidirectional: false },
  { source: 1, target: 4, type: "depends_on", weight: 0.8, bidirectional: false },
  { source: 1, target: 5, type: "is_a", weight: 0.6, bidirectional: false },
  { source: 2, target: 4, type: "related_to", weight: 0.7, bidirectional: true },
  { source: 3, target: 10, type: "part_of", weight: 0.8, bidirectional: false },
  { source: 5, target: 6, type: "depends_on", weight: 0.7, bidirectional: false },
  { source: 7, target: 9, type: "leads_to", weight: 0.8, bidirectional: false },
  { source: 8, target: 10, type: "related_to", weight: 0.6, bidirectional: true },
  { source: 9, target: 7, type: "example_of", weight: 0.7, bidirectional: false }
];

// Sample clusters for fallback
const initialClusters = [
  { id: "c1", label: "Energy Infrastructure", description: "Physical and digital systems for energy distribution", nodes: [1, 3, 5, 10] },
  { id: "c2", label: "Energy Sources", description: "Origins and generation of power", nodes: [2, 4] },
  { id: "c3", label: "Social Aspects", description: "Community and social dimensions of energy", nodes: [7, 9] },
  { id: "c4", label: "Technology & Innovation", description: "Technological advancements in energy systems", nodes: [4, 6, 10] },
  { id: "c5", label: "Governance", description: "Rules and frameworks for energy management", nodes: [8] }
];

// Sample child nodes for expand-node endpoint
const expandNodeData = {
  1: {
    nodes: [
      { id: 101, label: "Peer-to-Peer Energy Trading", description: "Systems allowing consumers to buy and sell excess energy directly to each other.", type: "process", properties: { importance: 0.7, domain: "energy" } },
      { id: 102, label: "Blockchain for Energy", description: "Using distributed ledger technology to manage energy transactions.", type: "technology", properties: { importance: 0.6, domain: "technology" } },
      { id: 103, label: "Virtual Power Plants", description: "Cloud-based distributed power plants that aggregate capacity from multiple sources.", type: "concept", properties: { importance: 0.8, domain: "energy" } }
    ],
    edges: [
      { source: 1, target: 101, type: "leads_to", weight: 0.8, bidirectional: false },
      { source: 1, target: 102, type: "depends_on", weight: 0.6, bidirectional: false },
      { source: 1, target: 103, type: "part_of", weight: 0.9, bidirectional: false },
      { source: 101, target: 102, type: "related_to", weight: 0.7, bidirectional: true }
    ]
  },
  2: {
    nodes: [
      { id: 201, label: "Solar Photovoltaics", description: "Technology converting sunlight directly into electricity using semiconducting materials.", type: "technology", properties: { importance: 0.8, domain: "energy" } },
      { id: 202, label: "Wind Power Systems", description: "Conversion of wind energy into electrical power using wind turbines.", type: "technology", properties: { importance: 0.7, domain: "energy" } },
      { id: 203, label: "Hydroelectric Generation", description: "Electricity generated by the gravitational force of falling or flowing water.", type: "technology", properties: { importance: 0.6, domain: "energy" } }
    ],
    edges: [
      { source: 2, target: 201, type: "example_of", weight: 0.9, bidirectional: false },
      { source: 2, target: 202, type: "example_of", weight: 0.8, bidirectional: false },
      { source: 2, target: 203, type: "example_of", weight: 0.7, bidirectional: false }
    ]
  }
  // Add more for other nodes as needed
};

/**
 * Generate a knowledge graph from a user prompt
 * Uses OpenAI or other LLM APIs to create nodes and relationships
 */
exports.generateGraph = async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('No OpenAI API key found. Using fallback data.');
      return res.json({
        nodes: initialNodes,
        edges: initialEdges,
        clusters: initialClusters,
        metadata: {
          prompt: prompt,
          generated: new Date().toISOString(),
          version: "1.0"
        }
      });
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
          { "source": 1, "target": 2, "type": "is_a", "weight": 0.8, "bidirectional": false },
          ...
        ],
        "clusters": [
          { "id": "c1", "label": "Cluster 1", "description": "Description", "nodes": [1, 2, 3] },
          ...
        ]
      }
    `;
    
    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // or 'gpt-4' for better results
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Parse the LLM response
    const content = response.data.choices[0].message.content.trim();
    let graphData;
    
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      graphData = JSON.parse(jsonString);
      
      // Validate the structure
      if (!graphData.nodes || !Array.isArray(graphData.nodes) || 
          !graphData.edges || !Array.isArray(graphData.edges)) {
        throw new Error('Invalid response structure');
      }

      // Add metadata
      graphData.metadata = {
        prompt: prompt,
        generated: new Date().toISOString(),
        version: "1.0"
      };
      
    } catch (parseError) {
      console.error('Error parsing LLM response:', parseError);
      // Use fallback data on parsing error
      graphData = {
        nodes: initialNodes,
        edges: initialEdges,
        clusters: initialClusters,
        metadata: {
          prompt: prompt,
          generated: new Date().toISOString(),
          version: "1.0"
        }
      };
    }
    
    // Return the graph data
    res.json(graphData);
    
  } catch (error) {
    console.error('Error generating graph:', error);
    
    // Return fallback data on error
    res.json({
      nodes: initialNodes,
      edges: initialEdges,
      clusters: initialClusters,
      metadata: {
        prompt: req.body.prompt || "unknown",
        generated: new Date().toISOString(),
        version: "1.0"
      }
    });
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
    const expansionType = req.query.expansion_type || 'all';
    
    // Validate nodeId
    const id = Number.parseInt(nodeId, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid node ID' });
    }

    // Find the node to expand
    const sourceNode = initialNodes.find(n => n.id === id);
    if (!sourceNode) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Check if we already have expansion data for this node
    if (expandNodeData[id]) {
      const expansion = expandNodeData[id];
      return res.json({
        sourceNode: {
          id: sourceNode.id,
          label: sourceNode.label,
          type: sourceNode.type
        },
        nodes: expansion.nodes.slice(0, limit),
        edges: expansion.edges.filter(e => 
          expansion.nodes.slice(0, limit).some(n => e.source === n.id || e.target === n.id)
        )
      });
    }
    
    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('No OpenAI API key found. Using generated expansion data.');
      
      // Generate fallback expansion
      const expansion = generateFallbackExpansion(sourceNode, limit);
      return res.json(expansion);
    }
    
    // Create system prompt for the LLM to generate connected nodes
    const systemPrompt = `
      You are an AI specialized in generating semantic network expansions for knowledge graphs.
      Generate ${limit} connected nodes for the concept: "${sourceNode.label}" (${sourceNode.description}).
      
      Each node should have:
      - A unique id starting from ${id * 100 + 1}
      - A descriptive label (1-5 words)
      - A brief description (1-2 sentences)
      - A node type (concept, entity, process, property, question, technology)
      - Properties including importance (0-1) and domain
      
      Also generate edges connecting these new nodes to the source node and to each other with:
      - Source and target node IDs
      - A relationship type (is_a, part_of, related_to, leads_to, depends_on, contradicts, similar_to, example_of)
      - A weight value (0-1)
      - Whether it's bidirectional
      
      Format your response as a valid JSON object with this structure:
      {
        "nodes": [
          { "id": ${id * 100 + 1}, "label": "Related Node 1", "description": "Description", "type": "concept", "properties": { "importance": 0.8, "domain": "domain" } },
          ...
        ],
        "edges": [
          { "source": ${id}, "target": ${id * 100 + 1}, "type": "is_a", "weight": 0.8, "bidirectional": false },
          ...
        ]
      }
    `;
    
    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', 
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate connected nodes for the concept: "${sourceNode.label}"` }
        ],
        temperature: 0.7,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Parse the LLM response
    const content = response.data.choices[0].message.content.trim();
    let expansion;
    
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(jsonString);
      
      // Validate the structure
      if (!parsed.nodes || !Array.isArray(parsed.nodes) || 
          !parsed.edges || !Array.isArray(parsed.edges)) {
        throw new Error('Invalid response structure');
      }
      
      expansion = {
        sourceNode: {
          id: sourceNode.id,
          label: sourceNode.label,
          type: sourceNode.type
        },
        nodes: parsed.nodes,
        edges: parsed.edges
      };
      
    } catch (parseError) {
      console.error('Error parsing LLM response:', parseError);
      // Use fallback data on parsing error
      expansion = generateFallbackExpansion(sourceNode, limit);
    }
    
    // Return the expansion data
    res.json(expansion);
    
  } catch (error) {
    console.error('Error expanding node:', error);
    
    // Generate fallback on error
    const id = Number.parseInt(req.params.nodeId, 10);
    const limit = req.query.limit ? Number.parseInt(req.query.limit, 10) : 3;
    
    // Find the source node
    const sourceNode = initialNodes.find(n => n.id === id) || {
      id: id,
      label: `Node ${id}`,
      type: "concept"
    };
    
    res.json(generateFallbackExpansion(sourceNode, limit));
  }
};

/**
 * Generate fallback expansion data for a node
 * @param {Object} sourceNode - The node to expand
 * @param {number} limit - Number of connected nodes to generate
 * @returns {Object} - Expansion data with nodes and edges
 */
function generateFallbackExpansion(sourceNode, limit = 3) {
  const baseChildId = sourceNode.id * 100;
  const nodeTypes = ["concept", "entity", "process", "property", "technology"];
  const relationshipTypes = ["is_a", "part_of", "related_to", "leads_to", "depends_on", "example_of"];
  const domains = ["energy", "technology", "science", "society", "economy", "environment"];
  
  // Generate connected nodes
  const nodes = Array.from({ length: limit }, (_, index) => {
    const childId = baseChildId + index + 1;
    return {
      id: childId,
      label: `${sourceNode.label} Aspect ${index + 1}`,
      description: `A related aspect of ${sourceNode.label} focused on specific applications and implications.`,
      type: nodeTypes[Math.floor(Math.random() * nodeTypes.length)],
      properties: {
        importance: Math.round((0.5 + Math.random() * 0.4) * 10) / 10,
        domain: domains[Math.floor(Math.random() * domains.length)]
      }
    };
  });
  
  // Generate edges
  const edges = [];
  
  // Connect source to all children
  nodes.forEach(node => {
    edges.push({
      source: sourceNode.id,
      target: node.id,
      type: relationshipTypes[Math.floor(Math.random() * relationshipTypes.length)],
      weight: Math.round((0.6 + Math.random() * 0.3) * 10) / 10,
      bidirectional: Math.random() > 0.7
    });
  });
  
  // Add some edges between children
  if (nodes.length >= 2) {
    for (let i = 0; i < Math.min(nodes.length - 1, 2); i++) {
      edges.push({
        source: nodes[i].id,
        target: nodes[i + 1].id,
        type: "related_to",
        weight: Math.round((0.5 + Math.random() * 0.3) * 10) / 10,
        bidirectional: Math.random() > 0.5
      });
    }
  }
  
  return {
    sourceNode: {
      id: sourceNode.id,
      label: sourceNode.label,
      type: sourceNode.type || "concept"
    },
    nodes,
    edges
  };
} 