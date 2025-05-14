import { renderHook, act } from '@testing-library/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import usePlaylistData from '../usePlaylistData';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn()
}));

// Mock react-firebase-hooks/auth
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

// Mock Firebase modules
jest.mock('../../firebase/firebase', () => ({
  firestore: {},
  auth: {}
}), { virtual: true });

describe('usePlaylistData', () => {
  // Mock user data
  const mockUser = {
    uid: 'test-user-123',
    displayName: 'Test User',
    email: 'test@example.com'
  };

  // Mock track data
  const mockTrack = {
    id: 'track-123',
    name: 'Test Track',
    audioUrl: 'https://example.com/test-track.mp3',
    key: 'C Major',
    bpm: 120,
    userId: 'creator-123',
    coverImage: 'https://example.com/cover.jpg',
    tags: ['Hip Hop', 'Beats']
  };

  // Mock playlist data
  const mockPlaylist = {
    id: 'playlist-123',
    name: 'Test Playlist',
    description: 'Test playlist description',
    userId: 'test-user-123',
    tracks: []
  };

  // Setup common test utilities
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth state - logged in
    useAuthState.mockReturnValue([mockUser, false, null]);
    
    // Mock document reference
    doc.mockReturnValue('playlist-doc-ref');
    
    // Mock successful playlist fetch by default
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ ...mockPlaylist })
    });
    
    // Mock successful document update by default
    updateDoc.mockResolvedValue(undefined);
    
    // Silence console errors for cleaner test output
    console.error = jest.fn();
  });

  it('should initialize with default state', () => {
    // Render hook
    const { result } = renderHook(() => usePlaylistData());
    
    // Check initial state
    expect(result.current.playlistData).toBeNull();
    expect(result.current.isAdding).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.addToPlaylist).toBe('function');
  });

  it('should add track to playlist successfully', async () => {
    // Render hook
    const { result } = renderHook(() => usePlaylistData());
    
    // Call addToPlaylist
    let success;
    await act(async () => {
      success = await result.current.addToPlaylist(mockTrack, mockPlaylist);
    });
    
    // Verify Firestore interactions
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'playlists', mockPlaylist.id);
    expect(getDoc).toHaveBeenCalledWith('playlist-doc-ref');
    
    // Verify playlist update with track added
    expect(updateDoc).toHaveBeenCalledWith('playlist-doc-ref', {
      tracks: [
        {
          id: mockTrack.id,
          name: mockTrack.name,
          audioUrl: mockTrack.audioUrl,
          key: mockTrack.key,
          bpm: mockTrack.bpm,
          addedAt: expect.any(Date),
          userId: mockTrack.userId,
          coverImage: mockTrack.coverImage,
          tags: mockTrack.tags
        }
      ]
    });
    
    // Verify success status
    expect(success).toBe(true);
    expect(result.current.isAdding).toBe(false);
  });

  it('should prevent adding to playlist when not logged in', async () => {
    // Mock user as not logged in
    useAuthState.mockReturnValue([null, false, null]);
    
    // Render hook
    const { result } = renderHook(() => usePlaylistData());
    
    // Try to add track
    let success;
    await act(async () => {
      success = await result.current.addToPlaylist(mockTrack, mockPlaylist);
    });
    
    // Verify no Firestore calls were made
    expect(doc).not.toHaveBeenCalled();
    expect(getDoc).not.toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalled();
    
    // Verify failure
    expect(success).toBe(false);
  });

  it('should prevent adding to invalid playlist', async () => {
    // Render hook
    const { result } = renderHook(() => usePlaylistData());
    
    // Try to add to invalid playlist
    let success;
    await act(async () => {
      success = await result.current.addToPlaylist(mockTrack, { name: 'Invalid Playlist' }); // No id
    });
    
    // Verify no Firestore calls were made
    expect(doc).not.toHaveBeenCalled();
    expect(getDoc).not.toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalled();
    
    // Verify failure
    expect(success).toBe(false);
  });

  it('should handle non-existent playlist', async () => {
    // Mock playlist not existing
    getDoc.mockResolvedValue({
      exists: () => false,
      data: () => null
    });
    
    // Render hook
    const { result } = renderHook(() => usePlaylistData());
    
    // Try to add to non-existent playlist
    let success;
    await act(async () => {
      success = await result.current.addToPlaylist(mockTrack, mockPlaylist);
    });
    
    // Verify failure
    expect(success).toBe(false);
    expect(console.error).toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('should handle adding duplicate track to playlist', async () => {
    // Mock playlist with the track already added
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        ...mockPlaylist,
        tracks: [{ id: mockTrack.id, name: 'Already Added Track' }]
      })
    });
    
    // Render hook
    const { result } = renderHook(() => usePlaylistData());
    
    // Try to add duplicate track
    let success;
    await act(async () => {
      success = await result.current.addToPlaylist(mockTrack, mockPlaylist);
    });
    
    // Verify no update was attempted
    expect(updateDoc).not.toHaveBeenCalled();
    
    // Verify duplicate was detected
    expect(success).toBe(false);
  });

  it('should handle track with missing properties', async () => {
    // Track with minimal properties
    const minimalTrack = {
      id: 'minimal-track-123'
      // Missing other properties
    };
    
    // Render hook
    const { result } = renderHook(() => usePlaylistData());
    
    // Add track with missing properties
    let success;
    await act(async () => {
      success = await result.current.addToPlaylist(minimalTrack, mockPlaylist);
    });
    
    // Verify Firestore update with safe defaults
    expect(updateDoc).toHaveBeenCalledWith('playlist-doc-ref', {
      tracks: [
        {
          id: minimalTrack.id,
          name: 'Untitled Track',  // Default name
          audioUrl: undefined,
          key: 'Unknown',         // Default key
          bpm: 0,                 // Default BPM
          addedAt: expect.any(Date),
          userId: 'unknown',      // Default userId
          tags: []                // Default empty tags
        }
      ]
    });
    
    // Verify success despite missing properties
    expect(success).toBe(true);
  });

  it('should handle update error', async () => {
    // Mock update error
    const mockError = new Error('Update failed');
    updateDoc.mockRejectedValue(mockError);
    
    // Render hook
    const { result } = renderHook(() => usePlaylistData());
    
    // Try to add track - should fail
    let success;
    await act(async () => {
      success = await result.current.addToPlaylist(mockTrack, mockPlaylist);
    });
    
    // Verify error handling
    expect(console.error).toHaveBeenCalledWith('Error adding to playlist:', mockError);
    expect(success).toBe(false);
    expect(result.current.isAdding).toBe(false);
  });

  it('should handle track without coverImage', async () => {
    // Track without coverImage
    const trackWithoutCover = { ...mockTrack };
    delete trackWithoutCover.coverImage;
    
    // Render hook
    const { result } = renderHook(() => usePlaylistData());
    
    // Add track without coverImage
    await act(async () => {
      await result.current.addToPlaylist(trackWithoutCover, mockPlaylist);
    });
    
    // Get the track from the updateDoc call
    const updateCall = updateDoc.mock.calls[0][1];
    const addedTrack = updateCall.tracks[0];
    
    // Verify coverImage property not included
    expect(addedTrack.hasOwnProperty('coverImage')).toBe(false);
  });

  it('should handle track with non-array tags', async () => {
    // Track with non-array tags
    const trackWithStringTags = { 
      ...mockTrack,
      tags: 'Hip Hop' // String instead of array
    };
    
    // Render hook
    const { result } = renderHook(() => usePlaylistData());
    
    // Add track with string tags
    await act(async () => {
      await result.current.addToPlaylist(trackWithStringTags, mockPlaylist);
    });
    
    // Get the track from the updateDoc call
    const updateCall = updateDoc.mock.calls[0][1];
    const addedTrack = updateCall.tracks[0];
    
    // Verify tags was converted to an empty array
    expect(Array.isArray(addedTrack.tags)).toBe(true);
    expect(addedTrack.tags).toEqual([]);
  });
}); 