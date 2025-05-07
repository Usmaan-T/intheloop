import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StreakDisplay from './StreakDisplay';
import * as streakUtils from '../../utils/streakUtils';

// Mock the streakUtils functions
jest.mock('../../utils/streakUtils', () => ({
  isStreakAtRisk: jest.fn(),
  getStreakMessage: jest.fn()
}));

describe('StreakDisplay Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementations
    streakUtils.isStreakAtRisk.mockReturnValue(false);
    streakUtils.getStreakMessage.mockReturnValue('Keep it up!');
  });

  test('renders loading state correctly', () => {
    render(<StreakDisplay streakData={{}} isLoading={true} />);
    
    // Check that skeletons are rendered when loading
    expect(screen.getAllByTestId('skeleton-loading')).toHaveLength(3);
  });

  test('displays streak data correctly', () => {
    const mockStreakData = {
      currentStreak: 5,
      longestStreak: 10,
      lastUploadDate: new Date('2023-06-01')
    };
    
    render(<StreakDisplay streakData={mockStreakData} isLoading={false} />);
    
    // Check that streak values are displayed
    expect(screen.getByText(/^5\s+days$/)).toBeInTheDocument();
    expect(screen.getByText(/^10\s+days$/)).toBeInTheDocument();
    expect(screen.getByText('Jun 1, 2023')).toBeInTheDocument();
    
    // Verify utility functions were called with correct parameters
    expect(streakUtils.isStreakAtRisk).toHaveBeenCalledWith(mockStreakData.lastUploadDate);
    expect(streakUtils.getStreakMessage).toHaveBeenCalledWith(5);
  });

  test('shows warning when streak is at risk', () => {
    streakUtils.isStreakAtRisk.mockReturnValue(true);
    
    const mockStreakData = {
      currentStreak: 3,
      longestStreak: 7,
      lastUploadDate: new Date('2023-06-01')
    };
    
    render(<StreakDisplay streakData={mockStreakData} isLoading={false} />);
    
    // Check that warning badge is shown
    expect(screen.getByText('Upload today to keep your streak!')).toBeInTheDocument();
    
    // Check that the message box has the warning color
    const messageBox = screen.getByText('Keep it up!').parentElement;
    expect(messageBox).toHaveStyle('border-color: var(--chakra-colors-orange-400)');
  });

  test('handles empty streak data gracefully', () => {
    render(<StreakDisplay streakData={null} isLoading={false} />);
    
    // Check that default values are shown - use getAllByText for multiple matches
    const dayElements = screen.getAllByText(/^0\s+days$/);
    expect(dayElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Never')).toBeInTheDocument();
  });
}); 