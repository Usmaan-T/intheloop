import { renderHook, act } from '@testing-library/react';
import useAudioPlayback from '../useAudioPlayback';

// Mock for HTML Audio Element
class MockAudio {
  constructor(url) {
    this.url = url;
    this.paused = true;
    this.ended = false;
    this.currentTime = 0;
    this.duration = 100;
    this.volume = 1;
    this.muted = false;
    this.playbackRate = 1;
    this.onended = null;
    this.onplay = null;
    this.onpause = null;
  }

  play() {
    this.paused = false;
    if (this.onplay) this.onplay();
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    if (this.onpause) this.onpause();
  }

  // Simulate audio ending
  simulateEnd() {
    this.ended = true;
    this.paused = true;
    if (this.onended) this.onended();
  }
}

describe('useAudioPlayback', () => {
  const mockAudioUrl = 'https://example.com/audio.mp3';
  
  // Store original Audio constructor
  const originalAudio = global.Audio;
  
  beforeEach(() => {
    // Mock the Audio constructor
    global.Audio = jest.fn().mockImplementation((url) => {
      return new MockAudio(url);
    });
  });
  
  afterEach(() => {
    // Restore original Audio constructor
    global.Audio = originalAudio;
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useAudioPlayback(mockAudioUrl));
    
    // Check initial values
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.audioRef.current).toBeNull();
    expect(typeof result.current.handlePlayToggle).toBe('function');
    expect(typeof result.current.handleAudioEnd).toBe('function');
  });
  
  it('should not toggle play if audio ref is not set', () => {
    const { result } = renderHook(() => useAudioPlayback(mockAudioUrl));
    
    // Initial state
    expect(result.current.isPlaying).toBe(false);
    
    // Try to toggle play
    act(() => {
      result.current.handlePlayToggle();
    });
    
    // State should remain unchanged
    expect(result.current.isPlaying).toBe(false);
  });
  
  it('should toggle play/pause when audioRef is set', () => {
    const { result } = renderHook(() => useAudioPlayback(mockAudioUrl));
    
    // Create a mock audio element
    const mockAudio = new MockAudio(mockAudioUrl);
    
    // Set the audioRef
    act(() => {
      result.current.audioRef.current = mockAudio;
    });
    
    // Initial state
    expect(result.current.isPlaying).toBe(false);
    expect(mockAudio.paused).toBe(true);
    
    // Toggle play (to start playing)
    act(() => {
      result.current.handlePlayToggle();
    });
    
    // Should now be playing
    expect(result.current.isPlaying).toBe(true);
    expect(mockAudio.paused).toBe(false);
    
    // Toggle play again (to pause)
    act(() => {
      result.current.handlePlayToggle();
    });
    
    // Should now be paused
    expect(result.current.isPlaying).toBe(false);
    expect(mockAudio.paused).toBe(true);
  });
  
  it('should handle audio end event', () => {
    const { result } = renderHook(() => useAudioPlayback(mockAudioUrl));
    
    // Create a mock audio element
    const mockAudio = new MockAudio(mockAudioUrl);
    
    // Set the audioRef and set isPlaying to true
    act(() => {
      result.current.audioRef.current = mockAudio;
      result.current.handlePlayToggle(); // Start playing
    });
    
    // Verify it's playing
    expect(result.current.isPlaying).toBe(true);
    
    // Trigger audio end event
    act(() => {
      result.current.handleAudioEnd();
    });
    
    // Should now be paused
    expect(result.current.isPlaying).toBe(false);
  });
  
  it('should clean up audio on unmount', () => {
    // Create a spy on the pause method
    const pauseSpy = jest.spyOn(MockAudio.prototype, 'pause');
    
    const { result, unmount } = renderHook(() => useAudioPlayback(mockAudioUrl));
    
    // Create a mock audio element
    const mockAudio = new MockAudio(mockAudioUrl);
    
    // Set the audioRef
    act(() => {
      result.current.audioRef.current = mockAudio;
      result.current.handlePlayToggle(); // Start playing
    });
    
    // Verify it's playing
    expect(result.current.isPlaying).toBe(true);
    
    // Unmount the hook
    unmount();
    
    // Pause should have been called during cleanup
    expect(pauseSpy).toHaveBeenCalled();
    
    // Clean up spy
    pauseSpy.mockRestore();
  });
}); 