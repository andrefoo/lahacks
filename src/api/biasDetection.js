// Bias detection service
// Analyzes graph nodes for potential biases

// List of cognitive biases to check for
const biasTypes = [
  {
    type: "Confirmation Bias",
    description: "Favoring information that confirms existing beliefs while giving less attention to alternative possibilities.",
    keywords: ["confirm", "believe", "agree", "support", "reinforce", "prove", "validate"]
  },
  {
    type: "Status Quo Bias",
    description: "Preference for the current state of affairs and resistance to change.",
    keywords: ["traditional", "conventional", "established", "standard", "normal", "usual", "maintain"]
  },
  {
    type: "Technological Solutionism",
    description: "Overemphasizing technology as the solution to complex social, economic, and political problems.",
    keywords: ["technology", "tech", "digital", "solution", "solve", "breakthrough", "innovative", "disrupt"]
  },
  {
    type: "Overconfidence Bias",
    description: "Overestimating one's abilities, knowledge, or the accuracy of one's beliefs.",
    keywords: ["certain", "definitely", "absolutely", "undoubtedly", "clearly", "obviously", "guaranteed"]
  },
  {
    type: "Shiny Object Bias",
    description: "Favoring new, exciting technologies over established solutions that may work better.",
    keywords: ["new", "cutting-edge", "revolutionary", "groundbreaking", "state-of-the-art", "latest", "advanced"]
  },
  {
    type: "Bandwagon Effect",
    description: "Adopting beliefs or behaviors because many others do the same.",
    keywords: ["popular", "trending", "everyone", "mainstream", "widespread", "growing", "movement"]
  },
  {
    type: "Anchoring Bias",
    description: "Relying too heavily on the first piece of information encountered.",
    keywords: ["initial", "first", "primary", "early", "original", "fundamental", "basic"]
  }
];

/**
 * Check if a text contains keywords related to a specific bias
 * @param {string} text - The text to analyze
 * @param {string[]} keywords - List of keywords to check for
 * @returns {boolean} - Whether the text contains any of the keywords
 */
const containsBiasKeywords = (text, keywords) => {
  if (!text) return false;
  
  const lowercaseText = text.toLowerCase();
  return keywords.some(keyword => lowercaseText.includes(keyword.toLowerCase()));
};

/**
 * Detect potential biases in a node based on its content
 * @param {Object} node - Node to analyze for biases
 * @returns {Object|null} - Bias information if detected, null otherwise
 */
const detectNodeBias = (node) => {
  // If node already has bias information, return it
  if (node.hasBias && node.biasType && node.biasDescription) {
    return {
      hasBias: true,
      biasType: node.biasType,
      biasDescription: node.biasDescription
    };
  }
  
  // Combine node text fields for analysis
  const nodeText = `${node.label} ${node.description || ''}`.toLowerCase();
  
  // Check each bias type
  for (const bias of biasTypes) {
    if (containsBiasKeywords(nodeText, bias.keywords)) {
      return {
        hasBias: true,
        biasType: bias.type,
        biasDescription: bias.description
      };
    }
  }
  
  // Simulate some randomness in bias detection to make it interesting
  // In a real implementation, this would be more sophisticated
  if (Math.random() < 0.2) { // 20% chance of detecting a bias
    const randomBias = biasTypes[Math.floor(Math.random() * biasTypes.length)];
    return {
      hasBias: true, 
      biasType: randomBias.type,
      biasDescription: randomBias.description
    };
  }
  
  return null;
};

/**
 * Process an array of nodes to detect biases
 * @param {Array} nodes - Array of nodes to analyze
 * @returns {Array} - Nodes with bias information added
 */
export const detectBiases = (nodes) => {
  if (!nodes || !Array.isArray(nodes)) return [];
  
  return nodes.map(node => {
    const biasInfo = detectNodeBias(node);
    
    if (biasInfo) {
      return { ...node, ...biasInfo };
    }
    
    return node;
  });
}; 