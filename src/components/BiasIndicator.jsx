import React from 'react';

const BiasIndicator = ({ biasType, x = 0, y = 0 }) => {
  // Different colors for different bias types
  const getBiasColor = () => {
    const biasColors = {
      cultural: '#FF5252',    // Red
      cognitive: '#FF9800',   // Orange
      statistical: '#FFEB3B', // Yellow
      political: '#E040FB',   // Purple
      social: '#2196F3',      // Blue
    };
    
    return biasColors[biasType] || '#F44336'; // Default red
  };
  
  // Different symbols for different bias types
  const getBiasSymbol = () => {
    switch (biasType) {
      case 'cultural': return '⚠';
      case 'cognitive': return '⚙';
      case 'statistical': return '📊';
      case 'political': return '🏛';
      case 'social': return '👥';
      default: return '⚠'; // Default warning
    }
  };
  
  return (
    <g className="bias-indicator" transform={`translate(${x}, ${y})`}>
      <circle r="8" fill={getBiasColor()} />
      <text 
        textAnchor="middle" 
        dy=".3em" 
        fontSize="10" 
        fontWeight="bold" 
        fill="white" 
        className="bias-symbol"
      >
        {getBiasSymbol()}
      </text>
      <title>{`${biasType || 'Unknown'} bias detected`}</title>
    </g>
  );
};

export default BiasIndicator; 