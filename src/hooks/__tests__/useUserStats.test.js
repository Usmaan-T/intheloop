import { renderHook, act } from '@testing-library/react';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import useUserStats from '../useUserStats';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  doc: jest.fn()
}));

// Mock Firebase modules
jest.mock('../../firebase/firebase', () => ({
  firestore: {}
}), { virtual: true });

describe('useUserStats', () => {
  const userId = 'test-user-123';
  const mockUserRef = 'user-doc-ref';
  
  // Mock user data
  const mockUserData = {
    followers: ['follower-1', 'follower-2', 'follower-3']
  };
  
  // Mock collection references
  const mockPostsCollection = 'posts-collection';
  const mockPlaylistsCollection = 'playlists-collection';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    global.console.error = jest.fn();
    
    // Mock document reference
    doc.mockReturnValue(mockUserRef);
    
    // Mock collection references
    collection.mockImplementation((_, collectionName) => {
      if (collectionName === 'posts') return mockPostsCollection;
      if (collectionName === 'playlists') return mockPlaylistsCollection;
      return `${collectionName}-collection`;
    });
    
    // Mock query builder
    query.mockReturnValue('query-result');
    where.mockReturnValue('where-condition');
    
    // Mock getDoc for user document
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ ...mockUserData })
    });
    
    // Mock getDocs for samples and playlists
    getDocs.mockImplementation((queryResult) => {
      if (queryResult === 'query-result') {
        if (where.mock.calls[where.mock.calls.length - 1][0] === 'userId') {
          const collectionType = collection.mock.calls[collection.mock.calls.length - 1][1];
          
          if (collectionType === 'posts') {
            // Return 5 samples
            return Promise.resolve({ size: 5 });
          } else if (collectionType === 'playlists') {
            // Return 2 playlists
            return Promise.resolve({ size: 2 });
          }
        }
      }
      return Promise.resolve({ size: 0 });
    });
  });
  
  it('should initialize with empty stats and loading state', () => {
    // Render hook
    const { result } = renderHook(() => useUserStats(userId));
    
    // Verify initial state
    expect(result.current.stats).toEqual({ samples: 0, playlists: 0, followers: 0 });
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });
  
  it('should fetch user stats when userId is provided', async () => {
    // Render hook
    const { result } = renderHook(() => useUserStats(userId));
    
    // Wait for useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify user document was fetched
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', userId);
    expect(getDoc).toHaveBeenCalledWith(mockUserRef);
    
    // Verify samples query was made
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'posts');
    expect(where).toHaveBeenCalledWith('userId', '==', userId);
    expect(query).toHaveBeenCalledWith(mockPostsCollection, 'where-condition');
    
    // Verify playlists query was made
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'playlists');
    expect(where).toHaveBeenCalledWith('userId', '==', userId);
    expect(query).toHaveBeenCalledWith(mockPlaylistsCollection, 'where-condition');
    
    // Verify state after fetching
    expect(result.current.loading).toBe(false);
    expect(result.current.stats).toEqual({
      samples: 5,
      playlists: 2,
      followers: 3
    });
    expect(result.current.error).toBeNull();
  });
  
  it('should not fetch stats when userId is not provided', async () => {
    // Render hook without userId
    const { result } = renderHook(() => useUserStats(null));
    
    // Wait for useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify no queries were made
    expect(getDoc).not.toHaveBeenCalled();
    expect(getDocs).not.toHaveBeenCalled();
    
    // Verify state
    expect(result.current.loading).toBe(false);
    expect(result.current.stats).toEqual({ samples: 0, playlists: 0, followers: 0 });
  });
  
  it('should handle case where user document does not exist', async () => {
    // Mock user document not existing
    getDoc.mockResolvedValueOnce({
      exists: () => false,
      data: () => null
    });
    
    // Render hook
    const { result } = renderHook(() => useUserStats(userId));
    
    // Wait for useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify state still includes samples and playlists but zero followers
    expect(result.current.stats.followers).toBe(0);
    expect(result.current.stats.samples).toBe(5);
    expect(result.current.stats.playlists).toBe(2);
  });
  
  it('should handle case where user document has no followers array', async () => {
    // Mock user document with no followers array
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ /* no followers property */ })
    });
    
    // Render hook
    const { result } = renderHook(() => useUserStats(userId));
    
    // Wait for useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify state has zero followers but other stats
    expect(result.current.stats.followers).toBe(0);
    expect(result.current.stats.samples).toBe(5);
    expect(result.current.stats.playlists).toBe(2);
  });
  
  it('should handle error during fetch process', async () => {
    // Mock fetch error
    getDoc.mockRejectedValueOnce(new Error('Test error'));
    
    // Render hook
    const { result } = renderHook(() => useUserStats(userId));
    
    // Wait for useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify error handling
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching user stats:',
      expect.any(Error)
    );
    
    // Verify state
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(new Error('Test error'));
    expect(result.current.stats).toEqual({ samples: 0, playlists: 0, followers: 0 });
  });
  
  it('should refetch stats when userId changes', async () => {
    // Render hook with initial userId
    const { result, rerender } = renderHook((props) => useUserStats(props.userId), {
      initialProps: { userId }
    });
    
    // Wait for initial useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Reset mocks to track new calls
    jest.clearAllMocks();
    
    // Change userId
    await act(async () => {
      rerender({ userId: 'new-user-456' });
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify new queries were made with new userId
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'new-user-456');
    expect(where).toHaveBeenCalledWith('userId', '==', 'new-user-456');
  });
});