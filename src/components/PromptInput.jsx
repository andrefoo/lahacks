import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import logo from '../assets/logo.png';

// Component for the initial prompt input screen
// Provides an input field and submit button for generating the knowledge graph
const PromptInput = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [loadingDots, setLoadingDots] = useState('');

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
    } else {
      setLoadingDots('');
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(prompt);
  };

  return (
    <div className="prompt-container">
      <div className="prompt-card">
        <img src={logo} alt="Constellation Logo" className="prompt-logo" />
        <h2>Rediscover the Power of Thinking</h2>
        <p className="prompt-subheader">
          Start with a curiosity, a challenge, or an idea. (e.g., 'What causes scientific revolutions?', 'How does bias shape decision-making?', 'What's the future of education?') Watch knowledge unfold in unexpected ways.
        </p>
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
              {isLoading ? `Generating${loadingDots}` : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromptInput; 