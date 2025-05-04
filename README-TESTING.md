# Testing Guide for Workout Tracker App

## Getting Started with Testing

This project uses Jest and React Testing Library for testing React components, hooks, and utility functions. The setup is compatible with React 19 and properly handles ECMAScript modules. Here's how to run tests:

```bash
# Run all tests
npm test

# Run a specific test file
npm test -- path/to/test.js

# Run tests with coverage report
npm test -- --coverage
```

After running the coverage command, a detailed report will be generated in the `/coverage` directory.

## Testing Structure

Tests are organized alongside the code they test:

- Component tests: `src/components/ComponentName.test.jsx`
- Hook tests: `src/hooks/useHookName.test.js`
- Utility tests: `src/utils/utilityName.test.js`

## Test Configuration

### Key Configuration Files

- `jest.config.cjs` - Main Jest configuration
- `babel.config.cjs` - Babel configuration for transpiling JSX and modern JavaScript
- `setupTests.js` - Global test setup including mocks for external dependencies

### ESM Compatibility

This project uses ECMAScript modules. The Jest configuration includes:

```js
// jest.config.cjs
module.exports = {
  // ...
  extensionsToTreatAsEsm: ['.jsx'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  // ...
};
```

## Writing Tests

### Testing Components

For components, focus on testing user-visible behavior rather than implementation details:

```jsx
import { render, screen } from '@testing-library/react';
import Component from './Component';

test('displays the correct content', () => {
  render(<Component />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### Testing UI Components with Chakra UI

When testing components that use Chakra UI, use the mocks provided in `setupTests.js`:

```jsx
// Example test for a component using Chakra UI Skeleton
test('renders loading state correctly', () => {
  render(<MyComponent isLoading={true} />);
  
  // The Skeleton component is mocked to show "Loading..." with data-testid="skeleton-loading"
  expect(screen.getAllByTestId('skeleton-loading')).toHaveLength(2);
});
```

### Testing Hooks

For hooks, use the `renderHook` function from React Testing Library:

```jsx
import { renderHook, act } from '@testing-library/react';
import useCustomHook from './useCustomHook';

test('returns the expected value', () => {
  const { result } = renderHook(() => useCustomHook());
  expect(result.current.value).toBe(expectedValue);
});

test('updates value correctly', async () => {
  const { result } = renderHook(() => useCustomHook());
  
  await act(async () => {
    await result.current.updateValue('new value');
  });
  
  expect(result.current.value).toBe('new value');
});
```

### Testing Date-Dependent Code

When testing code that depends on dates, use fixed date strings with UTC timezone to avoid timezone issues:

```jsx
// Use explicit UTC dates in tests
const mockDate = new Date('2023-06-01T12:00:00Z');
```

## Mocking Dependencies

### Chakra UI Components

Chakra UI components are mocked globally in `setupTests.js`. The mocks include:

```jsx
// In setupTests.js
jest.mock('@chakra-ui/react', () => {
  const originalModule = jest.requireActual('@chakra-ui/react');
  
  return {
    ...originalModule,
    // Mock for Skeleton
    Skeleton: ({ isLoaded, children }) => {
      if (!isLoaded) {
        return <div data-testid="skeleton-loading">Loading...</div>;
      }
      return children;
    },
    // Mock for useBreakpointValue
    useBreakpointValue: (values) => {
      return values.base || Object.values(values)[0];
    }
  };
});
```

### Firebase

Firebase is mocked globally in `setupTests.js`. For specific tests, you may need to add mock implementations:

```jsx
import { doc, getDoc } from 'firebase/firestore';

// The functions are already mocked in setupTests.js
// Provide implementation in your test
doc.mockReturnValue('mockDocRef');
getDoc.mockResolvedValue({
  exists: () => true,
  data: () => ({ /* mock data */ })
});
```

## Troubleshooting Common Issues

### JSX/ESM Issues

If you see errors related to JSX or ESM handling:

1. Ensure your test files use the `.jsx` extension for components
2. Check that `babel.config.cjs` includes the React preset with development mode
3. Verify that `jest.config.cjs` includes the correct transform settings

### Timezone Issues in Date Tests

If tests with dates are failing inconsistently:

1. Use explicit UTC dates with the 'Z' suffix (e.g., `2023-06-01T12:00:00Z`)
2. Use `expect.any(Date)` when comparing date objects if exact matching isn't required
3. For Firestore, mock the `serverTimestamp` function

### React Warnings About Missing Act()

If you see warnings about updates not wrapped in act(), they are suppressed automatically in `setupTests.js`. If you need to examine these warnings, comment out the suppression in `setupTests.js`.

## Continuous Integration

Tests run automatically on GitHub Actions for:
- All pull requests to the main branch
- All pushes to the main branch

The workflow is defined in `.github/workflows/test.yml`.

## Adding New Tests

When implementing a new feature, follow this process:

1. Write tests that define the expected behavior
2. Implement the feature to make the tests pass
3. Refactor code while keeping tests passing

This "Test-Driven Development" approach helps ensure your code works as expected and stays maintainable. 