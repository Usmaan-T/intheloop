// Waveform.jsx
import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

const Waveform = ({ audioUrl, options = {} }) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  // Toggle play/pause when the waveform container is clicked
  const togglePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  useEffect(() => {
    if (!audioUrl) {
      console.error('No audio URL provided.');
      return;
    }
    
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'black',
      progressColor: '#3B8686',
      cursorColor: '#3B8686',
      barWidth: 2,
      barGap: 2,
      height: 80,
      ...options,
    });
    
    wavesurfer.current.load(audioUrl);

    // Cleanup on unmount
    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [audioUrl, options]);

  return (
    <div
      ref={waveformRef}
      style={{ width: '100%', height: '80px', cursor: 'pointer' }}
      onClick={togglePlay}
    />
  );
};

export default Waveform;
