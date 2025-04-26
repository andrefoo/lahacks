import React, { useEffect, useRef, useState } from "react";
import { fetchNodeExpansion } from "../api/llmService";
import {
  calculateNodePositions
} from "../utils/graphLayout";
import Node from "./Node";

// Component for visualizing the knowledge graph
// Renders nodes and edges with interactive capabilities
const Graph = ({ graphData, onNodeClick, selectedNodeId, onEdgeClick }) => {
  const [expandedNodeId, setExpandedNodeId] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [isExpanding, setIsExpanding] = useState(false);
  const [activeCluster, setActiveCluster] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
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
        return oldNode?.x !== node.x || oldNode?.y !== node.y;
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
    const nodeIsExpanded = nodes.some((n) => n.parentId === nodeId);
    if (nodeIsExpanded || isExpanding) {
      return;
    }
    
    setIsExpanding(true);
    
    try {
      // Fetch node expansion data from API
      const expansion = await fetchNodeExpansion(nodeId);
      
      if (expansion?.nodes?.length) {
        // Add expanded nodes to the graph
        setNodes((prevNodes) => {
          const updatedNodes = prevNodes.map((node) =>
            node.id === nodeId ? { ...node, expanded: true } : node
          );
          const existingIds = new Set(prevNodes.map((n) => n.id));
          
          // Ensure all new nodes have valid labels
          const newNodes = expansion.nodes
            .filter((node) => !existingIds.has(node.id))
            .map((node) => ({
              ...node,
              parentId: node.parentId ?? nodeId,
              // Ensure each node has a label
              label: node.label || `Node ${node.id}`
            }));
            
          return [...updatedNodes, ...newNodes];
        });
        
        // Add new edges to the graph with enhanced information
        setEdges((prevEdges) => {
          // Ensure all new edges have proper descriptive properties
          const enhancedEdges = expansion.edges.map(edge => {
            // Find source and target nodes to get their labels
            const sourceNode = [...nodes, ...expansion.nodes].find(n => n.id === edge.source);
            const targetNode = [...nodes, ...expansion.nodes].find(n => n.id === edge.target);
            
            return {
              ...edge,
              // Add source and target labels to the edge for better UI display
              sourceLabel: sourceNode?.label || `Node ${edge.source}`,
              targetLabel: targetNode?.label || `Node ${edge.target}`
            };
          });
          
          return [...prevEdges, ...enhancedEdges];
        });
      }
    } catch (error) {
      console.error("Error expanding node:", error);
    } finally {
      setIsExpanding(false);
    }
  };

  // Handle node click - only notify parent, no auto-expansion
  const handleNodeClick = (node) => {
    onNodeClick(node);
    setSelectedEdgeId(null); // Clear edge selection when clicking a node
  };

  // Handle edge click
  const handleEdgeClick = (edge) => {
    const edgeId = `${edge.source}-${edge.target}`;
    setSelectedEdgeId(edgeId === selectedEdgeId ? null : edgeId);
    
    if (onEdgeClick && edge) {
      onEdgeClick(edge);
    }
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
    if (event.key === "Enter" || event.key === " ") {
      handleClusterClick(clusterId);
    }
  };

  // Render cluster labels
  const renderClusters = () => {
    return clusters.map((cluster) => {
      // Find the center of all nodes in this cluster
      const clusterNodes = nodes.filter((node) =>
        cluster.nodes.includes(node.id)
      );
      if (clusterNodes.length === 0) return null;

      // Calculate the average position
      const centerX =
        clusterNodes.reduce((sum, node) => sum + (node.x || 0), 0) /
        clusterNodes.length;
      const centerY =
        clusterNodes.reduce((sum, node) => sum + (node.y || 0), 0) /
        clusterNodes.length;

      return (
        <g
          key={`cluster-${cluster.id}`}
          className={`cluster-label ${
            activeCluster === cluster.id ? "active" : ""
          }`}
          // transform={`translate(${centerX}, ${centerY - 40})`}
          onClick={() => handleClusterClick(cluster.id)}
          onKeyPress={(e) => handleClusterKeyPress(e, cluster.id)}
          tabIndex="0"
          aria-pressed={activeCluster === cluster.id ? "true" : "false"}
          aria-label={`Cluster: ${cluster.label}`}
        >
          <foreignObject width="1" height="1" style={{ overflow: "visible" }}>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                width: "1px",
                height: "1px",
                position: "absolute",
                opacity: 0,
                pointerEvents: "none",
              }}
              aria-pressed={activeCluster === cluster.id ? "true" : "false"}
              aria-label={`Cluster: ${cluster.label}`}
            />
          </foreignObject>

          <text className="cluster-text" textAnchor="middle" fontWeight="bold">
            {cluster.label}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="graph-container">
      <svg
        className="graph-svg"
        width="100%"
        height="100%"
        aria-label="Knowledge graph visualization"
      >
        <title>Interactive Knowledge Graph Visualization</title>
        <defs>
          {/* Define marker for directed edges */}
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="10"
            markerHeight="10"
            orient="auto"
          >
            <polygon points="0,0 10,5 0,10" className="edge-arrow" />
          </marker>
        </defs>
        
        {/* Render edges */}
        <g className="edges">
          {edges.map((edge) => {
            const source = nodes.find(n => n.id === edge.source);
            const target = nodes.find(n => n.id === edge.target);
            
            if (!source || !target) return null;
            
            // Ensure source and target have valid labels
            const sourceLabel = source.label || `Node ${source.id}`;
            const targetLabel = target.label || `Node ${target.id}`;
            
            // Use the same positioning logic as found elsewhere in the codebase
            // The nodes are positioned with their top-left at (x,y) and have radius of 20px
            const centerOffset = 20; // Node radius
            const sourceX = (source.x || 0) + centerOffset;
            const sourceY = (source.y || 0) + centerOffset;
            const targetX = (target.x || 0) + centerOffset;
            const targetY = (target.y || 0) + centerOffset;
            
            // Calculate the midpoint for the arrow
            const midX = (sourceX + targetX) / 2;
            const midY = (sourceY + targetY) / 2;
            
            // Calculate direction vector
            const dx = targetX - sourceX;
            const dy = targetY - sourceY;
            
            // Label position - slightly offset from the midpoint
            const labelX = midX;
            const labelY = midY - 10; // Position above the arrow
            
            const isSelected = selectedEdgeId === `${edge.source}-${edge.target}`;
            
            // Create an enriched edge with source and target labels for the click handler
            const enrichedEdge = {
              ...edge,
              sourceLabel,
              targetLabel
            };
            
            // Common click handler for all edge elements
            const handleEdgeElementClick = () => handleEdgeClick(enrichedEdge);
            const handleEdgeKeyPress = (e) => e.key === "Enter" && handleEdgeClick(enrichedEdge);
            
            return (
              <g key={`edge-${edge.source}-${edge.target}`} className={`edge ${edge.type} ${isSelected ? "selected" : ""}`}>
                {!edge.bidirectional ? (
                  <>
                    {/* First half of the line (from source to midpoint) */}
                    <line
                      x1={sourceX}
                      y1={sourceY}
                      x2={midX}
                      y2={midY}
                      className={`graph-edge ${isSelected ? "selected" : ""}`}
                      onClick={handleEdgeElementClick}
                      onKeyPress={handleEdgeKeyPress}
                      tabIndex="0"
                      aria-label={`First half of edge from ${sourceLabel} to ${targetLabel}`}
                    />
                    
                    {/* Second half of the line (from midpoint to target), with arrow */}
                    <line
                      x1={midX}
                      y1={midY}
                      x2={targetX}
                      y2={targetY}
                      className={`graph-edge ${isSelected ? "selected" : ""}`}
                      onClick={handleEdgeElementClick}
                      onKeyPress={handleEdgeKeyPress}
                      tabIndex="0"
                      aria-label={`Second half of edge from ${sourceLabel} to ${targetLabel}`}
                      markerStart="url(#arrowhead)"
                    />
                  </>
                ) : (
                  // Bidirectional edge as a single line
                  <line
                    x1={sourceX}
                    y1={sourceY}
                    x2={targetX}
                    y2={targetY}
                    className={`graph-edge bidirectional ${isSelected ? "selected" : ""}`}
                    onClick={handleEdgeElementClick}
                    onKeyPress={handleEdgeKeyPress}
                    tabIndex="0"
                    aria-label={`Bidirectional edge between ${sourceLabel} and ${targetLabel}`}
                  />
                )}
                
                {/* Edge type label with improved clickability */}
                {edge.type && (
                  <g 
                    className="edge-label-container"
                    onClick={handleEdgeElementClick}
                    onKeyPress={handleEdgeKeyPress}
                    tabIndex="0"
                    role="button"
                    aria-label={`Relationship ${edge.type} between ${sourceLabel} and ${targetLabel}`}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Invisible larger hitbox for better clickability */}
                    <rect
                      x={labelX - 30}
                      y={labelY - 15}
                      width="60"
                      height="20"
                      fill="transparent"
                    />
                    
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      className={`edge-label ${isSelected ? "selected" : ""}`}
                      fontSize={isSelected ? "10" : "8"}
                      fontWeight={isSelected ? "bold" : "normal"}
                    >
                      {edge.type.replace(/_/g, " ")}
                      {edge.description && <title>{edge.description}</title>}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
        
        {/* Render cluster labels */}
        {renderClusters()}

        {/* Modified node rendering */}
        {nodes.map((node) => (
          <g key={`node-${node.id}`} className={isExpanding && node.id === expandedNodeId ? 'loading' : ''}>
            <Node
              node={node}
              onClick={handleNodeClick}
              isExpanded={node.id === expandedNodeId}
              isLoading={isExpanding && node.id === expandedNodeId}
              isInActiveCluster={
                activeCluster
                  ? clusters
                      .find((c) => c.id === activeCluster)
                      ?.nodes.includes(node.id)
                  : false
              }
              isSelected={node.id === selectedNodeId}
            />
            {/* expand button */}
            {!node.expanded && !isExpanding && (
              <g
                className="expand-button"
                transform={`translate(${node.x + 20}, ${node.y - 20})`}
                onClick={(e) => handleExpandClick(node.id, e)}
                onKeyPress={(e) => e.key === 'Enter' && handleExpandClick(node.id, e)}
                tabIndex="0"
                aria-label={`Expand node ${node.label}`}
                role="button"
              >
                <circle r="8" fill="#ffffff" stroke="#666666" strokeWidth="1" />
                <text textAnchor="middle" dy=".3em" fontSize="12" fill="#666666">
                  +
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

export default Graph;
