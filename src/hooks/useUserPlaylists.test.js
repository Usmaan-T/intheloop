import { renderHook, act } from '@testing-library/react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import useUserPlaylists from './useUserPlaylists';

// Mock Firebase
jest.mock('firebase/firestore', () => {
  return {
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    onSnapshot: jest.fn()
  };
});

jest.mock('../firebase/firebase', () => ({
  firestore: {}
}));

describe('useUserPlaylists Hook', () => {
  const mockUserId = 'user123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns initial loading state', () => {
    // Create a mock implementation of onSnapshot that won't immediately call its callback
    onSnapshot.mockImplementation(() => {
      // Return an unsubscribe function
      return jest.fn();
    });
    
    const { result } = renderHook(() => useUserPlaylists(mockUserId));
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.playlists).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  test('returns empty array when userId is null', () => {
    const { result } = renderHook(() => useUserPlaylists(null));
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.playlists).toEqual([]);
    expect(result.current.error).toBe(null);
    
    // Firestore should not be called
    expect(collection).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  test('fetches playlists successfully', async () => {
    // Mock collection and query
    collection.mockReturnValue('playlists-collection');
    where.mockReturnValue('where-condition');
    orderBy.mockReturnValue('order-condition');
    query.mockReturnValue('playlists-query');
    
    // Create a Date object for the test
    const createdAt = new Date('2023-01-01');
    
    // Mock playlist data
    const mockPlaylists = [
      {
        id: 'playlist1',
        name: 'Workout Mix',
        userId: mockUserId,
        createdAt: { toDate: () => createdAt }
      },
      {
        id: 'playlist2',
        name: 'Running Tracks',
        userId: mockUserId,
        createdAt: { toDate: () => createdAt }
      }
    ];
    
    // Mock onSnapshot to call the callback with our mock data
    onSnapshot.mockImplementation((query, callback) => {
      // Call the success callback with mock data
      callback({
        docs: mockPlaylists.map(playlist => ({
          id: playlist.id,
          data: () => playlist
        }))
      });
      
      // Return an unsubscribe function
      return jest.fn();
    });
    
    // Mock console.log to prevent test output noise
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Render the hook
    const { result } = renderHook(() => useUserPlaylists(mockUserId));
    
    // Use act even though the changes happen synchronously (due to our mock)
    await act(async () => {
      // Just to follow the pattern, even though our changes are synchronous
      await Promise.resolve();
    });
    
    // Verify results
    expect(result.current.isLoading).toBe(false);
    expect(result.current.playlists.length).toBe(2);
    expect(result.current.playlists[0].id).toBe('playlist1');
    expect(result.current.playlists[1].id).toBe('playlist2');
    expect(result.current.playlists[0].createdAt).toEqual(createdAt);
    expect(result.current.error).toBe(null);
    
    // Verify Firestore was called correctly
    expect(collection).toHaveBeenCalledWith(firestore, 'playlists');
    expect(where).toHaveBeenCalledWith('userId', '==', mockUserId);
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(query).toHaveBeenCalled();
    expect(onSnapshot).toHaveBeenCalledWith(
      'playlists-query',
      expect.any(Function),
      expect.any(Function)
    );
    
    // Clean up
    consoleLogSpy.mockRestore();
  });

  test('handles errors during subscription', async () => {
    // Mock collection and query
    collection.mockReturnValue('playlists-collection');
    where.mockReturnValue('where-condition');
    orderBy.mockReturnValue('order-condition');
    query.mockReturnValue('playlists-query');
    
    // Mock onSnapshot to call the error callback
    onSnapshot.mockImplementation((query, success, error) => {
      // Call the error callback
      error(new Error('Subscription error'));
      
      // Return an unsubscribe function
      return jest.fn();
    });
    
    // Mock console.error to prevent test output noise
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Render the hook
    const { result } = renderHook(() => useUserPlaylists(mockUserId));
    
    // Use act even though the changes happen synchronously (due to our mock)
    await act(async () => {
      // Just to follow the pattern, even though our changes are synchronous
      await Promise.resolve();
    });
    
    // Verify error state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.playlists).toEqual([]);
    expect(result.current.error).toEqual(new Error('Subscription error'));
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Clean up
    consoleErrorSpy.mockRestore();
  });

  test('handles errors during query setup', async () => {
    // Make collection throw an error
    collection.mockImplementation(() => {
      throw new Error('Query setup error');
    });
    
    // Mock console.error to prevent test output noise
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Render the hook
    const { result } = renderHook(() => useUserPlaylists(mockUserId));
    
    // Verify error state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.playlists).toEqual([]);
    expect(result.current.error).toEqual(new Error('Query setup error'));
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Clean up
    consoleErrorSpy.mockRestore();
  });

  test('unsubscribes when unmounted', async () => {
    // Create a mock unsubscribe function
    const unsubscribe = jest.fn();
    
    // Mock collection and query first since they're used in the hook
    collection.mockReturnValue('playlists-collection');
    where.mockReturnValue('where-condition');
    orderBy.mockReturnValue('order-condition');
    query.mockReturnValue('playlists-query');
    
    // Mock onSnapshot to return the unsubscribe function
    onSnapshot.mockReturnValue(unsubscribe);
    
    // Render the hook
    const { unmount } = renderHook(() => useUserPlaylists(mockUserId));
    
    // Unmount the component with act to ensure all effects run
    await act(async () => {
      unmount();
      await Promise.resolve();
    });
    
    // Verify unsubscribe was called
    expect(unsubscribe).toHaveBeenCalled();
  });

  test('re-fetches when refreshTrigger changes', async () => {
    // Mock collection and query
    collection.mockReturnValue('playlists-collection');
    where.mockReturnValue('where-condition');
    orderBy.mockReturnValue('order-condition');
    query.mockReturnValue('playlists-query');
    
    // Create an unsubscribe function that we can track
    const unsubscribe = jest.fn();
    onSnapshot.mockReturnValue(unsubscribe);
    
    // Mock console.log to prevent test output noise
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Render the hook with an initial refreshTrigger
    const { rerender } = renderHook(
      ({ userId, refreshTrigger }) => useUserPlaylists(userId, refreshTrigger),
      { initialProps: { userId: mockUserId, refreshTrigger: 0 } }
    );
    
    // Re-render with a different refreshTrigger
    rerender({ userId: mockUserId, refreshTrigger: 1 });
    
    // Verify onSnapshot was called twice (initial + refresh)
    expect(onSnapshot).toHaveBeenCalledTimes(2);
    
    // The first subscription should have been unsubscribed
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    
    // Clean up
    consoleLogSpy.mockRestore();
  });
}); 