import React from 'react';
import { AlertTriangle } from 'lucide-react';

// Component for individual nodes in the knowledge graph
// Renders a circle with text and indicates if the node has bias
const Node = ({ node, onClick, isExpanded }) => {
  // Determine node size based on whether it's a child node
  const isChild = node.parentId !== undefined;
  const nodeSize = isChild ? 40 : 60;
  
  // Truncate long labels
  const displayLabel = node.label.length > 15 
    ? node.label.substring(0, 15) + "..." 
    : node.label;
  
  return (
    <g 
      className={`graph-node ${isExpanded ? 'expanded' : ''}`}
      transform={`translate(${node.x - nodeSize/2}, ${node.y - nodeSize/2})`}
      onClick={onClick}
    >
      {/* Node circle */}
      <circle
        cx={nodeSize/2}
        cy={nodeSize/2}
        r={nodeSize/2}
        className={`node-circle ${node.hasBias ? 'has-bias' : ''}`}
      />
      
      {/* Node label */}
      <text
        x={nodeSize/2}
        y={nodeSize/2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="node-label"
        fontSize={isChild ? 10 : 12}
      >
        {displayLabel}
      </text>
      
      {/* Bias indicator - only shown if node has bias */}
      {node.hasBias && (
        <g transform={`translate(${nodeSize - 16}, ${nodeSize - 16})`} className="bias-indicator">
          <circle cx="8" cy="8" r="8" className="bias-circle" />
          <AlertTriangle size={10} className="bias-icon" />
        </g>
      )}
    </g>
  );
};

export default Node; 