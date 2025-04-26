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
    // For child nodes, position them around their parent
    else {
      const parentId = node.parentId;
      const parent = nodes.find((n) => n.id === parentId);

      if (parent) {
        // Find siblings (nodes with the same parent)
        const siblings = nodes.filter(
          (n) => n.parentId === parentId
        );
        
        // Get position in sibling array
        const siblingIndex = siblings.findIndex((s) => s.id === node.id);
        
        // Distribute children evenly in a full circle around the parent
        const totalChildren = siblings.length;
        const angleStep = (2 * Math.PI) / totalChildren;
        const angle = angleStep * siblingIndex;
        
        // Use different radius based on whether parent is expanded
        const childRadius = parentId === expandedNodeId ? 120 : 80;
        const x = (parent.x || centerX) + childRadius * Math.cos(angle);
        const y = (parent.y || centerY) + childRadius * Math.sin(angle);

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
