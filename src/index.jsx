import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Entry point for the React application
// Renders the main App component into the DOM
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 