import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArtistInfo from './ArtistInfo';
import { useDocument } from 'react-firebase-hooks/firestore';

// Mock the Firebase hooks
jest.mock('react-firebase-hooks/firestore', () => ({
  useDocument: jest.fn()
}));

// Mock Firebase firestore
jest.mock('../../../firebase/firebase', () => ({
  firestore: {}
}));

// Mock the doc function
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => 'mocked-doc-ref')
}));

describe('ArtistInfo Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render "Unknown Artist" when no user data is available', () => {
    // Mock useDocument to return null for user document
    useDocument.mockReturnValue([null, false, null]);
    
    render(<ArtistInfo userId="test-user-id" />);
    expect(screen.getByText('by Unknown Artist')).toBeInTheDocument();
  });

  it('should display the username when user data is available', () => {
    // Mock user document data with a username
    const mockUserDoc = {
      data: () => ({
        username: 'TestUser123'
      })
    };
    
    useDocument.mockReturnValue([mockUserDoc, false, null]);
    
    render(<ArtistInfo userId="test-user-id" />);
    expect(screen.getByText('by TestUser123')).toBeInTheDocument();
  });

  it('should display "Loading..." when user data is loading', () => {
    // Mock loading state
    useDocument.mockReturnValue([null, true, null]);
    
    render(<ArtistInfo userId="test-user-id" />);
    expect(screen.getByText('by Loading...')).toBeInTheDocument();
  });

  it('should display error message when there is an error loading user data', () => {
    // Mock error state
    useDocument.mockReturnValue([null, false, new Error('Failed to load user data')]);
    
    render(<ArtistInfo userId="test-user-id" />);
    expect(screen.getByText('by Error loading user')).toBeInTheDocument();
  });

  it('should use "Unknown Artist" when user document exists but has no username', () => {
    // Mock user document data without a username
    const mockUserDoc = {
      data: () => ({
        // No username property
        displayName: 'Display Name', // Some other property
        email: 'test@example.com'
      })
    };
    
    useDocument.mockReturnValue([mockUserDoc, false, null]);
    
    render(<ArtistInfo userId="test-user-id" />);
    expect(screen.getByText('by Unknown Artist')).toBeInTheDocument();
  });
}); 