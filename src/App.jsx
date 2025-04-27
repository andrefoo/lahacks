import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fetchGraphData } from './api/llmService';
import logo2 from './assets/logo-2.png';
import Graph from './components/Graph';
import PromptInput from './components/PromptInput';
import Sidebar from './components/Sidebar';
import StarTrail from './components/StarTrail';
import { redistributeNodes } from './utils/graphLayout';

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
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const [hoverNodeId, setHoverNodeId] = useState(null);

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
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom functionality
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    // Calculate new scale with zoom speed factor
    const zoomSpeed = 0.02;
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
  }, [transform]);

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

  // Reset layout to evenly space all nodes
  const resetLayout = () => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) return;
    
    // Use our redistributeNodes function to recalculate positions
    const redistributedNodes = redistributeNodes(
      graphData.nodes, 
      graphData.clusters || [],
      null
    );
    
    // Update the graph data with new node positions
    setGraphData({
      ...graphData,
      nodes: redistributedNodes
    });
    
    // Reset zoom to see the entire graph
    fitToScreen();
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
  }, [isGenerated, handleWheel]);

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
  }, [isDragging, handleMouseUp]);

  const handleNodeMouseEnter = (nodeId) => {
    setHoverNodeId(nodeId);
    
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleNodeMouseLeave = () => {
    // Only set timeout if menu is not being hovered
    if (!isMenuHovered) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoverNodeId(null);
      }, 500);
    }
  };

  const handleMenuMouseEnter = () => {
    setIsMenuHovered(true);
    
    // Clear any pending hide timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleMenuMouseLeave = () => {
    setIsMenuHovered(false);
    
    // Set timeout to hide menu
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverNodeId(null);
    }, 500);
  };

  return (
    <>
      {/*<StarTrail />*/}
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
              
              <div className="graph-controls" style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                display: 'flex',
                gap: '10px',
                background: 'rgba(30, 41, 59, 0.85)',
                padding: '10px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                zIndex: 1000
              }}>
                <button 
                  type="button" 
                  onClick={resetView} 
                  title="Reset View"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'rgba(51, 65, 85, 0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: '#e2e8f0',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(71, 85, 105, 0.9)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.7)'}
                >
                  <span>🔄</span>
                </button>
                <button 
                  type="button" 
                  onClick={fitToScreen} 
                  title="Fit to Screen"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'rgba(51, 65, 85, 0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: '#e2e8f0',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(71, 85, 105, 0.9)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.7)'}
                >
                  <span>🔍</span>
                </button>
                <button 
                  type="button" 
                  onClick={resetLayout} 
                  title="Reset Layout (Reorganize Nodes)"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'rgba(51, 65, 85, 0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: '#e2e8f0',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(71, 85, 105, 0.9)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.7)'}
                >
                  <span>📏</span>
                </button>
                <div className="zoom-level" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '60px',
                  padding: '0 10px',
                  fontWeight: 'bold',
                  color: '#e2e8f0'
                }}>
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
          <footer className="app-footer" style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            display: 'flex',
            gap: '10px',
            background: 'rgba(30, 41, 59, 0.85)',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            zIndex: 1000
          }}>
            <button 
              type="button" 
              onClick={handleReset}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                background: 'rgba(51, 65, 85, 0.7)',
                cursor: 'pointer',
                fontWeight: 'bold',
                color: '#e2e8f0',
                transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(71, 85, 105, 0.9)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.7)'}
            >
              New Prompt
            </button>
            <button 
              type="button"
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                background: 'rgba(51, 65, 85, 0.7)',
                cursor: 'pointer',
                fontWeight: 'bold',
                color: '#e2e8f0',
                transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(71, 85, 105, 0.9)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.7)'}
            >
              Highlight Biases
            </button>
          </footer>
        )}
      </div>
    </>
  );
}

export default App;