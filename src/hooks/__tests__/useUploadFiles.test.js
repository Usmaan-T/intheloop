import { renderHook, act } from '@testing-library/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { v4 as uuidv4 } from 'uuid';
import useUploadFiles from '../useUploadFiles';
import useUserStreak from '../useUserStreak';

// Mock uuid to return predictable values
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234')
}));

// Mock Firebase auth
jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: jest.fn()
}));

// Mock useUserStreak hook
jest.mock('../useUserStreak', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock Firebase storage functions
jest.mock('firebase/storage', () => ({
  ref: jest.fn(() => 'storage-ref'),
  uploadBytes: jest.fn(() => Promise.resolve({ ref: 'uploaded-ref' })),
  getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/audio.mp3'))
}));

// Mock Firebase firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'collection-ref'),
  addDoc: jest.fn(() => Promise.resolve({ id: 'new-post-id' })),
  serverTimestamp: jest.fn(() => 'server-timestamp')
}));

// Mock Firebase config
jest.mock('../../firebase/firebase', () => ({
  auth: 'mock-auth',
  storage: 'mock-storage',
  firestore: 'mock-firestore'
}));

describe('useUploadFiles', () => {
  // Mock files
  const mockAudioFile = new File(['audio content'], 'track.mp3', { type: 'audio/mpeg' });
  const mockImageFile = new File(['image content'], 'cover.jpg', { type: 'image/jpeg' });
  
  // Mock user
  const mockUser = { uid: 'test-user-123' };
  
  // Mock update streak function
  const mockUpdateStreakOnUpload = jest.fn(() => Promise.resolve());
  
  // Mock console.error
  const originalConsoleError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
    jest.clearAllMocks();
    
    // Setup default mocks
    useAuthState.mockReturnValue([mockUser, false, null]);
    useUserStreak.mockReturnValue({ updateStreakOnUpload: mockUpdateStreakOnUpload });
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
  });
  
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useUploadFiles());
    
    expect(result.current.audioUpload).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.uploadError).toBe('');
    expect(result.current.inputs).toEqual({
      name: '',
      key: '',
      bpm: '',
      tags: ''
    });
  });
  
  it('should set audio upload file', () => {
    const { result } = renderHook(() => useUploadFiles());
    
    act(() => {
      result.current.setAudioUpload(mockAudioFile);
    });
    
    expect(result.current.audioUpload).toBe(mockAudioFile);
  });
  
  it('should update inputs when setInputs is called', () => {
    const { result } = renderHook(() => useUploadFiles());
    
    act(() => {
      result.current.setInputs({
        name: 'Test Track',
        key: 'C Minor',
        bpm: '128',
        tags: ['electronic', 'beats']
      });
    });
    
    expect(result.current.inputs).toEqual({
      name: 'Test Track',
      key: 'C Minor',
      bpm: '128',
      tags: ['electronic', 'beats']
    });
  });
  
  it('should fail validation without audio file', () => {
    const { result } = renderHook(() => useUploadFiles());
    
    const validation = result.current.validateForm();
    
    expect(validation.isValid).toBe(false);
    expect(validation.error).toBe('No audio selected.');
  });
  
  it('should fail validation without track name', () => {
    const { result } = renderHook(() => useUploadFiles());
    
    act(() => {
      result.current.setAudioUpload(mockAudioFile);
    });
    
    const validation = result.current.validateForm();
    
    expect(validation.isValid).toBe(false);
    expect(validation.error).toBe('Please enter a track name.');
  });
  
  it('should fail validation without musical key', () => {
    const { result } = renderHook(() => useUploadFiles());
    
    act(() => {
      result.current.setAudioUpload(mockAudioFile);
      result.current.setInputs({
        name: 'Test Track',
        key: '',
        bpm: '128'
      });
    });
    
    const validation = result.current.validateForm();
    
    expect(validation.isValid).toBe(false);
    expect(validation.error).toBe('Please select a musical key.');
  });
  
  it('should fail validation without BPM', () => {
    const { result } = renderHook(() => useUploadFiles());
    
    act(() => {
      result.current.setAudioUpload(mockAudioFile);
      result.current.setInputs({
        name: 'Test Track',
        key: 'C Minor',
        bpm: ''
      });
    });
    
    const validation = result.current.validateForm();
    
    expect(validation.isValid).toBe(false);
    expect(validation.error).toBe('Please enter a BPM value.');
  });
  
  it('should pass validation with all required fields', () => {
    const { result } = renderHook(() => useUploadFiles());
    
    act(() => {
      result.current.setAudioUpload(mockAudioFile);
      result.current.setInputs({
        name: 'Test Track',
        key: 'C Minor',
        bpm: '128'
      });
    });
    
    const validation = result.current.validateForm();
    
    expect(validation.isValid).toBe(true);
    expect(validation.error).toBe('');
  });
  
  it('should fail upload if not authenticated', async () => {
    // Mock user as not logged in
    useAuthState.mockReturnValue([null, false, null]);
    
    const { result } = renderHook(() => useUploadFiles());
    
    act(() => {
      result.current.setAudioUpload(mockAudioFile);
      result.current.setInputs({
        name: 'Test Track',
        key: 'C Minor',
        bpm: '128'
      });
    });
    
    let success;
    await act(async () => {
      success = await result.current.uploadAudio();
    });
    
    expect(success).toBe(false);
    expect(result.current.uploadError).toBe('User is not authenticated.');
    expect(uploadBytes).not.toHaveBeenCalled();
  });
  
  it('should successfully upload audio and create post', async () => {
    const { result } = renderHook(() => useUploadFiles());
    
    act(() => {
      result.current.setAudioUpload(mockAudioFile);
      result.current.setInputs({
        name: 'Test Track',
        key: 'C Minor',
        bpm: '128',
        tags: ['electronic']
      });
    });
    
    let success;
    await act(async () => {
      success = await result.current.uploadAudio();
    });
    
    // Verify upload was successful
    expect(success).toBe(true);
    
    // Verify file upload
    expect(ref).toHaveBeenCalledWith('mock-storage', expect.stringContaining('audio/track.mp3_mock-uuid-1234'));
    expect(uploadBytes).toHaveBeenCalledWith('storage-ref', mockAudioFile);
    expect(getDownloadURL).toHaveBeenCalledWith('uploaded-ref');
    
    // Verify Firestore document creation
    expect(collection).toHaveBeenCalledWith('mock-firestore', 'posts');
    expect(addDoc).toHaveBeenCalledWith('collection-ref', {
      userId: 'test-user-123',
      audioUrl: 'https://example.com/audio.mp3',
      createdAt: 'server-timestamp',
      likes: 0,
      comments: [],
      bpm: '128',
      key: 'C Minor',
      name: 'Test Track',
      tags: ['electronic', 'C Minor']
    });
    
    // Verify streak update
    expect(mockUpdateStreakOnUpload).toHaveBeenCalled();
    
    // Verify loading state
    expect(result.current.loading).toBe(false);
  });
  
  it('should upload cover image if provided', async () => {
    const { result } = renderHook(() => useUploadFiles());
    
    act(() => {
      result.current.setAudioUpload(mockAudioFile);
      result.current.setInputs({
        name: 'Test Track',
        key: 'C Minor',
        bpm: '128',
        coverImage: mockImageFile
      });
    });
    
    // First mock for audio, second for image
    ref.mockImplementationOnce(() => 'audio-ref');
    ref.mockImplementationOnce(() => 'image-ref');
    
    uploadBytes.mockImplementationOnce(() => Promise.resolve({ ref: 'audio-uploaded-ref' }));
    uploadBytes.mockImplementationOnce(() => Promise.resolve({ ref: 'image-uploaded-ref' }));
    
    getDownloadURL.mockImplementationOnce(() => Promise.resolve('https://example.com/audio.mp3'));
    getDownloadURL.mockImplementationOnce(() => Promise.resolve('https://example.com/cover.jpg'));
    
    let success;
    await act(async () => {
      success = await result.current.uploadAudio();
    });
    
    // Verify upload was successful
    expect(success).toBe(true);
    
    // Verify both files were uploaded
    expect(ref).toHaveBeenCalledWith('mock-storage', expect.stringContaining('audio/'));
    expect(ref).toHaveBeenCalledWith('mock-storage', expect.stringContaining('covers/'));
    
    // Verify Firestore document included cover image
    expect(addDoc).toHaveBeenCalledWith('collection-ref', expect.objectContaining({
      coverImage: 'https://example.com/cover.jpg'
    }));
  });
  
  it('should handle upload errors gracefully', async () => {
    // Mock upload failure
    uploadBytes.mockImplementationOnce(() => Promise.reject(new Error('Upload failed')));
    
    const { result } = renderHook(() => useUploadFiles());
    
    act(() => {
      result.current.setAudioUpload(mockAudioFile);
      result.current.setInputs({
        name: 'Test Track',
        key: 'C Minor',
        bpm: '128'
      });
    });
    
    let success;
    await act(async () => {
      success = await result.current.uploadAudio();
    });
    
    // Verify upload failed
    expect(success).toBe(false);
    expect(result.current.uploadError).toBe('Failed to upload audio. Please try again.');
    expect(result.current.loading).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });
  
  it('should continue if cover image upload fails', async () => {
    const { result } = renderHook(() => useUploadFiles());
    
    act(() => {
      result.current.setAudioUpload(mockAudioFile);
      result.current.setInputs({
        name: 'Test Track',
        key: 'C Minor',
        bpm: '128',
        coverImage: mockImageFile
      });
    });
    
    // First call succeeds (audio), second call fails (image)
    uploadBytes.mockImplementationOnce(() => Promise.resolve({ ref: 'audio-uploaded-ref' }));
    uploadBytes.mockImplementationOnce(() => Promise.reject(new Error('Image upload failed')));
    
    let success;
    await act(async () => {
      success = await result.current.uploadAudio();
    });
    
    // Verify upload was still successful despite image failure
    expect(success).toBe(true);
    expect(console.error).toHaveBeenCalledWith('Error uploading cover image: ', expect.any(Error));
    
    // Verify post was still created without cover image
    expect(addDoc).toHaveBeenCalledWith('collection-ref', expect.not.objectContaining({
      coverImage: expect.anything()
    }));
  });
}); 