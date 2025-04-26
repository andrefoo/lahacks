import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

// Component for the sidebar that displays detailed node information
// Shows when a node is clicked and displays description and bias information
const Sidebar = ({ node, onClose }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">{node.label}</h2>
        <button onClick={onClose} className="close-button">
          <X size={20} />
        </button>
      </div>
      
      <div className="sidebar-content">
        <div className="sidebar-section">
          <h3 className="section-title">Description</h3>
          <p className="section-text">{node.description}</p>
        </div>
        
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
};

export default Sidebar; 