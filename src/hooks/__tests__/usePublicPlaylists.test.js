import { renderHook, act } from '@testing-library/react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { usePublicPlaylists } from '../usePublicPlaylists';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn()
}));

// Mock Firebase app
jest.mock('../../firebase/firebase', () => ({
  firestore: {}
}), { virtual: true });

// Mock console.error
console.error = jest.fn();

describe('usePublicPlaylists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch public playlists successfully', async () => {
    // Mock data
    const mockPlaylistsData = [
      { id: 'playlist1', name: 'Playlist 1', tracks: ['track1', 'track2'], privacy: 'public', createdAt: new Date() },
      { id: 'playlist2', name: 'Playlist 2', tracks: ['track3', 'track4'], privacy: 'public', createdAt: new Date() }
    ];

    // Mock query result
    const mockDocs = mockPlaylistsData.map(playlist => ({
      id: playlist.id,
      data: () => ({
        name: playlist.name,
        tracks: playlist.tracks,
        privacy: playlist.privacy,
        createdAt: playlist.createdAt
      })
    }));

    // Setup mocks
    collection.mockReturnValue('playlists-collection');
    where.mockReturnValue('where-clause');
    orderBy.mockReturnValue('orderBy-clause');
    limit.mockReturnValue('limit-clause');
    query.mockReturnValue('playlists-query');
    getDocs.mockResolvedValue({
      docs: mockDocs
    });

    // Render hook
    const { result } = renderHook(() => usePublicPlaylists(5));

    // Initial state - loading
    expect(result.current.loading).toBe(true);
    expect(result.current.playlists).toEqual([]);
    expect(result.current.error).toBe(null);

    // Wait for async effect to complete
    await act(async () => {
      // Wait for effect to finish
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Check Firestore query was called correctly
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'playlists');
    expect(where).toHaveBeenCalledWith('privacy', '==', 'public');
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(limit).toHaveBeenCalledWith(5);
    expect(query).toHaveBeenCalledWith(
      'playlists-collection',
      'where-clause',
      'orderBy-clause',
      'limit-clause'
    );
    expect(getDocs).toHaveBeenCalledWith('playlists-query');

    // After data is loaded
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.playlists).toHaveLength(2);
    expect(result.current.playlists[0].id).toBe('playlist1');
    expect(result.current.playlists[1].id).toBe('playlist2');
  });

  it('should handle fetch error correctly', async () => {
    // Setup mock error
    const mockError = new Error('Failed to fetch playlists');
    collection.mockReturnValue('playlists-collection');
    where.mockReturnValue('where-clause');
    orderBy.mockReturnValue('orderBy-clause');
    limit.mockReturnValue('limit-clause');
    query.mockReturnValue('playlists-query');
    getDocs.mockRejectedValue(mockError);

    // Render hook
    const { result } = renderHook(() => usePublicPlaylists());

    // Wait for async effect to complete
    await act(async () => {
      // Wait for effect to finish
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify error handling
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(mockError);
    expect(result.current.playlists).toEqual([]);
    expect(console.error).toHaveBeenCalledWith('Error fetching public playlists:', mockError);
  });

  it('should use default limit when not specified', async () => {
    // Mock empty result
    collection.mockReturnValue('playlists-collection');
    where.mockReturnValue('where-clause');
    orderBy.mockReturnValue('orderBy-clause');
    limit.mockReturnValue('limit-clause');
    query.mockReturnValue('playlists-query');
    getDocs.mockResolvedValue({ docs: [] });

    // Render hook with default limit
    renderHook(() => usePublicPlaylists());

    // Wait for async effect to complete
    await act(async () => {
      // Wait for effect to finish
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify default limit was used
    expect(limit).toHaveBeenCalledWith(10);
  });

  it('should re-fetch when limit changes', async () => {
    // Mock empty result
    collection.mockReturnValue('playlists-collection');
    where.mockReturnValue('where-clause');
    orderBy.mockReturnValue('orderBy-clause');
    limit.mockReturnValue('limit-clause');
    query.mockReturnValue('playlists-query');
    getDocs.mockResolvedValue({ docs: [] });

    // Render hook with initial limit
    const { rerender } = renderHook(({ limitCount }) => usePublicPlaylists(limitCount), {
      initialProps: { limitCount: 5 }
    });

    // Wait for initial fetch
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(limit).toHaveBeenCalledWith(5);
    expect(getDocs).toHaveBeenCalledTimes(1);

    // Clear mocks to track new calls
    jest.clearAllMocks();

    // Re-render with different limit
    rerender({ limitCount: 20 });

    // Wait for re-fetch
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify new limit was used and query was executed again
    expect(limit).toHaveBeenCalledWith(20);
    expect(getDocs).toHaveBeenCalledTimes(1);
  });
}); 