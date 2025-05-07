import { renderHook, act } from '@testing-library/react';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { setDoc, doc } from 'firebase/firestore';
import useSignUpWithEmailAndPassword from '../useSignUpWithEmailAndPassword';

// Mock Firebase dependencies
jest.mock('../../firebase/firebase', () => ({
  auth: {},
  firestore: {}
}), { virtual: true });

jest.mock('react-firebase-hooks/auth', () => ({
  useCreateUserWithEmailAndPassword: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  setDoc: jest.fn(),
  doc: jest.fn(),
}));

// Mock localStorage
const mockSetItem = jest.fn();
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: mockSetItem,
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock console.log
console.log = jest.fn();

describe('useSignUpWithEmailAndPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully sign up a new user and create a user document', async () => {
    // Mock user created in Firebase Auth
    const mockNewUser = {
      user: {
        uid: 'test-uid',
        email: 'test@example.com',
      },
    };

    // Mock Firestore document reference
    const mockDocRef = { id: 'test-uid' };
    doc.mockReturnValue(mockDocRef);
    setDoc.mockResolvedValue(undefined);

    // Mock user creation with email/password
    const mockCreateUserFn = jest.fn().mockResolvedValue(mockNewUser);
    useCreateUserWithEmailAndPassword.mockReturnValue([
      mockCreateUserFn,
      mockNewUser,
      false, // loading
      null, // error
    ]);

    // Render the hook
    const { result } = renderHook(() => useSignUpWithEmailAndPassword());

    // Initial state check
    expect(result.current.success).toBe(false);

    // Call signup with valid inputs
    await act(async () => {
      await result.current.signup({
        email: 'test@example.com',
        password: 'Password123',
        username: 'testuser',
      });
    });

    // Verify that createUserWithEmailAndPassword was called with correct params
    expect(mockCreateUserFn).toHaveBeenCalledWith(
      'test@example.com',
      'Password123'
    );

    // Verify that doc was called to create a reference to the user document
    expect(doc).toHaveBeenCalledWith(
      expect.anything(),
      'users',
      'test-uid'
    );

    // Verify that setDoc was called to store user data
    expect(setDoc).toHaveBeenCalledWith(
      mockDocRef,
      expect.objectContaining({
        uid: 'test-uid',
        email: 'test@example.com',
        username: 'testuser',
        bio: "",
        profilePicURL: "",
        followers: [],
        following: [],
        posts: [],
        createdAt: expect.any(Number),
        currentStreak: 0,
        longestStreak: 0,
        lastUploadDate: null,
        streakUpdatedToday: false
      })
    );

    // Verify localStorage was updated
    expect(mockSetItem).toHaveBeenCalledWith(
      'user-info',
      expect.any(String)
    );

    // Verify success state is true
    expect(result.current.success).toBe(true);
  });

  it('should handle missing signup fields', async () => {
    // Mock user creation function
    const mockCreateUserFn = jest.fn();
    useCreateUserWithEmailAndPassword.mockReturnValue([
      mockCreateUserFn,
      null, // user
      false, // loading
      null, // error
    ]);

    // Render the hook
    const { result } = renderHook(() => useSignUpWithEmailAndPassword());

    // Call signup with missing email
    await act(async () => {
      await result.current.signup({
        password: 'Password123',
        username: 'testuser',
      });
    });

    // Call signup with missing password
    await act(async () => {
      await result.current.signup({
        email: 'test@example.com',
        username: 'testuser',
      });
    });

    // Call signup with missing username
    await act(async () => {
      await result.current.signup({
        email: 'test@example.com',
        password: 'Password123',
      });
    });

    // Verify error message logged
    expect(console.log).toHaveBeenCalledWith('Please fill in all fields');

    // Verify that createUserWithEmailAndPassword was not called
    expect(mockCreateUserFn).not.toHaveBeenCalled();

    // Verify that doc was not called
    expect(doc).not.toHaveBeenCalled();

    // Verify that setDoc was not called
    expect(setDoc).not.toHaveBeenCalled();

    // Verify localStorage was not updated
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('should handle signup error from Firebase auth', async () => {
    // Mock Firebase auth error
    const mockError = new Error('Email already in use');
    
    // Mock user creation function to throw error
    const mockCreateUserFn = jest.fn().mockRejectedValue(mockError);
    useCreateUserWithEmailAndPassword.mockReturnValue([
      mockCreateUserFn,
      null, // user
      false, // loading
      mockError, // error
    ]);

    // Render the hook
    const { result } = renderHook(() => useSignUpWithEmailAndPassword());

    // Call signup with valid inputs
    await act(async () => {
      await result.current.signup({
        email: 'existing@example.com',
        password: 'Password123',
        username: 'existinguser',
      });
    });

    // Verify that createUserWithEmailAndPassword was called
    expect(mockCreateUserFn).toHaveBeenCalled();

    // Verify error was logged
    expect(console.log).toHaveBeenCalledWith(mockError);

    // Verify that doc and setDoc were not called
    expect(doc).not.toHaveBeenCalled();
    expect(setDoc).not.toHaveBeenCalled();

    // Verify localStorage was not updated
    expect(mockSetItem).not.toHaveBeenCalled();

    // Verify success state is false
    expect(result.current.success).toBe(false);
  });

  it('should handle Firestore document creation error', async () => {
    // Mock user created in Firebase Auth
    const mockNewUser = {
      user: {
        uid: 'test-uid',
        email: 'test@example.com',
      },
    };

    // Mock Firestore error
    const firestoreError = new Error('Firestore write failed');
    doc.mockReturnValue({ id: 'test-uid' });
    setDoc.mockRejectedValue(firestoreError);

    // Mock user creation with email/password
    const mockCreateUserFn = jest.fn().mockResolvedValue(mockNewUser);
    useCreateUserWithEmailAndPassword.mockReturnValue([
      mockCreateUserFn,
      mockNewUser,
      false, // loading
      null, // error
    ]);

    // Render the hook
    const { result } = renderHook(() => useSignUpWithEmailAndPassword());

    // Call signup with valid inputs
    await act(async () => {
      await result.current.signup({
        email: 'test@example.com',
        password: 'Password123',
        username: 'testuser',
      });
    });

    // Verify that createUserWithEmailAndPassword was called
    expect(mockCreateUserFn).toHaveBeenCalled();

    // Verify that setDoc was called but failed
    expect(setDoc).toHaveBeenCalled();

    // Verify Firestore error was logged
    expect(console.log).toHaveBeenCalledWith(firestoreError);

    // Verify localStorage was not updated due to error
    expect(mockSetItem).not.toHaveBeenCalled();

    // Verify success state is still false
    expect(result.current.success).toBe(false);
  });

  it('should expose the correct properties', () => {
    // Mock states for hook
    const mockUser = { uid: 'test-uid' };
    const mockError = null;
    const mockLoading = false;
    const mockCreateUserFn = jest.fn();

    useCreateUserWithEmailAndPassword.mockReturnValue([
      mockCreateUserFn,
      mockUser,
      mockLoading,
      mockError,
    ]);

    // Render the hook
    const { result } = renderHook(() => useSignUpWithEmailAndPassword());

    // Verify the hook exposes the expected properties
    expect(result.current).toHaveProperty('signup');
    expect(result.current).toHaveProperty('user', mockUser);
    expect(result.current).toHaveProperty('loading', mockLoading);
    expect(result.current).toHaveProperty('error', mockError);
    expect(result.current).toHaveProperty('success');
  });
}); 