// Using native fetch in Node.js 18+
// No need to import node-fetch

async function validateApis() {
  console.log('Starting API validation...');
  
  // Test health endpoint
  try {
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
  
  // Test generate-graph endpoint
  try {
    const graphResponse = await fetch('http://localhost:3001/api/generate-graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'artificial intelligence' })
    });
    
    const graphData = await graphResponse.json();
    
    // Validate nodes structure
    if (!Array.isArray(graphData.nodes)) {
      console.error('❌ nodes is not an array');
    } else {
      console.log(`✅ nodes is an array with ${graphData.nodes.length} items`);
      
      // Validate a sample node
      if (graphData.nodes.length > 0) {
        const node = graphData.nodes[0];
        console.log('Sample node:', node);
        
        // Check node properties
        const requiredNodeProps = ['id', 'label', 'description', 'type', 'properties'];
        const missingProps = requiredNodeProps.filter(prop => !node.hasOwnProperty(prop));
        
        if (missingProps.length === 0) {
          console.log('✅ Node has all required properties');
        } else {
          console.error(`❌ Node missing properties: ${missingProps.join(', ')}`);
        }
      }
    }
    
    // Validate edges structure
    if (!Array.isArray(graphData.edges)) {
      console.error('❌ edges is not an array');
    } else {
      console.log(`✅ edges is an array with ${graphData.edges.length} items`);
      
      // Validate a sample edge
      if (graphData.edges.length > 0) {
        const edge = graphData.edges[0];
        console.log('Sample edge:', edge);
        
        // Check edge properties
        const requiredEdgeProps = ['source', 'target', 'type', 'weight', 'bidirectional'];
        const missingProps = requiredEdgeProps.filter(prop => !edge.hasOwnProperty(prop));
        
        if (missingProps.length === 0) {
          console.log('✅ Edge has all required properties');
        } else {
          console.error(`❌ Edge missing properties: ${missingProps.join(', ')}`);
        }
      }
    }
    
    // Validate clusters structure
    if (!Array.isArray(graphData.clusters)) {
      console.error('❌ clusters is not an array');
    } else {
      console.log(`✅ clusters is an array with ${graphData.clusters.length} items`);
      
      // Validate a sample cluster
      if (graphData.clusters.length > 0) {
        const cluster = graphData.clusters[0];
        console.log('Sample cluster:', cluster);
        
        // Check cluster properties
        const requiredClusterProps = ['id', 'label', 'description', 'nodes'];
        const missingProps = requiredClusterProps.filter(prop => !cluster.hasOwnProperty(prop));
        
        if (missingProps.length === 0) {
          console.log('✅ Cluster has all required properties');
        } else {
          console.error(`❌ Cluster missing properties: ${missingProps.join(', ')}`);
        }
      }
    }
    
    // Validate metadata
    if (!graphData.metadata) {
      console.error('❌ metadata is missing');
    } else {
      console.log('✅ metadata is present:', graphData.metadata);
    }
    
  } catch (error) {
    console.error('❌ generate-graph test failed:', error.message);
  }
  
  // Test expand-node endpoint
  try {
    const expandResponse = await fetch('http://localhost:3001/api/expand-node/1');
    const expandData = await expandResponse.json();
    
    // Validate structure
    if (!expandData.sourceNode) {
      console.error('❌ sourceNode is missing');
    } else {
      console.log('✅ sourceNode:', expandData.sourceNode);
    }
    
    if (!Array.isArray(expandData.nodes)) {
      console.error('❌ nodes is not an array');
    } else {
      console.log(`✅ nodes is an array with ${expandData.nodes.length} items`);
      
      // Check a sample expanded node
      if (expandData.nodes.length > 0) {
        console.log('Sample expanded node:', expandData.nodes[0]);
      }
    }
    
    if (!Array.isArray(expandData.edges)) {
      console.error('❌ edges is not an array');
    } else {
      console.log(`✅ edges is an array with ${expandData.edges.length} items`);
      
      // Check a sample edge
      if (expandData.edges.length > 0) {
        console.log('Sample edge in expansion:', expandData.edges[0]);
      }
    }
  } catch (error) {
    console.error('❌ expand-node test failed:', error.message);
  }
}

// Run the validation
validateApis().catch(console.error);
