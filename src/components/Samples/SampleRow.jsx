import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Icon,
  Tooltip,
  Badge,
  Image,
  Wrap,
  WrapItem,
  Tag,
  IconButton,
  useDisclosure,
  HStack
} from '@chakra-ui/react';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { firestore } from '../../firebase/firebase';
import Waveform from '../Waveform/Waveform';
import { FaPlus, FaHeart, FaPlay, FaPause, FaDownload } from 'react-icons/fa';
import { MdMusicNote, MdPlaylistAdd } from 'react-icons/md';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef(null);
  
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
  
  // Audio playback controls
  const handlePlayToggle = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleAudioEnd = () => {
    setIsPlaying(false);
  };
  
  // Download function
  const handleDownload = () => {
    if (!track.audioUrl) return;
    
    const link = document.createElement('a');
    link.href = track.audioUrl;
    link.download = `${track.name || 'sample'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box
      bg="rgba(20, 20, 30, 0.8)"
      borderRadius="lg"
      overflow="hidden"
      mb={4}
      border="1px solid"
      borderColor="whiteAlpha.200"
      transition="all 0.2s"
      _hover={{ 
        transform: 'translateY(-2px)', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', 
        bg: 'rgba(25, 25, 35, 0.8)' 
      }}
      position="relative"
    >
      <Flex
        p={4}
        direction={{ base: 'column', lg: 'row' }}
        alignItems={{ base: 'flex-start', lg: 'center' }}
        justifyContent="space-between"
        gap={4}
      >
        {/* Left section with Play button and artwork */}
        <Flex alignItems="center" gap={4} flex="1">
          {/* Play/Pause button */}
          <IconButton
            icon={isPlaying ? <FaPause /> : <FaPlay />}
            aria-label={isPlaying ? "Pause" : "Play"}
            isRound
            colorScheme="red"
            size="md"
            onClick={handlePlayToggle}
            boxShadow="0 0 10px rgba(229, 62, 62, 0.4)"
          />
          
          {/* Cover Image */}
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

          {/* Track Details */}
          <Box flex="1" minW={0}>
            <Text fontWeight="bold" fontSize="md" color="white" noOfLines={1}>
              {track.name}
            </Text>
            <Text fontSize="sm" color="gray.400" noOfLines={1}>
              by {artistName}
            </Text>
            
            {/* Tags */}
            {track.tags && track.tags.length > 0 && (
              <Wrap spacing={1} mt={2}>
                {track.tags.slice(0, 3).map(tag => ( // Show max 3 tags inline
                  <WrapItem key={tag}>
                    <Tag 
                      size="sm" 
                      colorScheme="red" 
                      variant="solid"
                      borderRadius="full"
                    >
                      {tag}
                    </Tag>
                  </WrapItem>
                ))}
                {track.tags.length > 3 && (
                  <WrapItem>
                    <Tag size="sm" variant="subtle">+{track.tags.length - 3}</Tag>
                  </WrapItem>
                )}
              </Wrap>
            )}
          </Box>
        </Flex>

        {/* Right side actions section */}
        <Flex 
          alignItems="center" 
          gap={4}
          justifyContent="flex-end"
          minW={{ lg: '240px' }}
        >
          {/* Sound properties */}
          <HStack spacing={2}>
            <Badge colorScheme="red" px={2} py={1} borderRadius="full">
              {track.bpm} BPM
            </Badge>
            <Badge colorScheme="blue" px={2} py={1} borderRadius="full">
              {track.key}
            </Badge>
          </HStack>

          {/* Action buttons */}
          <HStack spacing={2}>
            {/* Like button */}
            <Tooltip label={isLiked ? "Unlike" : "Like"}>
              <IconButton
                icon={<FaHeart />}
                aria-label={isLiked ? "Unlike" : "Like"}
                size="sm"
                isRound
                colorScheme={isLiked ? "red" : "whiteAlpha"}
                variant={isLiked ? "solid" : "ghost"}
                onClick={toggleLike}
                isLoading={likeLoading}
              />
            </Tooltip>
            
            {/* Add to playlist button */}
            <Tooltip label="Add to playlist">
              <IconButton
                icon={<FaPlus />}
                aria-label="Add to playlist"
                size="sm"
                isRound
                colorScheme="whiteAlpha"
                variant="ghost"
              />
            </Tooltip>
            
            {/* Download button */}
            <Tooltip label="Download">
              <IconButton
                icon={<FaDownload />}
                aria-label="Download sample"
                size="sm"
                isRound
                colorScheme="whiteAlpha"
                variant="ghost"
                onClick={handleDownload}
              />
            </Tooltip>
          </HStack>
        </Flex>
      </Flex>
      
      {/* Waveform section - always visible */}
      <Box p={4} pt={0} height="80px">
        <Waveform audioUrl={track.audioUrl} />
        <audio 
          ref={audioRef}
          src={track.audioUrl}
          onEnded={handleAudioEnd}
          preload="auto"
        />
      </Box>
    </Box>
  );
};

export default SampleRow;