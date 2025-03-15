import React from 'react';
import {
  Box, Heading, Text, useColorModeValue
} from '@chakra-ui/react';
import SampleRow from '../Samples/SampleRow';

const TracksSection = ({ tracks, isLoading, error, showHeader = true }) => {
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
            <SampleRow key={track.id} track={track} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TracksSection;
