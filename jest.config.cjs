/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.js'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/theme.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  moduleFileExtensions: [
    'js',
    'jsx'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@testing-library|swiper|ssr-window|dom7)/)'
  ],
  // Support JSX in test files
  extensionsToTreatAsEsm: ['.jsx']
};

module.exports = config; 