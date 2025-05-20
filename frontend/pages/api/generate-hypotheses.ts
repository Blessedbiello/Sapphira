import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await axios.post('http://localhost:3001/api/generate-hypotheses', req.body);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error proxying generate-hypotheses:', error);
    res.status(500).json({ error: 'Failed to generate hypotheses' });
  }
}