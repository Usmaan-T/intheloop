import { renderHook, act } from '@testing-library/react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import usePopularUsers from '../usePopularUsers';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn()
}));

// Mock Firebase modules
jest.mock('../../firebase/firebase', () => ({
  firestore: {}
}), { virtual: true });

describe('usePopularUsers', () => {
  // Mock popular users data
  const mockUsers = [
    { 
      uid: 'user1', 
      username: 'Trending User 1', 
      photoURL: 'https://example.com/user1.jpg',
      popularityScores: { 
        weekly: 100,
        monthly: 300,
        allTime: 1000
      }
    },
    { 
      uid: 'user2', 
      username: 'Trending User 2', 
      photoURL: 'https://example.com/user2.jpg',
      popularityScores: { 
        weekly: 75,
        monthly: 200,
        allTime: 800
      }
    },
    { 
      uid: 'user3', 
      username: 'Trending User 3', 
      photoURL: 'https://example.com/user3.jpg',
      popularityScores: { 
        weekly: 50,
        monthly: 150,
        allTime: 500
      }
    },
    {
      uid: 'user4',
      username: 'Trending User 4',
      photoURL: 'https://example.com/user4.jpg',
      popularityScores: {
        weekly: 25,
        monthly: 100,
        allTime: 300
      }
    },
    {
      uid: 'user5',
      username: 'Trending User 5',
      photoURL: 'https://example.com/user5.jpg',
      popularityScores: {
        weekly: 10,
        monthly: 50,
        allTime: 200
      }
    },
    {
      uid: 'user6',
      // User without username but with displayName
      displayName: 'Display Name User',
      photoURL: 'https://example.com/user6.jpg',
      popularityScores: {
        weekly: 5,
        monthly: 15,
        allTime: 80
      }
    },
    {
      uid: 'user7',
      // User without username or displayName
      photoURL: 'https://example.com/user7.jpg',
      popularityScores: {
        weekly: 0, // This user should be filtered out due to zero heat
        monthly: 5,
        allTime: 20
      }
    }
  ];

  // Setup common test utilities
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Firebase functions
    collection.mockReturnValue('users-collection');
    orderBy.mockReturnValue('orderBy-weekly-desc');
    limit.mockReturnValue('limit-5');
    query.mockReturnValue('users-query');
    
    // Silence console errors for cleaner test output
    console.error = jest.fn();
  });

  it('should initialize with loading state and empty users array', () => {
    // Setup mock for getDocs that never resolves to keep loading state
    getDocs.mockImplementation(() => new Promise(() => {}));
    
    // Render hook
    const { result } = renderHook(() => usePopularUsers());
    
    // Check initial state
    expect(result.current.users).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch popular users with default limit', async () => {
    // Mock users query response with 5 users (default limit)
    const querySnapshotMock = mockUsers.slice(0, 5).map((user, index) => ({
      id: `user${index + 1}`,
      data: () => user
    }));
    
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => querySnapshotMock.forEach(callback)
    });
    
    // Render hook
    const { result } = renderHook(() => usePopularUsers());
    
    // Wait for effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify Firestore query was called with correct parameters
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'users');
    expect(orderBy).toHaveBeenCalledWith('popularityScores.weekly', 'desc');
    expect(limit).toHaveBeenCalledWith(5); // Default limit
    expect(query).toHaveBeenCalledWith('users-collection', 'orderBy-weekly-desc', 'limit-5');
    expect(getDocs).toHaveBeenCalledWith('users-query');
    
    // Verify state after fetch
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.users.length).toBe(5);
    
    // Verify first user data structure
    const firstUser = result.current.users[0];
    expect(firstUser).toHaveProperty('id');
    expect(firstUser).toHaveProperty('uid');
    expect(firstUser).toHaveProperty('username');
    expect(firstUser).toHaveProperty('photoURL');
    expect(firstUser).toHaveProperty('heat');
  });

  it('should fetch users with custom limit', async () => {
    // Custom limit to test
    const customLimit = 3;
    
    // Mock users query response with custom limit
    const querySnapshotMock = mockUsers.slice(0, customLimit).map((user, index) => ({
      id: `user${index + 1}`,
      data: () => user
    }));
    
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => querySnapshotMock.forEach(callback)
    });
    
    // Render hook with custom limit
    const { result } = renderHook(() => usePopularUsers(customLimit));
    
    // Wait for effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify limit parameter was passed correctly
    expect(limit).toHaveBeenCalledWith(customLimit);
    
    // Verify state after fetch
    expect(result.current.users.length).toBe(customLimit);
  });

  it('should filter out users with zero heat score', async () => {
    // Include a mix of users with and without heat scores
    const mixedUsers = [
      mockUsers[0], // has heat score
      mockUsers[1], // has heat score
      mockUsers[6], // has zero heat score (should be filtered out)
    ];
    
    // Mock users query response
    const querySnapshotMock = mixedUsers.map((user, index) => ({
      id: `user${index + 1}`,
      data: () => user
    }));
    
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => querySnapshotMock.forEach(callback)
    });
    
    // Render hook
    const { result } = renderHook(() => usePopularUsers());
    
    // Wait for effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify only users with heat > 0 are included
    expect(result.current.users.length).toBe(2); // Only first two should be included
    expect(result.current.users.every(user => user.heat > 0)).toBe(true);
  });

  it('should handle missing username or displayName', async () => {
    // Include user with displayName but no username, and one with neither
    const usersMissingFields = [
      mockUsers[5], // has displayName but no username
    ];
    
    // Mock users query response
    const querySnapshotMock = usersMissingFields.map((user, index) => ({
      id: `user${index + 1}`,
      data: () => user
    }));
    
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => querySnapshotMock.forEach(callback)
    });
    
    // Render hook
    const { result } = renderHook(() => usePopularUsers());
    
    // Wait for effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify fallback to displayName
    expect(result.current.users[0].username).toBe('Display Name User');
  });

  it('should handle fetch error', async () => {
    // Mock fetch error
    const mockError = new Error('Failed to fetch users');
    getDocs.mockRejectedValueOnce(mockError);
    
    // Render hook
    const { result } = renderHook(() => usePopularUsers());
    
    // Wait for effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify error handling
    expect(console.error).toHaveBeenCalledWith('Error fetching popular users:', mockError);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(mockError);
    expect(result.current.users).toEqual([]);
  });

  it('should update when limitCount changes', async () => {
    // First render with initial limit of 2
    const initialLimit = 2;
    
    // Mock first users query response
    const firstQuerySnapshotMock = mockUsers.slice(0, initialLimit).map((user, index) => ({
      id: `user${index + 1}`,
      data: () => user
    }));
    
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => firstQuerySnapshotMock.forEach(callback)
    });
    
    // Render hook with initial limit
    const { result, rerender } = renderHook((props) => usePopularUsers(props), {
      initialProps: initialLimit
    });
    
    // Wait for first query to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify first query results
    expect(result.current.users.length).toBe(initialLimit);
    expect(limit).toHaveBeenCalledWith(initialLimit);
    
    // Clear mocks for second query
    jest.clearAllMocks();
    
    // Mock second users query response with new limit
    const newLimit = 4;
    const secondQuerySnapshotMock = mockUsers.slice(0, newLimit).map((user, index) => ({
      id: `user${index + 1}`,
      data: () => user
    }));
    
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => secondQuerySnapshotMock.forEach(callback)
    });
    
    // Rerender with new limit
    rerender(newLimit);
    
    // Wait for second query to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify second query was called with new limit
    expect(limit).toHaveBeenCalledWith(newLimit);
    expect(result.current.users.length).toBe(newLimit);
  });
}); 