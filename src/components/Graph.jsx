import React, { useState, useEffect } from 'react';
import Node from './Node';
import { calculateNodePositions, createEdges } from '../utils/graphLayout';
import { fetchNodeChildren } from '../api/llmService';

// Component for visualizing the knowledge graph
// Renders nodes and edges with interactive capabilities
const Graph = ({ graphData, onNodeClick }) => {
  const [expandedNodeId, setExpandedNodeId] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isExpanding, setIsExpanding] = useState(false);

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
  const handleNodeExpand = async (nodeId) => {
    // Set the expanded node ID immediately for UI feedback
    setExpandedNodeId(nodeId);
    
    // Check if node is already expanded or is being expanded
    const nodeIsExpanded = nodes.some(n => n.parentId === nodeId);
    if (nodeIsExpanded || isExpanding) {
      return;
    }
    
    setIsExpanding(true);
    
    try {
      // Fetch child nodes from API
      const result = await fetchNodeChildren(nodeId);
      
      if (result && result.childNodes) {
        // Add child nodes to the graph
        setNodes(prevNodes => {
          // Update the parent node to show it's expanded
          const updatedNodes = prevNodes.map(node => 
            node.id === nodeId ? { ...node, expanded: true } : node
          );
          
          // Add the child nodes
          return [...updatedNodes, ...result.childNodes.map(child => ({
            ...child,
            parentId: nodeId
          }))];
        });
      }
    } catch (error) {
      console.error('Error expanding node:', error);
      // If the graph data has child nodes for this node, use them as fallback
      if (graphData && graphData.childNodesMap && graphData.childNodesMap[nodeId]) {
        const childNodes = graphData.childNodesMap[nodeId];
        setNodes(prevNodes => {
          const updatedNodes = prevNodes.map(node => 
            node.id === nodeId ? { ...node, expanded: true } : node
          );
          
          return [...updatedNodes, ...childNodes.map(child => ({
            ...child,
            parentId: nodeId
          }))];
        });
      }
    } finally {
      setIsExpanding(false);
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
            isLoading={isExpanding && node.id === expandedNodeId}
          />
        ))}
      </svg>
    </div>
  );
};

export default Graph; 