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
  Image,
  Wrap,
  WrapItem,
  Tag,
} from '@chakra-ui/react';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { firestore } from '../../firebase/firebase';
import Waveform from '../Waveform/Waveform';
import { FaPlus, FaHeart } from 'react-icons/fa';
import { MdMusicNote } from 'react-icons/md';
import useLikeSample from '../../hooks/useLikeSample';

// Color generator function
const generateColorFromName = (name) => {
  const colors = ['#8A2BE2', '#4A90E2', '#50C878', '#FF6347', '#FFD700'];
  if (!name) return colors[0];
  
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

const SampleRow = ({ track }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColorSecondary = useColorModeValue('gray.500', 'gray.400');

  // Fetch user details from 'users' collection
  const userDocRef = doc(firestore, 'users', track.userId);
  const [userDoc, userLoading, userError] = useDocument(userDocRef);
  const userData = userDoc?.data();

  let artistName = 'Unknown Artist';
  if (userLoading) artistName = 'Loading...';
  else if (userError) artistName = 'Error loading user';
  else if (userData?.username) artistName = userData.username;

  // Add like functionality
  const { isLiked, likeCount, toggleLike, isLoading: likeLoading } = useLikeSample(track.id);

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
          {/* Cover Image - Single larger image with proper fallback */}
          <Box
            w="100px"
            h="100px"
            borderRadius="lg"
            overflow="hidden"
            border="1px solid"
            borderColor={borderColor}
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
                <Icon as={MdMusicNote} color="white" boxSize={8} />
              </Flex>
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
            
            {/* Improve tag display */}
            {track.tags && track.tags.length > 0 && (
              <Wrap spacing={1} mt={2}>
                {track.tags.map(tag => (
                  <WrapItem key={tag}>
                    <Tag 
                      size="sm" 
                      colorScheme="purple" 
                      variant="subtle"
                      borderRadius="full"
                      py={1}
                      px={2}
                      fontWeight="medium"
                    >
                      {tag}
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            )}
            
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

          {/* Add Like Button */}
          <Tooltip label={isLiked ? "Unlike" : "Like"} placement="top">
            <Button
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering any row click events
                toggleLike();
              }}
              colorScheme={isLiked ? "red" : "gray"}
              variant={isLiked ? "solid" : "outline"}
              size="sm"
              borderRadius="full"
              width="36px"
              height="36px"
              p={0}
              isLoading={likeLoading}
            >
              <Icon as={FaHeart} />
            </Button>
          </Tooltip>
          
          {/* Like Count */}
          <Text 
            fontSize="sm" 
            fontWeight="bold" 
            color={isLiked ? "red.400" : "gray.400"}
            minWidth="20px"
          >
            {likeCount}
          </Text>

          {/* Add to Playlist Button */}
          <Tooltip label="Add to playlist" placement="top">
            <Button
              colorScheme="purple"
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