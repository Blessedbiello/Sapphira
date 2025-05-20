import express from 'express';
import cors from 'cors';
import { initDatabase } from './lib/database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { generateHypotheses } from './eliza-os/actions/generate_hypotheses.js';
import { getPercolationData } from './eliza-os/actions/get_percolation_data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const db = initDatabase();

// Load sample abstracts data
const loadSampleData = () => {
  try {
    const dataPath = path.join(__dirname, '../data/abstracts.json');
    const abstracts = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Loaded ${abstracts.length} sample abstracts`);
    return abstracts;
  } catch (error) {
    console.error('Error loading sample data:', error);
    return [];
  }
};

// API endpoints
app.post('/api/generate-hypotheses', async (req, res) => {
  try {
    const { complexity } = req.body;
    if (!complexity || complexity < 2 || complexity > 5) {
      return res.status(400).json({ error: 'Invalid complexity. Must be between 2 and 5.' });
    }
    
    const hypotheses = await generateHypotheses(complexity);
    res.json(hypotheses);
  } catch (error) {
    console.error('Error generating hypotheses:', error);
    res.status(500).json({ error: 'Failed to generate hypotheses' });
  }
});

app.get('/api/get-percolation-data', async (req, res) => {
  try {
    const percolationData = await getPercolationData();
    res.json(percolationData);
  } catch (error) {
    console.error('Error retrieving percolation data:', error);
    res.status(500).json({ error: 'Failed to retrieve percolation data' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize with sample data
  const abstracts = loadSampleData();
  console.log('Saphira backend is ready');
});

export default app;