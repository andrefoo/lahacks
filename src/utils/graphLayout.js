// Utilities for calculating node positions and edges for the knowledge graph
// Handles positioning of parent and child nodes in a visually appealing layout

/**
 * Calculate positions for nodes in a circle layout
 * Parent nodes are in a circle, child nodes are positioned around their parents
 */
export const calculateNodePositions = (
  nodes,
  expandedNodeId = null,
  clusters = [],
  activeCluster = null
) => {
  // Define center and radius for the main circle of nodes
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2.5;
  const radius = Math.min(window.innerWidth, window.innerHeight) * 0.3;

  // Get parent nodes (those without parentId)
  const parentNodes = nodes.filter((node) => !node.parentId);

  return nodes.map((node) => {
    // For parent nodes, arrange in a circle
    if (!node.parentId) {
      const index = parentNodes.findIndex((n) => n.id === node.id);
      const angle = (2 * Math.PI * index) / parentNodes.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      // If a cluster is active, move nodes in that cluster more to the center
      if (activeCluster) {
        const nodeCluster = clusters.find((c) => c.nodes.includes(node.id));
        const isInActiveCluster =
          nodeCluster && nodeCluster.id === activeCluster;

        if (isInActiveCluster) {
          // Move active cluster nodes 20% closer to center
          return {
            ...node,
            x: centerX + radius * 0.8 * Math.cos(angle),
            y: centerY + radius * 0.8 * Math.sin(angle),
            radius: expandedNodeId && node.id === expandedNodeId ? 30 : undefined
          };
        }
      }

      return { 
        ...node, 
        x, 
        y, 
        radius: expandedNodeId && node.id === expandedNodeId ? 30 : undefined
      };
    }
    // For child nodes, position them based on parent ID
    else {
      const parentId = node.parentId;
      const parent = nodes.find((n) => n.id === parentId);

      if (parent) {
        // Extract numerical part of parent ID
        const parentIdNum = parseInt(String(parentId).replace(/\D/g, '')) || 0;
        
        // Use modulo 10 to handle IDs > 10
        const sectorId = (parentIdNum % 10) || 10; // If remainder is 0, use 10
        
        // Calculate the angle range for this parent (each parent gets 36 degrees)
        // Increase the sector size for parents with expanded nodes or many children
        const siblings = nodes.filter(n => n.parentId === parentId);
        const totalChildren = siblings.length;
        
        // Dynamically allocate more degrees for parents with more children
        // Base sector is 36 degrees, but expand based on child count
        const sectorSize = Math.min(72, 36 + totalChildren * 3); // Cap at 72 degrees (2x default)
        const startDegree = (sectorId - 1) * 36;
        const endDegree = startDegree + sectorSize;
        
        const siblingIndex = siblings.findIndex(s => s.id === node.id);
        
        // Add spacing factor to increase angle between siblings
        const angleSpacing = 2.0; // Multiplier for angular spacing between nodes
        const degreeStep = (endDegree - startDegree) / (totalChildren || 1) * angleSpacing;
        
        // Center the children within the expanded sector
        const sectorCenter = startDegree + sectorSize / 2;
        const halfSpread = (degreeStep * (totalChildren - 1)) / 2;
        const startAngle = sectorCenter - halfSpread;
        
        const angleDegrees = startAngle + (siblingIndex * degreeStep);
        
        // Convert to radians for calculation
        const angleRadians = (angleDegrees * Math.PI) / 180;
        
        // Use different radius based on whether parent is expanded and number of siblings
        // Dynamically increase radius for nodes with many children
        const childCount = siblings.length;
        const childRadius = (parentId === expandedNodeId || totalChildren > 0) ? 
          Math.max(180, 160 + childCount * 10) : 
          Math.max(120, 100 + childCount * 8);
        
        const x = (parent.x || centerX) + childRadius * Math.cos(angleRadians);
        const y = (parent.y || centerY) + childRadius * Math.sin(angleRadians);

        return { ...node, x, y };
      }

      // Fallback if parent not found
      return { ...node, x: centerX, y: centerY };
    }
  });
};

/**
 * Create edges from the graph data
 * Uses the edge data directly from the API response
 */
export const createEdgesFromData = (edges, nodes) => {
  if (!edges || !nodes) return [];

  return edges.map((edge) => {
    const source = nodes.find((n) => n.id === edge.source);
    const target = nodes.find((n) => n.id === edge.target);

    if (source && target) {
      return {
        ...edge,
        sourceX: source.x,
        sourceY: source.y,
        targetX: target.x,
        targetY: target.y,
      };
    }

    return edge;
  });
};

/**
 * Create edges between nodes
 * Connects parent nodes in a web pattern and child nodes to their parents
 */
export const createEdges = (nodes) => {
  const edges = [];

  // Get parent nodes (those without parentId)
  const parentNodes = nodes.filter((node) => !node.parentId);

  // Connect parent nodes in a web pattern
  parentNodes.forEach((node, index) => {
    // Connect to a few neighbors to create a web-like structure
    const connections = [
      (index + 1) % parentNodes.length,
      (index + 2) % parentNodes.length,
    ];

    connections.forEach((targetIndex) => {
      const target = parentNodes[targetIndex];

      if (target && target.id !== node.id) {
        edges.push({
          source: node.id,
          target: target.id,
          type: "related_to",
        });
      }
    });
  });

  // Connect child nodes to their parent
  nodes.forEach((node) => {
    if (node.parentId) {
      const parent = nodes.find((n) => n.id === node.parentId);

      if (parent) {
        edges.push({
          source: parent.id,
          target: node.id,
          type: "parent_of",
        });
      }
    }
  });

  return edges;
};
