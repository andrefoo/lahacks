import React, { useState } from 'react';
import { Search } from 'lucide-react';

// Component for the initial prompt input screen
// Provides an input field and submit button for generating the knowledge graph
const PromptInput = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(prompt);
  };

  return (
    <div className="prompt-container">
      <div className="prompt-card">
        <h2>Explore Knowledge Graph</h2>
        <form onSubmit={handleSubmit} className="prompt-form">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Enter your idea, question, or problem..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />
            <Search className="search-icon" size={20} />
          </div>
          <div className="button-wrapper">
            <button 
              type="submit" 
              disabled={isLoading || !prompt.trim()}
              className="generate-button"
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromptInput; 