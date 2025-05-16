import { renderHook, act } from '@testing-library/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import useProfileData from '../useProfileData';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn()
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  updateProfile: jest.fn()
}));

// Mock Chakra UI toast
jest.mock('@chakra-ui/react', () => ({
  useToast: () => jest.fn()
}));

// Mock the Firebase modules
jest.mock('../../firebase/firebase', () => ({
  firestore: {},
  storage: {}
}), { virtual: true });

describe('useProfileData', () => {
  // Mock user
  const mockUser = {
    uid: 'test-user-123',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/old-photo.jpg'
  };

  // Mock profile data
  const mockProfileData = {
    username: 'Test User',
    email: 'test@example.com',
    bio: 'Test bio',
    location: 'Test City',
    profilePicURL: 'https://example.com/old-photo.jpg',
    tags: ['Hip Hop', 'Beats'],
    socialLinks: {
      twitter: 'https://twitter.com/testuser',
      instagram: 'https://instagram.com/testuser'
    }
  };

  // Setup common test utilities
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock document reference
    doc.mockReturnValue('user-doc-ref');
    
    // Mock successful document fetch by default
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockProfileData
    });
    
    // Mock successful document update by default
    updateDoc.mockResolvedValue(undefined);
    
    // Mock successful profile update by default
    updateProfile.mockResolvedValue(undefined);
    
    // Mock storage references and operations
    ref.mockReturnValue('storage-ref');
    uploadBytes.mockResolvedValue(undefined);
    getDownloadURL.mockResolvedValue('https://example.com/new-photo.jpg');
    
    // Silence console errors for cleaner test output
    console.error = jest.fn();
  });

  it('should initialize with null profile data and loading state', () => {
    // Render the hook without a user
    const { result } = renderHook(() => useProfileData(null));
    
    // Check initial state
    expect(result.current.profileData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(typeof result.current.updateProfileData).toBe('function');
  });

  it('should fetch profile data when user is provided', async () => {
    // Render the hook with a user
    const { result } = renderHook(() => useProfileData(mockUser));
    
    // Initial state should show loading
    expect(result.current.isLoading).toBe(true);
    
    // Wait for the effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify profile data was fetched and set
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', mockUser.uid);
    expect(getDoc).toHaveBeenCalledWith('user-doc-ref');
    expect(result.current.profileData).toEqual(mockProfileData);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle profile data fetch error', async () => {
    // Mock a fetch error
    const mockError = new Error('Failed to fetch profile');
    getDoc.mockRejectedValueOnce(mockError);
    
    // Render the hook with a user
    const { result } = renderHook(() => useProfileData(mockUser));
    
    // Wait for the effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify error handling
    expect(console.error).toHaveBeenCalledWith(
      "Error fetching profile data:",
      mockError
    );
    expect(result.current.profileData).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle case where profile document does not exist', async () => {
    // Mock document that doesn't exist
    getDoc.mockResolvedValueOnce({
      exists: () => false,
      data: () => null
    });
    
    // Render the hook with a user
    const { result } = renderHook(() => useProfileData(mockUser));
    
    // Wait for the effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Profile data should still be null
    expect(result.current.profileData).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should update profile data without image upload', async () => {
    // Prepare updates
    const updates = {
      username: 'Updated User',
      bio: 'Updated bio'
    };
    
    // Render the hook with a user
    const { result } = renderHook(() => useProfileData(mockUser));
    
    // Wait for initial load to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Update profile
    let updateSuccess;
    await act(async () => {
      updateSuccess = await result.current.updateProfileData(updates);
    });
    
    // Verify update
    expect(updateDoc).toHaveBeenCalledWith('user-doc-ref', updates);
    expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Updated User' });
    expect(updateSuccess).toBe(true);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.profileData).toEqual({
      ...mockProfileData,
      ...updates
    });
  });

  it('should update profile data with image upload', async () => {
    // Prepare updates and mock file
    const updates = {
      username: 'Updated User',
      bio: 'Updated bio'
    };
    const mockImageFile = new File(['dummy content'], 'profile.png', { type: 'image/png' });
    
    // Render the hook with a user
    const { result } = renderHook(() => useProfileData(mockUser));
    
    // Wait for initial load to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Update profile with image
    let updateSuccess;
    await act(async () => {
      updateSuccess = await result.current.updateProfileData(updates, mockImageFile);
    });
    
    // Verify update with image
    expect(ref).toHaveBeenCalledWith(expect.anything(), `profileImages/${mockUser.uid}`);
    expect(uploadBytes).toHaveBeenCalledWith('storage-ref', mockImageFile);
    expect(getDownloadURL).toHaveBeenCalledWith('storage-ref');
    
    // Verify Firebase Auth profile update
    expect(updateProfile).toHaveBeenCalledWith(mockUser, {
      displayName: 'Updated User',
      photoURL: 'https://example.com/new-photo.jpg'
    });
    
    // Verify document update with photo URL
    expect(updateDoc).toHaveBeenCalledWith('user-doc-ref', {
      ...updates,
      photoURL: 'https://example.com/new-photo.jpg',
      profilePicURL: 'https://example.com/new-photo.jpg'
    });
    
    expect(updateSuccess).toBe(true);
  });

  it('should handle profile update error', async () => {
    // Mock an update error
    const mockError = new Error('Update failed');
    updateDoc.mockRejectedValueOnce(mockError);
    
    // Prepare updates
    const updates = {
      username: 'Updated User',
      bio: 'Updated bio'
    };
    
    // Render the hook with a user
    const { result } = renderHook(() => useProfileData(mockUser));
    
    // Wait for initial load to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Update profile with error
    let updateSuccess;
    await act(async () => {
      updateSuccess = await result.current.updateProfileData(updates);
    });
    
    // Verify error handling
    expect(console.error).toHaveBeenCalledWith('Profile update error:', mockError);
    expect(updateSuccess).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    // Profile data should remain unchanged
    expect(result.current.profileData).toEqual(mockProfileData);
  });

  it('should handle image upload error', async () => {
    // Mock an upload error
    const mockError = new Error('Upload failed');
    uploadBytes.mockRejectedValueOnce(mockError);
    
    // Prepare updates and mock file
    const updates = {
      username: 'Updated User',
      bio: 'Updated bio'
    };
    const mockImageFile = new File(['dummy content'], 'profile.png', { type: 'image/png' });
    
    // Render the hook with a user
    const { result } = renderHook(() => useProfileData(mockUser));
    
    // Wait for initial load to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Update profile with image - should fail
    let updateSuccess;
    await act(async () => {
      updateSuccess = await result.current.updateProfileData(updates, mockImageFile);
    });
    
    // Verify error handling
    expect(console.error).toHaveBeenCalledWith('Profile update error:', mockError);
    expect(updateSuccess).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    // Profile data should remain unchanged
    expect(result.current.profileData).toEqual(mockProfileData);
  });

  it('should not attempt update if no user is provided', async () => {
    // Prepare updates
    const updates = {
      username: 'Updated User',
      bio: 'Updated bio'
    };
    
    // Render the hook without a user
    const { result } = renderHook(() => useProfileData(null));
    
    // Try to update profile
    let updateSuccess;
    await act(async () => {
      updateSuccess = await result.current.updateProfileData(updates);
    });
    
    // Verify no updates were attempted
    expect(updateDoc).not.toHaveBeenCalled();
    expect(updateProfile).not.toHaveBeenCalled();
    expect(updateSuccess).toBe(false);
  });
}); 