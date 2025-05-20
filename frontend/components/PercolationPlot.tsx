import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { Typography, Box, CircularProgress } from '@mui/material';

interface PercolationData {
  complexity: number;
  supportRate: number;
}

export default function PercolationPlot() {
  const [data, setData] = useState<PercolationData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPercolationData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('/api/get-percolation-data');
        setData(response.data);
      } catch (err) {
        setError('Failed to fetch percolation data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPercolationData();
  }, []);

  if (loading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Complexity vs. Support Percolation Plot
      </Typography>
      <Plot
        data={[
          {
            x: data.map((d) => d.complexity),
            y: data.map((d) => d.supportRate),
            type: 'scatter',
            mode: 'lines+markers',
            marker: { color: 'blue' },
            name: 'Support Rate'
          }
        ]}
        layout={{
          width: 800,
          height: 400,
          title: 'Hypothesis Support vs. Complexity',
          xaxis: { title: 'Complexity Level' },
          yaxis: { title: 'Support Rate (%)' }
        }}
      />
    </Box>
  );
}