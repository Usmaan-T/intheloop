import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SampleRow from './index';
import SampleRowMain from '../SampleRow';

// Mock the main SampleRow component that's being re-exported
jest.mock('../SampleRow', () => {
  return {
    __esModule: true,
    default: jest.fn(() => <div data-testid="mock-sample-row">Mocked SampleRow</div>)
  };
});

describe('SampleRow Index Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the main SampleRow component', () => {
    render(<SampleRow track={{ name: 'Test Track' }} />);
    
    // Verify the mocked component is rendered
    expect(screen.getByTestId('mock-sample-row')).toBeInTheDocument();
    expect(screen.getByText('Mocked SampleRow')).toBeInTheDocument();
    
    // Verify SampleRowMain was called
    expect(SampleRowMain).toHaveBeenCalled();
  });

  it('should forward all props to the main component', () => {
    const testProps = {
      track: { id: '123', name: 'Test Track' },
      onDelete: jest.fn()
    };
    
    render(<SampleRow {...testProps} />);
    
    // Check that props are passed correctly to the main component
    expect(SampleRowMain).toHaveBeenCalled();
    
    // Get the props that were passed to SampleRowMain
    const passedProps = SampleRowMain.mock.calls[0][0];
    
    // Verify the props were forwarded correctly
    expect(passedProps).toHaveProperty('track');
    expect(passedProps.track).toEqual(testProps.track);
    expect(passedProps).toHaveProperty('onDelete');
    expect(typeof passedProps.onDelete).toBe('function');
  });

  it('should handle when no props are provided', () => {
    render(<SampleRow />);
    
    // Should still render without crashing
    expect(screen.getByTestId('mock-sample-row')).toBeInTheDocument();
    expect(SampleRowMain).toHaveBeenCalled();
  });
}); 