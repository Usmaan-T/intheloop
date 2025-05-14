import { renderHook, act } from '@testing-library/react';
import { collection, query, orderBy, limit, getDocs, startAfter, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import useExploreData from '../useExploreData';
import { SAMPLE_TAGS } from '../useSamplesData';

// Mock Firebase Auth
jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: jest.fn()
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  startAfter: jest.fn(),
  where: jest.fn()
}));

// Mock Firebase modules
jest.mock('../../firebase/firebase', () => ({
  auth: {},
  firestore: {}
}), { virtual: true });

// Mock useSamplesData to provide the SAMPLE_TAGS
jest.mock('../useSamplesData', () => ({
  SAMPLE_TAGS: {
    'Genre': ['Hip Hop', 'EDM', 'Rock', 'Pop'],
    'Instrument': ['Drums', 'Guitar', 'Piano', 'Synth'],
    'Mood': ['Chill', 'Energetic', 'Dark', 'Happy']
  }
}));

// Mocking Math.random to ensure consistent results
const originalRandom = Math.random;
let mockRandom = jest.fn().mockReturnValue(0.5);

describe('useExploreData', () => {
  // Sample data for mocking Firestore responses
  const mockSamples = [
    {
      id: 'sample1',
      name: 'Test Sample 1',
      userId: 'user1',
      tags: ['Hip Hop', 'Drums', 'Energetic'],
      createdAt: { seconds: 1630000000 },
      popularityScores: { weekly: 95, allTime: 850 }
    },
    {
      id: 'sample2',
      name: 'Test Sample 2',
      userId: 'user2',
      tags: ['EDM', 'Synth', 'Chill'],
      createdAt: { seconds: 1631000000 },
      popularityScores: { weekly: 80, allTime: 720 }
    },
    {
      id: 'sample3',
      name: 'Test Sample 3',
      userId: 'user3',
      tags: ['Rock', 'Guitar', 'Dark'],
      createdAt: { seconds: 1632000000 },
      popularityScores: { weekly: 75, allTime: 650 }
    },
    {
      id: 'sample4',
      name: 'Test Sample 4',
      userId: 'user1',
      tags: ['Pop', 'Piano', 'Happy'],
      createdAt: { seconds: 1633000000 },
      popularityScores: { weekly: 85, allTime: 900 }
    },
    {
      id: 'sample5',
      name: 'Test Sample 5',
      userId: 'user2',
      tags: ['Hip Hop', 'Synth', 'Dark'],
      createdAt: { seconds: 1634000000 },
      popularityScores: { weekly: 90, allTime: 800 }
    }
  ];

  // Helper to create document snapshots
  const createMockSnapshot = (samples) => ({
    empty: samples.length === 0,
    docs: samples.map(sample => ({
      id: sample.id,
      data: () => ({ ...sample }),
      ref: `posts/${sample.id}`
    }))
  });

  // Mock user data
  const mockUser = { uid: 'user123' };
  const mockUserData = {
    id: 'user123',
    likes: ['sample1', 'sample5']
  };

  // Mock user interaction stats
  const mockUserStats = [
    { 
      id: 'stat1', 
      userId: 'user123', 
      sampleId: 'sample2', 
      interactionType: 'view' 
    },
    { 
      id: 'stat2', 
      userId: 'user123', 
      sampleId: 'sample3', 
      interactionType: 'play' 
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Replace Math.random with mock
    Math.random = mockRandom;
    
    // Mock console methods to prevent test noise
    global.console.error = jest.fn();
    global.console.log = jest.fn();
    
    // Default authentication state - not logged in
    useAuthState.mockReturnValue([null, false, null]);
    
    // Mock collection reference
    collection.mockImplementation((_, collectionName) => `${collectionName}-collection`);
    
    // Mock query function
    query.mockReturnValue('mock-query');
    
    // Mock other Firestore functions
    orderBy.mockReturnValue('orderBy-clause');
    limit.mockReturnValue('limit-clause');
    startAfter.mockReturnValue('startAfter-clause');
    where.mockReturnValue('where-clause');
    
    // Default implementation for getDocs
    getDocs.mockResolvedValue(createMockSnapshot(mockSamples));
  });

  afterEach(() => {
    // Restore original Math.random
    Math.random = originalRandom;
  });

  it('should initialize with empty data and loading state', async () => {
    // Set up mock implementation for anonymous user
    getDocs.mockResolvedValueOnce(createMockSnapshot(mockSamples));
    
    // Render hook with act to handle state updates
    let result;
    
    await act(async () => {
      const hookResult = renderHook(() => useExploreData());
      result = hookResult.result;
      
      // Initial state should be loading
      expect(result.current.loading).toBe(true);
      expect(result.current.samples).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.hasMore).toBe(true);
      expect(result.current.isPersonalized).toBe(false);
      
      // Wait for promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify that random samples were fetched (for anonymous user)
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'posts');
    expect(where).toHaveBeenCalledWith('createdAt', '>', expect.any(Date));
    expect(result.current.loading).toBe(false);
    expect(result.current.samples.length).toBeGreaterThan(0);
  });

  describe('for anonymous users', () => {
    it('should fetch random samples on initial load', async () => {
      // Render hook with act to handle all state updates
      let result;
      
      await act(async () => {
        const hookResult = renderHook(() => useExploreData(3));
        result = hookResult.result;
        
        // Wait for promises to resolve
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Verify random samples query
      expect(where).toHaveBeenCalledWith('createdAt', '>', expect.any(Date));
      expect(limit).toHaveBeenCalled();
      expect(result.current.samples.length).toBeGreaterThan(0);
    });
    
    it('should handle empty results', async () => {
      // Mock empty responses for both older and newer samples
      getDocs
        .mockResolvedValueOnce(createMockSnapshot([]))  // First call (newer samples)
        .mockResolvedValueOnce(createMockSnapshot([])); // Second call (older samples)
      
      // Render hook with act to handle all state updates
      let result;
      
      await act(async () => {
        const hookResult = renderHook(() => useExploreData());
        result = hookResult.result;
        
        // Wait for promises to resolve
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Verify state reflects empty results
      expect(result.current.samples).toEqual([]);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.loading).toBe(false);
    });
    
    it('should fetch more samples when requested', async () => {
      // Setup - first batch of samples
      getDocs
        .mockResolvedValueOnce(createMockSnapshot(mockSamples.slice(0, 2)))  // Initial query
        .mockResolvedValueOnce(createMockSnapshot(mockSamples.slice(2, 4))); // Load more query
      
      // Render hook
      let result;
      
      // Initial render and data fetch
      await act(async () => {
        const hookResult = renderHook(() => useExploreData(2));
        result = hookResult.result;
        
        // Wait for first batch to load
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Verify initial load
      expect(result.current.samples.length).toBe(2);
      
      // Fetch more samples
      await act(async () => {
        await result.current.fetchMoreSamples();
      });
      
      // Verify more samples were loaded
      expect(startAfter).toHaveBeenCalled();
      expect(result.current.samples.length).toBe(4);
    });
    
    it('should handle errors during fetch', async () => {
      // Mock error during fetch
      getDocs.mockRejectedValueOnce(new Error('Fetch error'));
      
      // Render hook
      let result;
      
      await act(async () => {
        const hookResult = renderHook(() => useExploreData());
        result = hookResult.result;
        
        // Wait for error to be processed
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Verify error state
      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('for authenticated users', () => {
    beforeEach(() => {
      // Mock logged in user
      useAuthState.mockReturnValue([mockUser, false, null]);
      
      // Setup for user preferences calculation
      getDocs.mockImplementation((queryParam) => {
        const queryStr = JSON.stringify(queryParam);
        
        // Mock user document
        if (queryStr.includes('users')) {
          if (queryStr.includes('__name__')) {
            const userDoc = {
              id: mockUser.uid,
              data: () => ({ ...mockUserData })
            };
            return Promise.resolve({ 
              empty: false,
              docs: [userDoc]
            });
          }
        }
        
        // Mock sample stats 
        if (queryStr.includes('sampleStats')) {
          return Promise.resolve({
            empty: false,
            docs: mockUserStats.map(stat => ({
              id: stat.id,
              data: () => ({ ...stat })
            }))
          });
        }
        
        // Default: return mock samples for post queries
        return Promise.resolve(createMockSnapshot(mockSamples));
      });
    });
    
    it('should fetch personalized samples for authenticated users', async () => {
      // Render hook
      let result;
      
      await act(async () => {
        const hookResult = renderHook(() => useExploreData());
        result = hookResult.result;
        
        // Wait for initial load
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Verify user document was fetched
      expect(collection).toHaveBeenCalledWith(expect.anything(), 'users');
      
      // Verify sample preferences logic was used
      expect(collection).toHaveBeenCalledWith(expect.anything(), 'sampleStats');
      
      // Verify personalized flag is set
      expect(result.current.isPersonalized).toBe(true);
      
      // Samples should have been loaded
      expect(result.current.samples.length).toBeGreaterThan(0);
    });
    
    it('should handle refresh samples request', async () => {
      // Render hook
      let result;
      
      await act(async () => {
        const hookResult = renderHook(() => useExploreData());
        result = hookResult.result;
        
        // Wait for initial load
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Clear previous mock calls
      collection.mockClear();
      getDocs.mockClear();
      
      // Refresh samples
      await act(async () => {
        result.current.refreshSamples();
        
        // Wait for refresh to complete
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Verify samples were refetched
      expect(collection).toHaveBeenCalledWith(expect.anything(), 'posts');
    });
    
    it('should handle fetch more samples for authenticated users', async () => {
      // Render hook
      let result;
      
      await act(async () => {
        const hookResult = renderHook(() => useExploreData());
        result = hookResult.result;
        
        // Wait for initial load
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Clear previous calls
      collection.mockClear();
      getDocs.mockClear();
      
      // Fetch more samples
      await act(async () => {
        await result.current.fetchMoreSamples();
        
        // Wait for additional samples to load
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // For authenticated users, fetchMoreSamples should trigger a new personalized fetch
      expect(collection).toHaveBeenCalledWith(expect.anything(), 'users');
    });
    
    it('should fallback to random samples if personalization fails', async () => {
      // Set up the sequence of mock responses
      const errorMock = jest.fn().mockRejectedValueOnce(new Error('Preferences fetch error'));
      const successMock = jest.fn().mockResolvedValueOnce(createMockSnapshot(mockSamples));
      
      // First call fails (user preferences), second succeeds (random samples)
      getDocs.mockImplementationOnce(errorMock).mockImplementationOnce(successMock);
      
      // Render hook
      let result;
      
      await act(async () => {
        const hookResult = renderHook(() => useExploreData());
        result = hookResult.result;
        
        // Wait for fallback to complete
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Error fetching personalized samples:"), 
        expect.any(Error)
      );
      
      // But samples should still be loaded from random fallback
      expect(result.current.samples.length).toBeGreaterThan(0);
      expect(result.current.loading).toBe(false);
    });
  });
  
  // Test shuffle functionality
  describe('shuffleArray utility', () => {
    it('should preserve array length when shuffling', async () => {
      // Force different random values for each call to simulate shuffling
      mockRandom
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.7)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.4);
      
      // Render hook
      let sample1, sample2;
      
      await act(async () => {
        // First render with mocked randomness
        const hook1 = renderHook(() => useExploreData());
        await new Promise(resolve => setTimeout(resolve, 0));
        sample1 = [...hook1.result.current.samples];
        
        // Reset mocks and change random behavior for second render
        jest.clearAllMocks();
        mockRandom
          .mockReturnValueOnce(0.9)
          .mockReturnValueOnce(0.1)
          .mockReturnValueOnce(0.5)
          .mockReturnValueOnce(0.3)
          .mockReturnValueOnce(0.2);
        
        // Second render with different randomness
        const hook2 = renderHook(() => useExploreData());
        await new Promise(resolve => setTimeout(resolve, 0));
        sample2 = [...hook2.result.current.samples];
      });
      
      // Check that we have different orderings
      const ordering1 = sample1.map(s => s.id).join(',');
      const ordering2 = sample2.map(s => s.id).join(',');
      expect(ordering1).not.toEqual(ordering2);
      
      // But length should be the same
      expect(sample1.length).toBe(mockSamples.length);
      expect(sample2.length).toBe(mockSamples.length);
    });
  });
}); 