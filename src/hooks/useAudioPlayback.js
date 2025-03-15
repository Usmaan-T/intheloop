import { useState, useRef, useEffect } from 'react';

const useAudioPlayback = (audioUrl) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  
  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);
  
  const handlePlayToggle = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleAudioEnd = () => {
    setIsPlaying(false);
  };
  
  return {
    audioRef,
    isPlaying,
    handlePlayToggle,
    handleAudioEnd
  };
};

export default useAudioPlayback;
