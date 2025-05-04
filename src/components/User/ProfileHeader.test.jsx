import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileHeader from './ProfileHeader';
import useUserPopularity from '../../hooks/useUserPopularity';

// Mock the hooks
jest.mock('../../hooks/useUserPopularity', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('ProfileHeader Component', () => {
  const mockUser = {
    id: 'user123',
    username: 'TestUser',
    photoURL: 'http://example.com/photo.jpg',
    bio: 'This is a test bio'
  };
  
  const mockStats = {
    samples: 10,
    playlists: 5,
    followers: 20
  };
  
  const mockPopularityScore = {
    weekly: 75,
    allTime: 150
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    useUserPopularity.mockReturnValue({ popularityScore: mockPopularityScore });
  });
  
  test('renders user information correctly', () => {
    render(
      <ProfileHeader 
        user={mockUser}
        stats={mockStats}
        showFollowButton={false}
      />
    );
    
    // Check basic user info
    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByText('This is a test bio')).toBeInTheDocument();
    
    // Check stats display
    expect(screen.getByText('10')).toBeInTheDocument(); // Samples
    expect(screen.getByText('5')).toBeInTheDocument(); // Playlists
    expect(screen.getByText('20')).toBeInTheDocument(); // Followers
    expect(screen.getByText('150')).toBeInTheDocument(); // All-time popularity
    
    // Check heat badge
    expect(screen.getByText(/Heat: 75/)).toBeInTheDocument();
  });
  
  test('renders edit button when showFollowButton is false and currentUser exists', () => {
    render(
      <ProfileHeader 
        user={mockUser}
        stats={mockStats}
        showFollowButton={false}
        currentUser={{ uid: 'user123' }}
        onEditClick={jest.fn()}
      />
    );
    
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });
  
  test('passes correct props to popularity hook', () => {
    render(
      <ProfileHeader 
        user={mockUser}
        stats={mockStats}
      />
    );
    
    expect(useUserPopularity).toHaveBeenCalledWith(mockUser.id);
  });
  
  test('uses provided popularityScore instead of hook if available', () => {
    const customPopularityScore = {
      weekly: 100,
      allTime: 500
    };
    
    render(
      <ProfileHeader 
        user={mockUser}
        stats={mockStats}
        popularityScore={customPopularityScore}
      />
    );
    
    // Should use the provided score, not the one from the hook
    expect(screen.getByText(/Heat: 100/)).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });
  
  test('handles empty or missing data gracefully', () => {
    const emptyUser = {
      id: 'user456'
    };
    
    render(
      <ProfileHeader 
        user={emptyUser}
        popularityScore={{ weekly: 0, allTime: 0 }}
      />
    );
    
    // Should display defaults for missing data
    expect(screen.getByText(/Heat: 0/)).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument(); // Default fallback for username
    expect(screen.getAllByText('0')[0]).toBeInTheDocument(); // Stats showing 0
  });
}); 