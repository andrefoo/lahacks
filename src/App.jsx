import React, { useState } from 'react';
import PromptInput from './components/PromptInput';
import Graph from './components/Graph';
import Sidebar from './components/Sidebar';
import StarTrail from './components/StarTrail';
import { fetchGraphData } from './api/llmService';

// Main App component
// Manages application state and coordinates between components
function App() {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [activeNode, setActiveNode] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  // Handle prompt submission
  const handlePromptSubmit = async (prompt) => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      // Fetch graph data from LLM service
      const data = await fetchGraphData(prompt);
      setGraphData(data);
      setIsGenerated(true);
    } catch (error) {
      console.error('Error generating graph:', error);
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
      // Select the new node
      setActiveNode(node);
      setShowSidebar(true);
    }
  };

  // Close sidebar
  const closeSidebar = () => {
    setShowSidebar(false);
    setActiveNode(null);
  };

  // Reset to initial state
  const handleReset = () => {
    setIsGenerated(false);
    setGraphData(null);
    setActiveNode(null);
    setShowSidebar(false);
  };

  return (
    <>
      <StarTrail />
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <h1>Constellation</h1>
          {!isGenerated && <div className="subtitle">Knowledge Graph Bias Detection</div>}
        </header>

        {/* Main content */}
        <main className="app-main">
          {!isGenerated ? (
            <PromptInput onSubmit={handlePromptSubmit} isLoading={isLoading} />
          ) : (
            <Graph
              graphData={graphData}
              onNodeClick={handleNodeClick}
              selectedNodeId={activeNode?.id}
            />
          )}

          {/* Sidebar appears when a node is clicked */}
          {showSidebar && activeNode && (
            <Sidebar
              node={activeNode}
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