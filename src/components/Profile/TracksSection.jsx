import React from 'react';
import {
  Box, Heading, Text, useColorModeValue
} from '@chakra-ui/react';
import SampleRow from '../Samples/SampleRow';

const TracksSection = ({ tracks, isLoading, error }) => {
  if (isLoading) return <Text>Loading tracks...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;
  
  return (
    <>
      <Heading as="h2" size="xl" mb={6} color={'white'}>
        Most Recent Samples
      </Heading>
      {tracks.length === 0 ? (
        <Text color="gray.300">You haven't uploaded any tracks yet.</Text>
      ) : (
        <Box
          bg={useColorModeValue('gray.800', 'gray.700')}
          p={4}
          borderRadius="lg"
          boxShadow="md"
        >
          {tracks.map(track => (
            <SampleRow key={track.id} track={track} />
          ))}
        </Box>
      )}
    </>
  );
};

export default TracksSection;
