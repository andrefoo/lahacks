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
    const endpoint = '/api/generate-graph';
    
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
    throw error;
  }
};

/**
 * Fetch expanded node data for a specific node
 * @param {number} nodeId - ID of the node to expand
 * @param {number} limit - Maximum number of connected nodes to return
 * @param {string} expansionType - Type of expansion (theory, experiments, philosophical, practical, all)
 * @returns {Object} - Object containing nodes and edges connected to the source node
 */
export const fetchNodeExpansion = async (nodeId, limit = 3, expansionType = 'all') => {
  try {
    console.log(`Fetching expansion for node ${nodeId} with type ${expansionType}`);
    
    // For development fallback, when API is not available, use mock data
    const useLocalMock = false; // Set to false to use the real API
    
    if (useLocalMock) {
      console.log('Using mock data for node expansion');
      return getMockExpansionByType(nodeId, expansionType);
    }
    
    // Construct the API endpoint with appropriate query parameters
    const endpoint = `/api/expand-node/${nodeId}?limit=${limit}&expansion_type=${expansionType}`;
    
    console.log(`Calling API endpoint: ${endpoint}`);
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      // If server returns error, fall back to mock data for development
      console.error(`Failed to expand node ${nodeId} with type ${expansionType}. Status: ${response.status}`);
      if (process.env.NODE_ENV === 'development') {
        console.log('Falling back to mock data');
        return getMockExpansionByType(nodeId, expansionType);
      }
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
    
    // In development, fallback to mock data on error
    if (process.env.NODE_ENV === 'development') {
      console.log('Error occurred, falling back to mock data');
      return getMockExpansionByType(nodeId, expansionType);
    }
    
    throw error;
  }
};

/**
 * Generate mock expansion data based on expansion type
 * @param {number|string} nodeId - ID of the node to expand
 * @param {string} expansionType - Type of expansion (theory, experiments, philosophical, practical, all)
 * @returns {Object} - Mock expansion data with nodes and edges
 */
const getMockExpansionByType = (nodeId, expansionType) => {
  // Get the existing expansion if available
  const existingExpansion = nodeExpansions[nodeId];
  
  if (expansionType === 'all' && existingExpansion) {
    return existingExpansion;
  }
  
  // Create ID prefixes for different expansion types to ensure unique IDs
  const typeInfo = {
    'theory': {
      prefix: 'T',
      nodeIds: [10101, 10102, 10103],
      labels: ['Theoretical Framework', 'Mathematical Models', 'Conceptual Analysis'],
      color: '#e1f5fe',
      relationType: 'theorizes'
    },
    'experiments': {
      prefix: 'E',
      nodeIds: [10201, 10202, 10203],
      labels: ['Empirical Evidence', 'Laboratory Tests', 'Field Experiments'],
      color: '#e8f5e9',
      relationType: 'verifies'
    },
    'philosophical': {
      prefix: 'P',
      nodeIds: [10301, 10302, 10303],
      labels: ['Ethical Implications', 'Epistemological Questions', 'Phenomenological Perspective'],
      color: '#fff8e1',
      relationType: 'questions'
    },
    'practical': {
      prefix: 'A',
      nodeIds: [10401, 10402, 10403],
      labels: ['Industrial Applications', 'Consumer Products', 'Policy Recommendations'],
      color: '#ffebee',
      relationType: 'implements'
    },
    'all': {
      prefix: 'X',
      nodeIds: [101, 102, 103],
      labels: ['Related Concept 1', 'Related Concept 2', 'Related Concept 3'],
      color: '#f5f5f5',
      relationType: 'related_to'
    }
  };
  
  // Get the specific type info or default to 'all'
  const { prefix, nodeIds, labels, color, relationType } = typeInfo[expansionType] || typeInfo.all;
  
  // Generate nodes based on expansion type
  const nodes = nodeIds.map((id, index) => ({
    id,
    label: labels[index],
    description: `${expansionType.charAt(0).toUpperCase() + expansionType.slice(1)}-related expansion of node ${nodeId}.`,
    type: expansionType,
    properties: { importance: 0.7 - (index * 0.1), domain: expansionType },
    hasBias: index === 0 ? Math.random() > 0.7 : false, // Random chance for first node to have bias
    biasType: index === 0 && Math.random() > 0.7 ? "Confirmation Bias" : null,
    biasDescription: index === 0 && Math.random() > 0.7 ? "Favoring information that confirms existing beliefs." : null,
    color
  }));
  
  // Generate edges
  const edges = nodeIds.map(id => ({
    source: nodeId,
    target: id,
    type: relationType,
    weight: 0.7,
    bidirectional: Math.random() > 0.7 // Random chance to be bidirectional
  }));
  
  // Add some edges between the new nodes
  if (nodes.length > 1) {
    edges.push({
      source: nodeIds[0],
      target: nodeIds[1],
      type: "relates_to",
      weight: 0.6,
      bidirectional: false
    });
  }
  
  if (nodes.length > 2) {
    edges.push({
      source: nodeIds[1],
      target: nodeIds[2],
      type: "influences",
      weight: 0.5,
      bidirectional: true
    });
  }
  
  return { nodes, edges };
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