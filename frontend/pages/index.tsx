import { useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import ComplexitySlider from '../components/ComplexitySlider';
import HypothesisList from '../components/HypothesisList';
import PercolationPlot from '../components/PercolationPlot';

export default function Home() {
  const [complexity, setComplexity] = useState<number>(2);
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h2" align="center" gutterBottom>
        Saphira: Hypothesis Generator
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <ComplexitySlider complexity={complexity} setComplexity={setComplexity} />
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <HypothesisList complexity={complexity} />
      </Box>
      
      <Box>
        <PercolationPlot />
      </Box>
    </Container>
  );
}