import React, { useState } from 'react';
import {
  Box, Heading, Text, useColorModeValue, useToast
} from '@chakra-ui/react';
import SampleRow from '../Samples/SampleRow';

const TracksSection = ({ tracks: initialTracks, isLoading, error, showHeader = true }) => {
  const [tracks, setTracks] = useState(initialTracks || []);
  const toast = useToast();
  
  // Handle track deletion
  const handleDeleteTrack = (trackId) => {
    setTracks(prevTracks => prevTracks.filter(track => track.id !== trackId));
    toast({
      title: "Sample deleted",
      description: "The sample has been removed from your collection",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Update tracks when initialTracks changes
  React.useEffect(() => {
    if (initialTracks) {
      setTracks(initialTracks);
    }
  }, [initialTracks]);
  
  if (isLoading) return <Text>Loading tracks...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;
  
  return (
    <Box mb={8}>
      {showHeader && (
        <Heading as="h2" size="lg" color="white" mb={4}>
          Your Samples
        </Heading>
      )}
      <Heading as="h2" size="xl" mb={6} color={'white'}>
        Most Recent Samples
      </Heading>
      {tracks.length === 0 ? (
        <Text color="gray.300">You haven't uploaded any tracks yet.</Text>
      ) : (
        <Box
          bg={useColorModeValue('gray.800', 'gray.700')}
          p={6}  // Increase padding from 4 to 6
          borderRadius="lg"
          boxShadow="md"
        >
          {tracks.map(track => (
            <SampleRow key={track.id} track={track} onDelete={handleDeleteTrack} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TracksSection;
