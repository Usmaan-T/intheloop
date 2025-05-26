import { renderHook, act } from '@testing-library/react';
import { doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import useDeleteSample from '../useDeleteSample';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => 'mock-doc-ref'),
  deleteDoc: jest.fn()
}));

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  ref: jest.fn(() => 'mock-storage-ref'),
  deleteObject: jest.fn()
}));

// Mock Firebase modules
jest.mock('../../firebase/firebase', () => ({
  firestore: {},
  storage: {}
}), { virtual: true });

// Mock Chakra UI toast
jest.mock('@chakra-ui/react', () => ({
  useToast: jest.fn(() => jest.fn())
}));

describe('useDeleteSample', () => {
  // Sample data for tests
  const mockSampleId = 'sample123';
  const mockAudioUrl = 'https://firebasestorage.googleapis.com/v0/b/workout-tracker-123.appspot.com/o/audio%2Fsample123.mp3?alt=media';
  const mockImageUrl = 'https://firebasestorage.googleapis.com/v0/b/workout-tracker-123.appspot.com/o/images%2Fsample123.jpg?alt=media';
  const mockUserId = 'user123';
  const mockSampleOwnerId = 'user123';
  const differentUserId = 'user456';

  // Extracted paths that match the logic in useDeleteSample.js
  // slice(7) on split('/') gets the path after the /o/ part of the Firebase Storage URL
  const audioPath = 'audio%2Fsample123.mp3';
  const imagePath = 'images%2Fsample123.jpg';

  // Mocks for console methods
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    
    // Default implementations for mocked functions
    deleteDoc.mockResolvedValue();
    deleteObject.mockResolvedValue();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useDeleteSample());
    expect(result.current.isDeleting).toBe(false);
    expect(typeof result.current.deleteSample).toBe('function');
  });

  it('should successfully delete a sample with audio and image', async () => {
    // Arrange
    const mockToast = jest.fn();
    require('@chakra-ui/react').useToast.mockReturnValue(mockToast);
    
    // Act
    const { result } = renderHook(() => useDeleteSample());
    
    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.deleteSample(
        mockSampleId,
        mockAudioUrl,
        mockImageUrl,
        mockUserId,
        mockSampleOwnerId
      );
    });
    
    // Assert
    // Check if document deletion was called
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'posts', mockSampleId);
    expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    
    // Check if audio file deletion was called with the correct path
    expect(ref).toHaveBeenCalledWith(expect.anything(), 'audio/sample123.mp3');
    
    // Check if image file deletion was called with the correct path
    expect(ref).toHaveBeenCalledWith(expect.anything(), 'images/sample123.jpg');
    
    // Check successful deletion
    expect(deleteResult).toBe(true);
    
    // Check toast was shown
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success',
      title: 'Sample Deleted'
    }));
    
    // Check loading state
    expect(result.current.isDeleting).toBe(false);
  });

  it('should prevent deletion if user is not the owner', async () => {
    // Arrange
    const mockToast = jest.fn();
    require('@chakra-ui/react').useToast.mockReturnValue(mockToast);
    
    // Act
    const { result } = renderHook(() => useDeleteSample());
    
    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.deleteSample(
        mockSampleId,
        mockAudioUrl,
        mockImageUrl,
        differentUserId, // Different user trying to delete
        mockSampleOwnerId
      );
    });
    
    // Assert
    // Check permission was denied
    expect(deleteResult).toBe(false);
    
    // Check that document deletion was not called
    expect(deleteDoc).not.toHaveBeenCalled();
    
    // Check error toast was shown
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      title: 'Permission Denied',
      description: 'You can only delete your own samples'
    }));
  });

  it('should handle a sample with no image', async () => {
    // Arrange
    const mockToast = jest.fn();
    require('@chakra-ui/react').useToast.mockReturnValue(mockToast);
    
    // Act
    const { result } = renderHook(() => useDeleteSample());
    
    await act(async () => {
      await result.current.deleteSample(
        mockSampleId,
        mockAudioUrl,
        null, // No image URL
        mockUserId,
        mockSampleOwnerId
      );
    });
    
    // Assert
    // Check if document deletion was called
    expect(deleteDoc).toHaveBeenCalled();
    
    // Check if audio deletion was called but not image
    expect(ref).toHaveBeenCalledTimes(1);
    expect(ref).toHaveBeenCalledWith(expect.anything(), 'audio/sample123.mp3');
    
    // Check success toast
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success'
    }));
  });

  it('should handle a sample with no audio', async () => {
    // Arrange
    const mockToast = jest.fn();
    require('@chakra-ui/react').useToast.mockReturnValue(mockToast);
    
    // Act
    const { result } = renderHook(() => useDeleteSample());
    
    await act(async () => {
      await result.current.deleteSample(
        mockSampleId,
        null, // No audio URL
        mockImageUrl,
        mockUserId,
        mockSampleOwnerId
      );
    });
    
    // Assert
    // Check if document deletion was called
    expect(deleteDoc).toHaveBeenCalled();
    
    // Check if image deletion was called but not audio
    expect(ref).toHaveBeenCalledTimes(1);
    expect(ref).toHaveBeenCalledWith(expect.anything(), 'images/sample123.jpg');
    
    // Check success toast
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success'
    }));
  });

  it('should handle errors from Firestore deletion', async () => {
    // Arrange
    const mockToast = jest.fn();
    require('@chakra-ui/react').useToast.mockReturnValue(mockToast);
    
    // Mock Firestore error
    deleteDoc.mockRejectedValueOnce(new Error('Firestore deletion error'));
    
    // Act
    const { result } = renderHook(() => useDeleteSample());
    
    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.deleteSample(
        mockSampleId,
        mockAudioUrl,
        mockImageUrl,
        mockUserId,
        mockSampleOwnerId
      );
    });
    
    // Assert
    expect(deleteResult).toBe(false);
    expect(console.error).toHaveBeenCalledWith('Error deleting sample:', expect.any(Error));
    
    // Check error toast
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      title: 'Error',
      description: 'Failed to delete the sample. Please try again.'
    }));
  });

  it('should continue if audio deletion fails', async () => {
    // Arrange
    const mockToast = jest.fn();
    require('@chakra-ui/react').useToast.mockReturnValue(mockToast);
    
    // Mock audio deletion failure but allow document and image deletion to succeed
    deleteObject.mockImplementationOnce(() => { throw new Error('Audio deletion error'); });
    
    // Act
    const { result } = renderHook(() => useDeleteSample());
    
    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.deleteSample(
        mockSampleId,
        mockAudioUrl,
        mockImageUrl,
        mockUserId,
        mockSampleOwnerId
      );
    });
    
    // Assert
    // Document should still be deleted
    expect(deleteDoc).toHaveBeenCalled();
    
    // Error should be logged for audio but image deletion should still be attempted
    expect(console.error).toHaveBeenCalledWith('Error deleting audio file:', expect.any(Error));
    expect(ref).toHaveBeenNthCalledWith(2, expect.anything(), 'images/sample123.jpg');
    expect(deleteObject).toHaveBeenCalledTimes(2);
    
    // Overall result should still be successful
    expect(deleteResult).toBe(true);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success'
    }));
  });

  it('should continue if image deletion fails', async () => {
    // Arrange
    const mockToast = jest.fn();
    require('@chakra-ui/react').useToast.mockReturnValue(mockToast);
    
    // First call succeeds (audio), second fails (image)
    deleteObject.mockImplementationOnce(() => Promise.resolve());
    deleteObject.mockImplementationOnce(() => { throw new Error('Image deletion error'); });
    
    // Act
    const { result } = renderHook(() => useDeleteSample());
    
    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.deleteSample(
        mockSampleId,
        mockAudioUrl,
        mockImageUrl,
        mockUserId,
        mockSampleOwnerId
      );
    });
    
    // Assert
    // Document and audio should be deleted
    expect(deleteDoc).toHaveBeenCalled();
    expect(deleteObject).toHaveBeenCalledTimes(2);
    
    // Error should be logged for image
    expect(console.error).toHaveBeenCalledWith('Error deleting image file:', expect.any(Error));
    
    // Overall result should still be successful
    expect(deleteResult).toBe(true);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success'
    }));
  });

  it('should handle malformed URLs gracefully', async () => {
    // Arrange
    const mockToast = jest.fn();
    require('@chakra-ui/react').useToast.mockReturnValue(mockToast);
    const malformedAudioUrl = 'invalid-url';
    
    // Act
    const { result } = renderHook(() => useDeleteSample());
    
    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.deleteSample(
        mockSampleId,
        malformedAudioUrl,
        mockImageUrl,
        mockUserId,
        mockSampleOwnerId
      );
    });
    
    // Assert
    // Document should still be deleted
    expect(deleteDoc).toHaveBeenCalled();
    
    // Storage references should still be attempted but with empty paths
    expect(ref).toHaveBeenCalled();
    
    // Overall result should still be successful
    expect(deleteResult).toBe(true);
  });
}); 