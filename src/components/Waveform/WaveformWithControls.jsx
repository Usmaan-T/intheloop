// WaveformWithControls.jsx
import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button, HStack, Box } from '@chakra-ui/react';

const WaveformWithControls = ({ audioUrl, options = {} }) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!audioUrl) {
      console.error('No audio URL provided.');
      return;
    }
    
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'grey',
      progressColor: '#3B8686',
      cursorColor: '#3B8686',
      barWidth: 2,
      barGap: 2,
      height: 80,
      ...options,
    });
    
    wavesurfer.current.load(audioUrl);

    // Update isPlaying state when playback changes
    wavesurfer.current.on('finish', () => setIsPlaying(false));
    
    return () => {
      if (wavesurfer.current) wavesurfer.current.destroy();
    };
  }, [audioUrl, options]);

  const handlePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <Box>
      <div ref={waveformRef} style={{ width: '100%', height: '80px' }} />
      <HStack mt={4} spacing={4}>
        <Button onClick={handlePlay} colorScheme="green" disabled={isPlaying}>
          Play
        </Button>
        <Button onClick={handlePause} colorScheme="red" disabled={!isPlaying}>
          Pause
        </Button>
      </HStack>
    </Box>
  );
};

export default WaveformWithControls;
