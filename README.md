# Constellation

Interactive knowledge graph visualization with cognitive bias detection.

## Overview

Constellation is a web application that generates knowledge graphs from user prompts and detects potential cognitive biases in the concepts.

Key features:
- Generate knowledge graphs from natural language prompts
- Interactive visualization with expandable nodes
- Automatic detection of cognitive biases in concepts
- Detailed information about detected biases

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- OpenAI API key (for LLM functionality)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory based on `.env.example`:
   ```
   cp .env.example .env
   ```
4. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

### Running the Application

#### Development mode

```
npm run dev
```

This starts both the client (port 3000) and server (port 3001) in development mode.

#### Production build

```
npm run build
npm start
```

## Project Structure

```
/src               # Frontend React code
  /components      # UI components
  /api             # API service functions
  /utils           # Utility functions
  
/server            # Backend Node.js/Express code
  index.js         # Server entry point
  routes.js        # API routes
  llmController.js # LLM integration
```

## How It Works

1. User enters a prompt
2. Backend calls LLM API to generate related concepts
3. Frontend renders the knowledge graph
4. Bias detection analyzes concepts for cognitive biases
5. User can interact with and explore the graph
6. Detailed information is shown in the sidebar when a node is clicked