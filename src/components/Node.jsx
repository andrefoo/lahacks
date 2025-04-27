import React, { useEffect, useRef, useState } from 'react';
import BiasIndicator from './BiasIndicator';

// Component for rendering a single node in the knowledge graph
const Node = ({ node, onClick, isExpanded, isLoading, isInActiveCluster, isSelected }) => {
  // Standardized radius for all nodes
  const radius = 30;
  const textRef = useRef(null);
  const [wrappedText, setWrappedText] = useState([]);
  
  // Function to wrap text into multiple lines
  const wrapText = (text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      // Approximate width based on character count
      const testWidth = testLine.length * 6; // Rough estimate of character width
      
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  useEffect(() => {
    if (node.label) {
      // Calculate max width based on circle radius
      const maxWidth = radius * 1.8; // Allow some padding
      setWrappedText(wrapText(node.label, maxWidth));
    }
  }, [node.label, radius]);

  // Calculate appropriate text size class
  const getTextSizeClass = () => {
    if (!textRef.current) return 'size-md';
    
    const text = node.label;
    const length = text.length;
    const words = text.split(' ').length;
    
    // Adjust these thresholds based on your needs
    if (length > 20 || words > 3) return 'size-xs';
    if (length > 15 || words > 2) return 'size-sm';
    if (length > 10) return 'size-md';
    return 'size-lg';
  };
  
  // Get node color based on expansion type
  const getNodeFill = () => {
    // Custom color if specifically set on the node
    if (node.color) return node.color;
    
    // Color based on expansion type
    const expansionTypeColors = {
      'theory': '#e1f5fe',      // Light blue
      'experiments': '#e8f5e9', // Light green
      'philosophical': '#fff8e1', // Light yellow
      'practical': '#ffebee'    // Light red
    };
    
    // If this is an expanded node with an expansion type
    if (node.expansionType && expansionTypeColors[node.expansionType]) {
      return expansionTypeColors[node.expansionType];
    }
    
    // Default node color from CSS
    return null; // Let CSS handle it
  };
  
  const handleClick = () => {
    onClick(node);
  };
  
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleClick();
    }
  };

  // Calculate vertical offset for multiple lines
  const lineHeight = 12; // Adjust based on your font size
  const totalHeight = wrappedText.length * lineHeight;
  const startY = -totalHeight / 2 + lineHeight / 2;
  
  // Create class name based on expansion type
  const nodeClass = `graph-node ${node.type || ''} ${isExpanded ? 'expanded' : ''} ${isInActiveCluster ? 'active-cluster' : ''} ${isSelected ? 'selected' : ''} ${node.expansionType ? `expansion-${node.expansionType}` : ''}`;

  return (
    <g
      className={nodeClass}
      transform={`translate(${node.x || 0}, ${node.y || 0})`}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      data-node-id={node.id}
      tabIndex="0"
      aria-expanded={isExpanded ? 'true' : 'false'}
      aria-label={`Node: ${node.label} (${node.type || 'unknown type'})`}
    >
      <foreignObject>
        <button
          type="button"
          aria-expanded={isExpanded ? 'true' : 'false'}
          aria-label={`Node: ${node.label} (${node.type || 'unknown type'})`}
        />
      </foreignObject>
      
      {/* Node circle with dynamic fill color based on expansion type */}
      <circle
        r={radius}
        strokeWidth={isExpanded ? 3 : 1.5}
        className="node-circle"
        fill={getNodeFill()}
      />
      
      {/* Show loading indicator */}
      {isLoading && (
        <circle
          r={radius + 5}
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
          r={radius + 4}
          className="expanded-indicator"
        />
      )}
      
      {/* Node label - wrapped text */}
      <g ref={textRef}>
        {wrappedText.map((line, index) => (
          <text
            key={index}
            className={`node-label ${getTextSizeClass()}`}
            textAnchor="middle"
            dominantBaseline="middle"
            y={startY + index * lineHeight}
          >
            {line}
          </text>
        ))}
      </g>
      
      {/* Node type indicator */}
      <text
        textAnchor="middle"
        dy={radius + 15}
        fontSize="8"
        className="node-type-label"
      >
        {node.type || 'node'}
      </text>
      
      {/* Expansion type badge if available */}
      {node.expansionType && node.expansionType !== 'all' && (
        <text
          textAnchor="end"
          x={-radius - 3}
          y="-5"
          fontSize="8"
          className="expansion-type-badge"
        >
          {node.expansionType}
        </text>
      )}
      
      {/* Bias indicator if present */}
      {node.hasBias && (
        <BiasIndicator
          biasType={node.biasType}
          x={-radius - 5}
          y={-radius - 5}
        />
      )}
      
      {/* Domain badge if available */}
      {node.properties?.domain && (
        <text
          textAnchor="start"
          x={radius + 5}
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