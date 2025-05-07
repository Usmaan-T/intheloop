import { renderHook, act } from '@testing-library/react';
import useUserStreak from './useUserStreak';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('../firebase/firebase', () => ({
  firestore: {}
}));

describe('useUserStreak hook', () => {
  const mockUserId = 'user123';
  const mockDocData = {
    currentStreak: 3,
    longestStreak: 7,
    lastUploadDate: { toDate: () => new Date('2023-06-01') },
    streakUpdatedToday: false
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock getDoc to return our test data
    doc.mockReturnValue('mockDocRef');
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockDocData
    });
    
    // Mock updateDoc for testing updates
    updateDoc.mockResolvedValue();
  });
  
  test('fetches streak data from Firestore on mount', async () => {
    const { result } = renderHook(() => useUserStreak(mockUserId));
    
    // Initially loading should be true
    expect(result.current.loading).toBe(true);
    
    // Wait for the effect to run
    await act(() => Promise.resolve());
    
    // After loading, we should have our mock data
    expect(result.current.loading).toBe(false);
    expect(result.current.streakData).toEqual({
      currentStreak: 3,
      longestStreak: 7,
      lastUploadDate: expect.any(Date),
      streakUpdatedToday: false
    });
    
    // Verify that Firebase was called correctly
    expect(doc).toHaveBeenCalledWith(firestore, 'users', mockUserId);
    expect(getDoc).toHaveBeenCalledWith('mockDocRef');
  });
  
  test('does not fetch data if userId is not provided', async () => {
    const { result } = renderHook(() => useUserStreak(null));
    
    // Should immediately set loading to false
    expect(result.current.loading).toBe(false);
    expect(doc).not.toHaveBeenCalled();
    expect(getDoc).not.toHaveBeenCalled();
  });
  
  test('updates streak on upload', async () => {
    // Mock Date.now() to return a fixed date for predictable testing
    jest.useFakeTimers();
    const today = new Date('2023-06-02T12:00:00Z');  // Use Z to indicate UTC
    jest.setSystemTime(today);
    
    const { result } = renderHook(() => useUserStreak(mockUserId));
    
    // Wait for the effect to run
    await act(() => Promise.resolve());
    
    // Testing streak update on consecutive day
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        ...mockDocData,
        // Last upload was yesterday
        lastUploadDate: { toDate: () => new Date('2023-06-01T12:00:00Z') }  // Use Z for UTC
      })
    });
    
    // Call updateStreakOnUpload
    let success;
    await act(async () => {
      success = await result.current.updateStreakOnUpload();
    });
    
    expect(success).toBe(true);
    
    // Verify Firestore update was called with correct values
    expect(updateDoc).toHaveBeenCalledWith('mockDocRef', expect.objectContaining({
      currentStreak: 4, // Incremented from 3
      longestStreak: 7, // Unchanged since longest is still 7
      streakUpdatedToday: true
    }));
    
    // Also check the date was set, but don't compare the exact timestamp
    const updateCall = updateDoc.mock.calls[0][1];
    expect(updateCall.lastUploadDate).toBeInstanceOf(Date);
    
    // Verify local state was updated
    expect(result.current.streakData).toEqual(expect.objectContaining({
      currentStreak: 4,
      longestStreak: 7,
      streakUpdatedToday: true
    }));
    
    // Also check the date without comparing exact timestamp
    expect(result.current.streakData.lastUploadDate).toBeInstanceOf(Date);
    
    jest.useRealTimers();
  });
  
  test('resets streak when there is more than 1 day gap', async () => {
    // Mock Date.now() to return a fixed date for predictable testing
    jest.useFakeTimers();
    const today = new Date('2023-06-05T12:00:00Z'); // 4 days after June 1
    jest.setSystemTime(today);
    
    const { result } = renderHook(() => useUserStreak(mockUserId));
    
    // Wait for the effect to run
    await act(() => Promise.resolve());
    
    // Call updateStreakOnUpload
    let success;
    await act(async () => {
      success = await result.current.updateStreakOnUpload();
    });
    
    expect(success).toBe(true);
    
    // Verify Firestore update was called with correct values for reset
    expect(updateDoc).toHaveBeenCalledWith('mockDocRef', expect.objectContaining({
      currentStreak: 1, // Reset to 1
      streakUpdatedToday: true
    }));
    
    // Also check the date was set, but don't compare the exact timestamp
    const updateCall = updateDoc.mock.calls[0][1];
    expect(updateCall.lastUploadDate).toBeInstanceOf(Date);
    
    jest.useRealTimers();
  });
  
  test('resetDailyStreak updates flags correctly', async () => {
    // Set up the hook with today's date
    jest.useFakeTimers();
    const yesterday = new Date('2023-06-01');
    const today = new Date('2023-06-02T08:00:00');
    jest.setSystemTime(today);
    
    // Mock lastUploadDate as yesterday
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        ...mockDocData,
        lastUploadDate: { toDate: () => yesterday },
        streakUpdatedToday: true // Flag is still set from yesterday
      })
    });
    
    const { result } = renderHook(() => useUserStreak(mockUserId));
    
    // Wait for the effect to run
    await act(() => Promise.resolve());
    
    // Call resetDailyStreak
    await act(async () => {
      await result.current.resetDailyStreak();
    });
    
    // Should update Firestore to reset the flag
    expect(updateDoc).toHaveBeenCalledWith('mockDocRef', {
      streakUpdatedToday: false
    });
    
    // Local state should also be updated
    expect(result.current.streakData.streakUpdatedToday).toBe(false);
    
    jest.useRealTimers();
  });
}); 