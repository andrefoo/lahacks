import React from 'react';
import BiasIndicator from './BiasIndicator';

// Component for rendering a single node in the knowledge graph
const Node = ({ node, onClick, isExpanded, isLoading, isInActiveCluster }) => {
  // Default dimensions
  const radius = node.parentId ? 18 : 25; // Child nodes are slightly smaller
  
  // Different colors based on node type
  const getNodeColor = () => {
    const typeColors = {
      concept: '#4285F4',     // Blue
      entity: '#34A853',      // Green
      process: '#FBBC05',     // Yellow
      property: '#EA4335',    // Red
      technology: '#9C27B0',  // Purple
      question: '#FF9800'     // Orange
    };
    
    return typeColors[node.type] || '#888888'; // Gray fallback
  };
  
  // Calculate importance radius adjustment
  const importanceRadius = () => {
    const importance = node.properties?.importance || 0.5;
    return radius * (0.8 + (importance * 0.4)); // Scale radius by importance
  };
  
  const nodeRadius = importanceRadius();
  
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      onClick(node);
    }
  };
  
  return (
    <g
      className={`graph-node ${node.type || ''} ${isExpanded ? 'expanded' : ''} ${isInActiveCluster ? 'active-cluster' : ''}`}
      transform={`translate(${node.x || 0}, ${node.y || 0})`}
      onClick={() => onClick(node)}
      onKeyPress={handleKeyPress}
      style={{ cursor: 'pointer' }}
      data-node-id={node.id}
      tabIndex="0"
      aria-expanded={isExpanded ? 'true' : 'false'}
      aria-label={`Node: ${node.label} (${node.type || 'unknown type'})`}
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
          aria-expanded={isExpanded ? 'true' : 'false'}
          aria-label={`Node: ${node.label} (${node.type || 'unknown type'})`}
        />
      </foreignObject>
      
      {/* Node circle */}
      <circle
        r={nodeRadius}
        fill={getNodeColor()}
        strokeWidth={isExpanded ? 3 : 1.5}
        className="node-circle"
      />
      
      {/* Show loading indicator */}
      {isLoading && (
        <circle
          r={nodeRadius + 5}
          className="loading-indicator"
          strokeDasharray="10 5"
          fill="none"
          stroke="#666"
          strokeWidth="2"
        />
      )}
      
      {/* Show expanded indicator */}
      {isExpanded && !isLoading && (
        <circle
          r={nodeRadius + 4}
          className="expanded-indicator"
          fill="none"
          stroke="#444"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
      )}
      
      {/* Node label */}
      <text
        textAnchor="middle"
        dy=".3em"
        fontSize={node.parentId ? 8 : 10}
        fontWeight="bold"
        fill="#fff"
        className="node-label"
      >
        {node.label.length > 20 ? `${node.label.substring(0, 18)}...` : node.label}
      </text>
      
      {/* Node type indicator */}
      <text
        textAnchor="middle"
        dy={nodeRadius + 15}
        fontSize="8"
        className="node-type-label"
      >
        {node.type || 'node'}
      </text>
      
      {/* Bias indicator if present */}
      {node.hasBias && (
        <BiasIndicator
          biasType={node.biasType}
          x={-nodeRadius - 5}
          y={-nodeRadius - 5}
        />
      )}
      
      {/* Domain badge if available */}
      {node.properties?.domain && (
        <text
          textAnchor="start"
          x={nodeRadius + 5}
          y="5"
          fontSize="7"
          className="domain-badge"
        >
          {node.properties.domain}
        </text>
      )}
    </g>
  );
};

export default Node; 