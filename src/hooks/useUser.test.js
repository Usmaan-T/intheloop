import { renderHook, act, waitFor } from '@testing-library/react';
import useUser from './useUser';

// Mock Firebase modules
jest.mock('../firebase/firebase', () => ({
  firestore: {},
  storage: {}
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn().mockReturnValue({ id: 'user123' }),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    id: 'user123',
    data: () => ({
      username: 'testuser',
      bio: 'Test bio',
      photoURL: 'https://example.com/photo.jpg'
    })
  }),
  updateDoc: jest.fn().mockResolvedValue(true)
}));

// Mock Storage functions
jest.mock('firebase/storage', () => ({
  ref: jest.fn().mockReturnValue({}),
  uploadBytes: jest.fn().mockResolvedValue({}),
  getDownloadURL: jest.fn().mockResolvedValue('https://example.com/new-photo.jpg')
}));

// Mock Auth functions
jest.mock('firebase/auth', () => ({
  updateProfile: jest.fn().mockResolvedValue(true)
}));

// Mock Chakra UI
jest.mock('@chakra-ui/react', () => ({
  useToast: jest.fn().mockReturnValue(jest.fn())
}));

describe('useUser hook', () => {
  // Mock user data
  const mockUserData = {
    username: 'testuser',
    bio: 'Test bio',
    photoURL: 'https://example.com/photo.jpg'
  };

  // Mock auth user
  const mockAuthUser = {
    uid: 'user123',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/auth-photo.jpg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations as needed
    const { getDoc } = require('firebase/firestore');
    getDoc.mockResolvedValue({
      exists: () => true,
      id: 'user123',
      data: () => ({ ...mockUserData })
    });
  });

  describe('Basic data fetching', () => {
    test('should fetch user data with string userId', async () => {
      const { result } = renderHook(() => useUser('user123'));
      
      expect(result.current.loading).toBe(true);
      expect(result.current.userData).toBe(null);
      
      // Wait for the hook to finish loading
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(result.current.userData).toEqual({
        id: 'user123',
        ...mockUserData
      });
      expect(result.current.error).toBe(null);
      
      const { getDoc } = require('firebase/firestore');
      expect(getDoc).toHaveBeenCalledTimes(1);
    });
    
    test('should fetch and merge with auth user data', async () => {
      const { result } = renderHook(() => useUser(mockAuthUser));
      
      expect(result.current.loading).toBe(true);
      
      // Wait for the hook to finish loading
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(result.current.userData).toEqual(expect.objectContaining({
        id: 'user123',
        displayName: mockAuthUser.displayName,
        email: mockAuthUser.email
      }));
    });
    
    test('should handle error if user not found', async () => {
      // Override the mock for this test
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => false
      });
      
      const { result } = renderHook(() => useUser('nonexistent'));
      
      // Wait for the hook to finish loading
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(result.current.error).toBe('User not found');
      expect(result.current.userData).toBe(null);
    });
    
    test('should handle fetch error', async () => {
      // Override the mock for this test
      const { getDoc } = require('firebase/firestore');
      getDoc.mockRejectedValueOnce(new Error('Network error'));
      
      const { result } = renderHook(() => useUser('user123'));
      
      // Wait for the hook to finish loading
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(result.current.error).toBe('Network error');
      expect(result.current.userData).toBe(null);
    });
  });
  
  describe('Update functionality', () => {
    test('should not include update function if not enabled', async () => {
      const { result } = renderHook(() => useUser('user123'));
      
      // Wait for the hook to finish loading
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(result.current.updateUserData).toBe(null);
    });
    
    test('should include update function when enabled', async () => {
      const { result } = renderHook(() => 
        useUser('user123', { enableUpdates: true })
      );
      
      // Wait for the hook to finish loading
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      expect(typeof result.current.updateUserData).toBe('function');
    });
    
    test('should update user data', async () => {
      const { updateDoc } = require('firebase/firestore');
      
      const { result } = renderHook(() => 
        useUser('user123', { enableUpdates: true })
      );
      
      // Wait for the hook to finish loading
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      const updates = { bio: 'Updated bio' };
      
      await act(async () => {
        const success = await result.current.updateUserData(updates);
        expect(success).toBe(true);
      });
      
      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(result.current.userData.bio).toBe('Updated bio');
      expect(result.current.updating).toBe(false);
    });
    
    test('should handle image upload during update', async () => {
      const { updateDoc } = require('firebase/firestore');
      const { uploadBytes, getDownloadURL } = require('firebase/storage');
      const { updateProfile } = require('firebase/auth');
      
      const { result } = renderHook(() => 
        useUser(mockAuthUser, { enableUpdates: true })
      );
      
      // Wait for the hook to finish loading
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      const updates = { bio: 'Updated bio' };
      const mockFile = new File(['dummy content'], 'example.png', { type: 'image/png' });
      
      await act(async () => {
        const success = await result.current.updateUserData(updates, mockFile);
        expect(success).toBe(true);
      });
      
      expect(uploadBytes).toHaveBeenCalledTimes(1);
      expect(getDownloadURL).toHaveBeenCalledTimes(1);
      expect(updateProfile).toHaveBeenCalledTimes(1);
      expect(updateDoc).toHaveBeenCalledTimes(1);
      
      expect(result.current.userData.photoURL).toBe('https://example.com/new-photo.jpg');
      expect(result.current.userData.profilePicURL).toBe('https://example.com/new-photo.jpg');
    });
    
    test('should handle update errors', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockRejectedValueOnce(new Error('Update failed'));
      
      const { result } = renderHook(() => 
        useUser('user123', { enableUpdates: true })
      );
      
      // Wait for the hook to finish loading
      await waitFor(() => expect(result.current.loading).toBe(false));
      
      const updates = { bio: 'Updated bio' };
      
      await act(async () => {
        const success = await result.current.updateUserData(updates);
        expect(success).toBe(false);
      });
      
      expect(result.current.error).toBe('Update failed');
      expect(result.current.updating).toBe(false);
    });
  });
}); 