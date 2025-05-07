import { renderHook, act } from '@testing-library/react';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import useSignInWithEmailAndPasswordHook from '../useSignInWithEmailandPassword';

// Mock Firebase and auth
jest.mock('../../firebase/firebase', () => ({
  auth: {}
}), { virtual: true });

// Mock the react-firebase-hooks library
jest.mock('react-firebase-hooks/auth', () => ({
  useSignInWithEmailAndPassword: jest.fn(),
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

// Mock console.log to verify error messages
console.log = jest.fn();

describe('useSignInWithEmailandPassword', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sign in successfully with valid credentials', async () => {
    // Mock user data returned after successful sign-in
    const mockUser = {
      user: {
        uid: 'test-uid',
        email: 'test@example.com',
      },
    };

    // Mock the useSignInWithEmailAndPassword to return success
    const signInWithEmailAndPasswordFn = jest.fn().mockResolvedValue(mockUser);
    useSignInWithEmailAndPassword.mockReturnValue([
      signInWithEmailAndPasswordFn,
      mockUser,
      false, // loading
      null, // error
    ]);

    const { result } = renderHook(() => useSignInWithEmailAndPasswordHook());

    // Call the signin function with valid credentials
    await act(async () => {
      await result.current.signin({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Verify the function was called with the correct credentials
    expect(signInWithEmailAndPasswordFn).toHaveBeenCalledWith(
      'test@example.com',
      'password123'
    );

    // Verify user info was stored in localStorage
    expect(mockSetItem).toHaveBeenCalledWith(
      'user-info',
      JSON.stringify(mockUser.user)
    );

    // Verify no errors were logged
    expect(console.log).not.toHaveBeenCalled();
  });

  it('should handle sign in error', async () => {
    // Mock error from Firebase
    const mockError = new Error('Invalid credentials');

    // Mock the useSignInWithEmailAndPassword to return error
    const signInWithEmailAndPasswordFn = jest.fn().mockRejectedValue(mockError);
    useSignInWithEmailAndPassword.mockReturnValue([
      signInWithEmailAndPasswordFn,
      null, // user
      false, // loading
      mockError, // error
    ]);

    const { result } = renderHook(() => useSignInWithEmailAndPasswordHook());

    // Call the signin function with valid credentials
    await act(async () => {
      await result.current.signin({
        email: 'test@example.com',
        password: 'wrong-password',
      });
    });

    // Verify the function was called with the provided credentials
    expect(signInWithEmailAndPasswordFn).toHaveBeenCalledWith(
      'test@example.com',
      'wrong-password'
    );

    // Verify error was logged
    expect(console.log).toHaveBeenCalledWith(mockError);

    // Verify user info was not stored in localStorage
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('should handle missing credentials', async () => {
    // Mock the useSignInWithEmailAndPassword
    const signInWithEmailAndPasswordFn = jest.fn();
    useSignInWithEmailAndPassword.mockReturnValue([
      signInWithEmailAndPasswordFn,
      null, // user
      false, // loading
      null, // error
    ]);

    const { result } = renderHook(() => useSignInWithEmailAndPasswordHook());

    // Test with missing email
    await act(async () => {
      await result.current.signin({
        password: 'password123',
      });
    });

    // Test with missing password
    await act(async () => {
      await result.current.signin({
        email: 'test@example.com',
      });
    });

    // Verify the sign in function was not called
    expect(signInWithEmailAndPasswordFn).not.toHaveBeenCalled();

    // Verify the error message was logged
    expect(console.log).toHaveBeenCalledWith('Please fill in all fields');
  });

  it('should expose the correct properties', () => {
    // Mock the useSignInWithEmailAndPassword
    const mockUser = { uid: 'test-uid' };
    const mockError = null;
    const mockLoading = false;
    const signInWithEmailAndPasswordFn = jest.fn();

    useSignInWithEmailAndPassword.mockReturnValue([
      signInWithEmailAndPasswordFn,
      mockUser,
      mockLoading,
      mockError,
    ]);

    const { result } = renderHook(() => useSignInWithEmailAndPasswordHook());

    // Verify the hook returns the correct properties
    expect(result.current).toHaveProperty('signin');
    expect(result.current).toHaveProperty('user', mockUser);
    expect(result.current).toHaveProperty('loading', mockLoading);
    expect(result.current).toHaveProperty('error', mockError);
  });
}); 