import { renderHook, act } from '@testing-library/react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import useSignInWithGoogle from '../useSignInWithGoogle';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
  signInWithPopup: jest.fn()
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn()
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Firebase modules
jest.mock('../../firebase/firebase', () => ({
  auth: {},
  firestore: {}
}), { virtual: true });

// Mock console.error to avoid test noise
const originalConsoleError = console.error;

describe('useSignInWithGoogle', () => {
  const mockUser = {
    uid: 'user123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg'
  };

  // Mock user document
  const mockUserDoc = {
    uid: 'user123',
    email: 'test@example.com',
    username: 'testuser',
    bio: '',
    profilePicURL: 'https://example.com/photo.jpg',
    followers: [],
    following: [],
    posts: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    console.error = jest.fn();

    // Reset mock implementations to their defaults
    doc.mockReturnValue('mock-doc-ref');
    signInWithPopup.mockResolvedValue({ user: mockUser });
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSignInWithGoogle());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.success).toBe(false);
    expect(typeof result.current.signInWithGoogle).toBe('function');
  });

  it('should handle successful sign-in for a new user', async () => {
    // Mock getDoc to return that user doesn't exist
    getDoc.mockResolvedValueOnce({ exists: () => false });
    setDoc.mockResolvedValueOnce();
    
    const { result } = renderHook(() => useSignInWithGoogle());
    
    await act(async () => {
      const user = await result.current.signInWithGoogle();
      expect(user).toEqual(mockUser);
    });
    
    // Check that GoogleAuthProvider was instantiated
    expect(GoogleAuthProvider).toHaveBeenCalled();
    
    // Check that signInWithPopup was called
    expect(signInWithPopup).toHaveBeenCalled();
    
    // Check that Firestore was queried for the user document
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', mockUser.uid);
    expect(getDoc).toHaveBeenCalled();
    
    // Check that a new user document was created
    expect(setDoc).toHaveBeenCalled();
    expect(setDoc.mock.calls[0][1]).toMatchObject({
      uid: mockUser.uid,
      email: mockUser.email,
      username: expect.any(String)
    });
    
    // Check localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('user-info', expect.any(String));
    
    // Check final state
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.success).toBe(true);
  });

  it('should handle successful sign-in for an existing user', async () => {
    // Mock getDoc to return that user exists
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => mockUserDoc
    });
    
    const { result } = renderHook(() => useSignInWithGoogle());
    
    await act(async () => {
      await result.current.signInWithGoogle();
    });
    
    // Check that setDoc was not called (no new user creation)
    expect(setDoc).not.toHaveBeenCalled();
    
    // Check localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('user-info', JSON.stringify(mockUserDoc));
    
    // Check final state
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.success).toBe(true);
  });

  it('should handle username generation when displayName is missing', async () => {
    // Create a user without displayName
    const userWithoutName = { 
      ...mockUser, 
      displayName: null 
    };
    signInWithPopup.mockResolvedValueOnce({ user: userWithoutName });
    
    // Mock getDoc to return that user doesn't exist
    getDoc.mockResolvedValueOnce({ exists: () => false });
    
    const { result } = renderHook(() => useSignInWithGoogle());
    
    await act(async () => {
      await result.current.signInWithGoogle();
    });
    
    // Check how the username was generated using email
    const createdDoc = setDoc.mock.calls[0][1];
    expect(createdDoc.username).toBe('test');
  });

  it('should handle random username generation when email and displayName are missing', async () => {
    // Create a user without displayName or email
    const userWithoutInfo = { 
      uid: 'user123',
      displayName: null,
      email: null
    };
    signInWithPopup.mockResolvedValueOnce({ user: userWithoutInfo });
    
    // Mock getDoc to return that user doesn't exist
    getDoc.mockResolvedValueOnce({ exists: () => false });
    
    // Mock Math.random for testing
    const originalRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(0.5);
    
    const { result } = renderHook(() => useSignInWithGoogle());
    
    await act(async () => {
      await result.current.signInWithGoogle();
    });
    
    // Check username fallback pattern
    const createdDoc = setDoc.mock.calls[0][1];
    expect(createdDoc.username).toBe('user5000');
    
    // Restore Math.random
    Math.random = originalRandom;
  });

  it('should handle popup closed by user error', async () => {
    // Mock signInWithPopup to throw a specific error
    signInWithPopup.mockRejectedValueOnce({
      code: 'auth/popup-closed-by-user',
      message: 'The popup has been closed by the user'
    });
    
    const { result } = renderHook(() => useSignInWithGoogle());
    
    await act(async () => {
      const user = await result.current.signInWithGoogle();
      expect(user).toBeNull();
    });
    
    // Check error handling
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Sign-in cancelled. The popup was closed.');
    expect(result.current.user).toBeNull();
    expect(result.current.success).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle network error', async () => {
    // Mock signInWithPopup to throw a network error
    signInWithPopup.mockRejectedValueOnce({
      code: 'auth/network-request-failed',
      message: 'Network error'
    });
    
    const { result } = renderHook(() => useSignInWithGoogle());
    
    await act(async () => {
      await result.current.signInWithGoogle();
    });
    
    // Check error handling
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error. Please check your connection.');
    expect(result.current.user).toBeNull();
    expect(result.current.success).toBe(false);
  });

  it('should handle generic error', async () => {
    // Mock signInWithPopup to throw a generic error
    signInWithPopup.mockRejectedValueOnce({
      code: 'auth/internal-error',
      message: 'Internal error'
    });
    
    const { result } = renderHook(() => useSignInWithGoogle());
    
    await act(async () => {
      await result.current.signInWithGoogle();
    });
    
    // Check error handling
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Internal error');
    expect(result.current.user).toBeNull();
    expect(result.current.success).toBe(false);
  });

  it('should handle firestore errors', async () => {
    // Mock successful sign-in but Firestore error
    signInWithPopup.mockResolvedValueOnce({ user: mockUser });
    getDoc.mockRejectedValueOnce(new Error('Firestore error'));
    
    const { result } = renderHook(() => useSignInWithGoogle());
    
    await act(async () => {
      await result.current.signInWithGoogle();
    });
    
    // Check error handling
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.user).toBeNull();
    expect(result.current.success).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });
}); 