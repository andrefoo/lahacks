import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

// Component for the sidebar that displays detailed node or edge information
const Sidebar = ({ node, edge, onClose }) => {
  // If we have an edge, display edge info
  if (edge) {
    const sourceLabel = edge.sourceLabel || `Node ${edge.source}`;
    const targetLabel = edge.targetLabel || `Node ${edge.target}`;
    
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Relationship</h2>
          <button onClick={onClose} type="button" className="close-button">
            <X size={20} />
          </button>
        </div>
        
        <div className="sidebar-content">
          <div className="sidebar-section">
            <h3 className="section-title">Relationship</h3>
            <p className="section-text">
              <strong>{sourceLabel}</strong> {edge.type.replace(/_/g, ' ')} <strong>{targetLabel}</strong>
              {edge.bidirectional && <span className="bidirectional-indicator"> (Bidirectional)</span>}
            </p>
          </div>
          
          <div className="sidebar-section">
            <h3 className="section-title">Description</h3>
            <p className="section-text">{edge.description || "No description available."}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Otherwise, display node info
  if (node) {
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">{node.label}</h2>
          <button onClick={onClose} type="button" className="close-button">
            <X size={20} />
          </button>
        </div>
        
        <div className="sidebar-content">
          <div className="sidebar-section">
            <h3 className="section-title">Description</h3>
            <p className="section-text">{node.description}</p>
          </div>
          
          {/* Fun Fact section - only shown if node has a fun fact */}
          {node.funFact && (
            <div className="sidebar-section fun-fact-section">
              <h3 className="section-title">Fun Fact</h3>
              <p className="section-text fun-fact-text">{node.funFact}</p>
            </div>
          )}
          
          {/* Bias information section - only shown if node has bias */}
          {node.hasBias && (
            <div className="bias-section">
              <div className="bias-header">
                <AlertTriangle size={16} className="bias-icon" />
                <h3 className="bias-title">Detected Bias</h3>
              </div>
              <h4 className="bias-type">{node.biasType}</h4>
              <p className="bias-description">{node.biasDescription}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Fallback if neither node nor edge is provided
  return null;
};

export default Sidebar; 