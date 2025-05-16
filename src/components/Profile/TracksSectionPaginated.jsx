import React from 'react';
import {
  Box, 
  Heading, 
  Text, 
  Button, 
  Flex,
  Spinner,
  useColorModeValue 
} from '@chakra-ui/react';
import SampleRow from '../Samples/SampleRow';

/**
 * Component to display tracks with pagination capability
 */
const TracksSectionPaginated = ({ 
  title,
  tracks, 
  isLoading, 
  hasMore, 
  loadMore, 
  error 
}) => {
  return (
    <Box mb={8}>
      <Heading as="h2" size="xl" mb={6} color={'white'}>
        {title}
      </Heading>
      
      {tracks.length === 0 && !isLoading ? (
        <Text color="gray.300">No tracks found.</Text>
      ) : (
        <>
          <Box
            bg={useColorModeValue('gray.800', 'gray.700')}
            p={6}
            borderRadius="lg"
            boxShadow="md"
            mb={4}
          >
            {tracks.map(track => (
              <SampleRow 
                key={track.id} 
                track={track} 
              />
            ))}
          </Box>
          
          {error && (
            <Text color="red.300" mt={2}>
              Error loading tracks: {error.message}
            </Text>
          )}
          
          {hasMore && (
            <Flex justify="center" mt={4}>
              <Button
                onClick={loadMore}
                isLoading={isLoading}
                colorScheme="purple"
                variant="outline"
                _hover={{ bg: 'whiteAlpha.100' }}
                loadingText="Loading..."
                size="md"
              >
                Load More
              </Button>
            </Flex>
          )}
          
          {isLoading && !tracks.length && (
            <Flex justify="center" py={6}>
              <Spinner size="lg" color="purple.500" />
            </Flex>
          )}
        </>
      )}
    </Box>
  );
};

export default TracksSectionPaginated; 