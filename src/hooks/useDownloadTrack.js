import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import trackSampleInteraction from './useTrackSampleInteraction'; // Add this import

const useDownloadTrack = () => {
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [user] = useAuthState(auth);
  const toast = useToast();

  const downloadTrack = async (track) => {
    if (!track || !track.audioUrl) {
      toast({
        title: "Download failed",
        description: "Audio file not available",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setDownloadLoading(true);
    
    try {
      // Fetch the audio file
      const response = await fetch(track.audioUrl);
      if (!response.ok) throw new Error('Failed to download file');
      
      const blob = await response.blob();
      
      // Create a temporary download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Name the file with the track name or fallback to a default
      const fileName = track.name 
        ? `${track.name}.mp3` 
        : `sample_${track.id}.mp3`;
        
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Track the download interaction for popularity
      await trackSampleInteraction(
        track.id,
        'download',
        user?.uid || null,
        false
      );

      toast({
        title: "Download complete",
        description: `"${track.name || 'Sample'}" has been downloaded`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error downloading track:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the file",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  return { downloadTrack, downloadLoading };
};

export default useDownloadTrack;
