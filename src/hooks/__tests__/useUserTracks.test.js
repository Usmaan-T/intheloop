import { renderHook, act } from '@testing-library/react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import useUserTracks from '../useUserTracks';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn()
}));

// Mock Firebase modules
jest.mock('../../firebase/firebase', () => ({
  firestore: {}
}), { virtual: true });

describe('useUserTracks', () => {
  // Mock user ID
  const mockUserId = 'user-123';
  
  // Mock tracks data
  const mockTracks = [
    { 
      id: 'track1', 
      name: 'Test Track 1', 
      audioUrl: 'https://example.com/track1.mp3',
      userId: 'user-123',
      createdAt: { seconds: 1600000000 } 
    },
    { 
      id: 'track2', 
      name: 'Test Track 2', 
      audioUrl: 'https://example.com/track2.mp3',
      userId: 'user-123',
      createdAt: { seconds: 1600000100 } 
    }
  ];

  // Setup for onSnapshot mock
  let onSnapshotCallback;
  let onSnapshotErrorCallback;
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Firebase functions
    collection.mockReturnValue('posts-collection');
    where.mockReturnValue('userId-condition');
    orderBy.mockReturnValue('createdAt-desc');
    query.mockReturnValue('tracks-query');
    
    // Mock onSnapshot to capture callbacks
    onSnapshot.mockImplementation((query, callback, errorCallback) => {
      onSnapshotCallback = callback;
      onSnapshotErrorCallback = errorCallback;
      return mockUnsubscribe;
    });
    
    // Silence console errors for cleaner test output
    console.error = jest.fn();
  });

  it('should initialize with empty tracks and loading state', () => {
    // Render hook
    const { result } = renderHook(() => useUserTracks(mockUserId));
    
    // Check initial state before snapshot callback
    expect(result.current.tracks).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should not setup listener if userId is not provided', () => {
    // Render hook without userId
    renderHook(() => useUserTracks());
    
    // Verify Firestore functions were not called
    expect(collection).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('should setup correct Firestore query', () => {
    // Render hook
    renderHook(() => useUserTracks(mockUserId));
    
    // Verify Firestore query setup
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'posts');
    expect(where).toHaveBeenCalledWith('userId', '==', mockUserId);
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(query).toHaveBeenCalledWith('posts-collection', 'userId-condition', 'createdAt-desc');
    expect(onSnapshot).toHaveBeenCalledWith('tracks-query', expect.any(Function), expect.any(Function));
  });

  it('should update tracks state on snapshot update', async () => {
    // Render hook
    const { result } = renderHook(() => useUserTracks(mockUserId));
    
    // Simulate snapshot update
    act(() => {
      onSnapshotCallback({
        docs: mockTracks.map(track => ({
          id: track.id,
          data: () => ({ ...track })
        }))
      });
    });
    
    // Verify state update
    expect(result.current.tracks).toEqual(mockTracks);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle snapshot error', async () => {
    // Render hook
    const { result } = renderHook(() => useUserTracks(mockUserId));
    
    // Mock error
    const mockError = new Error('Failed to fetch tracks');
    
    // Simulate snapshot error
    act(() => {
      onSnapshotErrorCallback(mockError);
    });
    
    // Verify error handling
    expect(console.error).toHaveBeenCalledWith('Error fetching tracks:', mockError);
    expect(result.current.error).toBe(mockError);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.tracks).toEqual([]);
  });

  it('should unsubscribe when unmounted', () => {
    // Render hook
    const { unmount } = renderHook(() => useUserTracks(mockUserId));
    
    // Unmount component
    unmount();
    
    // Verify unsubscribe was called
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe and resubscribe when userId changes', () => {
    // Render hook with initial userId
    const { rerender } = renderHook(({ userId }) => useUserTracks(userId), {
      initialProps: { userId: mockUserId }
    });
    
    // Verify initial subscription
    expect(onSnapshot).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledWith('userId', '==', mockUserId);
    
    // Reset mocks to track new calls
    jest.clearAllMocks();
    
    // Rerender with new userId
    rerender({ userId: 'new-user-456' });
    
    // Verify unsubscribe was called and new subscription was set up
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(onSnapshot).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledWith('userId', '==', 'new-user-456');
  });

  it('should handle empty snapshot results', async () => {
    // Render hook
    const { result } = renderHook(() => useUserTracks(mockUserId));
    
    // Simulate empty snapshot
    act(() => {
      onSnapshotCallback({
        docs: []
      });
    });
    
    // Verify empty tracks array
    expect(result.current.tracks).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
}); 