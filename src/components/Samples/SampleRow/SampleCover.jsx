import React from 'react';
import { Box, Image, Flex, Icon } from '@chakra-ui/react';
import { MdMusicNote } from 'react-icons/md';

// Generate color function
const generateColorFromName = (name) => {
  const colors = ['#8A2BE2', '#4A90E2', '#50C878', '#FF6347', '#FFD700'];
  if (!name) return colors[0];
  
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

const SampleCover = ({ track }) => {
  return (
    <Box
      w="60px"
      h="60px"
      borderRadius="md"
      overflow="hidden"
      border="2px solid"
      borderColor="whiteAlpha.300"
      position="relative"
    >
      {track.coverImage ? (
        <Image 
          src={track.coverImage}
          alt={track.name}
          w="100%"
          h="100%"
          objectFit="cover"
          fallback={
            <Flex
              h="100%"
              w="100%"
              bg={generateColorFromName(track.name)}
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={MdMusicNote} color="white" boxSize={6} />
            </Flex>
          }
        />
      ) : (
        <Flex
          h="100%"
          w="100%"
          bg={generateColorFromName(track.name)}
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={MdMusicNote} color="white" boxSize={6} />
        </Flex>
      )}
    </Box>
  );
};

export default SampleCover;
