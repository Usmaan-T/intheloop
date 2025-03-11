import { Box, Heading, Image, Text, VStack } from '@chakra-ui/react';
import React from 'react';

const Playlist = ({ name, bio, image }) => {
  const handleImageError = (e) => {
    // Fall back to a placeholder if the image fails to load
    e.target.src = "https://via.placeholder.com/300?text=Playlist";
  };

  return (
    <Box 
      borderRadius="md" 
      overflow="hidden" 
      bg="blackAlpha.400"
      transition="transform 0.3s, box-shadow 0.3s"
      _hover={{ 
        transform: 'translateY(-5px)', 
        boxShadow: 'xl',
        cursor: 'pointer'
      }}
      height="100%"
    >
      <Image 
        src={image} 
        alt={name} 
        borderRadius="md" 
        objectFit="cover"
        w="100%"
        h="160px"
        onError={handleImageError}
      />
      <VStack align="start" p={4} spacing={1}>
        <Heading size="md" color="white" noOfLines={1}>
          {name}
        </Heading>
        <Text color="gray.300" fontSize="sm" noOfLines={2}>
          {bio}
        </Text>
      </VStack>
    </Box>
  );
};

export default Playlist;