import { renderHook, act } from '@testing-library/react';
import * as reactModule from 'react';
import * as userPopularityModule from '../useUserPopularity';

// Mock Firebase functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn()
}));

jest.mock('../../firebase/firebase', () => ({
  firestore: {}
}));

// Import the module (after mocking dependencies)
import useUserPopularity from '../useUserPopularity';

describe('useUserPopularity', () => {
  const userId = 'test-user-123';
  const mockPopularityScore = {
    daily: 51,
    weekly: 0,
    monthly: 0,
    allTime: 100
  };

  // Create spies for React useState
  let mockSetPopularityScore;
  let mockSetLoading;
  let mockSetError;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useState to control state updates
    const mockUseState = jest.spyOn(reactModule, 'useState');
    
    // Mock useState for popularityScore
    mockSetPopularityScore = jest.fn();
    mockUseState.mockImplementationOnce((initialState) => [
      initialState, 
      mockSetPopularityScore
    ]);
    
    // Mock useState for loading
    mockSetLoading = jest.fn();
    mockUseState.mockImplementationOnce((initialState) => [
      initialState,
      mockSetLoading
    ]);
    
    // Mock useState for error
    mockSetError = jest.fn();
    mockUseState.mockImplementationOnce((initialState) => [
      initialState,
      mockSetError
    ]);

    // Mock the implementation of calculateUserPopularity
    jest.spyOn(userPopularityModule, 'calculateUserPopularity').mockImplementation(() => 
      Promise.resolve({
        success: true,
        popularityScore: mockPopularityScore
      })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useUserPopularity(null));
    
    expect(result.current.popularityScore).toEqual({
      daily: 0,
      weekly: 0,
      monthly: 0,
      allTime: 0
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('should update state on successful fetch', async () => {
    // Render the hook
    const { result, rerender } = renderHook(() => useUserPopularity(userId));
    
    // Initial value should have loading true
    expect(result.current.loading).toBe(false);
    
    // Wait for mock setTimeout to call the callback
    await new Promise(resolve => process.nextTick(resolve));
    
    // Loading should be set to true at start
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    
    // After successful response, loading should be set to false and data should be updated
    expect(mockSetPopularityScore).toHaveBeenCalledWith(mockPopularityScore);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
    
    // Error should not be set
    expect(mockSetError).not.toHaveBeenCalled();
  });
  
  test('should handle errors during fetch', async () => {
    const errorMessage = 'Failed to fetch posts';
    
    // Mock updatePopularityScore to throw an error
    jest.spyOn(userPopularityModule, 'calculateUserPopularity').mockImplementationOnce(() => 
      Promise.reject(new Error(errorMessage))
    );
    
    // Render the hook
    renderHook(() => useUserPopularity(userId));
    
    // Wait for mock setTimeout to call the callback
    await new Promise(resolve => process.nextTick(resolve));
    
    // Loading should be set to true at start
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    
    // After error, loading should be set to false and error should be set
    expect(mockSetError).toHaveBeenCalledWith(errorMessage);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
    
    // Data should not be updated
    expect(mockSetPopularityScore).not.toHaveBeenCalled();
  });
  
  test('should update popularity score when calling updatePopularityScore', async () => {
    // Render the hook
    const { result } = renderHook(() => useUserPopularity(userId));
    
    // Reset mocks to check for new calls
    mockSetPopularityScore.mockClear();
    mockSetLoading.mockClear();
    mockSetError.mockClear();
    
    // Reset the mock implementation for this specific test
    jest.spyOn(userPopularityModule, 'calculateUserPopularity').mockClear();
    jest.spyOn(userPopularityModule, 'calculateUserPopularity').mockImplementationOnce(() => 
      Promise.resolve({ 
        success: true, 
        popularityScore: mockPopularityScore 
      })
    );
    
    // Call updatePopularityScore
    await act(async () => {
      await result.current.updatePopularityScore();
    });
    
    // Loading state should be updated
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    
    // After successful response, loading should be set to false and data should be updated
    expect(mockSetPopularityScore).toHaveBeenCalledWith(mockPopularityScore);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });
  
  test('calculateUserPopularity should return error with no userId', async () => {
    // Temporarily restore the original implementation
    jest.spyOn(userPopularityModule, 'calculateUserPopularity').mockRestore();
    
    // Call it directly
    const result = await userPopularityModule.calculateUserPopularity(null);
    
    expect(result).toEqual({
      success: false,
      error: 'No user ID provided'
    });
    
    // Re-mock for subsequent tests
    jest.spyOn(userPopularityModule, 'calculateUserPopularity').mockImplementation(() => 
      Promise.resolve({
        success: true,
        popularityScore: mockPopularityScore
      })
    );
  });
}); 