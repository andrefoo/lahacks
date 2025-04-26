// Service for interacting with the LLM API
// Handles fetching graph data based on user prompts

import { detectBiases } from './biasDetection';

// Sample initial nodes as fallback
const initialNodes = [
  { id: 1, label: "Decentralized Energy Grids", description: "Systems that distribute energy generation across multiple small-scale sources rather than centralized power plants.", type: "concept", properties: { importance: 0.9, domain: "energy" }, hasBias: true, biasType: "Technological Solutionism", biasDescription: "Overemphasizing technology as the solution to complex social, economic, and political problems." },
  { id: 2, label: "Renewable Energy Sources", description: "Energy sources that are naturally replenished on a human timescale, such as sunlight, wind, rain, tides, waves, and geothermal heat.", type: "concept", properties: { importance: 0.8, domain: "energy" } },
  { id: 3, label: "Grid Resilience", description: "The ability of power systems to withstand and recover from extreme events and disruptions.", type: "property", properties: { importance: 0.7, domain: "energy" } },
  { id: 4, label: "Energy Storage Technologies", description: "Methods of storing energy for later use, including batteries, pumped hydro, and thermal storage.", type: "technology", properties: { importance: 0.8, domain: "energy" }, hasBias: true, biasType: "Confirmation Bias", biasDescription: "Favoring information that confirms existing beliefs while giving less attention to alternative possibilities." },
  { id: 5, label: "Microgrid Implementation", description: "Small-scale power grids that can operate independently or in coordination with the main grid.", type: "process", properties: { importance: 0.6, domain: "energy" } },
  { id: 6, label: "Smart Grid Technologies", description: "Digital technology that allows for two-way communication between utilities and consumers.", type: "technology", properties: { importance: 0.7, domain: "technology" } },
  { id: 7, label: "Energy Democratization", description: "Shift of power from centralized entities to individuals and communities in energy production and distribution.", type: "concept", properties: { importance: 0.6, domain: "society" }, hasBias: true, biasType: "Overconfidence Bias", biasDescription: "Overestimating one's abilities, knowledge, or the accuracy of one's beliefs." },
  { id: 8, label: "Regulatory Frameworks", description: "Legal and policy structures governing energy production, distribution, and consumption.", type: "process", properties: { importance: 0.7, domain: "policy" } },
  { id: 9, label: "Community-Owned Energy", description: "Energy projects owned and operated by local communities rather than by corporations or governments.", type: "entity", properties: { importance: 0.5, domain: "society" } },
  { id: 10, label: "Grid Modernization", description: "Upgrading electricity infrastructure to improve reliability, efficiency, security, and integration of renewables.", type: "process", properties: { importance: 0.8, domain: "technology" }, hasBias: true, biasType: "Status Quo Bias", biasDescription: "Preference for the current state of affairs and resistance to change." }
];

// Sample edges as fallback
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

// Sample clusters as fallback
const initialClusters = [
  { id: "c1", label: "Energy Infrastructure", description: "Physical and digital systems for energy distribution", nodes: [1, 3, 5, 10] },
  { id: "c2", label: "Energy Sources", description: "Origins and generation of power", nodes: [2, 4] },
  { id: "c3", label: "Social Aspects", description: "Community and social dimensions of energy", nodes: [7, 9] },
  { id: "c4", label: "Technology & Innovation", description: "Technological advancements in energy systems", nodes: [4, 6, 10] },
  { id: "c5", label: "Governance", description: "Rules and frameworks for energy management", nodes: [8] }
];

// Sample expansions for nodes
const nodeExpansions = {
  1: {
    sourceNode: {
      id: 1,
      label: "Decentralized Energy Grids",
      type: "concept"
    },
    nodes: [
      { id: 101, label: "Peer-to-Peer Energy Trading", description: "Systems allowing consumers to buy and sell excess energy directly to each other.", type: "process", properties: { importance: 0.7, domain: "energy" } },
      { id: 102, label: "Blockchain for Energy", description: "Using distributed ledger technology to manage energy transactions.", type: "technology", properties: { importance: 0.6, domain: "technology" }, hasBias: true, biasType: "Shiny Object Bias", biasDescription: "Favoring new, exciting technologies over established solutions that may work better." },
      { id: 103, label: "Virtual Power Plants", description: "Cloud-based distributed power plants that aggregate capacity from multiple sources.", type: "concept", properties: { importance: 0.8, domain: "energy" } }
    ],
    edges: [
      { source: 1, target: 101, type: "leads_to", weight: 0.8, bidirectional: false },
      { source: 1, target: 102, type: "depends_on", weight: 0.6, bidirectional: false },
      { source: 1, target: 103, type: "part_of", weight: 0.9, bidirectional: false },
      { source: 101, target: 102, type: "related_to", weight: 0.7, bidirectional: true }
    ]
  }
};

/**
 * Fetch graph data from the LLM API based on user prompt
 * @param {string} prompt - User's input prompt
 * @returns {Object} - Knowledge graph data with nodes, edges, and clusters
 */
export const fetchGraphData = async (prompt) => {
  try {
    // In a real implementation, call the server endpoint
    const endpoint = '/api/generate-graph';
    
    // In production, make the actual API call
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch graph data');
    }
    
    const data = await response.json();
    
    // Process the nodes to detect biases
    const nodesWithBiases = detectBiases(data.nodes);
    
    return {
      ...data,
      nodes: nodesWithBiases
    };
  } catch (error) {
    console.error('Error fetching graph data:', error);
    
    // Return fallback data
    return {
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
};

/**
 * Fetch expanded node data for a specific node
 * @param {number} nodeId - ID of the node to expand
 * @param {number} limit - Maximum number of connected nodes to return
 * @param {string} expansionType - Type of expansion (children, related, all)
 * @returns {Object} - Object containing nodes and edges connected to the source node
 */
export const fetchNodeExpansion = async (nodeId, limit = 3, expansionType = 'all') => {
  try {
    // Always use the real API endpoint
    const endpoint = `/api/expand-node/${nodeId}?limit=${limit}&expansion_type=${expansionType}`;
    
    // Make the API call
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to expand node ${nodeId}`);
    }
    
    const data = await response.json();
    
    // Process nodes to detect biases
    if (data.nodes && Array.isArray(data.nodes)) {
      data.nodes = detectBiases(data.nodes);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching expansion for node ${nodeId}:`, error);
    
    // Create fallback expansion
    const sourceNode = initialNodes.find(n => n.id === nodeId) || { 
      id: nodeId, 
      label: `Node ${nodeId}`, 
      type: "concept" 
    };
    
    const fallbackNodes = Array.from({ length: limit }, (_, i) => ({
      id: nodeId * 100 + i + 1,
      label: `Related to ${sourceNode.label} ${i + 1}`,
      description: `Fallback connected node for ${sourceNode.label}.`,
      type: "concept",
      properties: {
        importance: 0.5,
        domain: "general"
      }
    }));
    
    const fallbackEdges = fallbackNodes.map(node => ({
      source: nodeId,
      target: node.id,
      type: "related_to",
      weight: 0.5,
      bidirectional: false
    }));
    
    return {
      sourceNode,
      nodes: fallbackNodes,
      edges: fallbackEdges
    };
  }
};

/**
 * Check if the API server is healthy
 * @returns {boolean} - Whether the API server is available
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch('/api/health');
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}; 