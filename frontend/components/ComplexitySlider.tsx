import { Slider, Box, Typography } from '@mui/material';
import { useState } from 'react';

interface ComplexitySliderProps {
  complexity: number;
  setComplexity: (value: number) => void;
}

export default function ComplexitySlider({ complexity, setComplexity }: ComplexitySliderProps) {
  const [value, setValue] = useState<number>(complexity);

  const handleChange = (event: Event, newValue: number | number[]) => {
    const newComplexity = Array.isArray(newValue) ? newValue[0] : newValue;
    setValue(newComplexity);
    setComplexity(newComplexity);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Hypothesis Complexity Level: {value}
      </Typography>
      <Slider
        value={value}
        onChange={handleChange}
        aria-labelledby="complexity-slider"
        step={1}
        marks
        min={2}
        max={5}
        valueLabelDisplay="auto"
      />
    </Box>
  );
}