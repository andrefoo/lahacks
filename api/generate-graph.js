// Vercel API route for generating knowledge graphs
import axios from 'axios';

// Global in-memory store for serverless functions (note: this won't persist across invocations)
let lastGeneratedGraph = null;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key is not configured" });
    }

    // Create system prompt for the LLM to generate a knowledge graph
    const systemPrompt = `
      You are an AI specialized in generating knowledge graphs from user queries.
      Based on the user's topic, generate:
      1. 10 nodes (concepts, entities, processes, etc) related to the topic.
      2. A set of edges connecting nodes with semantic relationships.
      3. Clusters that group related nodes together.
      
      Each node should have:
      - A unique id (1-10)
      - A descriptive label (1-5 words)
      - An extensive description (1-2 sentences)
      - A type (concept, entity, process, property, question, technology)
      - Properties including importance (0-1) and domain
      
      Each edge should have:
      - Source and target node IDs
      - A relationship type (is_a, part_of, related_to, leads_to, depends_on, contradicts, similar_to, example_of)
      - A description explaining the relationship between the two nodes (1-2 sentences)
      - A weight value (0-1)
      - Whether it's bidirectional
      
      Each cluster should:
      - Group related nodes
      - Have a descriptive label
      - Have a brief description
      
      Format your response as a valid JSON object with this structure:
      {
        "nodes": [
          { "id": 1, "label": "Concept 1", "description": "Description", "type": "concept", "properties": { "importance": 0.9, "domain": "domain1" } },
          ...
        ],
        "edges": [
          { "source": 1, "target": 2, "type": "is_a", "weight": 0.8, "bidirectional": false, "description": "Description of how these nodes relate" },
          ...
        ],
        "clusters": [
          { "id": "c1", "label": "Cluster 1", "description": "Description", "nodes": [1, 2, 3] },
          ...
        ]
      }
    `;

    // Call Gemini API
    let response;
    try {
      console.log("Making Gemini API request...");
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      response = await axios.post(
        apiUrl,
        {
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2500,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
      console.log("Received Gemini API response");
    } catch (error) {
      console.error("Error calling Gemini API:", error.response ? error.response.data : error.message);
      return res.status(500).json({ error: "Error calling Gemini API" });
    }
    
    // Parse the Gemini response
    let content;
    try {
      if (response.data?.candidates && response.data.candidates.length > 0) {
        const candidate = response.data.candidates[0];
        if (candidate?.content?.parts && candidate.content.parts.length > 0) {
          content = candidate.content.parts[0].text;
        } else {
          throw new Error("No content in Gemini response");
        }
      } else {
        throw new Error("Invalid Gemini response structure");
      }
    } catch (error) {
      console.error("Error extracting content from Gemini response:", error);
      return res.status(500).json({ error: "Error parsing Gemini response" });
    }

    let graphData;
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      graphData = JSON.parse(jsonString);

      // Validate the structure
      if (
        !graphData.nodes ||
        !Array.isArray(graphData.nodes) ||
        !graphData.edges ||
        !Array.isArray(graphData.edges)
      ) {
        throw new Error("Invalid response structure");
      }

      // Add metadata
      graphData.metadata = {
        prompt: prompt,
        generated: new Date().toISOString(),
        version: "1.0",
      };
      
      // Store the graph data for the expand-node endpoint to use
      lastGeneratedGraph = {
        nodes: graphData.nodes,
        edges: graphData.edges,
        clusters: graphData.clusters || []
      };
      
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError);
      return res.status(500).json({ error: "Failed to parse API response" });
    }

    // Return the graph data
    res.status(200).json(graphData);
  } catch (error) {
    console.error("Error generating graph:", error);
    return res.status(500).json({ error: "Failed to generate graph" });
  }
} 