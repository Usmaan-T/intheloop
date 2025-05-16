// Add TextEncoder and TextDecoder polyfills
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add Jest extended matchers
import '@testing-library/jest-dom';

// Mock Chakra UI components
jest.mock('@chakra-ui/react', () => {
  const originalModule = jest.requireActual('@chakra-ui/react');
  
  // Return a mock for Skeleton component
  return {
    ...originalModule,
    Skeleton: ({ isLoaded, children }) => {
      if (!isLoaded) {
        return <div data-testid="skeleton-loading">Loading...</div>;
      }
      return children;
    },
    // Add mock for useBreakpointValue
    useBreakpointValue: (values) => {
      // Return the "base" value or the first value 
      return values.base || Object.values(values)[0];
    }
  };
});

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getFirestore: jest.fn(),
  updateDoc: jest.fn().mockResolvedValue(true),
  serverTimestamp: jest.fn().mockReturnValue(new Date())
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn()
}));

// Suppress specific console error messages
const originalConsoleError = console.error;
console.error = function(...args) {
  // Suppress "Warning: An update to X inside a test was not wrapped in act(...)"
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Warning: An update to') && args[0].includes('inside a test was not wrapped in act')) {
    return;
  }
  // Suppress "Warning: Can't perform a React state update on an unmounted component"
  if (args[0] && typeof args[0] === 'string' && args[0].includes("Warning: Can't perform a React state update on an unmounted component")) {
    return;
  }
  originalConsoleError(...args);
}; 