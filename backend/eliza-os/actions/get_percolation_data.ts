import { getPercolationData as dbGetPercolationData } from '../../lib/database.js';

interface PercolationData {
  complexity: number;
  supportRate: number;
}

/**
 * Retrieve percolation data (support rate per complexity level)
 */
export async function getPercolationData(): Promise<PercolationData[]> {
  try {
    const data = dbGetPercolationData();
    return data;
  } catch (error) {
    console.error('Error in getPercolationData:', error);
    throw new Error('Failed to retrieve percolation data');
  }
}