import { renderHook } from '@testing-library/react';
import { 
  doc, 
  collection, 
  writeBatch, 
  increment, 
  getDoc, 
  getDocs, 
  query,
  updateDoc, 
  setDoc 
} from 'firebase/firestore';
import useDistributedCounter from '../useDistributedCounter';
import { firestore } from '../../firebase/firebase';

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => 'mocked-doc-ref'),
  collection: jest.fn(() => 'mocked-collection-ref'),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    commit: jest.fn().mockResolvedValue(true)
  })),
  increment: jest.fn(value => ({ _increment: value })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(ref => ref),
  updateDoc: jest.fn().mockResolvedValue(true),
  setDoc: jest.fn().mockResolvedValue(true)
}));

// Mock Firebase config
jest.mock('../../firebase/firebase', () => ({
  firestore: 'mocked-firestore'
}));

describe('useDistributedCounter', () => {
  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Mock console methods to prevent test output pollution
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  it('should initialize with default number of shards', () => {
    const { result } = renderHook(() => useDistributedCounter());
    
    expect(typeof result.current.initializeCounters).toBe('function');
    expect(typeof result.current.incrementCounter).toBe('function');
    expect(typeof result.current.getCounterValue).toBe('function');
    expect(typeof result.current.getAllCounterValues).toBe('function');
  });
  
  it('should initialize counter shards with the specified fields', async () => {
    // Setup mocks for writeBatch
    const mockSet = jest.fn();
    const mockCommit = jest.fn().mockResolvedValue(true);
    writeBatch.mockReturnValueOnce({
      set: mockSet,
      commit: mockCommit
    });
    
    const { result } = renderHook(() => useDistributedCounter(5)); // Initialize with 5 shards
    
    // Call the method with a document path and field names
    await result.current.initializeCounters('posts/post123', ['likes', 'shares']);
    
    // Check that Firestore collection was created with the correct path
    expect(collection).toHaveBeenCalledWith('mocked-firestore', 'posts/post123/shards');
    
    // Check that the shards were created
    expect(doc).toHaveBeenCalledTimes(5); // Should create 5 shards
    expect(mockSet).toHaveBeenCalledTimes(5); // Should call set 5 times
    
    // Verify that each shard was set up correctly
    for (let i = 0; i < 5; i++) {
      expect(doc).toHaveBeenCalledWith('mocked-collection-ref', i.toString());
      expect(mockSet).toHaveBeenCalledWith('mocked-doc-ref', { likes: 0, shares: 0 });
    }
    
    // Verify batch was committed
    expect(mockCommit).toHaveBeenCalledTimes(1);
    
    // Verify logging
    expect(console.log).toHaveBeenCalledWith('Initialized 5 counter shards for posts/post123');
  });
  
  it('should handle errors when initializing counters', async () => {
    // Setup mock to throw an error
    const mockCommit = jest.fn().mockRejectedValue(new Error('Batch write failed'));
    writeBatch.mockReturnValueOnce({
      set: jest.fn(),
      commit: mockCommit
    });
    
    const { result } = renderHook(() => useDistributedCounter());
    
    // Call the method and expect it to throw
    await expect(result.current.initializeCounters('posts/post123', ['likes'])).rejects.toThrow('Batch write failed');
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Error initializing counter shards:', expect.any(Error));
  });
  
  it('should increment a counter when the shard exists', async () => {
    // Setup mock for getDoc to return an existing document
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ likes: 5 })
    });
    
    const { result } = renderHook(() => useDistributedCounter());
    
    // Call the increment method
    await result.current.incrementCounter('posts/post123', 'likes', 2);
    
    // Verify document reference was created correctly
    // Math.random is used for shard selection, so we can't check the exact shard ID
    expect(doc).toHaveBeenCalledWith('mocked-firestore', expect.stringMatching(/^posts\/post123\/shards\/\d$/));
    
    // Verify updateDoc was called with increment
    expect(updateDoc).toHaveBeenCalledWith('mocked-doc-ref', {
      likes: { _increment: 2 }
    });
    
    // Verify increment was called with the correct value
    expect(increment).toHaveBeenCalledWith(2);
  });
  
  it('should create a new counter shard when it does not exist', async () => {
    // Setup mock for getDoc to return a non-existent document
    getDoc.mockResolvedValueOnce({
      exists: () => false
    });
    
    const { result } = renderHook(() => useDistributedCounter());
    
    // Call the increment method
    await result.current.incrementCounter('posts/post123', 'likes');
    
    // Verify setDoc was called instead of updateDoc
    expect(setDoc).toHaveBeenCalledWith('mocked-doc-ref', { likes: 1 });
    expect(updateDoc).not.toHaveBeenCalled();
  });
  
  it('should handle errors when incrementing counters', async () => {
    // Setup mock to throw an error
    getDoc.mockRejectedValueOnce(new Error('Unable to access document'));
    
    const { result } = renderHook(() => useDistributedCounter());
    
    // Call the method and expect it to throw
    await expect(result.current.incrementCounter('posts/post123', 'likes')).rejects.toThrow('Unable to access document');
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Error incrementing counter:', expect.any(Error));
  });
  
  it('should get the value of a counter by summing shards', async () => {
    // Setup mock for getDocs to return multiple shards
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => {
        // Simulate three shards with different values
        callback({ data: () => ({ likes: 3 }) });
        callback({ data: () => ({ likes: 5 }) });
        callback({ data: () => ({ likes: 2 }) });
      }
    });
    
    const { result } = renderHook(() => useDistributedCounter());
    
    // Call the get method
    const total = await result.current.getCounterValue('posts/post123', 'likes');
    
    // Verify collection query was created correctly
    expect(collection).toHaveBeenCalledWith('mocked-firestore', 'posts/post123/shards');
    expect(query).toHaveBeenCalledWith('mocked-collection-ref');
    
    // Verify returned total
    expect(total).toBe(10); // 3 + 5 + 2 = 10
  });
  
  it('should handle missing fields when getting counter values', async () => {
    // Setup mock for getDocs to return shards with missing fields
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => {
        callback({ data: () => ({ likes: 3 }) });
        callback({ data: () => ({ shares: 1 }) }); // Missing likes
        callback({ data: () => ({}) }); // Missing all fields
      }
    });
    
    const { result } = renderHook(() => useDistributedCounter());
    
    // Call the get method
    const total = await result.current.getCounterValue('posts/post123', 'likes');
    
    // Verify returned total only counts existing fields
    expect(total).toBe(3); // Only the first shard has 'likes'
  });
  
  it('should handle errors when getting counter values', async () => {
    // Setup mock to throw an error
    getDocs.mockRejectedValueOnce(new Error('Query failed'));
    
    const { result } = renderHook(() => useDistributedCounter());
    
    // Call the method and expect it to throw
    await expect(result.current.getCounterValue('posts/post123', 'likes')).rejects.toThrow('Query failed');
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Error getting counter value:', expect.any(Error));
  });
  
  it('should get all counter values for a document', async () => {
    // Setup mock for getDocs to return multiple shards with different fields
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => {
        callback({ data: () => ({ likes: 3, shares: 1 }) });
        callback({ data: () => ({ likes: 5, comments: 10 }) });
        callback({ data: () => ({ shares: 4, views: 20 }) });
      }
    });
    
    const { result } = renderHook(() => useDistributedCounter());
    
    // Call the getAllCounterValues method
    const totals = await result.current.getAllCounterValues('posts/post123');
    
    // Verify collection query was created correctly
    expect(collection).toHaveBeenCalledWith('mocked-firestore', 'posts/post123/shards');
    expect(query).toHaveBeenCalledWith('mocked-collection-ref');
    
    // Verify returned totals for all fields
    expect(totals).toEqual({
      likes: 8,      // 3 + 5
      shares: 5,     // 1 + 4
      comments: 10,  // 10
      views: 20      // 20
    });
  });
  
  it('should ignore non-numeric fields when getting all counter values', async () => {
    // Setup mock for getDocs to return shards with non-numeric fields
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => {
        callback({ data: () => ({ likes: 3, name: 'John' }) });
        callback({ data: () => ({ likes: 5, metadata: { author: 'Jane' } }) });
      }
    });
    
    const { result } = renderHook(() => useDistributedCounter());
    
    // Call the getAllCounterValues method
    const totals = await result.current.getAllCounterValues('posts/post123');
    
    // Verify only numeric fields were summed
    expect(totals).toEqual({
      likes: 8  // 3 + 5
      // 'name' and 'metadata' should be ignored
    });
  });
  
  it('should handle errors when getting all counter values', async () => {
    // Setup mock to throw an error
    getDocs.mockRejectedValueOnce(new Error('Query failed'));
    
    const { result } = renderHook(() => useDistributedCounter());
    
    // Call the method and expect it to throw
    await expect(result.current.getAllCounterValues('posts/post123')).rejects.toThrow('Query failed');
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Error getting counter values:', expect.any(Error));
  });
}); 