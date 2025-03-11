import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  // Enhanced color palette
  colors: {
    brand: {
      primary: {
        50: '#f0e4ff',
        100: '#d1beff',
        200: '#b197ff',
        300: '#9070ff',
        400: '#7149ff',
        500: '#5222ff', // Primary purple
        600: '#3e0ae0',
        700: '#2b0bb0',
        800: '#1b0980',
        900: '#0e0751',
      },
      accent: {
        50: '#ffe9f5',
        100: '#ffc1e0',
        200: '#ff99cd',
        300: '#ff71b9',
        400: '#ff48a6',
        500: '#ff1f93', // Secondary pink
        600: '#db0d73',
        700: '#b70b55',
        800: '#920a39',
        900: '#6e091e',
      },
    },
    gray: {
      900: '#0d0e15', // Darker background
      800: '#131523',
      700: '#1e2136',
      // ...other grays
    }
  },
  
  // Immersive dark mode
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white',
        fontFeatureSettings: `'ss01' on, 'ss02' on, 'cv01' on`, // Typography enhancements
      },
      '*::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '*::-webkit-scrollbar-track': {
        bg: 'rgba(0, 0, 0, 0.1)',
      },
      '*::-webkit-scrollbar-thumb': {
        bg: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
      },
      '*::-webkit-scrollbar-thumb:hover': {
        bg: 'rgba(255, 255, 255, 0.25)',
      },
    },
  },
  
  // Custom component styles
  components: {
    Button: {
      variants: {
        solid: {
          bg: 'brand.primary.500',
          color: 'white',
          _hover: { bg: 'brand.primary.600', transform: 'translateY(-2px)', boxShadow: 'lg' },
          _active: { bg: 'brand.primary.700', transform: 'translateY(0)' },
          transition: 'all 0.2s',
        },
        // Glass effect button
        glass: {
          bg: 'rgba(255, 255, 255, 0.08)',
          color: 'white',
          backdropFilter: 'blur(10px)',
          _hover: { bg: 'rgba(255, 255, 255, 0.15)', transform: 'translateY(-2px)' },
          _active: { bg: 'rgba(255, 255, 255, 0.05)' },
        },
      },
    },
    // Other components...
  },
  
  // Global border radius
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '20px',
  },
  
  // Typography
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  },
});

export default theme;
