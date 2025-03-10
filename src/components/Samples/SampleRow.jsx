// SampleRow.jsx
import React from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  useColorModeValue,
  Icon,
  Tooltip,
  Badge,
} from '@chakra-ui/react';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { firestore } from '../../firebase/firebase';
import Waveform from '../Waveform/Waveform';
import { FaMusic, FaPlus } from 'react-icons/fa';

const SampleRow = ({ track }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColorSecondary = useColorModeValue('gray.500', 'gray.400');
  const artworkBg = useColorModeValue('gray.100', 'gray.700');

  // Fetch user details from 'users' collection
  const userDocRef = doc(firestore, 'users', track.userId);
  const [userDoc, userLoading, userError] = useDocument(userDocRef);
  const userData = userDoc?.data();

  let artistName = 'Unknown Artist';
  if (userLoading) artistName = 'Loading...';
  else if (userError) artistName = 'Error loading user';
  else if (userData?.username) artistName = userData.username;

  return (
    <Box
      borderBottom="1px"
      borderColor={borderColor}
      py={4}
      px={3}
      transition="all 0.2s"
      bg={bgColor}
      _hover={{ bg: hoverBgColor, transform: 'translateY(-2px)', shadow: 'sm' }}
      borderRadius="md"
      mb={2}
    >
      <Flex
        direction={{ base: 'row', lg: 'row' }}
        alignItems="center"
        justifyContent="space-between"
        gap={4}
        flexWrap="wrap"
      >
        {/* Top section with artwork and track info */}
        <Flex alignItems="center" gap={4} flex="1" minW="250px">
          {/* Artwork / Placeholder */}
          <Box
            w="80px"
            h="80px"
            borderRadius="lg"
            bg={artworkBg}
            display="flex"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
            border="1px solid"
            borderColor={borderColor}
          >
            {track.artworkUrl ? (
              <img src={track.artworkUrl} alt={track.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Icon as={FaMusic} boxSize="30px" color={textColorSecondary} />
            )}
          </Box>

          {/* Track Title & Artist Name */}
          <Box>
            <Text fontWeight="bold" fontSize="md" noOfLines={1}>
              {track.name}
            </Text>
            <Text fontSize="sm" color={textColorSecondary} noOfLines={1}>
              by {artistName}
            </Text>
            
            {/* BPM & Key with badges - visible on small screens */}
            <Flex mt={1} gap={2} display={{ base: 'flex', md: 'none' }}>
              <Badge colorScheme="purple" px={2} borderRadius="full">
                {track.bpm} BPM
              </Badge>
              <Badge colorScheme="blue" px={2} borderRadius="full">
                {track.key}
              </Badge>
            </Flex>
          </Box>
        </Flex>

        {/* Right side content */}
        <Flex alignItems="center" gap={4}>
          {/* BPM & Key with badges - visible on medium+ screens */}
          <Flex direction="column" align="center" display={{ base: 'none', md: 'flex' }}>
            <Badge colorScheme="purple" mb={1} px={2} borderRadius="full">
              {track.bpm} BPM
            </Badge>
            <Badge colorScheme="blue" px={2} borderRadius="full">
              {track.key}
            </Badge>
          </Flex>

          {/* Add Button */}
          <Tooltip label="Add to workout" placement="top">
            <Button
              colorScheme="red"
              size="sm"
              borderRadius="full"
              width="36px"
              height="36px"
              p={0}
            >
              <Icon as={FaPlus} />
            </Button>
          </Tooltip>
        </Flex>
        
        {/* Waveform Display - full width on its own row */}
        <Box 
          w="100%" 
          h="80px" 
          mt={{ base: 2, lg: 2 }} 
          mb={1}
          borderRadius="md"
          overflow="hidden"
          border="1px solid"
          borderColor={borderColor}
          p={2}
        >
          <Waveform audioUrl={track.audioUrl} />
        </Box>
      </Flex>
    </Box>
  );
};

export default SampleRow;