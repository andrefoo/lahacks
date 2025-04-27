// Service for interacting with the LLM API
// Handles fetching graph data based on user prompts

import { detectBiases } from './biasDetection';

// Sample initial nodes as fallback
const initialNodes = [
  { id: 1, label: "Decentralized Energy Grids", description: "Systems that distribute energy generation across multiple small-scale sources rather than centralized power plants.", type: "concept", properties: { importance: 0.9, domain: "energy" }, hasBias: true, biasType: "Technological Solutionism", biasDescription: "Overemphasizing technology as the solution to complex social, economic, and political problems.", funFact: "The first decentralized microgrid was created in New York after Hurricane Sandy left thousands without power for weeks." },
  { id: 2, label: "Renewable Energy Sources", description: "Energy sources that are naturally replenished on a human timescale, such as sunlight, wind, rain, tides, waves, and geothermal heat.", type: "concept", properties: { importance: 0.8, domain: "energy" }, funFact: "The earth receives more energy from the sun in one hour than the world uses in a whole year!" },
  { id: 3, label: "Grid Resilience", description: "The ability of power systems to withstand and recover from extreme events and disruptions.", type: "property", properties: { importance: 0.7, domain: "energy" }, funFact: "The most resilient power grid in the world is in Denmark, which can operate for days with 100% renewable energy." },
  { id: 4, label: "Energy Storage Technologies", description: "Methods of storing energy for later use, including batteries, pumped hydro, and thermal storage.", type: "technology", properties: { importance: 0.8, domain: "energy" }, hasBias: true, biasType: "Confirmation Bias", biasDescription: "Favoring information that confirms existing beliefs while giving less attention to alternative possibilities.", funFact: "The world's largest battery storage system can power about 300,000 homes for four hours." },
  { id: 5, label: "Microgrid Implementation", description: "Small-scale power grids that can operate independently or in coordination with the main grid.", type: "process", properties: { importance: 0.6, domain: "energy" }, funFact: "The U.S. military is one of the largest adopters of microgrids to ensure energy security at bases worldwide." },
  { id: 6, label: "Smart Grid Technologies", description: "Digital technology that allows for two-way communication between utilities and consumers.", type: "technology", properties: { importance: 0.7, domain: "technology" }, funFact: "Smart meters can detect electricity theft, which costs utilities an estimated $96 billion annually worldwide." },
  { id: 7, label: "Energy Democratization", description: "Shift of power from centralized entities to individuals and communities in energy production and distribution.", type: "concept", properties: { importance: 0.6, domain: "society" }, hasBias: true, biasType: "Overconfidence Bias", biasDescription: "Overestimating one's abilities, knowledge, or the accuracy of one's beliefs.", funFact: "In Germany, over 40% of renewable energy is owned by citizens and communities rather than corporations." },
  { id: 8, label: "Regulatory Frameworks", description: "Legal and policy structures governing energy production, distribution, and consumption.", type: "process", properties: { importance: 0.7, domain: "policy" }, funFact: "The world's first energy regulation agency was established in 1920 in the United States - the Federal Power Commission." },
  { id: 9, label: "Community-Owned Energy", description: "Energy projects owned and operated by local communities rather than by corporations or governments.", type: "entity", properties: { importance: 0.5, domain: "society" }, funFact: "The Isle of Eigg in Scotland was the first community to establish its own electricity grid powered entirely by renewable energy." },
  { id: 10, label: "Grid Modernization", description: "Upgrading electricity infrastructure to improve reliability, efficiency, security, and integration of renewables.", type: "process", properties: { importance: 0.8, domain: "technology" }, hasBias: true, biasType: "Status Quo Bias", biasDescription: "Preference for the current state of affairs and resistance to change.", funFact: "The U.S. electrical grid has over 7,300 power plants, 160,000 miles of high-voltage power lines, and millions of miles of low-voltage power lines." }
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
      { id: 101, label: "Peer-to-Peer Energy Trading", description: "Systems allowing consumers to buy and sell excess energy directly to each other.", type: "process", properties: { importance: 0.7, domain: "energy" }, funFact: "The first peer-to-peer energy trading platform was launched in Brooklyn, NY in 2016, allowing neighbors to sell solar power to each other." },
      { id: 102, label: "Blockchain for Energy", description: "Using distributed ledger technology to manage energy transactions.", type: "technology", properties: { importance: 0.6, domain: "technology" }, hasBias: true, biasType: "Shiny Object Bias", biasDescription: "Favoring new, exciting technologies over established solutions that may work better.", funFact: "Energy blockchain applications use up to 99.98% less energy than cryptocurrency blockchains like Bitcoin." },
      { id: 103, label: "Virtual Power Plants", description: "Cloud-based distributed power plants that aggregate capacity from multiple sources.", type: "concept", properties: { importance: 0.8, domain: "energy" }, funFact: "The largest virtual power plant connects over 1,000 households and can generate enough electricity to power a small city." }
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
    
    // If fun facts are missing, we can generate placeholder ones
    const nodesWithFunFacts = nodesWithBiases.map(node => {
      if (!node.funFact) {
        return {
          ...node,
          funFact: generatePlaceholderFunFact(node.label, node.type)
        };
      }
      return node;
    });
    
    return {
      ...data,
      nodes: nodesWithFunFacts
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
    
    // Process nodes to detect biases and add fun facts if missing
    if (data.nodes && Array.isArray(data.nodes)) {
      const nodesWithBiases = detectBiases(data.nodes);
      
      // Add fun facts to nodes if they're missing
      data.nodes = nodesWithBiases.map(node => {
        if (!node.funFact) {
          return {
            ...node,
            funFact: generatePlaceholderFunFact(node.label, node.type, expansionType)
          };
        }
        return node;
      });
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
      relationType: 'theorizes',
      funFacts: [
        'The theoretical framework for decentralized energy was first proposed in a 1978 paper that was largely ignored until the 2000s.',
        'The mathematical models used in grid optimization can process over 10 million variables simultaneously.',
        'The concept of energy decentralization has roots in systems theory from the 1950s.'
      ]
    },
    'experiments': {
      prefix: 'E',
      nodeIds: [10201, 10202, 10203],
      labels: ['Empirical Evidence', 'Laboratory Tests', 'Field Experiments'],
      color: '#e8f5e9',
      relationType: 'verifies',
      funFacts: [
        'The longest-running energy grid experiment has been collecting data continuously since 1996.',
        'A single laboratory test of grid components can require up to 10,000 simulation cycles.',
        'The largest field experiment for microgrids covers an entire island in Hawaii.'
      ]
    },
    'philosophical': {
      prefix: 'P',
      nodeIds: [10301, 10302, 10303],
      labels: ['Ethical Implications', 'Epistemological Questions', 'Phenomenological Perspective'],
      color: '#fff8e1',
      relationType: 'questions',
      funFacts: [
        'Energy justice as a philosophical concept emerged from environmental ethics in the early 2000s.',
        'The epistemology of energy science involves over 30 different disciplines contributing knowledge.',
        'Philosophers of technology have identified 7 distinct ethical frameworks for evaluating energy transitions.'
      ]
    },
    'practical': {
      prefix: 'A',
      nodeIds: [10401, 10402, 10403],
      labels: ['Industrial Applications', 'Consumer Products', 'Policy Recommendations'],
      color: '#ffebee',
      relationType: 'implements',
      funFacts: [
        'The fastest-growing industrial application of decentralized energy is in data centers, which can reduce energy costs by up to 40%.',
        'Home energy management systems can now predict usage patterns with 94% accuracy.',
        'The most successful energy policy implementation resulted in a 78% reduction in carbon emissions in one region.'
      ]
    },
    'all': {
      prefix: 'X',
      nodeIds: [101, 102, 103],
      labels: ['Related Concept 1', 'Related Concept 2', 'Related Concept 3'],
      color: '#f5f5f5',
      relationType: 'related_to',
      funFacts: [
        'This concept connects to over 15 different scientific disciplines.',
        'Researchers from 42 countries are actively studying this topic.',
        'The terminology in this field has evolved through 4 distinct phases since its inception.'
      ]
    }
  };
  
  // Get the specific type info or default to 'all'
  const { prefix, nodeIds, labels, color, relationType, funFacts } = typeInfo[expansionType] || typeInfo.all;
  
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
    funFact: funFacts[index], // Add fun fact from the array
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
 * Generate a placeholder fun fact based on the node's label and type
 * @param {string} label - The node's label
 * @param {string} type - The node's type
 * @param {string} expansionType - Optional expansion type
 * @returns {string} - A generated fun fact
 */
const generatePlaceholderFunFact = (label, type, expansionType = null) => {
  // Generic fun facts based on node type
  const typeFacts = {
    'concept': [
      `The term "${label}" was first coined in a research paper from the early 2000s.`,
      `There are over 50 different definitions of "${label}" used across scientific literature.`,
      `The concept of "${label}" has evolved through three distinct phases since its inception.`
    ],
    'technology': [
      `Early prototypes of ${label} were up to 10 times larger than modern versions.`,
      `Current research on ${label} involves teams from over 15 different countries.`,
      `The efficiency of ${label} has improved by approximately 400% in the last decade.`
    ],
    'process': [
      `Implementing ${label} can reduce operational costs by up to 30% in optimal conditions.`,
      `The standard methodology for ${label} was established through international collaboration.`,
      `Complete integration of ${label} typically takes organizations 1-3 years.`
    ],
    'property': [
      `${label} was recognized as a critical factor in energy systems after a major blackout in 2003.`,
      `Scientists use over 20 different metrics to measure ${label} in real-world systems.`,
      `Improvements in ${label} can extend system lifespans by up to 40%.`
    ],
    'entity': [
      `The largest examples of ${label} can be found in Scandinavia and Germany.`,
      `The growth rate of ${label} has increased by 200% in the last five years.`,
      `The oldest continuously operating ${label} has been active since 1985.`
    ]
  };
  
  // Expansion-specific facts
  if (expansionType) {
    const expansionFacts = {
      'theory': `Theoretical work on ${label} has been cited in over 500 academic papers.`,
      'experiments': `The largest experiment involving ${label} collected data continuously for 3 years.`,
      'philosophical': `Ethical debates around ${label} have been featured in major philosophy journals since 2010.`,
      'practical': `Real-world implementations of ${label} have been documented in over 30 countries.`,
      'all': `Research on ${label} spans multiple disciplines, including engineering, economics, and social sciences.`
    };
    
    // Return an expansion-specific fact if available
    if (expansionFacts[expansionType]) {
      return expansionFacts[expansionType];
    }
  }
  
  // Fallback to type-based facts
  const facts = typeFacts[type.toLowerCase()] || typeFacts['concept'];
  return facts[Math.floor(Math.random() * facts.length)];
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