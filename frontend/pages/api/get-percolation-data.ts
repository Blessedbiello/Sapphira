import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await axios.get('http://localhost:3001/api/get-percolation-data');
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error proxying get-percolation-data:', error);
    res.status(500).json({ error: 'Failed to retrieve percolation data' });
  }
}