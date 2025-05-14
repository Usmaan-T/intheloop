import { renderHook, act } from '@testing-library/react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import usePopularSamples from '../usePopularSamples';
import COLLECTIONS from '../../firebase/collections';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn()
}));

// Mock Firebase modules
jest.mock('../../firebase/firebase', () => ({
  firestore: {}
}), { virtual: true });

describe('usePopularSamples', () => {
  // Mock sample data
  const mockSamples = [
    { 
      id: 'sample1', 
      name: 'Popular Beat 1', 
      tags: ['Hip Hop', 'Drums'],
      likes: 120,
      popularityScores: { 
        daily: 50,
        weekly: 200,
        monthly: 500,
        allTime: 1200
      }
    },
    { 
      id: 'sample2', 
      name: 'Popular Beat 2', 
      tags: ['Lo-Fi', 'Piano'],
      likes: 100,
      popularityScores: { 
        daily: 40,
        weekly: 180,
        monthly: 450,
        allTime: 1000
      }
    },
    { 
      id: 'sample3', 
      name: 'Popular Beat 3', 
      tags: ['Jazz', 'Saxophone'],
      likes: 80,
      popularityScores: { 
        daily: 30,
        weekly: 150,
        monthly: 400,
        allTime: 800
      }
    },
    { 
      id: 'sample4', 
      name: 'Popular Beat 4', 
      tags: ['Electronic', 'Synth'],
      likes: 60,
      popularityScores: { 
        daily: 20,
        weekly: 120,
        monthly: 350,
        allTime: 600
      }
    },
    { 
      id: 'sample5', 
      name: 'Popular Beat 5', 
      tags: ['Rock', 'Guitar'],
      likes: 50,
      popularityScores: { 
        daily: 15,
        weekly: 100,
        monthly: 300,
        allTime: 500
      }
    },
    { 
      id: 'sample6', 
      name: 'Legacy Sample', 
      tags: ['Drum & Bass'],
      likes: 40,
      // This sample doesn't have popularity scores, testing fallback
    }
  ];

  // Setup common test utilities
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Firebase functions
    collection.mockReturnValue('samples-collection');
    orderBy.mockReturnValue('orderBy-clause');
    limit.mockReturnValue('limit-clause');
    query.mockReturnValue('samples-query');
    
    // Silence console errors for cleaner test output
    console.error = jest.fn();
  });

  it('should initialize with loading state and empty samples array', () => {
    // Setup mock for getDocs that never resolves to keep loading state
    getDocs.mockImplementation(() => new Promise(() => {}));
    
    // Render hook
    const { result } = renderHook(() => usePopularSamples());
    
    // Check initial state
    expect(result.current.samples).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch popular samples with default parameters', async () => {
    // Mock samples query response (default is 10 samples, weekly timeframe)
    const querySnapshotMock = mockSamples.map((sample, index) => ({
      id: sample.id,
      data: () => sample
    }));
    
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => querySnapshotMock.forEach(callback)
    });
    
    // Render hook with default parameters
    const { result } = renderHook(() => usePopularSamples());
    
    // Wait for effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify Firestore query was called with correct parameters
    expect(collection).toHaveBeenCalledWith(expect.anything(), COLLECTIONS.POSTS);
    expect(orderBy).toHaveBeenCalledWith('popularityScores.weekly', 'desc');
    expect(limit).toHaveBeenCalledWith(10); // Default limit
    expect(query).toHaveBeenCalledWith('samples-collection', 'orderBy-clause', 'limit-clause');
    expect(getDocs).toHaveBeenCalledWith('samples-query');
    
    // Verify state after fetch
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.samples.length).toBe(mockSamples.length);
    
    // Verify sample data and popularityScore computation
    const firstSample = result.current.samples.find(s => s.id === 'sample1');
    expect(firstSample).toBeDefined();
    expect(firstSample.popularityScore).toBe(mockSamples[0].popularityScores.weekly);
  });

  it('should fetch samples with custom limit', async () => {
    // Custom limit to test
    const customLimit = 3;
    
    // Mock samples query response with limited samples
    const querySnapshotMock = mockSamples.slice(0, customLimit).map((sample) => ({
      id: sample.id,
      data: () => sample
    }));
    
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => querySnapshotMock.forEach(callback)
    });
    
    // Render hook with custom limit
    const { result } = renderHook(() => usePopularSamples(customLimit));
    
    // Wait for effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify limit parameter was passed correctly
    expect(limit).toHaveBeenCalledWith(customLimit);
    
    // Verify state after fetch
    expect(result.current.samples.length).toBe(customLimit);
  });

  it('should fetch samples with different time range parameters', async () => {
    // Test different time ranges
    const timeRanges = ['daily', 'monthly', 'allTime'];
    
    for (const range of timeRanges) {
      jest.clearAllMocks();
      
      // Mock samples query response
      const querySnapshotMock = mockSamples.map((sample) => ({
        id: sample.id,
        data: () => sample
      }));
      
      getDocs.mockResolvedValueOnce({
        forEach: (callback) => querySnapshotMock.forEach(callback)
      });
      
      // Render hook with specific time range
      const { result } = renderHook(() => usePopularSamples(10, range));
      
      // Wait for effect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      // Verify orderBy parameter uses correct timeRange
      expect(orderBy).toHaveBeenCalledWith(`popularityScores.${range}`, 'desc');
      
      // Verify popularityScore is set to the correct timeRange value
      const firstSample = result.current.samples.find(s => s.id === 'sample1');
      expect(firstSample.popularityScore).toBe(mockSamples[0].popularityScores[range]);
    }
  });

  it('should fall back to likes for invalid time range', async () => {
    // Mock samples query response
    const querySnapshotMock = mockSamples.map((sample) => ({
      id: sample.id,
      data: () => sample
    }));
    
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => querySnapshotMock.forEach(callback)
    });
    
    // Render hook with invalid time range
    const { result } = renderHook(() => usePopularSamples(10, 'invalid_range'));
    
    // Wait for effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify fallback to likes for orderBy
    expect(orderBy).toHaveBeenCalledWith('likes', 'desc');
    
    // Verify samples were still loaded
    expect(result.current.samples.length).toBe(mockSamples.length);
  });

  it('should handle samples without popularity scores', async () => {
    // Include a sample without popularity scores
    const sampleWithoutScores = mockSamples[5]; // Legacy Sample
    
    // Mock query response with just this sample
    const querySnapshotMock = [{
      id: sampleWithoutScores.id,
      data: () => sampleWithoutScores
    }];
    
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => querySnapshotMock.forEach(callback)
    });
    
    // Render hook
    const { result } = renderHook(() => usePopularSamples());
    
    // Wait for effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify sample was loaded
    expect(result.current.samples.length).toBe(1);
    
    // Verify popularityScore falls back to likes
    const sample = result.current.samples[0];
    expect(sample.popularityScore).toBe(sampleWithoutScores.likes);
  });

  it('should handle fetch error', async () => {
    // Mock fetch error
    const mockError = new Error('Failed to fetch samples');
    getDocs.mockRejectedValueOnce(mockError);
    
    // Render hook
    const { result } = renderHook(() => usePopularSamples());
    
    // Wait for effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify error handling
    expect(console.error).toHaveBeenCalledWith('Error fetching popular samples:', mockError);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(mockError.message);
    expect(result.current.samples).toEqual([]);
  });

  it('should update when parameters change', async () => {
    // Initial parameters
    const initialLimit = 2;
    const initialTimeRange = 'daily';
    
    // Mock first samples query response
    const firstQuerySnapshotMock = mockSamples.slice(0, initialLimit).map((sample) => ({
      id: sample.id,
      data: () => sample
    }));
    
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => firstQuerySnapshotMock.forEach(callback)
    });
    
    // Render hook with initial parameters
    const { result, rerender } = renderHook(
      (props) => usePopularSamples(props.limit, props.timeRange), 
      { initialProps: { limit: initialLimit, timeRange: initialTimeRange } }
    );
    
    // Wait for first query to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify first query results
    expect(result.current.samples.length).toBe(initialLimit);
    expect(orderBy).toHaveBeenCalledWith('popularityScores.daily', 'desc');
    expect(limit).toHaveBeenCalledWith(initialLimit);
    
    // Clear mocks for second query
    jest.clearAllMocks();
    
    // New parameters
    const newLimit = 4;
    const newTimeRange = 'monthly';
    
    // Mock second samples query response
    const secondQuerySnapshotMock = mockSamples.slice(0, newLimit).map((sample) => ({
      id: sample.id,
      data: () => sample
    }));
    
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => secondQuerySnapshotMock.forEach(callback)
    });
    
    // Rerender with new parameters
    rerender({ limit: newLimit, timeRange: newTimeRange });
    
    // Wait for second query to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify second query was called with new parameters
    expect(orderBy).toHaveBeenCalledWith('popularityScores.monthly', 'desc');
    expect(limit).toHaveBeenCalledWith(newLimit);
    expect(result.current.samples.length).toBe(newLimit);
    
    // Verify popularityScore is from monthly data
    expect(result.current.samples[0].popularityScore).toBe(mockSamples[0].popularityScores.monthly);
  });
}); 