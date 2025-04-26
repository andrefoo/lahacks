import React, { useState } from 'react';
import PromptInput from './components/PromptInput';
import Graph from './components/Graph';
import Sidebar from './components/Sidebar';
import StarTrail from './components/StarTrail';
import logo2 from './assets/logo-2.png';
import { fetchGraphData } from './api/llmService';

// Main App component
// Manages application state and coordinates between components
function App() {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [activeNode, setActiveNode] = useState(null);
  const [activeEdge, setActiveEdge] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [error, setError] = useState(null);

  // Handle prompt submission
  const handlePromptSubmit = async (prompt) => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch graph data from LLM service
      const data = await fetchGraphData(prompt);
      setGraphData(data);
      setIsGenerated(true);
    } catch (error) {
      console.error('Error generating graph:', error);
      setError("Failed to generate graph. Please try again with a different prompt.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle node click
  const handleNodeClick = (node) => {
    // If clicking the same node, deselect it
    if (activeNode?.id === node.id) {
      setActiveNode(null);
      setShowSidebar(false);
    } else {
      // Select the new node and clear any active edge
      setActiveNode(node);
      setActiveEdge(null);
      setShowSidebar(true);
    }
  };

  // Handle edge click
  const handleEdgeClick = (edge) => {
    // If clicking the same edge, deselect it
    if (activeEdge && activeEdge.source === edge.source && activeEdge.target === edge.target) {
      setActiveEdge(null);
      setShowSidebar(false);
    } else {
      // Select the new edge and clear any active node
      // Add source and target node labels to the edge for display
      const sourceNode = graphData.nodes.find(n => n.id === edge.source);
      const targetNode = graphData.nodes.find(n => n.id === edge.target);
      
      const enrichedEdge = {
        ...edge,
        sourceLabel: sourceNode?.label || `Node ${edge.source}`,
        targetLabel: targetNode?.label || `Node ${edge.target}`
      };
      
      setActiveEdge(enrichedEdge);
      setActiveNode(null);
      setShowSidebar(true);
    }
  };

  // Close sidebar
  const closeSidebar = () => {
    setShowSidebar(false);
    setActiveNode(null);
    setActiveEdge(null);
  };

  // Reset to initial state
  const handleReset = () => {
    setIsGenerated(false);
    setGraphData(null);
    setActiveNode(null);
    setActiveEdge(null);
    setShowSidebar(false);
  };

  return (
    <>
      <StarTrail />
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="header-title">
            <img src={logo2} alt="Constellation Logo" className="header-logo" />
            <h1>Constellation</h1>
          </div>
          {!isGenerated && <div className="subtitle">Knowledge Graph Bias Detection</div>}
        </header>

        {/* Main content */}
        <main className="app-main">
          {!isGenerated ? (
            <>
              <PromptInput onSubmit={handlePromptSubmit} isLoading={isLoading} />
              {error && <div className="error-message">{error}</div>}
            </>
          ) : (
            <Graph
              graphData={graphData}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              selectedNodeId={activeNode?.id}
            />
          )}

          {/* Sidebar appears when a node or edge is clicked */}
          {showSidebar && (activeNode || activeEdge) && (
            <Sidebar
              node={activeNode}
              edge={activeEdge}
              onClose={closeSidebar}
            />
          )}
        </main>

        {/* Footer with controls */}
        {isGenerated && (
          <footer className="app-footer">
            <button onClick={handleReset}>New Prompt</button>
            <button>Highlight Biases</button>
          </footer>
        )}
      </div>
    </>
  );
}

export default App; 