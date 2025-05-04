import { renderHook, act } from '@testing-library/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import useTrackSampleView from './useTrackSampleView';
import trackSampleInteraction from './useTrackSampleInteraction';

// Mock dependencies
jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: jest.fn()
}));

jest.mock('../firebase/firebase', () => ({
  auth: {}
}));

jest.mock('./useTrackSampleInteraction', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('useTrackSampleView Hook', () => {
  const mockSampleId = 'sample123';
  const mockUser = { uid: 'user123' };
  
  // Mock localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      clear: jest.fn(() => {
        store = {};
      })
    };
  })();
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    useAuthState.mockReturnValue([null, false]);
  });
  
  test('does not track view when sampleId is null', async () => {
    const { result } = renderHook(() => useTrackSampleView(null));
    
    await act(async () => {
      await Promise.resolve();
    });
    
    expect(result.current.hasTrackedView).toBe(false);
    expect(trackSampleInteraction).not.toHaveBeenCalled();
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });
  
  test('tracks view for anonymous user', async () => {
    useAuthState.mockReturnValue([null, false]);
    
    const { result } = renderHook(() => useTrackSampleView(mockSampleId));
    
    await act(async () => {
      // Wait for the effect to run
      await Promise.resolve();
    });
    
    // Verify interaction was tracked
    expect(trackSampleInteraction).toHaveBeenCalledWith(
      mockSampleId,
      'view',
      null,
      false
    );
    
    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      `view_${mockSampleId}_anonymous`,
      'true'
    );
    
    // Verify hasTrackedView is true
    expect(result.current.hasTrackedView).toBe(true);
  });
  
  test('tracks view for authenticated user', async () => {
    useAuthState.mockReturnValue([mockUser, false]);
    
    const { result } = renderHook(() => useTrackSampleView(mockSampleId));
    
    await act(async () => {
      // Wait for the effect to run
      await Promise.resolve();
    });
    
    // Verify interaction was tracked
    expect(trackSampleInteraction).toHaveBeenCalledWith(
      mockSampleId,
      'view',
      mockUser.uid,
      false
    );
    
    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      `view_${mockSampleId}_${mockUser.uid}`,
      'true'
    );
    
    // Verify hasTrackedView is true
    expect(result.current.hasTrackedView).toBe(true);
  });
  
  test('does not track view if already tracked', async () => {
    useAuthState.mockReturnValue([mockUser, false]);
    
    // Simulate a previous view being tracked
    localStorageMock.getItem.mockReturnValueOnce('true');
    
    const { result } = renderHook(() => useTrackSampleView(mockSampleId));
    
    await act(async () => {
      // Wait for the effect to run
      await Promise.resolve();
    });
    
    // Verify interaction was NOT tracked again
    expect(trackSampleInteraction).not.toHaveBeenCalled();
    
    // Verify localStorage was NOT updated again
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    
    // Verify hasTrackedView is true (from localStorage)
    expect(result.current.hasTrackedView).toBe(true);
  });
  
  test('handles error during tracking', async () => {
    useAuthState.mockReturnValue([mockUser, false]);
    
    // Mock trackSampleInteraction to throw an error
    trackSampleInteraction.mockRejectedValueOnce(new Error('Tracking error'));
    
    // Mock console.error to prevent test output noise
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { result } = renderHook(() => useTrackSampleView(mockSampleId));
    
    await act(async () => {
      // Wait for the effect to run
      await Promise.resolve();
    });
    
    // Verify interaction attempt was made
    expect(trackSampleInteraction).toHaveBeenCalled();
    
    // Verify localStorage was NOT updated due to error
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    
    // Verify hasTrackedView is false due to error
    expect(result.current.hasTrackedView).toBe(false);
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error tracking sample view:',
      expect.any(Error)
    );
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
  
  test('reacts to user change', async () => {
    // Start with no user
    useAuthState.mockReturnValue([null, false]);
    
    const { result, rerender } = renderHook(() => useTrackSampleView(mockSampleId));
    
    await act(async () => {
      // Wait for the effect to run
      await Promise.resolve();
    });
    
    // Verify anonymous tracking
    expect(trackSampleInteraction).toHaveBeenCalledWith(
      mockSampleId,
      'view',
      null,
      false
    );
    
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Change to authenticated user
    useAuthState.mockReturnValue([mockUser, false]);
    
    // Rerender with same props to trigger effect again
    rerender();
    
    await act(async () => {
      // Wait for the effect to run
      await Promise.resolve();
    });
    
    // Verify authenticated tracking
    expect(trackSampleInteraction).toHaveBeenCalledWith(
      mockSampleId,
      'view',
      mockUser.uid,
      false
    );
  });
}); 