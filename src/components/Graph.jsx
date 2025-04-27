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
  const [hoverNodeId, setHoverNodeId] = useState(null);  // Track which node's menu is being hovered
  const hoverTimeoutRef = useRef(null); // Ref to store timeout ID
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

  // New handler for expand button click that accepts expansion type
  const handleExpandClick = (nodeId, expansionType, event) => {
    // Prevent the click from triggering the node click handler
    event.stopPropagation();
    handleNodeExpand(nodeId, expansionType);
  };

  // Modified node expansion to handle expansion types
  const handleNodeExpand = async (nodeId, expansionType = "all") => {
    // Set the expanded node ID immediately for UI feedback
    setExpandedNodeId(nodeId);
    
    // Check if node is already expanded or is being expanded
    const nodeIsExpanded = nodes.some((n) => n.parentId === nodeId);
    if (nodeIsExpanded || isExpanding) {
      return;
    }
    
    setIsExpanding(true);
    
    try {
      // Fetch node expansion data from API with expansion type
      const expansion = await fetchNodeExpansion(nodeId, 3, expansionType);
      
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
              label: node.label || `Node ${node.id}`,
              // Track expansion type
              expansionType: expansionType
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
          <g 
            key={`node-${node.id}`} 
            className={`graph-node-container ${isExpanding && node.id === expandedNodeId ? 'loading' : ''}`}
            onMouseEnter={() => setHoverNodeId(node.id)}
            onMouseLeave={() => {
              hoverTimeoutRef.current = setTimeout(() => {
                setHoverNodeId(null);
              }, 500);
            }}
          >
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
            
            {(!node.expanded && !isExpanding) && (
              <g
                className={`expand-options-container ${hoverNodeId === node.id ? 'show-menu' : ''}`}
                transform={`translate(${node.x + 20}, ${node.y - 20})`}
              >
                {/* Primary expand button */}
                <g className="expansion-menu">
                  <circle
                    r="10"
                    fill="#ffffff"
                    stroke="#666666"
                    strokeWidth="1"
                  />
                  <text
                    textAnchor="middle"
                    dy=".3em"
                    fontSize="10"
                    fill="#666666"
                  >
                    +
                  </text>
                  
                  {/* Expansion options */}
                  <g className="expansion-options">
                    {/* Theory option */}
                    <g
                      className="expansion-option theory-option"
                      onClick={(e) => handleExpandClick(node.id, "theory", e)}
                      onKeyPress={(e) => e.key === "Enter" && handleExpandClick(node.id, "theory", e)}
                      tabIndex="0"
                      aria-label={`Expand node ${node.label} with theory`}
                      transform="translate(-30, 0)"
                    >
                      <circle
                        r="8"
                        fill="#e1f5fe"
                        stroke="#666666"
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        dy=".3em"
                        fontSize="8"
                      >
                        📚
                      </text>
                    </g>
                    
                    {/* Experiments option */}
                    <g
                      className="expansion-option experiments-option"
                      onClick={(e) => handleExpandClick(node.id, "experiments", e)}
                      onKeyPress={(e) => e.key === "Enter" && handleExpandClick(node.id, "experiments", e)}
                      tabIndex="0"
                      aria-label={`Expand node ${node.label} with experiments`}
                      transform="translate(-15, -25)"
                    >
                      <circle
                        r="8"
                        fill="#e8f5e9"
                        stroke="#666666"
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        dy=".3em"
                        fontSize="8"
                      >
                        🧪
                      </text>
                    </g>
                    
                    {/* Philosophical questions option */}
                    <g
                      className="expansion-option philosophical-option"
                      onClick={(e) => handleExpandClick(node.id, "philosophical", e)}
                      onKeyPress={(e) => e.key === "Enter" && handleExpandClick(node.id, "philosophical", e)}
                      tabIndex="0"
                      aria-label={`Expand node ${node.label} with philosophical questions`}
                      transform="translate(15, -25)"
                    >
                      <circle
                        r="8"
                        fill="#fff8e1"
                        stroke="#666666"
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        dy=".3em"
                        fontSize="8"
                      >
                        🤔
                      </text>
                    </g>
                    
                    {/* Practical uses option */}
                    <g
                      className="expansion-option practical-option"
                      onClick={(e) => handleExpandClick(node.id, "practical", e)}
                      onKeyPress={(e) => e.key === "Enter" && handleExpandClick(node.id, "practical", e)}
                      tabIndex="0"
                      aria-label={`Expand node ${node.label} with practical uses`}
                      transform="translate(30, 0)"
                    >
                      <circle
                        r="8"
                        fill="#ffebee"
                        stroke="#666666"
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        dy=".3em"
                        fontSize="8"
                      >
                        🛠️
                      </text>
                    </g>
                  </g>
                </g>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

export default Graph;
