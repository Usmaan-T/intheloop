import { renderHook, act } from '@testing-library/react';
import { collection, query, where, getDocs, limit, orderBy, startAt, endAt, getCountFromServer } from 'firebase/firestore';
import useFindUsers from '../useFindUsers';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  startAt: jest.fn(),
  endAt: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  getCountFromServer: jest.fn()
}));

// Mock Firebase Auth hooks
jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: jest.fn(() => [null, false, null])
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock Firebase modules
jest.mock('../../firebase/firebase', () => ({
  auth: {},
  firestore: {}
}), { virtual: true });

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

describe('useFindUsers', () => {
  // Mock user data for testing
  const mockUsers = [
    {
      id: 'user1',
      username: 'johndoe',
      displayName: 'John Doe',
      email: 'john@example.com',
      bio: 'I am a musician',
      photoURL: 'https://example.com/photo1.jpg',
      createdAt: { seconds: 1600000100 }
    },
    {
      id: 'user2',
      username: 'janedoe',
      displayName: 'Jane Doe',
      email: 'jane@example.com',
      bio: 'Producer and DJ',
      photoURL: 'https://example.com/photo2.jpg',
      createdAt: { seconds: 1600000200 }
    },
    {
      id: 'user3',
      username: 'bobsmith',
      displayName: 'Bob Smith',
      email: 'bob@example.com',
      bio: 'Producer from LA',
      photoURL: 'https://example.com/photo3.jpg',
      createdAt: { seconds: 1600000300 }
    }
  ];

  // Mock collection references and snapshots
  const mockUsersRef = 'users-collection-ref';
  const mockCountSnapshot = {
    data: () => ({ count: mockUsers.length })
  };

  // Helper to create document snapshots
  const createMockSnapshot = (users) => ({
    empty: users.length === 0,
    docs: users.map(user => ({
      id: user.id,
      data: () => ({ ...user })
    }))
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset localStorage mock
    mockLocalStorage.clear();
    
    // Setup base mocks
    collection.mockReturnValue(mockUsersRef);
    query.mockReturnValue('mock-query');
    limit.mockReturnValue('limit-clause');
    orderBy.mockReturnValue('orderBy-clause');
    startAt.mockReturnValue('startAt-clause');
    endAt.mockReturnValue('endAt-clause');
    
    // Setup getCountFromServer mock
    getCountFromServer.mockResolvedValue(mockCountSnapshot);
    
    // By default, return all mock users
    getDocs.mockResolvedValue(createMockSnapshot(mockUsers));
  });

  it('should initialize with empty values and load from localStorage', async () => {
    // Setup mock for localStorage data
    const mockRecentSearches = [
      { id: 'recent1', name: 'Recent User 1', photoURL: 'https://example.com/recent1.jpg' },
      { id: 'recent2', name: 'Recent User 2', photoURL: 'https://example.com/recent2.jpg' }
    ];
    
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(mockRecentSearches));
    
    // Render hook
    let result;
    await act(async () => {
      result = renderHook(() => useFindUsers()).result;
    });
    
    // Initial state before any async operation completes
    expect(result.current.loading).toBe(false);
    expect(result.current.users).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.searchQuery).toBe('');
    expect(result.current.recentSearches).toEqual(mockRecentSearches);
    
    // Wait for the useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify that it tried to check the users collection
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'users');
    expect(getCountFromServer).toHaveBeenCalledWith(mockUsersRef);
  });

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage.getItem to throw an error
    mockLocalStorage.getItem.mockImplementationOnce(() => {
      throw new Error('localStorage error');
    });
    
    // Render hook
    const { result } = renderHook(() => useFindUsers());
    
    // Should default to empty array instead of crashing
    expect(result.current.recentSearches).toEqual([]);
  });

  describe('searchUsers', () => {
    it('should not search if term is too short', async () => {
      // Reset mocks to ensure we're testing from clean state
      jest.clearAllMocks();
      
      // Render hook
      const { result } = renderHook(() => useFindUsers());
      
      // Call searchUsers with short term
      await act(async () => {
        await result.current.searchUsers('a');
      });
      
      // Verify - too short to trigger search
      expect(result.current.users).toEqual([]);
      expect(getDocs).not.toHaveBeenCalled();
    });
    
    it('should search users with multi-strategy approach', async () => {
      // Mock query responses
      const prefixUsers = [mockUsers[0]]; // Only John matches prefix
      const backupUsers = [mockUsers[0], mockUsers[1]]; // John and Jane match backup
      
      // Setup mock to return different results for different queries
      let queryCounter = 0;
      getDocs.mockImplementation((queryRef) => {
        queryCounter++;
        if (queryCounter === 1) {
          // First query - prefix strategy
          return Promise.resolve(createMockSnapshot(prefixUsers));
        } else if (queryCounter === 2) {
          // Second query - backup strategy
          return Promise.resolve(createMockSnapshot(backupUsers));
        } else {
          // Last resort query
          return Promise.resolve(createMockSnapshot(mockUsers));
        }
      });
      
      // Render hook
      const { result } = renderHook(() => useFindUsers());
      
      // Wait for initial useEffect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Call searchUsers
      await act(async () => {
        await result.current.searchUsers('jo');
      });
      
      // Verify state
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.searchQuery).toBe('jo');
      
      // Verify Firestore calls
      expect(collection).toHaveBeenCalledWith(expect.anything(), 'users');
      expect(orderBy).toHaveBeenCalledWith('username');
      expect(startAt).toHaveBeenCalledWith('jo');
      expect(endAt).toHaveBeenCalledWith('jo\uf8ff');
      
      // Should have results - the exact number might vary based on deduplication
      expect(result.current.users.length).toBeGreaterThan(0);
    });
    
    it('should use cache for repeated searches', async () => {
      // Render hook
      const { result } = renderHook(() => useFindUsers());
      
      // Wait for initial useEffect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // First search
      await act(async () => {
        await result.current.searchUsers('doe');
      });
      
      // Reset mocks to detect if they're called again
      getDocs.mockClear();
      collection.mockClear();
      
      // Second search with same term
      await act(async () => {
        await result.current.searchUsers('doe');
      });
      
      // Should use cache and not call Firestore again
      expect(getDocs).not.toHaveBeenCalled();
      expect(collection).not.toHaveBeenCalled();
    });
    
    it('should handle errors during search', async () => {
      // Mock error from Firestore
      getCountFromServer.mockRejectedValueOnce(new Error('Firestore error'));
      
      // Render hook
      const { result } = renderHook(() => useFindUsers());
      
      // Wait for initial useEffect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Attempt search
      await act(async () => {
        await result.current.searchUsers('test');
      });
      
      // Verify error state
      expect(result.current.error).toContain('Error searching users');
      expect(result.current.loading).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
    
    it('should handle empty collection', async () => {
      // Mock empty users collection
      getCountFromServer.mockResolvedValueOnce({
        data: () => ({ count: 0 })
      });
      
      // Render hook
      const { result } = renderHook(() => useFindUsers());
      
      // Wait for initial useEffect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Attempt search
      await act(async () => {
        await result.current.searchUsers('test');
      });
      
      // Verify state - should show error for empty collection
      expect(result.current.error).toContain('No users exist');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('recent searches', () => {
    it('should add user to recent searches', async () => {
      // Render hook
      const { result } = renderHook(() => useFindUsers());
      
      // Add a user to recent searches
      await act(async () => {
        result.current.addToRecentSearches(mockUsers[0]);
      });
      
      // Verify
      expect(result.current.recentSearches).toHaveLength(1);
      expect(result.current.recentSearches[0].id).toBe(mockUsers[0].id);
      expect(result.current.recentSearches[0].name).toBe(mockUsers[0].username);
      
      // Verify localStorage update
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'recentUserSearches',
        expect.any(String)
      );
    });
    
    it('should remove user from recent searches', async () => {
      // Setup initial state with some recent searches
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify([
        { id: 'user1', name: 'John Doe' },
        { id: 'user2', name: 'Jane Doe' }
      ]));
      
      // Render hook
      const { result } = renderHook(() => useFindUsers());
      
      // Remove one user
      await act(async () => {
        result.current.removeFromRecentSearches('user1');
      });
      
      // Verify
      expect(result.current.recentSearches).toHaveLength(1);
      expect(result.current.recentSearches[0].id).toBe('user2');
    });
    
    it('should clear search history', async () => {
      // Setup initial state with some recent searches
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify([
        { id: 'user1', name: 'John Doe' },
        { id: 'user2', name: 'Jane Doe' }
      ]));
      
      // Render hook
      const { result } = renderHook(() => useFindUsers());
      
      // Clear history
      await act(async () => {
        result.current.clearSearchHistory();
      });
      
      // Verify
      expect(result.current.recentSearches).toHaveLength(0);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('recentUserSearches');
    });
    
    it('should not add invalid user to recent searches', async () => {
      // Render hook
      const { result } = renderHook(() => useFindUsers());
      
      // Try to add null
      await act(async () => {
        result.current.addToRecentSearches(null);
      });
      
      // Try to add user without username or displayName
      await act(async () => {
        result.current.addToRecentSearches({ id: 'invalid' });
      });
      
      // Verify nothing was added
      expect(result.current.recentSearches).toHaveLength(0);
    });
    
    it('should limit recent searches to 10 items', async () => {
      // Create 12 mock users
      const manyUsers = Array.from({ length: 12 }, (_, i) => ({
        id: `user${i}`,
        username: `User ${i}`
      }));
      
      // Render hook
      const { result } = renderHook(() => useFindUsers());
      
      // Add all users
      await act(async () => {
        for (const user of manyUsers) {
          result.current.addToRecentSearches(user);
        }
      });
      
      // Verify max limit
      expect(result.current.recentSearches).toHaveLength(10);
      
      // Most recent should be first
      expect(result.current.recentSearches[0].id).toBe('user11');
    });
  });

  describe('utility functions', () => {
    it('should clear search results', async () => {
      // Render hook
      const { result } = renderHook(() => useFindUsers());
      
      // Wait for initial useEffect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Populate with results
      await act(async () => {
        // Manually set users to simulate search results
        result.current.searchUsers('doe');
      });
      
      // Wait for the search to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Verify we have results
      expect(result.current.users.length).toBeGreaterThan(0);
      
      // Clear search
      await act(async () => {
        result.current.clearSearch();
      });
      
      // Verify cleared state
      expect(result.current.users).toEqual([]);
      expect(result.current.searchQuery).toBe('');
    });
  });
}); 