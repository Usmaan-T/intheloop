import { renderHook, act } from '@testing-library/react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import useUserData from './useUserData';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('../firebase/firebase', () => ({
  firestore: {}
}));

describe('useUserData Hook', () => {
  const mockUserId = 'user123';
  const mockUserData = {
    username: 'testuser',
    email: 'test@example.com',
    photoURL: 'https://example.com/photo.jpg',
    bio: 'Test user bio'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns loading state initially', () => {
    const { result } = renderHook(() => useUserData(mockUserId));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.userData).toBe(null);
    expect(result.current.error).toBe(null);
  });

  test('fetches user data successfully', async () => {
    // Mock the Firestore response
    doc.mockReturnValue('user-doc-ref');
    getDoc.mockResolvedValue({
      id: mockUserId,
      exists: () => true,
      data: () => mockUserData
    });

    const { result } = renderHook(() => useUserData(mockUserId));
    
    // Initial state
    expect(result.current.loading).toBe(true);
    
    // Wait for the async effect to complete
    await act(() => Promise.resolve());
    
    // Check final state
    expect(result.current.loading).toBe(false);
    expect(result.current.userData).toEqual({
      id: mockUserId,
      ...mockUserData
    });
    expect(result.current.error).toBe(null);
    
    // Verify Firestore was called correctly
    expect(doc).toHaveBeenCalledWith(firestore, 'users', mockUserId);
    expect(getDoc).toHaveBeenCalledWith('user-doc-ref');
  });

  test('handles user not found', async () => {
    // Mock user not found
    doc.mockReturnValue('user-doc-ref');
    getDoc.mockResolvedValue({
      exists: () => false
    });

    const { result } = renderHook(() => useUserData(mockUserId));
    
    // Wait for the async effect to complete
    await act(() => Promise.resolve());
    
    // Check error state
    expect(result.current.loading).toBe(false);
    expect(result.current.userData).toBe(null);
    expect(result.current.error).toBe('User not found');
  });

  test('handles error during fetch', async () => {
    // Mock Firestore error
    doc.mockReturnValue('user-doc-ref');
    getDoc.mockRejectedValue(new Error('Network error'));
    
    // Mock console.error to prevent test output noise
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useUserData(mockUserId));
    
    // Wait for the async effect to complete
    await act(() => Promise.resolve());
    
    // Check error state
    expect(result.current.loading).toBe(false);
    expect(result.current.userData).toBe(null);
    expect(result.current.error).toBe('Network error');
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  test('handles null or undefined userId', async () => {
    const { result } = renderHook(() => useUserData(null));
    
    // Wait for the async effect to complete
    await act(() => Promise.resolve());
    
    // Should not load or cause error when userId is null
    expect(result.current.loading).toBe(false);
    expect(result.current.userData).toBe(null);
    expect(result.current.error).toBe(null);
    
    // Verify Firestore was not called
    expect(doc).not.toHaveBeenCalled();
    expect(getDoc).not.toHaveBeenCalled();
  });
}); 