import { Box, Heading, Image, Text, VStack, Flex, Badge } from '@chakra-ui/react';
import React from 'react';
import { MdLibraryMusic, MdLock } from 'react-icons/md';

const Playlist = ({ name, bio, image, color, privacy }) => {
  // Use provided color or generate one from name
  const getColorFromName = (name) => {
    if (color) return color;
    
    const colors = ['#8A2BE2', '#4A90E2', '#50C878', '#FF6347', '#FFD700'];
    let sum = 0;
    for (let i = 0; i < name?.length || 0; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  // Handle case where name might be undefined
  const displayName = name || "Untitled Playlist";
  const displayColor = getColorFromName(displayName);
  const isPrivate = privacy === 'private';

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
      position="relative"
    >
      {isPrivate && (
        <Badge 
          position="absolute" 
          top={2} 
          right={2} 
          colorScheme="gray"
          px={2}
          py={1}
          borderRadius="md"
          display="flex"
          alignItems="center"
          zIndex={2}
        >
          <MdLock style={{ marginRight: '4px' }} /> Private
        </Badge>
      )}

      {image ? (
        // Show image if available
        <Image 
          src={image} 
          alt={displayName} 
          borderRadius="md" 
          objectFit="cover"
          w="100%"
          h="160px"
          fallback={
            <Flex 
              h="160px" 
              bg={displayColor}
              color="white"
              alignItems="center"
              justifyContent="center"
              fontSize="4xl"
            >
              <MdLibraryMusic />
            </Flex>
          }
        />
      ) : (
        // Show a colored box with icon if no image
        <Flex 
          h="160px" 
          bg={displayColor}
          color="white"
          alignItems="center"
          justifyContent="center"
          fontSize="4xl"
        >
          <MdLibraryMusic />
        </Flex>
      )}
      <VStack align="start" p={4} spacing={1}>
        <Heading size="md" color="white" noOfLines={1}>
          {displayName}
        </Heading>
        {bio && (
          <Text color="gray.300" fontSize="sm" noOfLines={2}>
            {bio}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default Playlist;