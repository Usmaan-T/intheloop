import { extendTheme } from '@chakra-ui/react';

// Enhanced color palette with more depth and vibrancy
const colors = {
  brand: {
    50: '#ffe5e5',
    100: '#fbbaba',
    200: '#f58f8f',
    300: '#f16363',
    400: '#ec3838',
    500: '#d62222', // Primary brand color
    600: '#b81818',
    700: '#8e1010',
    800: '#650a0a',
    900: '#3c0303',
  },
  darkBg: {
    900: '#0A0A0E', // Darkest bg
    800: '#121218', // Main bg
    700: '#1A1A24', // Card bg
    600: '#252532', // Slightly lighter card bg
    500: '#2F2F3D', // Hover states
  },
  accent: {
    purple: {
      500: '#8B5CF6',
      600: '#7C3AED',
    },
    pink: {
      500: '#EC4899',
      600: '#DB2777',
    },
    blue: {
      500: '#3B82F6',
      600: '#2563EB',
    },
  },
};

// More sophisticated typography
const typography = {
  fonts: {
    heading: "'Space Grotesk', sans-serif",
    body: "'Inter', sans-serif",
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fontSizes: {
    '2xs': '0.625rem',
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
};

// Enhanced component styles
const components = {
  Heading: {
    baseStyle: {
      fontWeight: 'bold',
      letterSpacing: 'tight',
    },
  },
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'md',
      _focus: {
        boxShadow: 'outline',
      },
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
          transform: 'translateY(-2px)',
          boxShadow: 'lg',
        },
        transition: 'all 0.2s ease-in-out',
      },
      outline: {
        borderColor: 'brand.500',
        color: 'brand.500',
        _hover: {
          bg: 'rgba(214, 34, 34, 0.1)',
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.2s ease-in-out',
      },
      ghost: {
        _hover: {
          bg: 'whiteAlpha.200',
          transform: 'translateY(-1px)',
        },
        transition: 'all 0.2s ease-in-out',
      },
    },
  },
  Card: {
    baseStyle: {
      bg: 'darkBg.700',
      borderRadius: 'xl',
      overflow: 'hidden',
      borderColor: 'whiteAlpha.200',
      transition: 'all 0.3s ease',
      _hover: {
        transform: 'translateY(-4px)',
        boxShadow: 'xl',
      },
    },
  },
  Input: {
    variants: {
      filled: {
        field: {
          bg: 'whiteAlpha.200',
          _hover: { bg: 'whiteAlpha.300' },
          _focus: { bg: 'whiteAlpha.300', borderColor: 'brand.500' },
          borderRadius: 'md',
        },
      },
      outline: {
        field: {
          borderColor: 'whiteAlpha.300',
          _focus: { borderColor: 'brand.500' },
          _hover: { borderColor: 'whiteAlpha.400' },
          borderRadius: 'md',
        },
      },
    },
  },
  Link: {
    baseStyle: {
      _hover: {
        textDecoration: 'none',
      },
      transition: 'all 0.2s',
    },
  },
};

// Global styles
const styles = {
  global: {
    body: {
      bg: 'darkBg.800',
      color: 'white',
    },
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: 'darkBg.800',
    },
    '::-webkit-scrollbar-thumb': {
      bg: 'whiteAlpha.300',
      borderRadius: 'full',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: 'whiteAlpha.400',
    },
  },
};

// Combine all theme customizations
const theme = extendTheme({
  colors,
  ...typography,
  components,
  styles,
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
});

export default theme;

// Add to index.html:
// <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
