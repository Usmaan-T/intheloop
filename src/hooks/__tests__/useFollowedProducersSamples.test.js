import { renderHook, act } from '@testing-library/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  documentId
} from 'firebase/firestore';
import useFollowedProducersSamples from '../useFollowedProducersSamples';

// Mock Firebase Auth
jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: jest.fn()
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  documentId: jest.fn()
}));

// Mock Firebase modules
jest.mock('../../firebase/firebase', () => ({
  auth: {},
  firestore: {}
}), { virtual: true });

describe('useFollowedProducersSamples', () => {
  // Mock data
  const mockUser = { uid: 'test-user-123' };
  const mockUserRef = 'user-doc-ref';
  
  // Mock following user IDs
  const mockFollowing = ['producer-1', 'producer-2', 'producer-3'];
  
  // Mock user documents for followed producers
  const mockFollowedUsers = [
    { id: 'producer-1', username: 'Producer One', photoURL: 'url1' },
    { id: 'producer-2', username: 'Producer Two', photoURL: 'url2' },
    { id: 'producer-3', username: 'Producer Three', photoURL: 'url3' }
  ];
  
  // Mock samples from followed producers
  const mockSamples = [
    { 
      id: 'sample1', 
      name: 'Sample One', 
      userId: 'producer-1',
      createdAt: { seconds: 1600000100 }
    },
    { 
      id: 'sample2', 
      name: 'Sample Two', 
      userId: 'producer-2',
      createdAt: { seconds: 1600000200 }
    },
    { 
      id: 'sample3', 
      name: 'Sample Three', 
      userId: 'producer-1',
      createdAt: { seconds: 1600000050 }
    },
    { 
      id: 'sample4', 
      name: 'Sample Four', 
      userId: 'producer-3',
      createdAt: { seconds: 1600000150 }
    },
    { 
      id: 'sample5', 
      name: 'Sample Five', 
      userId: 'producer-2',
      createdAt: { seconds: 1600000300 }
    },
    { 
      id: 'sample6', 
      name: 'Sample Six', 
      userId: 'producer-3',
      createdAt: { seconds: 1600000250 }
    }
  ];
  
  // Sort samples by createdAt descending for expected results
  const sortedSampleIds = [...mockSamples]
    .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
    .map(s => s.id);
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    global.console.log = jest.fn();
    global.console.error = jest.fn();
    
    // Mock default authentication - logged in
    useAuthState.mockReturnValue([mockUser, false, null]);
    
    // Set up document reference mock
    doc.mockReturnValue(mockUserRef);
    
    // Mock document ID function
    documentId.mockReturnValue('__documentId__');
    
    // Mock collection references
    collection.mockImplementation((_, collectionName) => `${collectionName}-collection`);
    
    // Mock query builders
    where.mockReturnValue('where-clause');
    orderBy.mockReturnValue('orderBy-clause');
    limit.mockReturnValue('limit-clause');
    query.mockReturnValue('query-result');
    
    // Setup default user document
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ following: [...mockFollowing] })
    });
  });
  
  it('should initialize with loading state and empty samples array', () => {
    // Render hook
    const { result } = renderHook(() => useFollowedProducersSamples());
    
    // Check initial state
    expect(result.current.samples).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });
  
  it('should fetch samples from followed producers when user is authenticated', async () => {
    // Setup mock responses for this test specifically
    getDocs
      // First call - users query
      .mockResolvedValueOnce({
        forEach: callback => {
          mockFollowedUsers.forEach(user => {
            callback({
              id: user.id,
              data: () => ({ ...user })
            });
          });
        }
      })
      // Second call - samples query for batch of users
      .mockResolvedValueOnce({
        forEach: callback => {
          mockSamples.forEach(sample => {
            callback({
              id: sample.id,
              data: () => ({ ...sample })
            });
          });
        }
      });
    
    // Render hook
    const { result } = renderHook(() => useFollowedProducersSamples());
    
    // Initial state should be loading with empty samples
    expect(result.current.loading).toBe(true);
    expect(result.current.samples).toEqual([]);
    
    // Wait for the async effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify user document was fetched
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', mockUser.uid);
    expect(getDoc).toHaveBeenCalledWith(mockUserRef);
    
    // Verify users query was made
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'users');
    expect(where).toHaveBeenCalledWith('__documentId__', 'in', expect.arrayContaining(mockFollowing));
    
    // Verify samples query was made
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'posts');
    expect(where).toHaveBeenCalledWith('userId', 'in', expect.arrayContaining(mockFollowedUsers.map(u => u.id)));
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(limit).toHaveBeenCalledWith(5); // Default limit
    
    // Verify state after fetching
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    
    // Verify samples are sorted by createdAt and limited correctly
    expect(result.current.samples.length).toBe(5);
    
    // Exact array order comparison - using expected sorted order
    const expectedSampleIds = sortedSampleIds.slice(0, 5);
    const actualSampleIds = result.current.samples.map(s => s.id);
    expect(actualSampleIds).toEqual(expectedSampleIds);
  });
  
  it('should not fetch samples when user is not authenticated', async () => {
    // Set auth state to not authenticated
    useAuthState.mockReturnValue([null, false, null]);
    
    // Render hook
    const { result } = renderHook(() => useFollowedProducersSamples());
    
    // Wait for the async effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify no Firestore queries
    expect(doc).not.toHaveBeenCalled();
    expect(getDoc).not.toHaveBeenCalled();
    expect(getDocs).not.toHaveBeenCalled();
    
    // Verify loading is set to false and samples is empty
    expect(result.current.loading).toBe(false);
    expect(result.current.samples).toEqual([]);
  });
  
  it('should handle case where user document does not exist', async () => {
    // Mock user document not existing
    getDoc.mockResolvedValue({
      exists: () => false
    });
    
    // Render hook
    const { result } = renderHook(() => useFollowedProducersSamples());
    
    // Wait for the async effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify console message
    expect(console.log).toHaveBeenCalledWith('User document not found:', mockUser.uid);
    
    // Verify no further queries were made
    expect(getDocs).not.toHaveBeenCalled();
    
    // Verify state
    expect(result.current.loading).toBe(false);
    expect(result.current.samples).toEqual([]);
  });
  
  it('should handle case where user is not following anyone', async () => {
    // Mock user not following anyone
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ following: [] })
    });
    
    // Render hook
    const { result } = renderHook(() => useFollowedProducersSamples());
    
    // Wait for the async effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify console message
    expect(console.log).toHaveBeenCalledWith('User is not following anyone');
    
    // Verify no further queries were made
    expect(getDocs).not.toHaveBeenCalled();
    
    // Verify state
    expect(result.current.loading).toBe(false);
    expect(result.current.samples).toEqual([]);
  });
  
  it('should handle case where no followed user documents are found', async () => {
    // Mock empty users query result
    getDocs.mockResolvedValueOnce({
      forEach: jest.fn() // No documents in the result
    });
    
    // Render hook
    const { result } = renderHook(() => useFollowedProducersSamples());
    
    // Wait for the async effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify getDocs was called exactly once (only for users, not for samples)
    expect(getDocs).toHaveBeenCalledTimes(1);
    
    // Verify state
    expect(result.current.loading).toBe(false);
    expect(result.current.samples).toEqual([]);
  });
  
  it('should respect custom sample limit parameter', async () => {
    // Set up mock responses
    getDocs
      // First call - users query
      .mockResolvedValueOnce({
        forEach: callback => {
          mockFollowedUsers.forEach(user => {
            callback({
              id: user.id,
              data: () => ({ ...user })
            });
          });
        }
      })
      // Second call - samples query
      .mockResolvedValueOnce({
        forEach: callback => {
          mockSamples.forEach(sample => {
            callback({
              id: sample.id,
              data: () => ({ ...sample })
            });
          });
        }
      });
    
    // Custom limit to test
    const customLimit = 3;
    
    // Render hook with custom limit
    const { result } = renderHook(() => useFollowedProducersSamples(customLimit));
    
    // Wait for the async effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify limit parameter was used
    expect(limit).toHaveBeenCalledWith(customLimit);
    
    // Verify result is limited
    expect(result.current.samples.length).toBe(customLimit);
    
    // Verify correct samples (top 3 by date)
    const expectedIds = sortedSampleIds.slice(0, customLimit);
    expect(result.current.samples.map(s => s.id)).toEqual(expectedIds);
  });
  
  it('should handle error during fetch process', async () => {
    // Mock error during fetch
    getDoc.mockRejectedValue(new Error('Test error'));
    
    // Render hook
    const { result } = renderHook(() => useFollowedProducersSamples());
    
    // Wait for the async effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify error handling
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching followed producers samples:',
      expect.any(Error)
    );
    
    // Verify state
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Test error');
    expect(result.current.samples).toEqual([]);
  });
  
  it('should handle large number of followed users in batches', async () => {
    // Create a larger following list (12 users to test batching)
    const largeFollowing = Array.from({ length: 12 }, (_, i) => `producer-${i + 1}`);
    
    // Create corresponding user documents
    const largeFollowedUsers = largeFollowing.map((id, i) => ({ 
      id, 
      username: `Producer ${i + 1}` 
    }));
    
    // Mock user document with large following array
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ following: largeFollowing })
    });
    
    // Setup mock responses for batched queries - critical change here to fix batch processing
    // First batch of 10 users
    getDocs.mockImplementationOnce(query => {
      // Extract the user IDs from the query to determine which batch
      const queryStr = JSON.stringify(query);
      const isBatchOne = queryStr.includes(largeFollowing[0]);
      
      return {
        forEach: callback => {
          (isBatchOne ? largeFollowedUsers.slice(0, 10) : largeFollowedUsers.slice(10)).forEach(user => {
            callback({
              id: user.id,
              data: () => ({ ...user })
            });
          });
        }
      };
    });
    
    // Second batch of 2 users
    getDocs.mockImplementationOnce(query => {
      return {
        forEach: callback => {
          largeFollowedUsers.slice(10).forEach(user => {
            callback({
              id: user.id,
              data: () => ({ ...user })
            });
          });
        }
      };
    });
    
    // First batch of samples
    getDocs.mockImplementationOnce(query => {
      return {
        forEach: callback => {
          mockSamples.slice(0, 3).forEach(sample => {
            callback({
              id: sample.id,
              data: () => ({ ...sample })
            });
          });
        }
      };
    });
    
    // Second batch of samples
    getDocs.mockImplementationOnce(query => {
      return {
        forEach: callback => {
          mockSamples.slice(3).forEach(sample => {
            callback({
              id: sample.id,
              data: () => ({ ...sample })
            });
          });
        }
      };
    });
    
    // Render hook
    const { result } = renderHook(() => useFollowedProducersSamples());
    
    // Wait for the async effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify batching occurred - checking if where was called with expected subset of users
    expect(where).toHaveBeenCalledWith('__documentId__', 'in', expect.arrayContaining([largeFollowing[0]]));
    
    // Verify number of queries executed
    expect(getDocs).toHaveBeenCalledTimes(4); // 2 for users (batched), 2 for samples (batched)
    
    // Verify final state
    expect(result.current.loading).toBe(false);
    expect(result.current.samples.length).toBe(5); // Default limit
  });
}); 