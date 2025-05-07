import { renderHook, act } from '@testing-library/react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import useUserLikes from './useUserLikes';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('../firebase/firebase', () => ({
  firestore: {}
}));

describe('useUserLikes Hook', () => {
  const mockUserId = 'user123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns loading state initially', () => {
    const { result } = renderHook(() => useUserLikes(mockUserId));
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.likedSamples).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  test('returns empty array when user has no likes', async () => {
    // Mock user document with no likes
    doc.mockReturnValue('user-doc-ref');
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ username: 'testuser' }) // no likes array
    });

    const { result } = renderHook(() => useUserLikes(mockUserId));
    
    // Wait for the async effect to complete
    await act(() => Promise.resolve());
    
    // Check final state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.likedSamples).toEqual([]);
    expect(result.current.error).toBe(null);
    
    // Verify Firestore was called correctly
    expect(doc).toHaveBeenCalledWith(firestore, 'users', mockUserId);
    expect(getDoc).toHaveBeenCalledWith('user-doc-ref');
    expect(query).not.toHaveBeenCalled(); // No query if no likes
  });

  test('returns empty array when user document not found', async () => {
    // Mock user document not found
    doc.mockReturnValue('user-doc-ref');
    getDoc.mockResolvedValue({
      exists: () => false
    });

    const { result } = renderHook(() => useUserLikes(mockUserId));
    
    // Wait for the async effect to complete
    await act(() => Promise.resolve());
    
    // Check final state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.likedSamples).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  test('fetches and sorts liked samples correctly', async () => {
    // Mock likes in user document
    const likedIds = ['sample1', 'sample2', 'sample3'];
    doc.mockReturnValue('user-doc-ref');
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ likes: likedIds })
    });

    // Mock samples query
    collection.mockReturnValue('samples-collection');
    query.mockReturnValue('samples-query');
    where.mockReturnValue('where-condition');
    
    // Mock liked samples data with timestamps
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const mockSamples = [
      {
        id: 'sample1',
        title: 'Sample 1',
        createdAt: { toDate: () => yesterday }
      },
      {
        id: 'sample2',
        title: 'Sample 2',
        createdAt: { toDate: () => today }
      },
      {
        id: 'sample3',
        title: 'Sample 3',
        createdAt: { toDate: () => today }
      }
    ];
    
    getDocs.mockResolvedValue({
      docs: mockSamples.map(sample => ({
        id: sample.id,
        data: () => sample
      }))
    });

    const { result } = renderHook(() => useUserLikes(mockUserId));
    
    // Wait for the async effect to complete
    await act(() => Promise.resolve());
    
    // Check final state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.likedSamples.length).toBe(3);
    
    // Samples should be sorted by date (newest first)
    expect(result.current.likedSamples[0].id).toBe('sample2');
    expect(result.current.likedSamples[1].id).toBe('sample3');
    expect(result.current.likedSamples[2].id).toBe('sample1');
    
    // Verify Firestore was called correctly
    expect(doc).toHaveBeenCalledWith(firestore, 'users', mockUserId);
    expect(getDoc).toHaveBeenCalledWith('user-doc-ref');
    expect(collection).toHaveBeenCalledWith(firestore, 'posts');
    expect(where).toHaveBeenCalledWith('__name__', 'in', expect.any(Array));
    expect(query).toHaveBeenCalled();
    expect(getDocs).toHaveBeenCalledWith('samples-query');
  });

  test('handles batch processing for more than 10 liked samples', async () => {
    // Create an array of 15 sample IDs
    const likedIds = Array.from({ length: 15 }, (_, i) => `sample${i + 1}`);
    
    doc.mockReturnValue('user-doc-ref');
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ likes: likedIds })
    });

    // Mock collections and queries
    collection.mockReturnValue('samples-collection');
    query.mockReturnValue('samples-query');
    where.mockReturnValue('where-condition');
    
    // Return different sample sets for each batch call
    const batch1 = Array.from({ length: 10 }, (_, i) => ({
      id: `sample${i + 1}`,
      title: `Sample ${i + 1}`,
      createdAt: { toDate: () => new Date() }
    }));
    
    const batch2 = Array.from({ length: 5 }, (_, i) => ({
      id: `sample${i + 11}`,
      title: `Sample ${i + 11}`,
      createdAt: { toDate: () => new Date() }
    }));
    
    // Mock first and second batch calls
    getDocs.mockResolvedValueOnce({
      docs: batch1.map(sample => ({
        id: sample.id,
        data: () => sample
      }))
    }).mockResolvedValueOnce({
      docs: batch2.map(sample => ({
        id: sample.id,
        data: () => sample
      }))
    });

    const { result } = renderHook(() => useUserLikes(mockUserId));
    
    // Wait for the async effect to complete
    await act(() => Promise.resolve());
    
    // Check final state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.likedSamples.length).toBe(15);
    
    // Verify Firestore query was called twice (once for each batch)
    expect(query).toHaveBeenCalledTimes(2);
    expect(getDocs).toHaveBeenCalledTimes(2);
  });

  test('handles error during fetch', async () => {
    // Mock Firestore error
    doc.mockReturnValue('user-doc-ref');
    getDoc.mockRejectedValue(new Error('Network error'));
    
    // Mock console.error to prevent test output noise
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useUserLikes(mockUserId));
    
    // Wait for the async effect to complete
    await act(() => Promise.resolve());
    
    // Check error state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.likedSamples).toEqual([]);
    expect(result.current.error).toBe('Network error');
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  test('handles null or undefined userId', async () => {
    const { result } = renderHook(() => useUserLikes(null));
    
    // Wait for the async effect to complete
    await act(() => Promise.resolve());
    
    // Should not load or cause error when userId is null
    expect(result.current.isLoading).toBe(false);
    expect(result.current.likedSamples).toEqual([]);
    expect(result.current.error).toBe(null);
    
    // Verify Firestore was not called
    expect(doc).not.toHaveBeenCalled();
    expect(getDoc).not.toHaveBeenCalled();
  });
}); 