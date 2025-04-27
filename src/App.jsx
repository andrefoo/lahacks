import React, { useEffect, useRef, useState } from 'react';
import { fetchGraphData } from './api/llmService';
import logo2 from './assets/logo-2.png';
import Graph from './components/Graph';
import PromptInput from './components/PromptInput';
import Sidebar from './components/Sidebar';
import StarTrail from './components/StarTrail';

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
  
  // Pan and zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPosition, setStartDragPosition] = useState({ x: 0, y: 0 });
  const graphContainerRef = useRef(null);

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
      // Use the sourceLabel and targetLabel from the enriched edge if available
      // Otherwise, find the nodes and create the labels
      let enrichedEdge = { ...edge };
      
      if (!edge.sourceLabel || !edge.targetLabel) {
        const sourceNode = graphData?.nodes?.find(n => n.id === edge.source);
        const targetNode = graphData?.nodes?.find(n => n.id === edge.target);
        
        enrichedEdge = {
          ...edge,
          sourceLabel: edge.sourceLabel || sourceNode?.label || `Node ${edge.source}`,
          targetLabel: edge.targetLabel || targetNode?.label || `Node ${edge.target}`
        };
      }
      
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

  // Pan functionality - start dragging
  const handleMouseDown = (e) => {
    // Only enable dragging with primary mouse button and not on nodes/edges
    if (e.button !== 0 || e.target.closest('.node, .edge')) return;
    
    setIsDragging(true);
    setStartDragPosition({
      x: e.clientX - transform.x,
      y: e.clientY - transform.y
    });
    e.preventDefault();
  };

  // Pan functionality - during drag
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setTransform(prev => ({
      ...prev,
      x: e.clientX - startDragPosition.x,
      y: e.clientY - startDragPosition.y
    }));
  };

  // Pan functionality - end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom functionality
  const handleWheel = (e) => {
    e.preventDefault();
    
    // Calculate new scale with zoom speed factor
    const zoomSpeed = 0.1;
    const delta = e.deltaY < 0 ? zoomSpeed : -zoomSpeed;
    const newScale = Math.max(0.1, Math.min(2, transform.scale + delta));
    
    // Get mouse position relative to container
    const container = graphContainerRef.current;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate new position to zoom toward mouse position
    const newX = transform.x - ((mouseX - transform.x) * (newScale / transform.scale - 1));
    const newY = transform.y - ((mouseY - transform.y) * (newScale / transform.scale - 1));
    
    setTransform({
      x: newX,
      y: newY,
      scale: newScale
    });
  };

  // Reset zoom and pan to default
  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  // Fit graph to screen
  const fitToScreen = () => {
    // This is a simple implementation; ideally you'd calculate based on 
    // actual graph dimensions if you have them available
    setTransform({ x: 0, y: 0, scale: 0.8 });
  };

  // Add wheel event listener
  useEffect(() => {
    if (isGenerated && graphContainerRef.current) {
      const container = graphContainerRef.current;
      container.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isGenerated]);

  // Handle mouse leaving the container while dragging
  useEffect(() => {
    const handleMouseLeave = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDragging]);

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
            <div 
              ref={graphContainerRef}
              className="graph-container"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ 
                cursor: isDragging ? 'grabbing' : 'grab',
                overflow: 'hidden',
                width: '100%',
                height: '100%',
                position: 'relative'
              }}
            >
              <div
                className="graph-transform-container"
                style={{
                  transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                  transformOrigin: '0 0',
                  width: '100%',
                  height: '100%'
                }}
              >
                <Graph
                  graphData={graphData}
                  onNodeClick={handleNodeClick}
                  onEdgeClick={handleEdgeClick}
                  selectedNodeId={activeNode?.id}
                  transform={transform}
                />
              </div>
              
              <div className="graph-controls">
                <button onClick={resetView} title="Reset View">
                  <span>🔄</span>
                </button>
                <button onClick={fitToScreen} title="Fit to Screen">
                  <span>🔍</span>
                </button>
                <div className="zoom-level">
                  {Math.round(transform.scale * 100)}%
                </div>
              </div>
            </div>
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