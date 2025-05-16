import { renderHook, act } from '@testing-library/react';
import { useSignOut } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../useLogout';

// Mock dependencies
jest.mock('react-firebase-hooks/auth', () => ({
  useSignOut: jest.fn()
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock console.log
console.log = jest.fn();

describe('useLogout', () => {
  // Mock functions
  const mockSignOut = jest.fn();
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    useSignOut.mockReturnValue([mockSignOut, false, null]);
    useNavigate.mockReturnValue(mockNavigate);
  });
  
  it('should initialize with correct values', () => {
    // Render the hook
    const { result } = renderHook(() => useLogout());
    
    // Verify initial values
    expect(typeof result.current.handleLogout).toBe('function');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
  
  it('should sign out and navigate to auth page on successful logout', async () => {
    // Render the hook
    const { result } = renderHook(() => useLogout());
    
    // Mock successful signOut
    mockSignOut.mockResolvedValueOnce(true);
    
    // Call handleLogout
    await act(async () => {
      await result.current.handleLogout();
    });
    
    // Verify logout flow
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user-info');
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });
  
  it('should handle logout errors', async () => {
    // Render the hook
    const { result } = renderHook(() => useLogout());
    
    // Mock signOut failure
    const mockError = new Error('Logout failed');
    mockSignOut.mockRejectedValueOnce(mockError);
    
    // Call handleLogout
    await act(async () => {
      await result.current.handleLogout();
    });
    
    // Verify error handling
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(mockError.message);
    
    // Should not navigate or remove localStorage on error
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  
  it('should expose loading and error states', () => {
    // Mock loading state
    useSignOut.mockReturnValueOnce([mockSignOut, true, null]);
    
    // Render hook with loading state
    const { result: loadingResult } = renderHook(() => useLogout());
    expect(loadingResult.current.loading).toBe(true);
    
    // Mock error state
    const mockError = new Error('Auth error');
    useSignOut.mockReturnValueOnce([mockSignOut, false, mockError]);
    
    // Render hook with error state
    const { result: errorResult } = renderHook(() => useLogout());
    expect(errorResult.current.error).toBe(mockError);
  });
  
  it('should update loading and error states from useSignOut', () => {
    // Start with initial state
    const mockSignOutUpdated = jest.fn();
    
    // Create a sequence of states to simulate changing values
    useSignOut
      .mockReturnValueOnce([mockSignOutUpdated, false, null]) // Initial
      .mockReturnValueOnce([mockSignOutUpdated, true, null])  // Loading
      .mockReturnValueOnce([mockSignOutUpdated, false, new Error('Error')]); // Error
    
    // Render the hook
    const { result, rerender } = renderHook(() => useLogout());
    
    // Initial state
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    
    // Trigger loading state
    rerender();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    
    // Trigger error state
    rerender();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(new Error('Error'));
  });
}); 