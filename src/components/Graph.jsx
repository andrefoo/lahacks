import React, { useState, useEffect, useRef } from 'react';
import Node from './Node';
import { calculateNodePositions, createEdgesFromData } from '../utils/graphLayout';
import { fetchNodeExpansion } from '../api/llmService';

// Component for visualizing the knowledge graph
// Renders nodes and edges with interactive capabilities
const Graph = ({ graphData, onNodeClick, selectedNodeId }) => {
  const [expandedNodeId, setExpandedNodeId] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [isExpanding, setIsExpanding] = useState(false);
  const [activeCluster, setActiveCluster] = useState(null);
  const nodesRef = useRef(nodes);

  // Initialize graph with data from props
  useEffect(() => {
    if (graphData) {
      setNodes(graphData.nodes || []);
      setEdges(graphData.edges || []);
      setClusters(graphData.clusters || []);
    }
  }, [graphData]);

  // Update ref when nodes change
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Calculate positions when relevant dependencies change (but not nodes itself)
  useEffect(() => {
    if (nodesRef.current.length > 0) {
      const positionedNodes = calculateNodePositions(
        nodesRef.current, 
        expandedNodeId, 
        clusters, 
        activeCluster
      );
      
      // Only update if there are actual position changes
      const hasPositionChanges = positionedNodes.some((node, index) => {
        const oldNode = nodesRef.current[index];
        return (oldNode?.x !== node.x || oldNode?.y !== node.y);
      });
      
      if (hasPositionChanges) {
        setNodes(positionedNodes);
      }
    }
  }, [nodes, expandedNodeId, clusters, activeCluster]);

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
      // Fetch node expansion data from API
      const expansion = await fetchNodeExpansion(nodeId);
      
      if (expansion?.nodes?.length) {
        // Add expanded nodes to the graph
        setNodes(prevNodes => {
          const updatedNodes = prevNodes.map(node => 
            node.id === nodeId ? { ...node, expanded: true } : node
          );
          const existingIds = new Set(prevNodes.map(n => n.id));
          const newNodes = expansion.nodes
            .filter(node => !existingIds.has(node.id))
            .map(node => ({
              ...node,
              parentId: node.parentId ?? nodeId
            }));
          return [...updatedNodes, ...newNodes];
        });
        
        // Add new edges to the graph
        setEdges(prevEdges => {
          return [...prevEdges, ...expansion.edges];
        });
      }
    } catch (error) {
      console.error('Error expanding node:', error);
    } finally {
      setIsExpanding(false);
    }
  };

  // Handle node click - only notify parent, no auto-expansion
  const handleNodeClick = (node) => {
    onNodeClick(node);
  };

  // New handler for expand button click
  const handleExpandClick = (nodeId, event) => {
    // Prevent the click from triggering the node click handler
    event.stopPropagation();
    handleNodeExpand(nodeId);
  };
  
  // Handle cluster activation
  const handleClusterClick = (clusterId) => {
    setActiveCluster(activeCluster === clusterId ? null : clusterId);
  };

  // Handle keyboard interaction for clusters
  const handleClusterKeyPress = (event, clusterId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleClusterClick(clusterId);
    }
  };

  // Render cluster labels
  const renderClusters = () => {
    return clusters.map(cluster => {
      // Find the center of all nodes in this cluster
      const clusterNodes = nodes.filter(node => cluster.nodes.includes(node.id));
      if (clusterNodes.length === 0) return null;
      
      // Calculate the average position
      const centerX = clusterNodes.reduce((sum, node) => sum + (node.x || 0), 0) / clusterNodes.length;
      const centerY = clusterNodes.reduce((sum, node) => sum + (node.y || 0), 0) / clusterNodes.length;
      
      return (
        <g 
          key={`cluster-${cluster.id}`} 
          className={`cluster-label ${activeCluster === cluster.id ? 'active' : ''}`}
          // transform={`translate(${centerX}, ${centerY - 40})`}
          onClick={() => handleClusterClick(cluster.id)}
          onKeyPress={(e) => handleClusterKeyPress(e, cluster.id)}
          tabIndex="0"
          aria-pressed={activeCluster === cluster.id ? 'true' : 'false'}
          aria-label={`Cluster: ${cluster.label}`}
        >
          <foreignObject width="1" height="1" style={{ overflow: 'visible' }}>
            <button
              type="button"
              style={{ 
                background: 'none',
                border: 'none',
                padding: 0,
                width: '1px',
                height: '1px',
                position: 'absolute',
                opacity: 0,
                pointerEvents: 'none'
              }}
              aria-pressed={activeCluster === cluster.id ? 'true' : 'false'}
              aria-label={`Cluster: ${cluster.label}`}
            />
          </foreignObject>
          
          <text 
            className="cluster-text"
            textAnchor="middle"
            fontWeight="bold"
          >
            {cluster.label}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="graph-container">
      <svg className="graph-svg" width="100%" height="100%" aria-label="Knowledge graph visualization">
        <title>Interactive Knowledge Graph Visualization</title>
        {/* Render edges */}
        {edges.map((edge, index) => {
          const source = nodes.find(n => n.id === edge.source);
          const target = nodes.find(n => n.id === edge.target);
          
          if (!source || !target || !source.x || !target.x) return null;
          
          return (
            <g key={`edge-${edge.source}-${edge.target}`} className={`edge ${edge.type}`}>
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                className={`graph-edge ${edge.bidirectional ? 'bidirectional' : ''}`}
                strokeWidth={edge.weight ? edge.weight * 3 : 1}
              />
              {/* Arrow marker for directed edges */}
              {!edge.bidirectional && (
                <polygon 
                  points="0,-3 6,0 0,3" 
                  className="edge-arrow"
                  // transform={`translate(${target.x}, ${target.y}) rotate(${Math.atan2(target.y - source.y, target.x - source.x) * 180 / Math.PI}) translate(-10, 0)`}
                />
              )}
              {/* Edge type label */}
              {edge.type && (
                <text
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2 - 5}
                  textAnchor="middle"
                  className="edge-label"
                  fontSize="8"
                >
                  {edge.type.replace(/_/g, ' ')}
                </text>
              )}
            </g>
          );
        })}
        
        {/* Render cluster labels */}
        {renderClusters()}
        
        {/* Modified node rendering */}
        {nodes.map(node => (
          <g key={`node-${node.id}`}>
            <Node
              node={node}
              onClick={handleNodeClick}
              isExpanded={node.id === expandedNodeId}
              isLoading={isExpanding && node.id === expandedNodeId}
              isInActiveCluster={activeCluster ? clusters.find(c => c.id === activeCluster)?.nodes.includes(node.id) : false}
              isSelected={node.id === selectedNodeId}
            />
            {/* expand button */}
            <g
              className="expand-button"
              transform={`translate(${node.x + 20}, ${node.y - 20})`}
              onClick={(e) => handleExpandClick(node.id, e)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                r="8"
                fill="#ffffff"
                stroke="#666666"
                strokeWidth="1"
              />
              <text
                textAnchor="middle"
                dy=".3em"
                fontSize="12"
                fill="#666666"
              >
                +
              </text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default Graph; 