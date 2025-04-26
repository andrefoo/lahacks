import React, { useState, useEffect } from 'react';
import Node from './Node';
import { calculateNodePositions, createEdges } from '../utils/graphLayout';

// Component for visualizing the knowledge graph
// Renders nodes and edges with interactive capabilities
const Graph = ({ graphData, onNodeClick }) => {
  const [expandedNodeId, setExpandedNodeId] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Initialize graph with data from props
  useEffect(() => {
    if (graphData) {
      setNodes(graphData.nodes);
    }
  }, [graphData]);

  // Calculate positions and edges whenever nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      const positionedNodes = calculateNodePositions(nodes, expandedNodeId);
      setNodes(positionedNodes);
      
      const graphEdges = createEdges(positionedNodes);
      setEdges(graphEdges);
    }
  }, [nodes, expandedNodeId]);

  // Handle node expansion
  const handleNodeExpand = (nodeId) => {
    setExpandedNodeId(nodeId);
    
    // Get child nodes from the graph data
    if (graphData.childNodesMap && graphData.childNodesMap[nodeId]) {
      const childNodes = graphData.childNodesMap[nodeId];
      
      // Add child nodes to the graph if they aren't already present
      setNodes(prevNodes => {
        const existingNodeIds = new Set(prevNodes.map(n => n.id));
        const newChildNodes = childNodes.filter(child => !existingNodeIds.has(child.id));
        
        // Update the parent node to show it's expanded
        const updatedNodes = prevNodes.map(node => 
          node.id === nodeId ? { ...node, expanded: true } : node
        );
        
        return [...updatedNodes, ...newChildNodes];
      });
    }
  };

  // Handle node click - both expand and notify parent
  const handleNodeClick = (node) => {
    handleNodeExpand(node.id);
    onNodeClick(node);
  };

  return (
    <div className="graph-container">
      <svg className="graph-svg" width="100%" height="100%">
        {/* Render edges first so they appear behind nodes */}
        {edges.map((edge, index) => (
          <line
            key={`edge-${index}`}
            x1={edge.source.x}
            y1={edge.source.y}
            x2={edge.target.x}
            y2={edge.target.y}
            className="graph-edge"
          />
        ))}
        
        {/* Render nodes */}
        {nodes.map(node => (
          <Node
            key={`node-${node.id}`}
            node={node}
            onClick={() => handleNodeClick(node)}
            isExpanded={node.id === expandedNodeId}
          />
        ))}
      </svg>
    </div>
  );
};

export default Graph; 