import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: "'Space Grotesk', sans-serif", // Or your chosen heading font
    body: "'Inter', sans-serif", // Or your chosen body font
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  components: {
    Heading: {
      baseStyle: {
        fontWeight: 'bold',
        letterSpacing: '-0.02em',
      },
    },
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
      },
    },
  },
});

export default theme;

// Add to index.html:
// <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
