import { renderHook, act } from '@testing-library/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  doc, 
  updateDoc, 
  increment, 
  getDoc,
  arrayUnion,
  arrayRemove,
  runTransaction
} from 'firebase/firestore';
import useLikeSample from '../useLikeSample';

// Mock useTrackSampleInteraction
jest.mock('../useTrackSampleInteraction', () => jest.fn().mockResolvedValue(undefined));
import trackSampleInteraction from '../useTrackSampleInteraction';

// Mock Firebase Auth
jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: jest.fn()
}));

// Mock Chakra UI toast
jest.mock('@chakra-ui/react', () => ({
  useToast: () => jest.fn().mockReturnValue({
    title: '',
    description: '',
    status: '',
    duration: 0,
    isClosable: false
  })
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn(),
  arrayUnion: jest.fn(),
  arrayRemove: jest.fn(),
  runTransaction: jest.fn()
}));

// Mock Firebase modules
jest.mock('../../firebase/firebase', () => ({
  auth: {},
  firestore: {}
}), { virtual: true });

describe('useLikeSample', () => {
  const sampleId = 'sample-123';
  const mockUser = { uid: 'user-123' };
  let mockToast;
  
  // Mock document references and snapshots
  const mockUserRef = 'user-doc-ref';
  const mockSampleRef = 'sample-doc-ref';
  
  // Mock user document data
  const mockUserData = {
    likes: ['sample-999', 'sample-456'] // Not including our test sampleId initially
  };
  
  // Mock sample document data
  const mockSampleData = {
    likes: 42
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock user authentication state
    useAuthState.mockReturnValue([mockUser, false, null]);
    
    // Mock document references
    doc.mockImplementation((_, collection, id) => {
      if (id === mockUser.uid) return mockUserRef;
      if (id === sampleId) return mockSampleRef;
      return `${collection}-${id}-ref`;
    });
    
    // Mock document snapshots
    getDoc.mockImplementation((ref) => {
      if (ref === mockUserRef) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ ...mockUserData })
        });
      }
      if (ref === mockSampleRef) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ ...mockSampleData })
        });
      }
      return Promise.resolve({ exists: () => false });
    });
    
    // Mock transaction get method
    const mockTransactionGet = jest.fn();
    mockTransactionGet.mockImplementation((ref) => {
      if (ref === mockUserRef) {
        return {
          exists: () => true,
          data: () => ({ ...mockUserData })
        };
      }
      if (ref === mockSampleRef) {
        return {
          exists: () => true,
          data: () => ({ ...mockSampleData })
        };
      }
      return { exists: () => false };
    });
    
    // Mock transaction update method
    const mockTransactionUpdate = jest.fn();
    
    // Mock runTransaction
    runTransaction.mockImplementation(async (_, callback) => {
      const transaction = {
        get: mockTransactionGet,
        update: mockTransactionUpdate
      };
      await callback(transaction);
      return transaction;
    });
    
    // Mock other Firestore functions
    increment.mockImplementation(val => `increment(${val})`);
    arrayUnion.mockImplementation(val => `arrayUnion(${val})`);
    arrayRemove.mockImplementation(val => `arrayRemove(${val})`);
    
    // Silence console errors
    console.error = jest.fn();
  });
  
  it('should initialize with correct default state', async () => {
    // Render hook
    const { result } = renderHook(() => useLikeSample(sampleId));
    
    // Initial state before useEffect
    expect(result.current.isLiked).toBe(false);
    expect(result.current.likeCount).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.toggleLike).toBe('function');
    
    // Wait for useEffect
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // State after useEffect
    expect(result.current.isLiked).toBe(false); // Not in user's likes array
    expect(result.current.likeCount).toBe(42); // From mock sample data
  });
  
  it('should check like status and count on mount', async () => {
    // Render hook
    renderHook(() => useLikeSample(sampleId));
    
    // Wait for useEffect
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify Firestore interaction
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', mockUser.uid);
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'posts', sampleId);
    expect(getDoc).toHaveBeenCalledWith(mockUserRef);
    expect(getDoc).toHaveBeenCalledWith(mockSampleRef);
  });
  
  it('should not fetch like status if user or sampleId is missing', async () => {
    // Mock user not authenticated
    useAuthState.mockReturnValueOnce([null, false, null]);
    
    // Render hook
    renderHook(() => useLikeSample(sampleId));
    
    // Wait for useEffect
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify Firestore was not called
    expect(getDoc).not.toHaveBeenCalled();
    
    // Reset mock and test with missing sampleId
    useAuthState.mockReturnValueOnce([mockUser, false, null]);
    renderHook(() => useLikeSample(null));
    
    // Wait for useEffect
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify Firestore was not called
    expect(getDoc).not.toHaveBeenCalled();
  });
  
  it('should handle error during like status check', async () => {
    // Mock getDoc to throw error
    getDoc.mockRejectedValueOnce(new Error('Test error'));
    
    // Render hook
    renderHook(() => useLikeSample(sampleId));
    
    // Wait for useEffect
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Error checking like status:',
      expect.any(Error)
    );
  });
  
  it('should prevent liking when user is not authenticated', async () => {
    // Mock toast
    mockToast = jest.fn();
    jest.spyOn(require('@chakra-ui/react'), 'useToast').mockReturnValue(mockToast);
    
    // Mock user not authenticated
    useAuthState.mockReturnValueOnce([null, false, null]);
    
    // Render hook
    const { result } = renderHook(() => useLikeSample(sampleId));
    
    // Attempt to like
    await act(async () => {
      await result.current.toggleLike();
    });
    
    // Verify no Firestore interaction
    expect(runTransaction).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      status: "warning"
    }));
  });
  
  it('should like a sample when not previously liked', async () => {
    // Render hook
    const { result } = renderHook(() => useLikeSample(sampleId));
    
    // Wait for initial state
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Toggle like (like the sample)
    await act(async () => {
      await result.current.toggleLike();
    });
    
    // Verify transaction call
    expect(runTransaction).toHaveBeenCalled();
    const transaction = await runTransaction.mock.results[0].value;
    
    // Verify updates in the transaction
    expect(transaction.update).toHaveBeenCalledWith(
      mockSampleRef, 
      { likes: increment(1) }
    );
    expect(transaction.update).toHaveBeenCalledWith(
      mockUserRef,
      { likes: arrayUnion(sampleId) }
    );
    
    // Verify interaction tracking
    expect(trackSampleInteraction).toHaveBeenCalledWith(
      sampleId,
      'like',
      mockUser.uid,
      false // Not removing the like
    );
    
    // Verify UI state update
    expect(result.current.isLiked).toBe(true);
    expect(result.current.likeCount).toBe(43); // Increased by 1
    expect(result.current.isLoading).toBe(false);
  });
  
  it('should unlike a sample when previously liked', async () => {
    // Mock user already liked the sample
    getDoc.mockImplementation((ref) => {
      if (ref === mockUserRef) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ likes: [...mockUserData.likes, sampleId] })
        });
      }
      if (ref === mockSampleRef) {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ ...mockSampleData })
        });
      }
      return Promise.resolve({ exists: () => false });
    });
    
    // Mock transaction get method to return liked status
    runTransaction.mockImplementation(async (_, callback) => {
      const transaction = {
        get: jest.fn().mockImplementation((ref) => {
          if (ref === mockUserRef) {
            return {
              exists: () => true,
              data: () => ({ likes: [...mockUserData.likes, sampleId] })
            };
          }
          if (ref === mockSampleRef) {
            return {
              exists: () => true,
              data: () => ({ ...mockSampleData })
            };
          }
          return { exists: () => false };
        }),
        update: jest.fn()
      };
      await callback(transaction);
      return transaction;
    });
    
    // Render hook
    const { result } = renderHook(() => useLikeSample(sampleId));
    
    // Wait for initial state
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify initial like state
    expect(result.current.isLiked).toBe(true);
    
    // Toggle like (unlike the sample)
    await act(async () => {
      await result.current.toggleLike();
    });
    
    // Verify transaction call
    expect(runTransaction).toHaveBeenCalled();
    const transaction = await runTransaction.mock.results[0].value;
    
    // Verify updates in the transaction
    expect(transaction.update).toHaveBeenCalledWith(
      mockSampleRef, 
      { likes: increment(-1) }
    );
    expect(transaction.update).toHaveBeenCalledWith(
      mockUserRef,
      { likes: arrayRemove(sampleId) }
    );
    
    // Verify interaction tracking
    expect(trackSampleInteraction).toHaveBeenCalledWith(
      sampleId,
      'like',
      mockUser.uid,
      true // Removing the like
    );
    
    // Verify UI state update
    expect(result.current.isLiked).toBe(false);
    expect(result.current.likeCount).toBe(41); // Decreased by 1
    expect(result.current.isLoading).toBe(false);
  });
  
  it('should handle sample not found during transaction', async () => {
    // Mock toast
    mockToast = jest.fn();
    jest.spyOn(require('@chakra-ui/react'), 'useToast').mockReturnValue(mockToast);
    
    // Mock transaction where sample doesn't exist
    runTransaction.mockImplementation(async (_, callback) => {
      const transaction = {
        get: jest.fn().mockImplementation((ref) => {
          if (ref === mockUserRef) {
            return {
              exists: () => true,
              data: () => ({ ...mockUserData })
            };
          }
          if (ref === mockSampleRef) {
            return {
              exists: () => false
            };
          }
          return { exists: () => false };
        }),
        update: jest.fn()
      };
      
      try {
        await callback(transaction);
      } catch (error) {
        return Promise.reject(error);
      }
      
      return transaction;
    });
    
    // Make runTransaction reject with error
    runTransaction.mockRejectedValueOnce("Sample does not exist");
    
    // Render hook
    const { result } = renderHook(() => useLikeSample(sampleId));
    
    // Wait for initial state
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Toggle like (should error)
    await act(async () => {
      await result.current.toggleLike();
    });
    
    // Verify error handling
    expect(console.error).toHaveBeenCalledWith(
      'Error updating like status:',
      "Sample does not exist"
    );
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      status: "error"
    }));
    
    // Verify state didn't change
    expect(result.current.isLoading).toBe(false);
  });
  
  it('should handle user document not found during transaction', async () => {
    // Mock toast
    mockToast = jest.fn();
    jest.spyOn(require('@chakra-ui/react'), 'useToast').mockReturnValue(mockToast);
    
    // Mock transaction where user doesn't exist
    runTransaction.mockImplementation(async (_, callback) => {
      const transaction = {
        get: jest.fn().mockImplementation((ref) => {
          if (ref === mockUserRef) {
            return {
              exists: () => false
            };
          }
          if (ref === mockSampleRef) {
            return {
              exists: () => true,
              data: () => ({ ...mockSampleData })
            };
          }
          return { exists: () => false };
        }),
        update: jest.fn()
      };
      
      try {
        await callback(transaction);
      } catch (error) {
        return Promise.reject(error);
      }
      
      return transaction;
    });
    
    // Make runTransaction reject with error
    runTransaction.mockRejectedValueOnce("User document does not exist");
    
    // Render hook
    const { result } = renderHook(() => useLikeSample(sampleId));
    
    // Wait for initial state
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Toggle like (should error)
    await act(async () => {
      await result.current.toggleLike();
    });
    
    // Verify error handling
    expect(console.error).toHaveBeenCalledWith(
      'Error updating like status:',
      "User document does not exist"
    );
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      status: "error"
    }));
  });
}); 