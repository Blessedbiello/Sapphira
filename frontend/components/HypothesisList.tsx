import { useState, useEffect } from 'react';
import { List, ListItem, ListItemText, Typography, Box, CircularProgress } from '@mui/material';
import axios from 'axios';

interface Hypothesis {
  id: number;
  text: string;
  complexity: number;
  isSupported: boolean;
}

interface HypothesisListProps {
  complexity: number;
}

export default function HypothesisList({ complexity }: HypothesisListProps) {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHypotheses = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post('/api/generate-hypotheses', { complexity });
        setHypotheses(response.data);
      } catch (err) {
        setError('Failed to fetch hypotheses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHypotheses();
  }, [complexity]);

  if (loading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Generated Hypotheses (Complexity: {complexity})
      </Typography>
      <List>
        {hypotheses.map((hypothesis) => (
          <ListItem key={hypothesis.id}>
            <ListItemText
              primary={hypothesis.text}
              secondary={`Supported: ${hypothesis.isSupported ? 'Yes' : 'No'}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}