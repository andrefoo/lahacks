// Utilities for calculating node positions and edges for the knowledge graph
// Handles positioning of parent and child nodes in a visually appealing layout

/**
 * Calculate positions for nodes in a circle layout
 * Parent nodes are in a circle, child nodes are positioned around their parents
 */
export const calculateNodePositions = (nodes, expandedNodeId = null) => {
  // Define center and radius for the main circle of nodes
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2.5;
  const radius = Math.min(window.innerWidth, window.innerHeight) * 0.3;
  
  // Get parent nodes (those with ids <= 10 in our simplified example)
  const parentNodes = nodes.filter(node => node.id <= 10);
  
  return nodes.map(node => {
    // For parent nodes, arrange in a circle
    if (node.id <= 10) {
      const index = parentNodes.findIndex(n => n.id === node.id);
      const angle = (2 * Math.PI * index) / parentNodes.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      return { ...node, x, y };
    } 
    // For child nodes, position them around their parent
    else {
      const parentId = Math.floor(node.id / 100);
      const parent = nodes.find(n => n.id === parentId);
      
      if (parent) {
        // Find siblings (nodes with the same parent)
        const siblings = nodes.filter(n => 
          n.id !== node.id && Math.floor(n.id / 100) === parentId
        );
        
        // Find this node's index among siblings
        const siblingIndex = siblings.length > 0 
          ? siblings.findIndex(s => s.id > node.id) 
          : 0;
        
        // Calculate angle based on index and total siblings
        const totalChildren = siblings.length + 1;
        const angleOffset = (siblingIndex / totalChildren) * (Math.PI * 1.5) + (Math.PI * 0.25);
        
        // Position around parent with some distance
        const childRadius = 80;
        const x = parent.x + childRadius * Math.cos(angleOffset);
        const y = parent.y + childRadius * Math.sin(angleOffset);
        
        return { ...node, x, y, parentId };
      }
      
      // Fallback if parent not found
      return { ...node, x: centerX, y: centerY };
    }
  });
};

/**
 * Create edges between nodes
 * Connects parent nodes in a web pattern and child nodes to their parents
 */
export const createEdges = (nodes) => {
  const edges = [];
  
  // Get parent nodes (those with ids <= 10)
  const parentNodes = nodes.filter(node => node.id <= 10);
  
  // Connect parent nodes in a web pattern
  parentNodes.forEach((node, index) => {
    // Connect to a few neighbors to create a web-like structure
    const connections = [
      (index + 1) % parentNodes.length,
      (index + 2) % parentNodes.length
    ];
    
    connections.forEach(targetIndex => {
      const target = parentNodes[targetIndex];
      
      if (target && target.id !== node.id) {
        edges.push({
          source: { id: node.id, x: node.x, y: node.y },
          target: { id: target.id, x: target.x, y: target.y }
        });
      }
    });
  });
  
  // Connect child nodes to their parent
  nodes.forEach(node => {
    if (node.parentId) {
      const parent = nodes.find(n => n.id === node.parentId);
      
      if (parent) {
        edges.push({
          source: { id: parent.id, x: parent.x, y: parent.y },
          target: { id: node.id, x: node.x, y: node.y }
        });
      }
    }
  });
  
  return edges;
}; 