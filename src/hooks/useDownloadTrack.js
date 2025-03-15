import { useState } from 'react';
import { useToast } from '@chakra-ui/react';

const useDownloadTrack = () => {
  const [downloadLoading, setDownloadLoading] = useState(false);
  const toast = useToast();
  
  const downloadTrack = async (track) => {
    if (!track?.audioUrl) {
      toast({
        title: "Download failed",
        description: "Audio file not available",
        status: "error",
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    setDownloadLoading(true);
    
    try {
      // Create a clean file name
      let fileName = `${track.name || 'sample'}.mp3`;
      fileName = fileName.replace(/[/\\?%*:|"<>]/g, '-');
      
      // Download logic
      const response = await fetch(track.audioUrl);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast({
        title: "Download started",
        description: `Downloading ${fileName}`,
        status: "success",
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  return { downloadTrack, downloadLoading };
};

export default useDownloadTrack;
